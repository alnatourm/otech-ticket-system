-- OTECH Ticketing System — image attachments
-- Run this in the Supabase SQL Editor AFTER 002_auth_and_companies.sql.
-- Safe to re-run.

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  reply_id uuid references public.ticket_replies(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_attachments_ticket_id_idx on public.ticket_attachments(ticket_id);
create index if not exists ticket_attachments_reply_id_idx on public.ticket_attachments(reply_id);

alter table public.ticket_attachments enable row level security;

drop policy if exists "Read attachments on visible tickets" on public.ticket_attachments;
create policy "Read attachments on visible tickets"
  on public.ticket_attachments for select
  using (
    public.is_agent() or exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.company_id is not null
        and t.company_id = public.my_company_id()
    )
  );

drop policy if exists "Add attachments to own tickets" on public.ticket_attachments;
create policy "Add attachments to own tickets"
  on public.ticket_attachments for insert
  with check (
    public.is_agent() or exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.company_id is not null
        and t.company_id = public.my_company_id()
    )
  );

drop policy if exists "Remove own attachments" on public.ticket_attachments;
create policy "Remove own attachments"
  on public.ticket_attachments for delete
  using (public.is_agent() or uploaded_by = auth.uid());

grant select, insert, delete on public.ticket_attachments to authenticated;

-- Private storage bucket. Files are accessed through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments',
  'ticket-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Upload ticket images" on storage.objects;
create policy "Upload ticket images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ticket-attachments'
    and (
      public.is_agent()
      or (storage.foldername(name))[1] = coalesce(public.my_company_id()::text, '')
    )
  );

drop policy if exists "Read ticket images" on storage.objects;
create policy "Read ticket images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and (
      public.is_agent()
      or (storage.foldername(name))[1] = coalesce(public.my_company_id()::text, '')
    )
  );

drop policy if exists "Delete own ticket images" on storage.objects;
create policy "Delete own ticket images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_agent());
