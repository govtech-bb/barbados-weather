# Alpha banner match + design/accessibility pass

**Date:** 2026-06-26
**Issue:** [#2](https://github.com/govtech-bb/barbados-weather/issues/2)
**Branch:** `worktree-alpha-banner-match` (off `main`)

## What this session set out to do
Make the "This page is in Alpha" banner match live alpha.gov.bb exactly
(font, sizes, link treatment) and review WCAG compliance. It started as a small
banner fix and grew, by the user's direction during review, into a broader
design and copy pass aligning the dashboard with the gov.bb design language.

## What changed and why

### Banner parity
The live banner was pulled from the rendered HTML (WebFetch strips CSS, so the
Tailwind utilities were read directly from the source). Key finding: the live
StatusBanner has **no visible border** (`border-blue-100` sets colour only, with
zero width) and the "Alpha" link is a black, underlined secondary link with
white-bg hover and yellow-bg focus, not a plain blue link. Ours matched after
removing the border, switching to `padding: 1rem 0`, `line-height: 1.5`, and the
secondary-link styling. Verified by computed styles matching live pixel-for-pixel.

### Design language alignment (gov.bb)
Read against the live landing and `/feedback` form. gov.bb uses black headings,
flat surfaces (`rounded-sm`, minimal shadow), and generous padding. So:
- Headings set to black (`--heading`, the H1, section sub-headings).
- Cards flattened: radius 16px -> 8px, shadow removed.
- Card content gutters unified to `1.3rem` (intros, headings, controls, tiles
  previously diverged between 1.1 and 1.3, which caused visible misalignment of
  the Official-Sources and shelter intros). The `.hist-intro` class had no rule
  at all and sat flush at the card edge; it now uses the shared gutter.
- Radar/legend keys restructured into clean rows (colon format) with the
  instructions split into their own paragraphs.
- "Things to do" activity cards tidied: smaller icons box-aligned to the title,
  flat outlined items instead of filled nested boxes.

### Copy: no em-dashes
Removed 80+ em-dashes from `index.html`, `app.js`, and `src/*`, and added a rule
to the Bedrock briefing prompt so generated text avoids them. See
[decision 0001](../decisions/0001-no-em-dashes-in-public-copy.md).

### Type: 16px minimum
Raised 75 sub-16px declarations to `1rem`. The one exception is the gov
"Official government website" strip, kept at 12px to preserve the exact
alpha.gov.bb match (with an inline comment). See
[decision 0002](../decisions/0002-minimum-16px-body-text.md).

### Smaller fixes
- Removed the redundant "Barbados weather, every day" subtitle and null-guarded
  the JS that referenced `#island`.
- "Forecast unavailable" no longer wraps: it was injected into the 7-day grid
  (one narrow column); now it uses the full-width summary line, matching the
  hourly card.

## A bug worth remembering
During review the `#mode`/`#updated` pills rendered empty. Root cause was the
service worker: page navigations are network-first (fresh `index.html` with
`#island` removed) but other assets are cache-first (a stale `app.js` still
doing `getElementById("island").textContent`, which threw and aborted render
before the pills). Two fixes: the new `app.js` is null-guarded, and the SW cache
was bumped (`gov3 -> gov5`) per the documented "bump on shell change" rule, which
had been missed. Lesson: when shell assets change, bump the SW cache, and never
assume a removed element is safe for cache-first scripts mid-deploy.

## Not done (still tracked on #2)
The formal WCAG 2.2 AA audit (Phase 2) is outstanding. The 16px floor and black
headings move toward it but are not a substitute for the audit.

## Verification
- Banner computed styles matched live alpha.gov.bb.
- Live Playwright load: no JS errors, pills/sections render.
- 158/158 unit tests pass (`branding.test.mjs` updated to drop the removed
  `island` control from its required-controls list).
