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
3. Copy Project URL and anon key

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
- `/tickets/new` — Submit ticket (customer)
- `/tickets` — Look up my tickets by email
- `/tickets/[id]` — Ticket detail + replies
- `/agent` — Agent dashboard (status, internal notes)

## Arabic support
Switch locale via URL prefix `/ar` or `/en`. Default English. RTL applied automatically for Arabic.

## Notes
- Agent dashboard is unprotected in MVP — add Supabase Auth + RLS policies for production.
- Email-to-ticket intake can be added via SendGrid/Mailgun inbound webhooks → `/api/tickets`.
