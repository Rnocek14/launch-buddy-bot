# Deleteist (Footprint Finder)

**Live site:** [https://footprintfinder.co](https://footprintfinder.co)  
**Privacy policy:** [https://footprintfinder.co/privacy](https://footprintfinder.co/privacy)

## What it does

Deleteist helps you find and remove your personal data from online services. Connect your Gmail or Outlook inbox and we scan email headers (sender, subject, date) to discover which companies have your data — no email bodies are ever read or stored. From there you can unsubscribe from marketing emails and send deletion requests in a few clicks.

## Why it exists

Most people have hundreds of accounts they forgot about. Deleting them manually means finding contact info, writing emails, and following up. Deleteist automates the discovery and outreach so you can actually finish the job.

## Key features

- **Inbox scan** — OAuth-connected scan of Gmail or Outlook headers only (not content)
- **Privacy risk score** — See how exposed you are based on discovered accounts
- **One-click unsubscribe** — Detect and execute RFC 8058 List-Unsubscribe requests
- **Deletion requests** — Generate and send GDPR/CCPA deletion requests via email
- **Broker exposure scan** — Check if your info appears on people-search sites
- **Continuous monitoring** — Re-scan periodically to catch new exposures

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Edge Functions, RLS)
- Resend (transactional emails)
- Stripe (subscriptions)

## Security & privacy

- All data encrypted in transit (TLS) and at rest
- Row-Level Security on all database tables
- OAuth tokens stored server-side only, never exposed to the client
- No email content is read, stored, or indexed — only metadata (From, Subject, Date)
- No AI/ML training on user data
- Google API Services Limited Use Policy compliant

## Local development

```sh
npm install
npm run dev
```

Environment variables (see `.env`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

## Contact

- Support: support@footprintfinder.co
- Privacy questions: privacy@footprintfinder.co
