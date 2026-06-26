# Adopt the Real gov-bb Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Tasks 1–4 are delegable static edits (TDD via `test/branding.test.mjs`); Task 5 deploys (push to `main` → auto release). Steps use `- [ ]`.

**Goal:** Replace the navy approximation chrome with a faithful static port of the real alpha.gov.bb chrome (`@govtech-bb/design` tokens + `@govtech-bb/react` component markup), keeping the weather dashboard and JS unchanged.

**Architecture:** Copy real design tokens into `web/index.html` `:root`; vendor Figtree (woff2) + coat-of-arms.png + gov.bb Logo SVG into `web/`; rebuild chrome bands as plain HTML/CSS against the tokens. Chrome full-bleed; content aligned to `.wrap` via the existing `.gov-bleed__inner`.

**Tech Stack:** static HTML/CSS/JS, `node --test`, Playwright, the existing sandbox CI/CD (`release.yml`).

**Reference (exact tokens/markup/assets):** `docs/superpowers/specs/gov-bb-chrome-reference.md`.

## Global Constraints
- Token values **verbatim** from `@govtech-bb/design` (reference doc). Key: yellow-100 `#ffc726`, yellow-40 `#ffe9a8`, blue-100 `#00267f`, blue-10 `#e5e9f2`, blue-00 `#00164a`, black-00 `#000`, white-00 `#fff`, focus `#ace6e9`; Figtree font; spacing scale.
- Preserve the 8 control IDs: `island`, `mode`, `updated`, `settings-btn`, `settings-panel`, `set-temp`, `set-wind`, `set-theme`.
- Chrome colors are fixed (theme-independent); chrome text legible in both themes (use fixed token colors, not `--text`).
- No external font/asset CDN — vendor locally. No new deps, no JS logic change, no backend. HelpfulBox stays `mailto:feedback@gov.bb`.
- No "Bim Weather"/personal strings (`christophercorbin`, etc.) reintroduced.
- Remove the superseded approximation chrome (`.gov-strip`, old white `.gov-header`, `.gov-wordmark`, `.gov-crest`, old `.gov-feedback`/`.gov-footer` styling, tokens `--gov-navy/--gov-black/--gov-cyan/--gov-feedback-bg/--gov-link/--gov-link-visited/--gov-focus`). Keep `.gov-bleed__inner`.
- After structural edits, `<div>` open/close balance must be equal.
- Commit after each task.

---

### Task 1: Vendor assets + Figtree font + real design tokens

**Files:** add `web/coat-of-arms.png`, `web/gov-logo.svg`, `web/fonts/figtree-latin-{400,500,600,700,800}-normal.woff2`; modify `web/index.html` (`<style>` `:root` + `@font-face` + `body`); modify `test/branding.test.mjs`.

- [ ] **Step 1: Vendor the assets** (run from repo root)

```bash
mkdir -p web/fonts
# coat of arms (from gov-bb landing)
gh api "repos/govtech-bb/gov-bb/contents/apps/landing/public/images/coat-of-arms.png?ref=sandbox" --jq '.content' | base64 -d > web/coat-of-arms.png
# Figtree woff2 (latin) from @fontsource via unpkg
for w in 400 500 600 700 800; do
  curl -fsSL "https://unpkg.com/@fontsource/figtree@5.2.10/files/figtree-latin-$w-normal.woff2" -o "web/fonts/figtree-latin-$w-normal.woff2"
done
ls -l web/coat-of-arms.png web/fonts/*.woff2   # all non-zero
```

- [ ] **Step 2: Build `web/gov-logo.svg`** from the design-system Logo source

```bash
# Extract the <g>…</g> path block from Logo.tsx and wrap it as a standalone SVG with a baked dark fill.
gh api "repos/govtech-bb/design-system/contents/packages/react/src/components/Logo/Logo.tsx" --jq '.content' | base64 -d > /tmp/Logo.tsx
```
Then create `web/gov-logo.svg` as: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 276 27" fill="#00164a" role="img" aria-label="Government of Barbados">` + the exact `<g>…</g>` block from `/tmp/Logo.tsx` + `</svg>`. Verify it opens as a valid SVG (e.g. `head -c 60 web/gov-logo.svg` shows the `<svg` tag) and contains multiple `<path`.

- [ ] **Step 3: Write the failing test**

Append to `test/branding.test.mjs`:

```js
import { existsSync } from "node:fs";

test("gov-bb real design tokens are present", () => {
  assert.match(html, /--color-yellow-100:\s*#ffc726/i, "missing yellow-100 token");
  assert.match(html, /--color-blue-100:\s*#00267f/i, "missing blue-100 token");
  assert.match(html, /--color-blue-10:\s*#e5e9f2/i, "missing blue-10 token");
});
test("Figtree is vendored and font-faced", () => {
  assert.match(html, /@font-face/, "missing @font-face");
  assert.match(html, /Figtree/, "missing Figtree family");
  assert.ok(existsSync(new URL("../web/fonts/figtree-latin-400-normal.woff2", import.meta.url)), "missing Figtree 400 woff2");
  assert.ok(existsSync(new URL("../web/coat-of-arms.png", import.meta.url)), "missing coat-of-arms.png");
  assert.ok(existsSync(new URL("../web/gov-logo.svg", import.meta.url)), "missing gov-logo.svg");
});
test("superseded approximation tokens are gone", () => {
  for (const t of ["--gov-navy", "--gov-cyan", "--gov-feedback-bg", "--gov-focus"]) {
    assert.ok(!html.includes(t), `superseded token ${t} still present`);
  }
});
```

- [ ] **Step 4: Run test → fails** (`node --test test/branding.test.mjs`) — missing tokens / files.

- [ ] **Step 5: Add tokens, font-face, body font**

In `web/index.html` `<style>`, add near the top of `:root` (and REMOVE the superseded `--gov-*` approximation tokens wherever they appear in `:root` and `:root[data-theme="light"]`):

```css
    /* gov.bb design tokens (verbatim from @govtech-bb/design) */
    --color-yellow-100:#ffc726; --color-yellow-40:#ffe9a8; --color-yellow-10:#fff9e9; --color-yellow-00:#e8a833;
    --color-blue-00:#00164a; --color-blue-100:#00267f; --color-blue-40:#99a8cc; --color-blue-10:#e5e9f2;
    --color-black-00:#000000; --color-mid-grey-00:#595959; --color-grey-00:#e0e4e9; --color-white-00:#ffffff;
    --color-focus-visible:#ace6e9;
    --gov-font:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    --font-size-h2:2.5rem; --line-height-h2:1.25; --font-size-h3:1.5rem; --font-size-body:1.25rem; --font-size-caption:1rem;
    --spacing-xs:.5rem; --spacing-s:1rem; --spacing-xm:1.5rem; --spacing-m:2rem;
```

Add `@font-face` rules (just before `body {`):

```css
    @font-face{font-family:'Figtree';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/figtree-latin-400-normal.woff2') format('woff2');}
    @font-face{font-family:'Figtree';font-style:normal;font-weight:500;font-display:swap;src:url('/fonts/figtree-latin-500-normal.woff2') format('woff2');}
    @font-face{font-family:'Figtree';font-style:normal;font-weight:600;font-display:swap;src:url('/fonts/figtree-latin-600-normal.woff2') format('woff2');}
    @font-face{font-family:'Figtree';font-style:normal;font-weight:700;font-display:swap;src:url('/fonts/figtree-latin-700-normal.woff2') format('woff2');}
    @font-face{font-family:'Figtree';font-style:normal;font-weight:800;font-display:swap;src:url('/fonts/figtree-latin-800-normal.woff2') format('woff2');}
```

Set the body font to Figtree (replace the existing `font-family:` in `body {`):

```css
      font-family: var(--gov-font);
```

Update the global focus ring to the gov token (replace the previous `:focus-visible` rule's color with `var(--color-focus-visible)`):

```css
    :focus-visible { outline: 3px solid var(--color-focus-visible); outline-offset: 0; }
```

- [ ] **Step 6: Run test → passes.** Then `npm test` (full suite green). Note: some existing chrome assertions (focus token, gov-strip, "Help us to improve") will now fail — those are fixed in Tasks 2–3 where the markup changes. If `npm test` shows failures ONLY in those soon-to-change chrome assertions, that's expected; do not "fix" them here. (If unsure, list which assertions fail in the report.)

- [ ] **Step 7: Commit**

```bash
git add web/coat-of-arms.png web/gov-logo.svg web/fonts test/branding.test.mjs web/index.html
git commit -m "feat(web): vendor gov.bb design tokens, Figtree font, and crest/logo assets"
```

---

### Task 2: Top chrome — OfficialBanner + alpha StageBanner + yellow Header

**Files:** modify `web/index.html` (replace the current top-chrome markup — the old `.gov-strip` + white `.gov-header` blocks — and their CSS); modify `test/branding.test.mjs`.

- [ ] **Step 1: Extend/adjust the tests**

In `test/branding.test.mjs`, REPLACE the old top-strip test (`near-black top utility strip` / `gov-strip`) and the old white-header test (`gov-nav` / "white header") with:

```js
test("official banner present (blue, gov copy)", () => {
  assert.match(html, /class="gov-official"/, "missing gov-official");
  assert.match(html, /Official government website/, "missing official banner text");
});
test("alpha stage banner present", () => {
  assert.match(html, /This page is in/, "missing alpha stage prefix");
  assert.match(html, /\/what-we-mean-by-alpha/, "missing alpha explainer link");
  assert.match(html, />\s*Alpha\s*</, "missing Alpha link text");
});
test("yellow header has gov logo and Services nav", () => {
  assert.match(html, /class="gov-header"/, "missing gov-header");
  assert.match(html, /gov-logo\.svg/, "missing gov logo");
  assert.match(html, /href="\/services"/, "missing Services nav link");
});
```

- [ ] **Step 2: Run test → fails.**

- [ ] **Step 3: Replace the top-chrome markup**

Replace everything from `<body>` up to (but not including) `<div class="wrap">` with:

```html
<body>
  <div class="gov-official">
    <div class="gov-bleed__inner gov-official__inner">
      <img class="gov-official__crest" src="/coat-of-arms.png" alt="" aria-hidden="true" />
      <p>Official government website</p>
    </div>
  </div>
  <div class="gov-stage">
    <div class="gov-bleed__inner">
      <div class="gov-stage__box" role="status" aria-live="polite" aria-label="alpha status banner">
        <p>This page is in <a href="/what-we-mean-by-alpha">Alpha</a>.</p>
      </div>
    </div>
  </div>
  <header class="gov-header">
    <div class="gov-bleed__inner gov-header__inner">
      <a href="/" class="gov-logo-link" aria-label="Go to the homepage">
        <img class="gov-logo" src="/gov-logo.svg" alt="Government of Barbados" />
      </a>
      <nav class="gov-nav" aria-label="Primary">
        <ul><li><a href="/services">Services</a></li></ul>
      </nav>
    </div>
  </header>
```

(Keep `<div class="wrap">` and everything after it, including the `.gov-service-bar` with the 8 control IDs.)

- [ ] **Step 4: Replace the top-chrome CSS**

Remove the old `.gov-strip*`, white `.gov-header*`, `.gov-crest*`, `.gov-wordmark` rules; add:

```css
    .gov-official { background: var(--color-blue-100); }
    .gov-official__inner { display:flex; gap:.5rem; align-items:center; padding:.5rem 1rem; }
    .gov-official__crest { width:16px; height:16px; flex:0 0 auto; object-fit:cover; }
    .gov-official p { font-size:12px; line-height:1rem; color:var(--color-white-00); margin:0; }
    .gov-stage { background: var(--color-blue-10); }
    .gov-stage__box { padding:1rem; border:1px solid var(--color-blue-100); border-radius:.25rem; background:var(--color-blue-10); }
    .gov-stage p { font-size:var(--font-size-body); line-height:1.4; color:var(--color-black-00); margin:0; }
    .gov-stage a, .gov-helpful a { color:var(--color-blue-100); }
    .gov-header { position:relative; background: var(--color-yellow-100); }
    .gov-header__inner { display:flex; align-items:center; gap:1.5rem; padding-top:1rem; padding-bottom:1rem; }
    @media (min-width:1024px){ .gov-header__inner{ padding-top:1.5rem; padding-bottom:1.5rem; } }
    .gov-logo-link { display:inline-flex; }
    .gov-logo { height:1.75rem; width:auto; display:block; }
    @media (min-width:1024px){ .gov-logo{ height:2.25rem; } }
    .gov-nav { margin-left:auto; }
    .gov-nav ul { display:flex; align-items:center; gap:1.25rem; list-style:none; margin:0; padding:0; }
    .gov-nav a { color:var(--color-blue-00); font-weight:600; text-decoration:none; font-size:var(--font-size-caption); }
    .gov-nav a:hover { text-decoration:underline; }
    /* Service identity row, gov type */
    .gov-service-bar__title h1 { font-size:var(--font-size-h2); line-height:var(--line-height-h2); font-weight:700; color:var(--color-blue-00); }
    .gov-service-bar .island { font-size:var(--font-size-caption); color:var(--color-mid-grey-00); }
```

(Leave the existing `.gov-service-bar { display:flex; ... }` layout rule; just the title/island restyle above overrides type. If the old rule sets a conflicting `h1` color, ensure the new rule wins by source order / or edit it in place.)

- [ ] **Step 5: Run test → passes.** Run the div-balance check; report open/close (must be equal). `node --test test/branding.test.mjs` green.

- [ ] **Step 6: Commit**

```bash
git add web/index.html test/branding.test.mjs
git commit -m "feat(web): real gov.bb official banner, alpha stage banner, yellow header"
```

---

### Task 3: Bottom chrome — HelpfulBox + blue Footer

**Files:** modify `web/index.html` (replace the current `.gov-feedback` section and `.gov-footer`), `web/sw.js` (cache bump), `test/branding.test.mjs`.

- [ ] **Step 1: Adjust the tests**

In `test/branding.test.mjs`: update the feedback assertion to the real copy and add the footer/help checks. Replace any `Help us to improve` assertion with:

```js
test("helpful box uses real gov copy + mailto", () => {
  assert.match(html, /Was this helpful\?/i, "missing helpful heading");
  assert.match(html, /Help us improve alpha\.gov\.bb/i, "missing real helpful copy");
  assert.match(html, /href="mailto:feedback@gov\.bb/, "missing mailto");
});
test("blue gov footer with links + copyright", () => {
  assert.match(html, /class="gov-footer"/, "missing gov-footer");
  assert.match(html, /Terms &amp; Conditions/, "missing Terms link");
  assert.match(html, /Careers/, "missing Careers link");
  assert.match(html, /© 2026 Government of Barbados/, "missing copyright");
});
```

- [ ] **Step 2: Run test → fails.**

- [ ] **Step 3: Replace the HelpfulBox markup** (the current `<section class="gov-feedback">…</section>`):

```html
    <section class="gov-helpful" aria-labelledby="feedback-h">
      <h3 id="feedback-h">Was this helpful?</h3>
      <p>Give us your feedback about this page.</p>
      <a href="mailto:feedback@gov.bb?subject=Barbados%20Weather%20%26%20Storm%20Watch%20feedback">Help us improve alpha.gov.bb</a>
    </section>
```

- [ ] **Step 4: Replace the Footer markup** (the current `<footer class="gov-footer">…</footer>`):

```html
  <footer class="gov-footer">
    <div class="gov-bleed__inner gov-footer__grid">
      <nav class="gov-footer__nav" aria-label="Footer">
        <a href="/">Home</a>
        <a href="/terms">Terms &amp; Conditions</a>
        <a href="https://job-boards.greenhouse.io/govtechbarbados" rel="noopener noreferrer">Careers</a>
      </nav>
      <div class="gov-footer__brand">
        <img class="gov-footer__crest" src="/coat-of-arms.png" alt="" aria-hidden="true" />
        <p class="gov-footer__copyright">© 2026 Government of Barbados</p>
      </div>
    </div>
  </footer>
```

- [ ] **Step 5: Replace the HelpfulBox + Footer CSS** (remove old `.gov-feedback*` and `.gov-footer*` rules):

```css
    .gov-helpful { display:flex; flex-direction:column; align-items:flex-start; gap:var(--spacing-xs); border:4px solid var(--color-yellow-100); background:var(--color-yellow-40); padding:1.5rem 1rem; margin:1.5rem 0; }
    .gov-helpful h3 { font-size:var(--font-size-h3); color:var(--color-black-00); margin:0; }
    .gov-helpful p { color:var(--color-black-00); margin:0; }
    .gov-footer { background:var(--color-blue-100); color:var(--color-white-00); width:100%; overflow:hidden; margin-top:2rem; }
    .gov-footer__grid { display:grid; gap:0; }
    @media (min-width:1024px){ .gov-footer__grid{ grid-template-columns:1fr 1fr; gap:2rem; } }
    .gov-footer__nav { display:flex; flex-direction:column; gap:.5rem; padding:2rem 0; }
    .gov-footer__nav a { color:var(--color-white-00); font-size:var(--font-size-body); text-decoration:underline; }
    .gov-footer__brand { display:flex; flex-direction:column; align-items:flex-start; gap:1.5rem; padding:2rem 0 1rem; }
    @media (min-width:1024px){ .gov-footer__brand{ align-items:flex-end; padding-bottom:2rem; } }
    .gov-footer__crest { height:7rem; width:auto; display:block; }
    .gov-footer__copyright { font-size:var(--font-size-body); margin:0; color:var(--color-white-00); }
```

Also remove the now-unused legacy generic `footer { ... }` rule's conflicting props if present (the footer is now `.gov-footer`); ensure no leftover `text-align`/`max-width` constrains it.

- [ ] **Step 6: Bump SW cache** in `web/sw.js`: change `hr-cache-v3-gov2` → `hr-cache-v3-gov3`.

- [ ] **Step 7: Run test → passes.** Div-balance check (report open/close equal). `npm test` full suite green.

- [ ] **Step 8: Commit**

```bash
git add web/index.html web/sw.js test/branding.test.mjs
git commit -m "feat(web): real gov.bb helpful box and blue footer; sw cache bump"
```

---

### Task 4: e2e assertions + local screenshot verification

**Files:** modify `e2e/smoke.spec.mjs`.

- [ ] **Step 1: Update the e2e chrome assertions** (after `page.goto`), replacing the old strip/header ones:

```js
  await expect(page.locator(".gov-official")).toContainText("Official government website");
  await expect(page.locator(".gov-header img.gov-logo")).toBeVisible();
  await expect(page.locator(".gov-footer")).toContainText("© 2026 Government of Barbados");
```

Keep the existing `h1` "Barbados Weather & Storm Watch" assertion and the no-`christophercorbin` check.

- [ ] **Step 2: Unit suite** — `npm test` all green.

- [ ] **Step 3: Run app + e2e** (port 8081):

```bash
REPLAY=1 DISABLE_AI=1 HOST_PORT=8081 docker compose up -d --build
# wait for /healthz 200
BASE_URL=http://localhost:8081 npm run test:e2e
```
Expected: smoke passes incl. new chrome assertions.

- [ ] **Step 4: Screenshot** for visual comparison vs alpha.gov.bb (leave container running):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1200,2200 --screenshot=/tmp/gov-bb-real.png "http://localhost:8081/"
```
Report the screenshot path; do NOT `docker compose down`.

- [ ] **Step 5: Commit**

```bash
git add e2e/smoke.spec.mjs
git commit -m "test(e2e): assert real gov.bb official banner, logo header, footer"
```

---

### Task 5: Deploy to sandbox + verify live (operator-aware)

- [ ] **Step 1: Push `main`** to `govtech-bb/barbados-weather` (triggers `release.yml` auto-deploy).
- [ ] **Step 2: Watch the run** to success (`gh run watch …`).
- [ ] **Step 3: Verify** ECS steady (`running==desired`) and `curl -sI https://d1vndmereog5wb.cloudfront.net/` → 200; confirm the new chrome serves.
- [ ] **Step 4: Screenshot the live URL** and compare to `https://alpha.gov.bb/`.

---

## Self-Review
- Tokens/font/assets → Task 1; top chrome → Task 2; bottom chrome → Task 3; e2e+visual → Task 4; deploy → Task 5. ✓
- Superseded chrome removed (Tasks 1–3 remove old tokens/classes; tests guard `--gov-*` gone). ✓
- 8 IDs preserved (untouched `.gov-service-bar` markup; Task 2 keeps `.wrap` and below). ✓
- Real copy "Help us improve alpha.gov.bb" (no "to"), alpha explainer link, Careers — match reference doc. ✓
- Placeholders (`/services`, `/what-we-mean-by-alpha`, `/terms`, Careers URL) are intentional external/portal links. ✓
