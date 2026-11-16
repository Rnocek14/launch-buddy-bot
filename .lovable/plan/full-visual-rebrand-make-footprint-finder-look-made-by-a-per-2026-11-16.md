# Full visual rebrand: make Footprint Finder look made by a person, not a template

## Direction: "Field report"
The site should feel like an investigator's case file, not a SaaS landing page. It should be calm, exact and evidence-led, which suits a privacy tool that only reads email metadata.

- **Type:** a sharp grotesk for headings (Space Grotesk or similar, tight tracking, set large). A monospace (JetBrains Mono) for data, labels, counts and dates, so numbers read like real readings. Plain sans for body text. The current serif display font goes.
- **Color:** warm off-white paper plus near-black ink in light mode, and deep graphite in dark mode. The orange #FF6A00 is kept but used only for actions and the single most important number on screen. No red warnings. Concern levels use ink weight and a muted amber, which keeps the calm tone.
- **Structure:** a visible grid with thin rules and hairline dividers, instead of floating rounded cards with shadows. Sections are marked with small mono labels like `01 / WHAT'S EXPOSED`, not pill badges.
- **Removed everywhere:** blurred orange blobs, pill labels above headings, icon-in-rounded-square card grids, numbered circles, the scrolling stats strip, the shimmer effect on buttons, and stock icon rows.

## Homepage, rebuilt top to bottom
1. **Hero:** no empty gap above it. The headline sits at the top: "Find out who has your data. Then make them delete it." Email field + button. Under it, a cropped screenshot of a real scan result (yours, personal details blurred) in place of the spinner "demo preview".
2. **The proof strip:** one annotated scan result. Short margin notes point at parts of it ("found from a receipt, 2019", "newsletter only", "broker listing, removable"). This replaces the 8 identical icon cards.
3. **How it works:** three plain steps in a single row, written as a short sentence each, divided by rules.
4. **What we never touch:** a two-column "We read / We never read" table (metadata vs. message content). This is your strongest trust point, and right now it's hidden in an FAQ.
5. **Pricing:** one clean comparison block ($15/mo, $79/yr, free scan first).
6. **For families:** the /parents offer becomes one quiet row, not a big banner.
7. **FAQ + footer.**

## Shared style (applies site-wide)
The color, font, spacing and card styles are redefined once, so the dashboard, guides, broker removal pages, comparison pages and pricing all pick up the new look automatically. Then a cleanup pass removes leftover template patterns (pill badges, blob backgrounds, icon tiles) from those pages.

## What I need from you
- **Screenshots of your own scan results:** the dashboard and the "Who Has My Data" page, at full size. I'll blur names, emails and addresses before using them. Until you send them, I'll use realistic sample data rendered from the app's own result screens, clearly fake, so the layout can be built and checked.

## Order of work
1. New style foundations (fonts, colors, grid, section labels) and an updated design memory.
2. Homepage rebuild.
3. Site-wide cleanup on the main public pages: pricing, guides, broker removal, comparisons, /parents.
4. Dashboard visual pass. Only the look changes; layout and behavior stay the same.
5. Check on mobile (390px) and desktop, in light and dark mode, and check that contrast still meets accessibility standards.

## Technical notes
- Tokens live in `src/index.css` and `tailwind.config.ts`; fonts load from `index.html` (keep the non-blocking font load used for page speed).
- Update memory: brand identity, visual identity and the CTA shimmer rule (removed).
- Page titles, descriptions and URLs are unchanged, so search rankings are not affected.
