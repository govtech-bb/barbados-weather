# alpha.gov.bb Portal Chrome — Design Spec (Rebrand revision)

**Date:** 2026-06-25
**Status:** Approved (design); proceeding to plan
**Supersedes the chrome from:** `2026-06-25-gov-barbados-rebrand-design.md` (header/footer only; the personal-reference sweep and tokens from that work stay).

## Goal

Make the Barbados Weather & Storm Watch service sit under the **exact same shared
chrome** as the alpha.gov.bb portal landing page (the reference screenshot), so it
reads as one continuous site rather than a separate app. The reference screenshot
is the source of truth; assets are reproduced (placeholder coat-of-arms, closest
matching fonts/colors) and are swappable when official assets exist.

## Source of truth

The portal landing-page screenshot. Shared chrome (top strip, header, footer) is
reproduced identically; landing-only elements (hero search band, quick-action
buttons, service-category list) are NOT used on this service page.

## Approach

Rebuild the page chrome to the portal's structure. The defining change is
**full-bleed chrome with width-constrained content**: the top strip, header, and
footer span the full viewport width; page content is centered in a fixed-width
column. The existing weather dashboard content and JavaScript are unchanged.

## Scope

### In scope (chrome rebuild in `web/index.html`)

**1. Top utility strip (new, full-bleed)**
- Near-black bar `#0b0c0c`, full width.
- Left-aligned text: "Official government website" (with a small flag/emblem glyph).

**2. Header bar (replace current `.gov-header`)**
- White background, full-bleed, subtle bottom border (`#e3eaf4` / 1px), with the
  gold accent line retained as a thin bottom rule.
- Left: placeholder coat-of-arms crest SVG + "Government of Barbados" wordmark in
  navy (`#0b2e6e`).
- Right: nav links **Home** / **Services** (navy, the Services link points to a
  placeholder `/` for now) + a small teal (`#0e7490`/`#7fd6ea`) circular icon
  button (account/info placeholder).
- Inner content constrained to the same max-width as the body (920px), centered.

**3. Service page heading (replace `.gov-service-bar` styling)**
- No hero search band, no quick-action buttons, no category list.
- Service title `Barbados Weather &amp; Storm Watch` rendered as the page `<h1>`
  in the portal heading treatment (large, navy, on white), with the existing
  freshness pills (`#mode`, `#updated`) and ⚙ settings control beside/below it.
- The 8 JS-referenced IDs are preserved (see constraints).

**4. Footer (replace current `.gov-footer`)**
- Full-bleed navy bar `#0b2e6e`.
- Left: **Home** · **Terms & Conditions** links (white, underlined) and
  "© 2026 Government of Barbados".
- Right: placeholder coat-of-arms emblem.
- Inner content constrained to 920px, centered.

**5. Feedback box (restyle existing `.gov-feedback`)**
- Portal pale-yellow box (`#fff7bf`-ish background, gold border).
- Copy: "**Was this helpful?**" heading + "Give us your feedback about this page.
  Help us to improve alpha.gov.bb." with the existing `mailto:feedback@gov.bb`
  link as "Send feedback".

**6. Tokens & type**
- Add/confirm tokens: `--gov-navy:#0b2e6e`, `--gov-black:#0b0c0c`,
  `--gov-cyan:#7fd6ea`, `--gov-feedback-bg:#fff7bf`, `--gov-link` (existing).
- Full-bleed pattern: chrome elements break out of the centered column; a shared
  `.gov-bleed` + inner `.gov-bleed__inner { max-width:920px; margin:0 auto }`
  approach (or equivalent) so strip/header/footer align their inner content to
  the body column.
- Match the screenshot's sans-serif with the Inter + system fallback stack
  (already preconnected).

### Out of scope
- Landing-page elements (search, quick actions, category list).
- Real coat-of-arms / official fonts / exact hex from a live source (deferred;
  placeholders used — "Reproduce from the screenshot" was chosen).
- Any weather logic, API, or JS behavior change.
- Workstream B (done) and Workstream C (CI/CD, next).
- A real feedback backend (mailto stays; SNS is a future C enhancement).

## Constraints

- **Preserve these element IDs (app JS reads them):** `island`, `mode`,
  `updated`, `settings-btn`, `settings-panel`, `set-temp`, `set-wind`,
  `set-theme`. Do not rename or remove.
- No "Bim Weather" or personal strings may reappear (guarded by
  `test/branding.test.mjs`).
- No new runtime dependencies, no JS changes, no backend.
- Existing `test/branding.test.mjs` and Playwright smoke must stay green; extend
  them to assert the new chrome (top strip text, white header nav, navy footer,
  full-bleed structure).

## Components / data flow

No new runtime components. Pure markup/CSS in `web/index.html`. Service worker
cache version bumps again so the new chrome supersedes the cached shell.

## Testing

- `test/branding.test.mjs`: assert the top strip ("Official government website"),
  the Home/Services nav, the navy footer ("Terms & Conditions", "© 2026
  Government of Barbados"), and the feedback copy ("Help us to improve
  alpha.gov.bb"). Keep all existing assertions (IDs, no personal strings).
- Playwright smoke: assert the top strip and footer render; keep the masthead
  assertion (updated to the new structure).
- Manual: spin up locally (replay mode) and compare against the screenshot —
  full-bleed strip/header/footer, centered content, gov palette.

## Open items (deferred)
- Official coat-of-arms asset, exact fonts/hex, real Services/Home/Terms targets,
  and the gov domain (Workstream C) — placeholders until then.
