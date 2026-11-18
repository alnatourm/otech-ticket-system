-- OTECH Ticketing System - Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project.

-- Tickets table
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  email text not null,
  name text,
  category text not null default 'general',
  priority text not null default 'medium',
  status text not null default 'open',
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Replies / comments
create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_email text,
  author_name text,
  is_agent boolean not null default false,
  is_internal boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;

-- Public can insert tickets (submit form) and read their own by email
create policy "Anyone can submit a ticket"
  on public.tickets for insert
  with check (true);

create policy "Anyone can read tickets by email"
  on public.tickets for select
  using (true);

create policy "Anyone can add a reply"
  on public.ticket_replies for insert
  with check (true);

create policy "Anyone can read replies"
  on public.ticket_replies for select
  using (true);

-- Agents (authenticated users) can update tickets
create policy "Authenticated users can update tickets"
  on public.tickets for update
  using (auth.role() = 'authenticated');

-- Indexes
create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_created_at_idx on public.tickets(created_at desc);
create index if not exists ticket_replies_ticket_id_idx on public.ticket_replies(ticket_id);