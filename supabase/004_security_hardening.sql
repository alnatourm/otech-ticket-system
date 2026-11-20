-- OTECH Ticketing System - Security Hardening (Release 0.2)
-- Run this in the Supabase SQL Editor AFTER 003_ticket_attachments.sql.
-- Safe to re-run.

-- 1. DEF-01: Never trust client metadata for profile roles.
-- Force role = 'company' on user signup; agent/admin accounts are provisioned server-side.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_name text;
  v_company_id uuid;
begin
  v_company_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), '');

  -- Company self-signup creates one company per account.
  -- Agent/admin accounts are created server-side by an admin.
  if v_company_name is not null then
    insert into public.companies (name)
    values (v_company_name)
    returning id into v_company_id;
  end if;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    v_company_id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'company'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 2. DEF-09: Restrict profile updates to column-level privileges.
-- Revoke table-level update from authenticated users and grant only full_name.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- 3. DEF-03: Prevent forged official agent replies or internal notes by company users.
-- For non-agents require: not is_agent and not is_internal and ticket company check. Agents keep full insert.
drop policy if exists "Company users reply on their tickets" on public.ticket_replies;
create policy "Company users reply on their tickets"
  on public.ticket_replies for insert
  with check (
    public.is_agent() or (
      not is_agent
      and not is_internal
      and exists (
        select 1 from public.tickets t
        where t.id = ticket_id
          and t.company_id is not null
          and t.company_id = public.my_company_id()
      )
    )
  );

-- 4. DEF-02: Prevent exposure of attachments belonging to internal replies.
-- 4a. Ticket attachments table policy:
-- For non-agents allow only: reply_id is null, or exists(select 1 from public.ticket_replies r where r.id = reply_id and r.is_internal = false).
drop policy if exists "Read attachments on visible tickets" on public.ticket_attachments;
create policy "Read attachments on visible tickets"
  on public.ticket_attachments for select
  using (
    public.is_agent() or (
      exists (
        select 1 from public.tickets t
        where t.id = ticket_id
          and t.company_id is not null
          and t.company_id = public.my_company_id()
      )
      and (
        reply_id is null
        or exists (
          select 1 from public.ticket_replies r
          where r.id = reply_id
            and r.is_internal = false
        )
      )
    )
  );

-- 4b. Storage objects select policy for bucket 'ticket-attachments':
-- Applies the same condition so non-agents cannot read attachments of internal replies.
drop policy if exists "Read ticket images" on storage.objects;
create policy "Read ticket images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and (
      public.is_agent()
      or (
        (storage.foldername(name))[1] = coalesce(public.my_company_id()::text, '')
        and exists (
          select 1 from public.ticket_attachments a
          where a.file_path = storage.objects.name
            and (
              a.reply_id is null
              or exists (
                select 1 from public.ticket_replies r
                where r.id = a.reply_id
                  and r.is_internal = false
              )
            )
        )
      )
    )
  );
