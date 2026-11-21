-- OTECH Ticketing System - Attachment Read Access Fix (DEF-10)
-- Run this in the Supabase SQL Editor AFTER 004_security_hardening.sql.
-- Safe to re-run (idempotent).
--
-- DEF-02 Security Guarantee:
-- A company user must NEVER read an attachment whose reply has is_internal = true,
-- whatever folder it sits in (including 'agents/' or '<company_id>/').
-- Only public agent replies (is_internal = false) and ticket-level attachments
-- belonging to the user's company are accessible to company users.

-- Index on file_path to optimize storage RLS lookups
create index if not exists ticket_attachments_file_path_idx on public.ticket_attachments(file_path);

-- Replace the storage select policy on bucket 'ticket-attachments'
drop policy if exists "Read ticket images" on storage.objects;
create policy "Read ticket images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and (
      public.is_agent()
      or (
        -- Allow customer to read attachment images (including agent uploads under 'agents/')
        -- if the attachment is linked to a ticket of the caller's company, scoped to allowed paths,
        -- and is NOT an internal note:
        exists (
          select 1
          from public.ticket_attachments a
          join public.tickets t on t.id = a.ticket_id
          where a.file_path = storage.objects.name
            and (
              a.file_path like 'agents/%'
              or a.file_path like (public.my_company_id()::text || '/%')
            )
            and t.company_id is not null
            and t.company_id = public.my_company_id()
            and (
              a.reply_id is null
              or exists (
                select 1
                from public.ticket_replies r
                where r.id = a.reply_id
                  and r.ticket_id = a.ticket_id
                  and r.is_internal = false
              )
            )
        )
      )
      or (
        -- Existing company-folder rule as an additional allowed branch so ticket-level and company uploads still work:
        (storage.foldername(name))[1] = coalesce(public.my_company_id()::text, '')
        and exists (
          select 1
          from public.ticket_attachments a
          where a.file_path = storage.objects.name
            and (
              a.reply_id is null
              or exists (
                select 1
                from public.ticket_replies r
                where r.id = a.reply_id
                  and r.is_internal = false
              )
            )
        )
      )
    )
  );

/*
--------------------------------------------------------------------------------
VERIFICATION TEST PLAN (Execute in SQL Editor / Supabase Client):
--------------------------------------------------------------------------------

1. Setup:
   - Identify or sign up a company customer account (e.g. customer@company-a.com, company_id = 'C1').
   - Identify or sign up an agent account (e.g. agent@otech.com, role = 'agent').
   - Customer submits Ticket T1 (company_id = 'C1').

2. Test Public Agent Reply Image (DEF-10 fix):
   - As agent, post a PUBLIC reply on Ticket T1 (is_internal = false) and attach an image (file uploaded to 'agents/<filename>.png').
   - Row inserted into public.ticket_attachments with file_path = 'agents/<filename>.png', reply_id = <public_reply_id>, ticket_id = T1.id.
   - As customer@company-a.com (authenticated as customer), query storage.objects or download/createSignedUrl for 'agents/<filename>.png'.
   - Result: SUCCESS - Image loads and is readable by the customer.

3. Test Internal Agent Note Image (DEF-02 verification):
   - As agent, post an INTERNAL note on Ticket T1 (is_internal = true) and attach an image (file uploaded to 'agents/<filename2>.png').
   - Row inserted into public.ticket_attachments with file_path = 'agents/<filename2>.png', reply_id = <internal_reply_id>, ticket_id = T1.id.
   - As customer@company-a.com, query storage.objects or request signed URL for 'agents/<filename2>.png'.
   - Result: ACCESS DENIED - 0 rows returned; storage RLS policy blocks access because r.is_internal = true. DEF-02 is verified closed.

4. Test Cross-Company Isolation:
   - As customer from Company B, attempt to read 'agents/<filename>.png' belonging to Company A's ticket.
   - Result: ACCESS DENIED - t.company_id does not match public.my_company_id().
--------------------------------------------------------------------------------
*/
