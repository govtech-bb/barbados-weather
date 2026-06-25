# Government of Barbados Rebrand — Design Spec

**Date:** 2026-06-25
**Status:** Approved (design); pending spec review
**Workstream:** A of 3 (Rebrand · Repo-move · CI/CD). This spec covers **A only**.

## Goal

Make the existing Barbados weather + hurricane-alert dashboard ("Bim Weather")
present as an official **Government of Barbados** service, matching the gov.bb
portal look from the reference screenshot, and remove every personal reference
to the original author from the page and the repo.

## Approach

Option A — **apply the gov.bb design-system shell around the existing
dashboard**. The dashboard's content, panels, structure, and JavaScript logic
are unchanged. The change is a presentation layer only:

- A set of gov design tokens (palette + type) added to the stylesheet.
- A gov **header** (navy crest bar + service-name row) replacing the current
  Bim Weather header block.
- A gov **footer** + "Was this page helpful?" box.
- Light tuning of existing cards so their color sits calmly inside the gov frame.

Brand fidelity is **"match the screenshot"**: best-approximation colors, a
system/Inter font stack, and a placeholder crest SVG — all swappable later if
official gov.bb assets become available.

This is the correct GOV.UK pattern: an individual service lives *inside* the
shared gov shell rather than reproducing the portal landing page.

## Scope

### In scope

**Visual (gov shell):**
- `web/index.html`
  - Replace the Bim Weather header block (around lines 477–499) with a gov
    crest bar: placeholder crest SVG + "Government of Barbados" wordmark, plus a
    service-name row beneath reading the service title. The existing settings
    (⚙) gear, freshness pills (`#mode`, `#updated`), and theme/units controls
    move into this row and keep working.
  - Add a gov footer (Home, Terms links; "© 2026 Government of Barbados")
    replacing the "Built by Christopher Corbin" credit (line ~766).
  - Add a "Was this page helpful?" feedback box (yellow-bordered, per
    screenshot) near the bottom, wired to a `mailto:` link (no backend).
- Stylesheet (`<style>` in `index.html` / associated CSS)
  - Add gov design tokens:
    - `--gov-navy: #0b2e6e` (header/footer)
    - `--gov-link`: gov blue, links underlined
    - body text black, page background white
    - `--gov-focus: #ffdd00` GDS yellow focus ring via `:focus-visible`
  - Font: Inter (CDN already preconnected) with a system fallback stack.
  - Reconcile weather cards: flatter borders, gov-navy headings, softer card
    tint. **Threat-level severity colors (storm reds/oranges) stay vivid** —
    they are functional, not decorative.
- `web/manifest.webmanifest`, `web/sw.js`, icon assets — update app name and
  theme color to the gov service name.

**Non-visual (personal-reference sweep):**
- `web/index.html:766` — remove "Built by Christopher Corbin" /
  `christophercorbin.cloud`.
- `README.md` — remove the same credit + `christophercorbin.cloud`; update
  `ghcr.io/christophercorbin/hurricane-ready` image paths to neutral/org paths.
- `src/*.mjs` (nhc, tropical, advisory, civil, weather) — replace User-Agent
  strings `hurricane-ready (github.com/christophercorbin/hurricane-ready)` with
  a neutral identifier, e.g. `barbados-weather (gov.bb)`.
- `src/push.mjs` — replace VAPID subject `mailto:alerts@hurricane-ready.local`
  with a gov-appropriate placeholder.
- `web/index.html` — replace hardcoded personal CloudFront canonical + Open
  Graph URLs (`d1a03jmlh4dne2.cloudfront.net`) with placeholders pending the
  gov domain decision in Workstream C.

### Out of scope (deferred)

- Workstream B — moving the repo into the GovTech GitHub org.
- Workstream C — retargeting CI/CD + Terraform to the GovTech sandbox AWS
  account and choosing the final gov domain.
- A real feedback backend (the box is a `mailto` for now). **Future:** route
  feedback to SNS (a topic publish) instead of `mailto` once the gov AWS
  account is wired in Workstream C.
- Full GOV.UK Frontend component rebuild (rejected: flattens the data-dense
  dashboard for little gain).
- A new portal-style landing page (rejected: wrong template for a single
  service).

## Components / data flow

No new runtime components. No API, routing, or data-flow changes. The service
worker (`sw.js`) continues to cache the app shell — its cache name/version
should bump so the rebranded shell supersedes the cached old one.

## Error handling

No new failure modes. The `mailto` feedback link degrades gracefully (opens the
user's mail client or no-ops). All existing graceful-degradation behavior of the
weather panels is untouched.

## Testing

- Existing Playwright e2e should remain green (weather behavior unchanged).
- Visual smoke check: page renders with the gov header + footer, no console
  errors, settings/units/theme controls still function.
- Repo-wide grep verifying **zero** remaining personal strings
  (`christophercorbin`, `christopher.corbin`, the personal CloudFront host,
  "Built by").

## Open items handed to later workstreams

- Final service name / wordmark text (placeholder: "Barbados Weather & Storm
  Watch").
- Official crest asset, exact brand hex codes, official font (placeholder
  approximations used until then).
- Gov domain for canonical/OG URLs and the feedback `mailto` address (decided
  in Workstream C).
