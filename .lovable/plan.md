# Why traffic is stuck at ~16 views/week — and what to change

## What the live data actually says

Google Search Console, last 28 days (2026-07-21 → 2026-08-17):

- 735 impressions, **21 clicks**, average position **35.8**
- The homepage brand query "footprint finder" is 9 of those 21 clicks
- Every non-brand query sits at position 8-70 — page 2 and deeper

Semrush (US): 39 ranking keywords, estimated organic traffic ~0/mo. The keywords with real volume are all buried:

| Keyword | Volume | Position |
|---|---|---|
| onerep | 14,800/mo | 54 |
| linkedin delete account | 880/mo | 74 |
| spokeo opt out remove listing | 480/mo | 74 |
| opt out spokeo | 390/mo | 68 |
| how to remove spokeo profile | 320/mo | 87 |
| aura digital footprint checker | 320/mo | 30 |

So the site is fully indexed and crawled (Google reports "Submitted and indexed", robots allowed, last crawl Aug 5). Indexing is not the problem. **Nothing is ranking high enough to get clicked.** Position 35 average = roughly 0.3% CTR, which is exactly the 16-20 views/week you're seeing.

## The three real causes

1. **Coverage without depth.** ~126 URLs, mostly templated broker/state/guide pages. Google has enough signal to index them but no reason to rank them above OneRep, Incogni and DeleteMe, who have hundreds to thousands of referring domains. Adding more pages of the same type will add more page-6 rankings, not traffic.

2. **Legacy `/blog/footprint-finder-vs-*` URLs still hold the rankings.** Search Console shows `/blog/footprint-finder-vs-aura` at 12 impressions and `/blog/footprint-finder-vs-incogni` at 11 impressions, and Semrush still ranks `/blog/footprint-finder-vs-aura` at position 30 for "aura digital footprint checker" (320/mo). Those URLs are 301-redirected to `/vs/*`, so the ranking authority is sitting on URLs that immediately bounce users to a different page. The new `/vs/*` pages are ranking separately and worse.

3. **SEO alone can't fix a 4-week-old-authority site this quarter.** Even a perfect plan needs 3-6 months. Meanwhile there is no second acquisition channel carrying load.

## What I recommend building (in this order)

### 1. Consolidate the redirected comparison pages (highest leverage, smallest work)
Confirm the 301s resolve to a `/vs/*` page that covers the same query intent as the old blog URL, and make each `/vs/*` page the single canonical target: matching H1, matching title pattern, and the old page's strongest query in the first 100 words. Add internal links from the homepage and footer to the four `/vs/*` pages with real impressions (aura, incogni, deleteme, onerep) so link equity concentrates instead of spreading over 126 URLs.

### 2. Pick 6 pages to go deep on, stop making new ones
Choose by "has volume AND already ranks 20-55" — those are within striking distance:

- `/vs/onerep` (14,800/mo, pos 54)
- `/remove-from/spokeo` (four keywords, 390-480/mo, pos 68-87)
- `/vs/aura` / the aura comparison (320/mo, pos 30)
- `/remove-from/intelius` (90/mo × 3 variants)
- `/delete/linkedin` (880/mo, pos 74)
- `/remove-from/publicdatausa` (140/mo, pos 11 — closest to page 1)

For each: expand to genuinely better content than the competitor page — exact click paths with the current form fields, screenshots or step diagrams, real timelines, what to do when the opt-out fails, and a short "verify it worked" section. Target 1,200+ substantive words each, not filler.

### 3. Fix the click-through problem on the pages that DO rank
`/guides/remove-images-from-google` gets 17 impressions at position 32 with 1 click. `/breach/national-public-data` sits at position 70. Rewrite titles and meta descriptions on the top 15 impression-earning pages to lead with the outcome and a number ("Remove Your Spokeo Listing in 6 Steps (2026)") rather than the keyword alone.

### 4. Add a channel that doesn't depend on Google
The `src` attribution parameter is already wired into the free scan, so short-form video, Reddit answers in r/privacy and privacy-adjacent forums, and directory listings (Product Hunt, AlternativeTo, privacy tool roundups) can be measured immediately. The distribution kit already drafted covers the launch copy. Directory and roundup listings double as the referring domains that fix cause #1.

### What I would NOT do
Write more new articles or new broker pages until the six pages above are on page 1. More thin pages is the thing that produced this position-35 average.

## Technical notes

- No indexing, robots, sitemap, or rendering fix is needed — GSC confirms `INDEXING_ALLOWED`, `page_fetch_state: SUCCESSFUL`, canonical selected correctly.
- Redirect rules for `/blog/footprint-finder-vs-*` live in `netlify.toml` and `public/_redirects`; they stay, this is about making the destination pages stronger, not changing the redirects.
- Page content lives in `src/data/competitors.ts`, `src/data/brokerEnrichment.ts`, and `src/data/deleteGuides.ts`; titles/descriptions come from `useSEO` in each page component.
- Expect 6-10 weeks before position changes on the deepened pages show up in Search Console.

## Scope for this build

Confirm which slice you want me to execute first — my recommendation is items 1 and 3 in one pass (fast, mechanical, affects every ranking page), then item 2 six pages at a time.
