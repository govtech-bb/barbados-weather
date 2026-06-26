# gov-bb Design System — Extracted Reference

Source of truth for the static port. Pulled 2026-06-26 from:
- Tokens: `@govtech-bb/design@1.0.0-alpha.16` (public npm) → `src/index.css`
- Components: `github.com/govtech-bb/design-system` `packages/react/src/components/`
- Composition: `github.com/govtech-bb/gov-bb` (default branch `sandbox`) `apps/landing/src/components/`
- Assets: `gov-bb` `apps/landing/public/images/coat-of-arms.png`; Logo SVG from design-system `Logo.tsx`

## Design tokens (exact, from @govtech-bb/design)

```
--color-yellow-00:#e8a833; --color-yellow-100:#ffc726; --color-yellow-40:#ffe9a8; --color-yellow-10:#fff9e9;
--color-blue-00:#00164a;   --color-blue-100:#00267f;   --color-blue-40:#99a8cc;   --color-blue-10:#e5e9f2;
--color-black-00:#000000;  --color-mid-grey-00:#595959; --color-grey-00:#e0e4e9;  --color-white-00:#ffffff;
--color-green-100:#1fbf84; --color-red-100:#ff6b6b; (+ purple/pink/teal families)
--color-focus-visible:#ace6e9;
--font-size-display:5rem; --font-size-h1:3.5rem; --font-size-h2:2.5rem; --font-size-h3:1.5rem;
--font-size-h4:1.25rem; --font-size-body-lg:2rem; --font-size-body:1.25rem; --font-size-caption:1rem; --font-size-caption-sm:.75rem;
--line-height-h1:1.15; --line-height-h2:1.25; --line-height-h3:1.25; --line-height-body:1.5;
--font-weight-bold:700; --font-weight-normal:400;
--font-family-base:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
--spacing-xxs:.25rem; --spacing-xs:.5rem; --spacing-s:1rem; --spacing-xm:1.5rem; --spacing-m:2rem; --spacing-l:4rem; --spacing-xl:8rem;
```

## OfficialBanner (design-system OfficialBanner.tsx)
- Wrapper `bg-blue-100 w-full`; inner `flex gap-2 items-center px-4 py-2`.
- coat-of-arms `<img>` in a `shrink-0 w-4 h-4` box (16px), `object-cover`.
- `<p>` `text-[12px] leading-4 text-white`: "Official government website".
- Optional "Learn more" link (the landing passes `showLearnMore={false}`, so omit).
- Landing wraps it in `bg-blue-100` + `container` with `[&>div]:px-0`.

## StageBanner alpha (gov-bb StageBanner.tsx + design-system StatusBanner.tsx)
- StatusBanner alpha variant: `flex items-center p-s w-full rounded-sm bg-blue-10 border-blue-100`, `role="status" aria-live="polite"`, `aria-label="alpha status banner"`.
- Body text `text-[1.25rem] leading-normal text-black-00`: "This page is in " + link "Alpha" (secondary, href `/what-we-mean-by-alpha`) + ".".
- Landing wraps in `bg-blue-10` + `container`, StatusBanner `className="px-0"`.

## Header (gov-bb Header.tsx)
- `<header class="relative bg-yellow-100">` → `container` → `flex items-center gap-x-6 py-4 lg:py-6`.
- Home link wraps `<Logo>` (`h-7 w-auto lg:h-9`), link `aria-label="Go to the alpha.gov.bb homepage"`.
- Desktop nav `ml-auto` (hidden <640px): `<ul class="flex items-center gap-x-5 lg:gap-x-7">` with one item: Services → `/services`. (Mobile menu button omitted for our static port; nav can stay visible.)

## HelpfulBox (gov-bb HelpfulBox.tsx)
- `<aside class="flex flex-col items-start gap-xs border-4 border-yellow-100 bg-yellow-40 px-s py-xm">`
- `<h3>` "Was this helpful?"; `<p>` "Give us your feedback about this page."; secondary link "Help us improve alpha.gov.bb" → `/feedback`.

## Footer (design-system Footer.tsx; landing passes coat-of-arms + links)
- `<footer class="bg-blue-100 text-white w-full overflow-hidden">` → `container` → `grid lg:grid-cols-2 lg:gap-8`.
- Left `<nav>` `flex flex-col gap-2 py-8`: links underlined `text-body` (20px): Home `/`, Terms & Conditions `/terms`, Careers (external).
- Right column `flex flex-col items-start gap-6 justify-between pt-8 pb-4 lg:items-end`: coat-of-arms `<img class="block h-28 w-auto">` + `<p class="text-body">© 2026 Government of Barbados`.

## Logo
gov.bb wordmark SVG, `viewBox="0 0 276 27"`, `fill="currentColor"` (single `<g>` of `<path>`s spelling "Government of Barbados"). Vendored to `web/gov-logo.svg` with fill set to `#00164a` (blue-00) for the yellow header. Full path data in design-system `packages/react/src/components/Logo/Logo.tsx`.

## container
Centered, responsive padding: `padding-inline: var(--spacing-s)` (16px); `>=640px: var(--spacing-m)` (32px). For our static port the chrome is full-bleed and inner content aligns to the existing `.wrap` width (920px; 1140px @ ≥880px).

## Notes
- gov.bb design is light-only. The dashboard keeps its theme toggle for the CONTENT area; chrome (banners/header/footer) uses fixed gov colors regardless of theme.
- Figtree vendored locally as woff2 (weights 400/500/600/700/800) from `@fontsource/figtree` (unpkg `…/files/figtree-latin-<wt>-normal.woff2`).
