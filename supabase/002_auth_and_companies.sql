-- OTECH Ticketing System — company accounts, authentication and per-company RLS
-- Run this in the Supabase SQL Editor AFTER supabase/schema.sql.
-- It is safe to re-run.

-- 1. Companies -----------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. User profiles -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  role text not null default 'company' check (role in ('company', 'agent', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles(company_id);

-- 3. Link tickets to a company and the user who created them -------------------
alter table public.tickets add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.tickets add column if not exists created_by uuid references auth.users(id) on delete set null;
create index if not exists tickets_company_id_idx on public.tickets(company_id);

-- 4. Helper functions (security definer avoids RLS recursion) ------------------
create or replace function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('agent', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 5. Create a company + profile automatically when a user signs up -------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_name text;
  v_role text;
  v_company_id uuid;
begin
  v_company_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), '');
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'company');
  if v_role not in ('company', 'agent', 'admin') then
    v_role := 'company';
  end if;

  -- Company self-signup creates one company per account.
  -- Agent/admin accounts must be linked to a company manually by an admin.
  if v_role = 'company' and v_company_name is not null then
    insert into public.companies (name)
    values (v_company_name)
    returning id into v_company_id;
  end if;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    v_company_id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Replace the open MVP policies ---------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Anyone can submit a ticket" on public.tickets;
drop policy if exists "Anyone can read tickets by email" on public.tickets;
drop policy if exists "Anyone can add a reply" on public.ticket_replies;
drop policy if exists "Anyone can read replies" on public.ticket_replies;
drop policy if exists "Authenticated users can update tickets" on public.tickets;

-- Companies
create policy "Users see their own company"
  on public.companies for select
  using (id = public.my_company_id() or public.is_agent());

-- Profiles
create policy "Users see their own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_agent());

create policy "Users update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Tickets
create policy "Company users see their company tickets"
  on public.tickets for select
  using (public.is_agent() or (company_id is not null and company_id = public.my_company_id()));

create policy "Company users submit their own tickets"
  on public.tickets for insert
  with check (
    public.is_agent() or
    (company_id = public.my_company_id() and created_by = auth.uid())
  );

create policy "Agents update tickets"
  on public.tickets for update
  using (public.is_agent())
  with check (public.is_agent());

-- Replies
create policy "Read replies on visible tickets"
  on public.ticket_replies for select
  using (
    public.is_agent() or (
      not is_internal and exists (
        select 1 from public.tickets t
        where t.id = ticket_id
          and t.company_id is not null
          and t.company_id = public.my_company_id()
      )
    )
  );

create policy "Company users reply on their tickets"
  on public.ticket_replies for insert
  with check (
    public.is_agent() or (
      not is_internal and exists (
        select 1 from public.tickets t
        where t.id = ticket_id
          and t.company_id is not null
          and t.company_id = public.my_company_id()
      )
    )
  );

-- 7. Grant authenticated access ------------------------------------------------
grant usage on schema public to authenticated;
grant select on public.companies to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.tickets to authenticated;
grant select, insert on public.ticket_replies to authenticated;
