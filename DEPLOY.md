# Deploying Footprint Finder to a rewrite-capable host

## Why not Lovable hosting?

Lovable's static hosting serves a file only on an **exact path match** and
otherwise serves the root `index.html` (SPA fallback). It does **not** resolve
`directory/index.html` and does **not** support URL rewrites. Our prerender
step writes `dist/<route>/index.html` for every public SEO route, but Lovable
never serves those at the clean URLs Google crawls (`/guides/foo`) — it returns
the homepage shell instead.

Netlify, Cloudflare Pages, and Vercel all serve `dist/<route>/index.html` at
`/<route>` automatically, so the prerendered HTML reaches crawlers as raw HTML
before any JavaScript runs. That is the unlock.

## What the build produces

```
npm run build
  → vite build              (SPA bundle + dist/index.html)
  → scripts/prerender.ts    (postbuild: ~126 dist/<route>/index.html files)
```

Each prerendered file has a unique `<title>`, meta description, canonical,
Open Graph tags, JSON-LD, and full body content.

## Option A — Netlify (recommended)

Config: `netlify.toml` + `public/_redirects` (already in repo).

1. Push the repo to GitHub (Lovable → GitHub → Connect).
2. Netlify → Add new site → Import from Git → pick the repo.
3. Build command `npm run build`, publish directory `dist` (auto-detected from
   `netlify.toml`).
4. Deploy. Then point `footprintfinder.co` DNS at Netlify
   (Domain settings → add custom domain → update nameservers / CNAME).

The `/* → /index.html 200` rule is the SPA fallback; because it has no force
(`!`) flag, real prerendered files are always served first.

## Option B — Cloudflare Pages

Reads `public/_redirects` too.

1. Cloudflare Pages → Create project → connect the GitHub repo.
2. Build command `npm run build`, output directory `dist`.
3. Add `footprintfinder.co` as a custom domain in the Pages project.

## Option C — Vercel

Config: `vercel.json` (already in repo, `cleanUrls: true`).

1. Vercel → New Project → import the GitHub repo.
2. Framework preset: Vite. Build `npm run build`, output `dist`.
3. Add `footprintfinder.co` under Project → Domains.

`cleanUrls` maps `/guides/foo` → `dist/guides/foo/index.html`; the catch-all
rewrite only fires when no static file matches.

## Post-deploy verification

Run these against the NEW host (replace with the deploy URL until DNS cuts
over). Each must show a UNIQUE title — not the homepage one:

```bash
for u in /guides/what-is-a-data-broker /remove-from/spokeo /vs/deleteme /guides; do
  echo "== $u =="
  curl -s "https://<new-host>$u" | grep -o '<title>[^<]*</title>' | head -1
done
```

Then in Google Search Console:
1. Update the property / verify the new host if needed.
2. URL Inspection → Test Live URL on a few guide + broker URLs.
3. Resubmit `sitemap.xml`.
4. Request indexing for the priority pages.

## DNS cutover note

`footprintfinder.co` currently points at Lovable. Moving it to the new host
means Lovable hosting no longer serves the production domain — keep the Lovable
project for editing, but production traffic and OAuth redirect URIs must use the
new host. Update any Supabase / OAuth redirect allow-lists to the new origin if
it changes (it won't, if you keep `footprintfinder.co`).
