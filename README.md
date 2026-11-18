# OTECH Support Portal

Custom branded ticketing system with Arabic/English support, built with Next.js + Supabase.

## Stack
- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **next-intl** for Arabic/English with RTL layout
- **Supabase** (Postgres) for tickets, replies, auth
- **Deploy**: Vercel (free Hobby tier)

## Setup

### 1. Supabase
1. Create a free project at https://supabase.com
2. Open SQL Editor → paste `supabase/schema.sql` → Run
3. In the same SQL Editor, paste `supabase/002_auth_and_companies.sql` → Run
4. Copy Project URL and anon key
5. Authentication → Providers → Email: enable email/password signups (turn off email confirmation to let users in immediately; if left on, users must confirm via email before signing in)

### 2. Environment
```
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Run
```
npm install
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Vercel
```
npx vercel
```
Add env vars in Vercel dashboard.

## Routes
- `/` — Home
- `/signup` — Company self-registration (company name + user details)
- `/login` — Company / agent sign in
- `/tickets/new` — Submit ticket (requires login)
- `/tickets` — My company's tickets (requires login)
- `/tickets/[id]` — Ticket detail + replies (requires login)
- `/agent` — Agent dashboard (agents/admins only)

## Authentication & access
- Companies sign themselves up; one `companies` row is created per signup and the user is linked to it through `profiles`.
- Tickets are tied to a company (`tickets.company_id`) and the submitting user (`created_by`). Row Level Security means a company can only read its own tickets and non-internal replies; agents/admins see everything and can update tickets.
- Company identity, email and user ID are set on the server from the session — the browser cannot spoof them.
- Session cookies are refreshed in `src/proxy.ts`; protected pages check the session again on the server, and RLS is the final boundary.

### Creating an agent account
Agent/admin accounts are not public. Create the user in Supabase Auth (Authentication → Add user), then set their profile role in the SQL Editor:

```sql
update public.profiles set role = 'agent' where id = (
  select id from auth.users where email = 'agent@example.com'
);
```

## Arabic support
Switch locale via URL prefix `/ar` or `/en`. Default English. RTL applied automatically for Arabic. All login, signup and ticket screens have English and Arabic copy.

## Notes
- Email-to-ticket intake can be added via SendGrid/Mailgun inbound webhooks → `/api/tickets`.
- If you change `supabase/002_auth_and_companies.sql`, re-run it in the SQL Editor — it is safe to re-run.
