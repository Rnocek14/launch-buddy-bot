# Month-One Launch: In-App Support Plan

Goal: build only the *code* the content plan depends on, without disturbing the frozen broker-page SEO experiment. Everything funnels to one CTA: **run the free scan**.

## Decision needed first (blocker)

The content plan calls the product **"Deleteist"**, but the app, domain, schema, and brand memory are all **Footprint Finder / footprintfinder.co**. I will **not** rename anything — the plan below assumes Footprint Finder stays canonical. If "Deleteist" is a real rebrand, that's a separate, larger project (domain, OAuth redirect URIs, schema `sameAs`, every page title) and would burn the SEO authority you just baselined. Flagging, not changing.

---

## Phase 1 — Week-2 "How to delete X" SEO pages (highest leverage)

The `/delete/:slug` system already exists (`deleteGuides.ts` + `DeleteService.tsx` with HowTo schema). Current slugs: facebook, instagram, amazon, linkedin, spotify, twitter, tiktok, snapchat, reddit, pinterest.

Add the 6 missing Week-2 video targets as new guide entries (each = one video script + one ranking page, same script two channels):

```text
gmail (old / secondary accounts)   ticketmaster
myfitnesspal                       temu
shein                              tinder (the "old dating app")
```

Each entry: accurate steps, official deletion URL, "what they keep", gotchas — matching existing tone (no overpromising, per compliance memory). LinkedIn data-sharing settings is covered by the existing `linkedin` guide; I'll extend its gotchas with the data-sharing toggle rather than duplicate.

Then add the new slugs to `public/sitemap.xml` and confirm the `/delete` index lists them.

## Phase 2 — Breach-reaction landing surface (Always-On converter)

The plan's highest-converting moment is breach news. Build a reusable, ungated landing route the founder can link in any same-day breach video:

```text
/breach/:slug   ->  "Was your email in the [X] breach? Check free in 60s"
```

- Driven by a small `breachEvents.ts` data file (breach name, date, records, what leaked).
- Reuses the existing `SeoEmailCapture` / free-scan funnel — one email field, straight into `/free-scan?src=breach_<slug>`.
- Includes FAQ + NewsArticle JSON-LD for search pickup.
- Adding a breach = one data entry, no redeploy of logic. (A generic `/breach` index lists recent ones.)

## Phase 3 — Conversion tracking for the experiment

So you can answer "which hook drove each scan spike" (the only metric that matters):

- Ensure every entry point passes a `src` param (`seo_<broker>`, `delete_<service>`, `breach_<slug>`, plus a generic `tiktok`/`reels`/`shorts` set) through to `trackEvent("scan_started", ...)`.
- Confirm `FreeScan.tsx` reads and logs `src` (it already auto-scans on `?email=`; I'll make sure `src` is captured on the event).
- No new dashboards — this just makes the existing analytics attributable per channel/hook.

## Phase 4 — Entity / distribution prep (off-page enablers)

- Fill the empty `sameAs` array in `index.html` Organization schema — **only once you send real URLs** (LinkedIn company page, X/Twitter, Product Hunt, Crunchbase). I'll leave a clearly-marked placeholder and wire them the moment you provide them.
- Optionally draft (as downloadable artifacts, not code): Product Hunt launch copy, Show HN post + comment-thread notes, and a directory-submission checklist (privacyguides.org, AlternativeTo, G2/Capterra). These are the referring domains that get you onto Semrush's radar.

---

## What this deliberately does NOT touch

- The 4 frozen broker test pages (`/remove-from/*`) — the running experiment.
- Templates, URL structure, pricing, auth, scanning logic.
- No rename. No backend/schema changes beyond a new static route + data files.

## Technical notes

- New files: `src/data/breachEvents.ts`, `src/pages/Breach.tsx`, `src/pages/BreachIndex.tsx`; routes added in `src/App.tsx`.
- Edited: `src/data/deleteGuides.ts` (+6 entries, extend linkedin), `public/sitemap.xml`, `src/pages/FreeScan.tsx` (src capture), `index.html` (sameAs placeholder only).
- Suggested order: Phase 1 → Phase 3 → Phase 2 → Phase 4 (delete pages + tracking first, since they reinforce the experiment and are pure additive SEO).

Approve and I'll start with Phase 1.