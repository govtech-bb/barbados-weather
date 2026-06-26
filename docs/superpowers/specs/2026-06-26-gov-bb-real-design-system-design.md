# Adopt the Real gov-bb Design System — Design Spec

**Date:** 2026-06-26
**Status:** Approved (design); proceeding to plan
**Supersedes:** the chrome from `2026-06-25-gov-bb-portal-chrome-design.md` (the navy approximation). The personal-reference sweep and the dashboard content/JS from prior work stay.
**Reference (exact tokens/markup/assets):** `gov-bb-chrome-reference.md`

## Goal

Replace the hand-rolled navy chrome with a faithful static port of the **real** alpha.gov.bb chrome from the `@govtech-bb/design` + `@govtech-bb/react` system, so the weather service matches the live portal exactly. Approach chosen: **port real chrome (static)** — no React, no Tailwind build; copy the real design tokens, vendor the real font + assets, and hand-write the chrome markup/CSS against those tokens.

## Approach

- Copy `@govtech-bb/design` token values verbatim into `web/index.html`'s `:root`.
- Vendor the **Figtree** font locally as woff2 (`@fontsource/figtree`, weights 400/500/600/700/800) with `@font-face` — no external font CDN, no CSP change.
- Vendor the real **coat-of-arms.png** and the gov.bb **Logo** SVG into `web/`.
- Rebuild the chrome bands (OfficialBanner, alpha StageBanner, yellow Header, HelpfulBox, blue Footer) as plain HTML/CSS matching the canonical component markup, using the real tokens.
- Chrome is full-bleed; inner content aligns to the existing `.wrap` column width. The dashboard content and JS are untouched.

## Scope

### In scope (`web/index.html`, `web/sw.js`, new assets under `web/`)
1. **Tokens + font + assets:** real design tokens in `:root`; `@font-face` Figtree (5 weights, vendored woff2 under `web/fonts/`); `web/coat-of-arms.png`; `web/gov-logo.svg`. Body font → Figtree.
2. **OfficialBanner** — `bg-blue-100` strip, coat-of-arms (16px) + "Official government website" (12px white). `showLearnMore=false`.
3. **StageBanner (alpha)** — `bg-blue-10` band, blue-100 left accent, role=status: "This page is in **Alpha**." (Alpha → `/what-we-mean-by-alpha`).
4. **Header** — `bg-yellow-100`, gov.bb Logo (h-7 / h-9) as home link + "Services" nav (`/services`).
5. **Service heading row** — keep the dashboard's service title `Barbados Weather & Storm Watch` + freshness pills + ⚙ settings (all 8 control IDs preserved), styled with gov type tokens.
6. **HelpfulBox** — `border-4 border-yellow-100` + `bg-yellow-40`: "Was this helpful?" / "Give us your feedback about this page." / "Help us improve alpha.gov.bb" (`mailto:feedback@gov.bb`).
7. **Footer** — `bg-blue-100` white: Home · Terms & Conditions · Careers + coat-of-arms (h-28) + "© 2026 Government of Barbados".
8. **Remove** the superseded navy chrome (`.gov-strip`, old `.gov-header`/`__inner`, `.gov-wordmark`, `.gov-crest`, old `.gov-feedback`/`.gov-footer`, the gov-bb-approximation tokens like `--gov-navy/--gov-black/--gov-cyan/--gov-feedback-bg`, `--gov-focus`) — replaced by the real tokens/markup. Keep `.gov-bleed__inner` (full-bleed inner) pattern.
9. **SW cache bump** so the new shell supersedes the cached one.

### Out of scope (deferred / unchanged)
- React/Tailwind rebuild into the gov-bb monorepo (rejected — would replace the standalone repo + sandbox pipeline).
- Real `/services`, `/what-we-mean-by-alpha`, `/terms`, Careers targets (link to the live alpha.gov.bb paths or `#` placeholders where no canonical URL).
- The dashboard's weather panels, maps, charts, JS, theme toggle (kept).
- Custom domain, AI/alerts (separate deferred items).

## Constraints
- Preserve the 8 JS-referenced control IDs: `island`, `mode`, `updated`, `settings-btn`, `settings-panel`, `set-temp`, `set-wind`, `set-theme`.
- Token values copied **verbatim** from `@govtech-bb/design` (see reference doc).
- Chrome colors are fixed (theme-independent); only the dashboard content area honors the light/dark toggle. Chrome text must stay legible on its fixed backgrounds in both themes.
- No external font/asset CDN (vendor locally) — keep the container self-contained and CSP unchanged.
- No new runtime deps, no JS logic changes, no backend. HelpfulBox stays `mailto`.
- No "Bim Weather"/personal strings reintroduced (existing tests guard this).

## Testing / verification
- `test/branding.test.mjs`: assert OfficialBanner text, alpha StageBanner ("This page is in", "Alpha", `/what-we-mean-by-alpha`), yellow header + Logo + Services nav, HelpfulBox copy ("Was this helpful?", "Help us improve alpha.gov.bb"), footer (Terms & Conditions, © 2026), Figtree `@font-face`, real tokens present (`#ffc726`, `#00267f`), and NO superseded approximation tokens/classes remain. Keep all existing ID/no-personal-string assertions.
- Playwright smoke: assert OfficialBanner + yellow header + footer render.
- Manual: spin up locally (replay) and compare against `https://alpha.gov.bb/`; then deploy to sandbox and verify the live CloudFront URL.

## Open items (deferred)
- Canonical targets for Services/alpha-explainer/Terms/Careers.
- Custom gov domain; AI/alerts enablement.
