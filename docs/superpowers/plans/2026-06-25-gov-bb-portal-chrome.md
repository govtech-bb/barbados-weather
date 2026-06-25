# alpha.gov.bb Portal Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the page chrome so the weather service sits under the same shared header/footer as the alpha.gov.bb portal: a near-black top strip, a white header bar (crest + "Government of Barbados" + Home/Services nav), and a full-bleed navy footer — with full-bleed chrome and width-constrained content.

**Architecture:** Pure markup/CSS edits to `web/index.html` (inline `<style>` + body). The defining change is full-bleed chrome (strip/header/footer span the viewport) with a shared `.gov-bleed__inner` centering content to the same column as `.wrap`. The weather dashboard content and all JavaScript are unchanged.

**Tech Stack:** Static HTML/CSS in `web/index.html`; `web/sw.js` cache version; `node --test` (`test/branding.test.mjs`); Playwright (`e2e/smoke.spec.mjs`).

## Global Constraints

- Reproduce from the screenshot; placeholder coat-of-arms (reuse the existing navy/gold emblem SVG) and Inter+system fonts are acceptable, swappable later.
- Colors: navy `#0b2e6e` (`--navy`), near-black strip `#0b0c0c` (`--gov-black`), gold `#ffc726` (`--gold`), teal `--accent` (`#0e7490` light), pale-yellow feedback `#fff7bf` (`--gov-feedback-bg`).
- Content column width must match `.wrap`: `max-width:920px`, and `1140px` at `@media (min-width:880px)`. The shared `.gov-bleed__inner` MUST mirror both.
- **Preserve these element IDs verbatim (app JS reads them):** `island`, `mode`, `updated`, `settings-btn`, `settings-panel`, `set-temp`, `set-wind`, `set-theme`.
- Service title text stays `Barbados Weather &amp; Storm Watch`. No "Bim Weather" or personal strings may appear (guarded by existing tests).
- Feedback box stays a `mailto:feedback@gov.bb` link; copy becomes "Was this helpful? … Help us to improve alpha.gov.bb."
- No JS changes, no new dependencies, no backend.
- The feedback box has a fixed pale-yellow background in BOTH themes, so its text MUST be a fixed dark color (`#0b0c0c`) for contrast.
- After any structural HTML edit, verify `<div>` open/close balance is equal.
- Commit after every task. Commands run from repo root.

---

### Task 1: Tokens, full-bleed helper, and near-black top strip

**Files:**
- Modify: `web/index.html` (inline `<style>` + body top)
- Modify: `test/branding.test.mjs`

**Interfaces:**
- Produces: `--gov-black`, `--gov-feedback-bg` tokens; a `.gov-bleed__inner` centering helper used by header (Task 2) and footer (Task 3); a `.gov-strip` element as the first child of `<body>`.

- [ ] **Step 1: Extend the failing test**

Append to `test/branding.test.mjs`:

```js
test("near-black top utility strip is present", () => {
  assert.match(html, /class="gov-strip"/, "missing gov-strip");
  assert.match(html, /Official government website/, "missing official-website strip text");
});

test("full-bleed inner helper exists", () => {
  assert.match(html, /\.gov-bleed__inner\s*\{/, "missing .gov-bleed__inner helper");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — "missing gov-strip".

- [ ] **Step 3: Add tokens**

In `web/index.html`, add to the `:root` block (near the other tokens) AND to the `:root[data-theme="light"]` block:

```css
      --gov-black: #0b0c0c; --gov-feedback-bg: #fff7bf;
```

- [ ] **Step 4: Add the full-bleed helper + strip CSS**

Replace the existing `.gov-header__inner { ... }` rule (currently `max-width: 920px; margin: 0 auto; ...`) with a shared helper plus a header-specific rule:

```css
    .gov-bleed__inner { max-width: 920px; margin: 0 auto; padding: 0 1.1rem; }
    .gov-strip { background: var(--gov-black); color: rgba(255,255,255,0.85); font-size: 0.78rem; }
    .gov-strip .gov-bleed__inner { display: flex; align-items: center; gap: 0.4rem; padding-top: 0.3rem; padding-bottom: 0.3rem; }
```

In the existing `@media (min-width: 880px)` block (where `.wrap { max-width: 1140px; }` lives), add:

```css
      .gov-bleed__inner { max-width: 1140px; }
```

- [ ] **Step 5: Add the strip markup**

In `web/index.html`, immediately after `<body>` (before `<header class="gov-header">`) insert:

```html
  <div class="gov-strip">
    <div class="gov-bleed__inner">
      <span aria-hidden="true">🇧🇧</span>
      <span>Official government website</span>
    </div>
  </div>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test test/branding.test.mjs`
Expected: PASS (new tests green).

- [ ] **Step 7: Commit**

```bash
git add web/index.html test/branding.test.mjs
git commit -m "feat(web): add gov.bb top strip, full-bleed helper, chrome tokens"
```

---

### Task 2: White two-tier header (crest + wordmark + Home/Services nav)

**Files:**
- Modify: `web/index.html` (header markup lines ~468–486 and header/service-bar CSS ~154–162)
- Modify: `test/branding.test.mjs`

**Interfaces:**
- Consumes: `.gov-bleed__inner` (Task 1), `--navy`, `--accent`, `--gold`, `--border`.
- Produces: white `.gov-header` with `.gov-brand`, `.gov-nav` (Home/Services + teal icon button).

- [ ] **Step 1: Extend the failing test**

Append to `test/branding.test.mjs`:

```js
test("white header has brand and Home/Services nav", () => {
  assert.match(html, /class="gov-nav"/, "missing gov-nav");
  assert.match(html, />\s*Home\s*</, "missing Home link");
  assert.match(html, />\s*Services\s*</, "missing Services link");
  assert.match(html, /Government of Barbados/, "missing wordmark");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — "missing gov-nav".

- [ ] **Step 3: Replace the header markup**

Replace the entire `<header class="gov-header"> ... </header>` block with (KEEP the inner crest `<svg>` exactly as it currently is — it is the placeholder emblem; only the wrapper structure and nav change):

```html
  <header class="gov-header">
    <div class="gov-bleed__inner gov-header__inner">
      <a class="gov-brand" href="/">
        <span class="gov-crest" aria-hidden="true">
          <svg viewBox="0 0 100 100" focusable="false" width="100%" height="100%">
            <rect width="100" height="100" rx="24" fill="#0b2e6e"/>
            <g stroke="#ffc726" stroke-width="4.5" stroke-linecap="round">
              <line x1="32" y1="58" x2="24" y2="58"/><line x1="34.4" y1="49" x2="27.5" y2="45"/>
              <line x1="41" y1="42.4" x2="37" y2="35.5"/><line x1="50" y1="40" x2="50" y2="32"/>
              <line x1="59" y1="42.4" x2="63" y2="35.5"/><line x1="65.6" y1="49" x2="72.5" y2="45"/>
              <line x1="68" y1="58" x2="76" y2="58"/>
            </g>
            <path d="M35 58 a15 15 0 0 1 30 0 z" fill="#ffc726"/>
            <g stroke="#ffffff" stroke-width="5" stroke-linecap="round"><line x1="14" y1="58" x2="31" y2="58"/><line x1="69" y1="58" x2="86" y2="58"/></g>
            <path d="M16 76 q9 -8 18 0 t18 0 t18 0 t18 0" fill="none" stroke="#7fd6ea" stroke-width="5" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="gov-wordmark">Government of Barbados</span>
      </a>
      <nav class="gov-nav" aria-label="Government of Barbados">
        <a href="/">Home</a>
        <a href="/services">Services</a>
        <button class="gov-nav__icon" type="button" aria-label="Account">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></svg>
        </button>
      </nav>
    </div>
  </header>
```

- [ ] **Step 4: Replace the header CSS**

Replace the current `.gov-header`, `.gov-crest`, `.gov-crest svg`, `.gov-wordmark` rules (the `.gov-header__inner` rule was already replaced in Task 1) and the `.gov-service-bar*` rules with:

```css
    .gov-header { background: #fff; border-bottom: 1px solid var(--border); box-shadow: 0 1px 0 rgba(11,31,58,0.04); }
    .gov-header__inner { display: flex; align-items: center; gap: 0.7rem; padding-top: 0.7rem; padding-bottom: 0.7rem; }
    .gov-brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
    .gov-crest { width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .gov-crest svg { width: 100%; height: 100%; display: block; }
    .gov-wordmark { color: var(--navy); font-weight: 800; font-size: 1.15rem; letter-spacing: -0.01em; }
    .gov-nav { margin-left: auto; display: flex; align-items: center; gap: 1rem; }
    .gov-nav a { color: var(--navy); text-decoration: none; font-weight: 600; font-size: 0.95rem; }
    .gov-nav a:hover { text-decoration: underline; }
    .gov-nav__icon { width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--accent); color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
    /* Service identity row — portal page-heading treatment on white. */
    .gov-service-bar { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; padding: 1.4rem 0 0.6rem; border-bottom: 1px solid var(--border); margin-bottom: 1.1rem; }
    .gov-service-bar__title h1 { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.01em; color: var(--heading); }
    .gov-service-bar .island { font-size: 0.92rem; color: var(--muted); }
```

- [ ] **Step 5: Verify and pass**

Run: `node --test test/branding.test.mjs` → PASS.
Run div-balance check:
```bash
node -e "const s=require('fs').readFileSync('web/index.html','utf8'); const o=(s.match(/<div/g)||[]).length, c=(s.match(/<\/div>/g)||[]).length; console.log('div open',o,'close',c)"
```
Expected: open === close. Report numbers.

- [ ] **Step 6: Commit**

```bash
git add web/index.html test/branding.test.mjs
git commit -m "feat(web): white gov.bb header bar with crest and Home/Services nav"
```

---

### Task 3: Full-bleed navy footer + portal feedback box

**Files:**
- Modify: `web/index.html` (feedback section ~774–778, footer ~780–786 moved out of `.wrap`, and footer/feedback CSS ~459–464)
- Modify: `web/sw.js` (cache version)
- Modify: `test/branding.test.mjs`

**Interfaces:**
- Consumes: `.gov-bleed__inner`, `--navy`, `--gold`, `--gov-feedback-bg`, `--gov-link`.
- Produces: full-bleed `<footer class="gov-footer">` outside `.wrap`; restyled `.gov-feedback`.

- [ ] **Step 1: Extend / update the tests**

In `test/branding.test.mjs`:
- UPDATE the existing feedback test: change the assertion `assert.match(html, /Was this page helpful\?/i, ...)` to `assert.match(html, /Was this helpful\?/i, "missing feedback prompt")` and ADD `assert.match(html, /Help us to improve alpha\.gov\.bb/i, "missing alpha.gov.bb feedback copy")`. (Legitimate expectation update — the copy changed by design.)
- APPEND a footer test:

```js
test("full-bleed navy footer with gov links", () => {
  assert.match(html, /class="gov-footer"/, "missing gov-footer");
  assert.match(html, /Terms &amp; Conditions/, "missing Terms link");
  assert.match(html, /© 2026 Government of Barbados/, "missing copyright");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — "missing alpha.gov.bb feedback copy" and "missing Terms link".

- [ ] **Step 3: Restyle + recopy the feedback box**

Replace the `<section class="gov-feedback"> ... </section>` block with:

```html
    <section class="gov-feedback" aria-labelledby="feedback-h">
      <h2 id="feedback-h">Was this helpful?</h2>
      <p>Give us your feedback about this page. Help us to improve alpha.gov.bb.
        <a href="mailto:feedback@gov.bb?subject=Barbados%20Weather%20%26%20Storm%20Watch%20feedback">Send feedback</a>.</p>
    </section>
```

- [ ] **Step 4: Move the footer out of `.wrap` and make it full-bleed**

The `<footer class="gov-footer"> ... </footer>` currently sits AFTER `</main>` but the closing of `.wrap` is the `</div>` that follows the footer. Restructure so the footer is OUTSIDE `.wrap`: ensure `.wrap` closes (its `</div>`) immediately after the `.gov-feedback` section, then place the footer as a direct child of `<body>`. Replace the footer block with:

```html
  <footer class="gov-footer">
    <div class="gov-bleed__inner gov-footer__inner">
      <div class="gov-footer__main">
        <nav class="gov-footer__nav" aria-label="Footer">
          <a href="/">Home</a>
          <a href="/terms">Terms &amp; Conditions</a>
        </nav>
        <p class="gov-footer__meta"><strong>Forecasts and threat levels are generated automatically and may be wrong.</strong> Always follow official guidance from <a href="https://www.barbadosweather.org">Barbados Meteorological Services</a> and the Department of Emergency Management. Storm data: NOAA NHC · Weather &amp; marine: Open-Meteo.</p>
        <p class="gov-footer__copyright">© 2026 Government of Barbados</p>
      </div>
      <span class="gov-footer__emblem" aria-hidden="true">
        <svg viewBox="0 0 100 100" focusable="false" width="100%" height="100%">
          <rect width="100" height="100" rx="14" fill="#ffffff" fill-opacity="0.08"/>
          <g stroke="#ffc726" stroke-width="4.5" stroke-linecap="round">
            <line x1="32" y1="58" x2="24" y2="58"/><line x1="50" y1="40" x2="50" y2="32"/><line x1="68" y1="58" x2="76" y2="58"/>
          </g>
          <path d="M35 58 a15 15 0 0 1 30 0 z" fill="#ffc726"/>
          <path d="M16 76 q9 -8 18 0 t18 0 t18 0 t18 0" fill="none" stroke="#7fd6ea" stroke-width="5" stroke-linecap="round"/>
        </svg>
      </span>
    </div>
  </footer>
```

Confirm `</body>` follows the footer.

- [ ] **Step 5: Replace footer/feedback CSS**

Replace the existing `.gov-feedback*` and `.gov-footer*` rules with:

```css
    .gov-feedback { background: var(--gov-feedback-bg); border: 1px solid #f3d000; border-radius: 6px; padding: 1rem 1.15rem; margin: 1.5rem 0; }
    .gov-feedback h2, .gov-feedback p { color: #0b0c0c; }
    .gov-feedback h2 { font-size: 1.05rem; margin-bottom: 0.3rem; }
    .gov-feedback a { color: var(--gov-link); text-decoration: underline; }
    .gov-footer { background: var(--navy); color: rgba(255,255,255,0.85); border-top: 3px solid var(--gold); margin-top: 2rem; }
    .gov-footer__inner { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .gov-footer__nav { display: flex; gap: 1.2rem; margin-bottom: 0.7rem; }
    .gov-footer a { color: #fff; text-decoration: underline; }
    .gov-footer__meta { font-size: 0.8rem; line-height: 1.5; color: rgba(255,255,255,0.8); max-width: 62ch; }
    .gov-footer__copyright { margin-top: 0.6rem; font-weight: 600; color: #fff; }
    .gov-footer__emblem { width: 64px; height: 64px; flex-shrink: 0; }
    .gov-footer__emblem svg { width: 100%; height: 100%; display: block; }
```

- [ ] **Step 6: Bump the service-worker cache version**

In `web/sw.js`, change the cache constant `hr-cache-v3-gov1` to `hr-cache-v3-gov2`.

- [ ] **Step 7: Verify and pass**

Run: `node --test test/branding.test.mjs` → PASS.
Run the div-balance check (from Task 2 Step 5); confirm open === close; report numbers.
Run `npm test` once → full suite green.

- [ ] **Step 8: Commit**

```bash
git add web/index.html web/sw.js test/branding.test.mjs
git commit -m "feat(web): full-bleed navy gov.bb footer and portal feedback box"
```

---

### Task 4: e2e smoke update + verification + local screenshot

**Files:**
- Modify: `e2e/smoke.spec.mjs`

**Interfaces:**
- Consumes: the rebuilt chrome served by the running container.

- [ ] **Step 1: Add the failing assertions**

In `e2e/smoke.spec.mjs`, immediately after the existing gov masthead assertions (the `.gov-header` / `h1` ones added previously), add:

```js
  await expect(page.locator(".gov-strip")).toContainText("Official government website");
  await expect(page.locator(".gov-footer")).toContainText("Government of Barbados");
```

(Keep all existing assertions unchanged.)

- [ ] **Step 2: Run the unit suite**

Run: `npm test`
Expected: PASS — all `test/*.test.mjs` including branding green.

- [ ] **Step 3: Run the app and e2e smoke**

Run (port 8081 to avoid a known local collision on 8080):
```bash
REPLAY=1 DISABLE_AI=1 HOST_PORT=8081 docker compose up -d --build
BASE_URL=http://localhost:8081 npm run test:e2e
```
Expected: smoke test PASSES, including the new strip/footer assertions (these do not depend on external feeds).

- [ ] **Step 4: Capture a screenshot for visual comparison**

Run:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1100,1900 --screenshot=/tmp/gov-portal-chrome.png "http://localhost:8081/"
```
Then leave the container running (the controller will inspect the screenshot) and report the screenshot path. Do NOT run `docker compose down` (the controller wants the app live for review).

- [ ] **Step 5: Commit**

```bash
git add e2e/smoke.spec.mjs
git commit -m "test(e2e): assert gov.bb top strip and navy footer render"
```

---

## Self-Review

**Spec coverage:** top strip → Task 1; white header + nav + service heading → Task 2; navy full-bleed footer + portal feedback box + SW bump → Task 3; e2e + verification + screenshot → Task 4. Full-bleed pattern (`.gov-bleed__inner` mirroring `.wrap` widths) → Task 1, used in 2 & 3. ✓

**Placeholder scan:** placeholder coat-of-arms (reused emblem), `/services` `/terms` nav targets, and `gov.bb` domains are intentional, documented placeholders. All code steps contain concrete code. ✓

**Type/name consistency:** class names `gov-strip`, `gov-bleed__inner`, `gov-header`, `gov-header__inner`, `gov-brand`, `gov-crest`, `gov-wordmark`, `gov-nav`, `gov-nav__icon`, `gov-service-bar`, `gov-feedback`, `gov-footer`, `gov-footer__inner/nav/main/meta/copyright/emblem` are consistent between markup, CSS, and tests. The existing feedback test copy change is explicitly an update, not a new assertion. ✓
