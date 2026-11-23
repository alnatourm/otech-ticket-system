-- Migration 007: Inbound Email Webhook Support & Ticket Creation
-- Project: rsmevpbbilqtjoccayla
-- Target: tickets.o-tech.space / Resend Webhook Integration

-- 1. Policy to allow inbound webhooks and email tickets to be submitted with created_by IS NULL
drop policy if exists "Allow inbound email tickets" on public.tickets;
create policy "Allow inbound email tickets"
  on public.tickets for insert
  with check (created_by is null);

-- 2. Policy to allow inbound email replies
drop policy if exists "Allow inbound email replies" on public.ticket_replies;
create policy "Allow inbound email replies"
  on public.ticket_replies for insert
  with check (not is_agent and not is_internal);

-- 3. Security Definer RPC function for robust inbound ticket creation
create or replace function public.create_inbound_email_ticket(
  p_title text,
  p_description text,
  p_email text,
  p_name text default null,
  p_category text default 'general',
  p_priority text default 'medium'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_id uuid;
  v_company_id uuid;
begin
  -- If sender email matches an existing user profile, automatically associate with their company
  select p.company_id into v_company_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_email)
  limit 1;

  insert into public.tickets (
    title,
    description,
    email,
    name,
    category,
    priority,
    status,
    company_id,
    created_by
  )
  values (
    p_title,
    p_description,
    p_email,
    p_name,
    coalesce(p_category, 'general'),
    coalesce(p_priority, 'medium'),
    'open',
    v_company_id,
    null
  )
  returning id into v_ticket_id;

  return v_ticket_id;
end;
$$;

grant execute on function public.create_inbound_email_ticket to anon, authenticated;
