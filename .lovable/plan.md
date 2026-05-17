## SEO & AI Search (AEO) optimization

Lovable shipped a built-in SEO/AEO reviewer at **Services → SEO & AI search**. It audits sitemap, robots.txt, metadata, semantic HTML, alt text, canonicals, JSON-LD, mobile usability, performance, indexing, and Google Search Console setup — and I can apply most fixes from chat.

### How we'll do it

1. **You run the scan once** (I can't trigger it from chat — it's a UI button)
   - Open the project → **Services → SEO & AI search → Scan project**
   - Takes ~30s. Findings will then appear in my context.

2. **I fix everything actionable in one pass**
   - For each failing finding I'll either apply the fix in code (meta tags, alt text, JSON-LD, canonicals, semantic markup, etc.) or explain why it should be ignored.
   - Batch all edits together so you get one round of changes, not 12.

3. **Google Search Console setup** (if flagged)
   - Verify `footprintfinder.co` via meta tag
   - Submit `https://footprintfinder.co/sitemap.xml`
   - Add the verified property to your GSC account

4. **Published-site checks** (perf / indexing / accessibility)
   - These only run against the live site. Project is already published at `footprintfinder.co`, so the rescan after fixes will cover them.

### What I already know is in good shape

- `index.html` has full meta (title, description, canonical, OG, Twitter, theme-color, JSON-LD for Organization + WebSite + SoftwareApplication)
- `public/robots.txt` + `public/sitemap.xml` exist
- Per-route SEO via `useSEO` hook on blog/compare/broker pages
- Brand favicon + apple-touch-icon wired

So the scan will likely flag a smaller, more specific set: probably alt text gaps, missing per-route canonicals on some pages, possibly H1 duplication, and GSC connection.

### Next step

Run the scan, then ping me — I'll batch-fix everything that comes back.
