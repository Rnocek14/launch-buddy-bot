# Add a visible "Log in" for returning members

## Problem
Login already works at `/auth` (email + password, Google OAuth, password reset). But a logged-out visitor only sees landing links + a "Free Scan" button in the navbar — there is no "Log in" entry point. Returning members have no obvious way back into their account.

## Fix
Surface a clear **Log in** link in the navbar for logged-out users, on both desktop and mobile. No backend or auth-logic changes — purely navigation.

### Desktop (`src/components/Navbar.tsx`)
- In the `{!user && (...)}` desktop block, add a `Log in` button (ghost, links to `/auth`) placed just before the orange `Free Scan` CTA, so the pairing reads: Features · Pricing · FAQ · **Log in** · [Free Scan].

### Mobile (Sheet menu)
- In the logged-out branch of the mobile sheet, add a full-width `Log in` button (links to `/auth`, closes the menu) above the `Free Scan` button, separated from the landing links.

### Copy / behavior
- Label: "Log in" (returning-member language, calm tone per project guidelines).
- Destination: `/auth` (existing page; its tabs already default appropriately).
- Keep "Free Scan" as the primary accent CTA; "Log in" is a secondary ghost button so the top-of-funnel action stays dominant.

## Out of scope
- No changes to the auth flow, providers, or `/auth` page itself.
- No route protection changes.
