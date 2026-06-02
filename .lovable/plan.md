## SEO Domination Plan — Footprint Finder

### The honest starting point
Semrush shows footprintfinder.co currently ranks for **2 keywords**, both on page 6 (positions 55 & 63), with ~0 estimated organic traffic. You're not behind — you've barely started. "Dominating" is realistic here because the queries you named have **low keyword difficulty (0–26/100)** and we already have the page-generation machinery to scale. This is a content-coverage + consistency game, and results land over 2–4 months, not overnight.

### What the search data says (Semrush, US)
The single biggest untapped opportunity is the **"remove my info from the internet"** cluster — we have almost no content targeting it:

```
how to remove personal information from internet     1,900/mo
how to remove my personal information from internet   2,900/mo
how to delete personal information from internet      1,900/mo
how to remove personal info from google (free)        1,900/mo
how to hide your phone number / make number private   3,600/mo
google results about you                              3,600/mo
how to remove my phone number from the internet         210/mo  (KD 26)
```

The **"delete from whitepages"** cluster alone is ~1,500/mo across variants (260 + 210 + 170s…), and we already have a `/remove-from/whitepages` page — it's just optimized for "opt out," not the higher-volume "how to delete" phrasing.

### Current coverage (what we have)
- `/remove-from/:slug` — ~45 data-broker pages (DB-driven), targeting "<broker> opt out"
- `/delete/:slug` — 10 account-deletion guides
- `/vs/:competitor` — 5 competitor comparisons
- `/blog` — blog posts

### The plan — 3 phases

**Phase 1 — Capture the "how to delete X" intent on pages we already have**
- Update `RemoveBroker.tsx` SEO (title/description/H1 + on-page copy) to target the dominant query phrasing: "How to delete your info from Whitepages (2026 guide)" alongside the existing opt-out language. This recaptures ~1,500/mo for Whitepages and similar for every broker — zero new pages, big ranking lift.
- Add a FAQ/JSON-LD `FAQPage` block to each broker page answering "How do I delete my information from <broker>?", "Is it free?", "How long does it take?" — wins FAQ rich results and long-tail variants.

**Phase 2 — New high-volume hub pages (the cluster we're missing)**
Build a small set of authoritative guide pages, each with an embedded `SeoEmailCapture` → free scan:
- `/guides/remove-personal-information-from-internet` — the pillar page (targets the 1,900–2,900/mo cluster), linking out to every broker + delete guide.
- `/guides/remove-phone-number-from-internet` — phone-number cluster.
- `/guides/remove-yourself-from-google` — "google results about you" / "remove personal info from google."
- `/guides/who-has-my-personal-information` — high-intent, funnels straight to the scan.
Implemented as a data-driven `guides` collection (like `deleteGuides.ts`) so we can keep adding cluster pages cheaply.

**Phase 3 — Widen programmatic broker + delete coverage**
- Expand the `data_brokers` table coverage (add the remaining major people-search sites — e.g. Radaris, BeenVerified, TruthFinder variants, Spokeo, USPhoneBook) so every "delete from <site>" query has a matching page.
- Add ~10 more `/delete/:slug` guides for top-searched services.
- Internal linking: pillar guides ↔ broker pages ↔ delete guides, plus `RelatedBrokers` everywhere, to concentrate authority.

### Sitemap & indexing
- Regenerate `public/sitemap.xml` via the existing `scripts/generate-sitemap.ts` to include the new `/guides/*` routes and any new broker/delete slugs, and add `routeDefaults` priorities for them.
- Confirm Google Search Console has the property verified so we can watch these pages get indexed.

### What I'd build first
Phase 1 + the 4 Phase-2 hub pages in the first pass — that's where the volume and the easy wins are. Phase 3 (broker DB expansion) follows.

### Technical notes
- New guide pages use `react-helmet`/`useSEO` for per-route title/description/canonical/og + JSON-LD (`Article` + `FAQPage`), mirroring `RemoveBroker.tsx`.
- Guides stored in `src/data/guides.ts`; routes `/guides` (index) and `/guides/:slug` added in `App.tsx` above the catch-all.
- Each page embeds `SeoEmailCapture` so SEO traffic converts into free scans.
- Broker DB additions are SQL migrations (new rows in `data_brokers`), not schema changes.

### Tracking your progress
For ongoing rank tracking, daily ranking updates, and alerts as these pages climb, Semrush (the SEO data service the platform integrates with) can be connected to wire Position Tracking into an admin view — useful once dozens of these pages are live and you want to watch the cluster move. Optional; not needed to ship the content.
