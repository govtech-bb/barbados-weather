# Government of Barbados Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present the existing Barbados weather dashboard as an official Government of Barbados service (matching the gov.bb screenshot) and remove every personal reference to the original author from the page and the repo.

**Architecture:** Pure presentation-layer change. The dashboard's content, panels, and JavaScript are untouched. We add gov design tokens + a GDS focus ring to the existing inline `<style>`, swap the masthead for a Government of Barbados crest bar, add a gov footer with a "Was this page helpful?" feedback box (mailto), and sweep personal strings out of `src/`, `README.md`, and the web assets. A new `test/branding.test.mjs` (node:test) guards all of this with real red/green cycles, plus one assertion added to the Playwright smoke test.

**Tech Stack:** Static HTML/CSS in `web/index.html` (inline `<style>`), `web/manifest.webmanifest`, `web/sw.js`, Node 22 ESM in `src/*.mjs`, `node --test` for unit tests, Playwright for e2e.

## Global Constraints

- **Brand fidelity:** "match the screenshot" — best-approximation colors, system/Inter font stack, placeholder crest SVG. Exact assets swappable later.
- **Navy:** `#0b2e6e` (already `--navy` in the stylesheet). Gold underline `#ffc726` (already `--gold`).
- **GDS focus ring:** `#ffdd00`, used via `:focus-visible`.
- **Service name / wordmark title:** `Barbados Weather & Storm Watch` (approved, keep verbatim).
- **Preserve these element IDs (the app JS reads them) when editing the header:** `island`, `mode`, `updated`, `settings-btn`, `settings-panel`, `set-temp`, `set-wind`, `set-theme`. Do not rename or remove them.
- **No new runtime dependencies, no backend, no API changes.** Feedback box is a `mailto:` for now (SNS is a future Workstream-C enhancement).
- **Placeholder domain:** until Workstream C sets the gov domain, use `gov.bb` in user-agent strings and `feedback@gov.bb` for the mailto. Replace personal CloudFront URLs (`d1a03jmlh4dne2.cloudfront.net`) with `https://weather.gov.bb` as a placeholder canonical/OG host.
- **Zero personal strings repo-wide** after this work: `christophercorbin`, `christopher.corbin`, `Built by Christopher`, `hurricane-ready.local`, `d1a03jmlh4dne2.cloudfront.net`.
- Commit after every task. Test commands run from repo root.

---

### Task 1: Branding test harness + gov design tokens & GDS focus ring

**Files:**
- Create: `test/branding.test.mjs`
- Modify: `web/index.html` (inline `<style>`, lines ~50–458)

**Interfaces:**
- Consumes: nothing.
- Produces: `test/branding.test.mjs` — a node:test file other tasks extend with more assertions. Reads files with `node:fs` `readFileSync`. Establishes the helper pattern `const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");`.

- [ ] **Step 1: Write the failing test**

Create `test/branding.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const html = read("../web/index.html");

test("gov design tokens are defined", () => {
  assert.match(html, /--gov-link:/, "missing --gov-link token");
  assert.match(html, /--gov-focus:\s*#ffdd00/i, "missing GDS yellow focus token");
});

test("global GDS yellow focus ring is present", () => {
  assert.match(
    html,
    /:focus-visible\s*\{[^}]*var\(--gov-focus\)/,
    "missing global :focus-visible rule using --gov-focus",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — "missing --gov-link token".

- [ ] **Step 3: Add the tokens and focus ring**

In `web/index.html`, inside the `:root` block (after line 71, before the closing `}` at line 72) add:

```css
      --gov-link: #1d70b8; --gov-link-visited: #4c2c92; --gov-focus: #ffdd00;
```

Add the same three tokens inside `:root[data-theme="light"]` (after line 90's `--soft-text` line) so they are stable in both themes:

```css
      --gov-link: #1d70b8; --gov-link-visited: #4c2c92; --gov-focus: #ffdd00;
```

Then add a global focus ring. Immediately after the `.skip-link:focus` rule (line 128) add:

```css
    /* GDS yellow focus ring — accessibility staple of the gov.bb design system. */
    :focus-visible { outline: 3px solid var(--gov-focus); outline-offset: 0; box-shadow: 0 0 0 1px #0b0c0c; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/branding.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add test/branding.test.mjs web/index.html
git commit -m "feat(web): add gov.bb design tokens and GDS focus ring"
```

---

### Task 2: Government of Barbados crest masthead

**Files:**
- Modify: `web/index.html` — body markup (lines 461–499) and inline `<style>` header rules (lines ~149–164)
- Modify: `test/branding.test.mjs`

**Interfaces:**
- Consumes: the `read`/`html` helper and tokens from Task 1.
- Produces: a full-bleed `<header class="gov-header">` followed by the existing content; a `.gov-service-bar` row holding the service title + preserved controls.

- [ ] **Step 1: Extend the failing test**

Append to `test/branding.test.mjs`:

```js
test("masthead shows Government of Barbados crest bar", () => {
  assert.match(html, /Government of Barbados/, "missing gov wordmark");
  assert.match(html, /class="gov-header"/, "missing gov-header element");
});

test("service title is the approved name", () => {
  assert.match(html, /Barbados Weather &amp; Storm Watch/, "missing service title");
  assert.doesNotMatch(html, /Bim Weather/, "stale Bim Weather brand still present");
});

test("header controls the app JS depends on are preserved", () => {
  for (const id of ["island", "mode", "updated", "settings-btn", "settings-panel", "set-temp", "set-wind", "set-theme"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing required control id="${id}"`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — "missing gov wordmark" and "stale Bim Weather brand still present".

- [ ] **Step 3: Replace the masthead markup**

In `web/index.html`, the `.wrap` div opens at line 461 and the skip-link + `<header>...</header>` (lines 462–499) currently sit *inside* it. Replace lines 461–499 with a full-bleed gov header placed before `.wrap`, then re-open `.wrap` with the skip-link:

```html
  <header class="gov-header">
    <div class="gov-header__inner">
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
    </div>
  </header>
  <div class="wrap">
    <a class="skip-link" href="#now">Skip to weather</a>
    <div class="gov-service-bar">
      <div class="gov-service-bar__title">
        <h1>Barbados Weather &amp; Storm Watch</h1>
        <span class="island"><span id="island">Barbados</span> weather, every day</span>
      </div>
      <div class="header-spacer"></div>
      <span class="pill" id="mode"></span>
      <span class="pill" id="updated"></span>
      <div class="settings-wrap">
        <button id="settings-btn" class="settings-btn" type="button" aria-label="Settings" aria-expanded="false" aria-haspopup="true" aria-controls="settings-panel"><span class="ico" data-icon="settings"></span></button>
        <div id="settings-panel" class="settings-panel" role="dialog" aria-label="Settings" hidden>
          <label>Temperature
            <select id="set-temp"><option value="C">°C</option><option value="F">°F</option></select>
          </label>
          <label>Wind speed
            <select id="set-wind"><option value="kmh">km/h</option><option value="kt">knots</option><option value="mph">mph</option></select>
          </label>
          <label>Theme
            <select id="set-theme"><option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option></select>
          </label>
        </div>
      </div>
    </div>
```

Note: this moves `<header>` out of `.wrap` (full-bleed) and renames the service row to `.gov-service-bar`. The closing `</header>` that was at line 499 is now the gov-header's; the service-bar div is closed by the existing structure — verify the `.wrap` div still closes at its original `</div>` (was line 760). The settings/pills/island markup is copied verbatim so all required IDs are preserved.

- [ ] **Step 4: Replace the header CSS**

In `web/index.html`, replace the `header { ... }` rule and the `.logo` rules (lines ~150–164, from `header { display: flex;` through `.header-spacer { flex: 1; }`) with:

```css
    /* Government of Barbados full-bleed crest bar (gov.bb masthead). */
    .gov-header { background: var(--navy); border-bottom: 3px solid var(--gold); }
    .gov-header__inner { max-width: 920px; margin: 0 auto; display: flex; align-items: center; gap: 0.7rem; padding: 0.7rem 1.1rem; }
    .gov-crest { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; overflow: hidden; display: flex; box-shadow: 0 0 0 1px rgba(255,255,255,0.14); }
    .gov-crest svg { width: 100%; height: 100%; display: block; }
    .gov-wordmark { color: #fff; font-weight: 800; font-size: 1.15rem; letter-spacing: -0.01em; }
    /* Service identity row beneath the crest bar. */
    .gov-service-bar { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; padding: 1rem 0 0.4rem; border-bottom: 1px solid var(--border); margin-bottom: 1.1rem; }
    .gov-service-bar__title h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: var(--heading); }
    .gov-service-bar .island { font-size: 0.92rem; color: var(--muted); }
    .header-spacer { flex: 1; }
```

Also delete the now-orphaned `header .pill`, `header .settings-btn`, `header .settings-btn:hover` overrides (lines ~161–163) since the controls now sit on a light background and should use the default `.pill` / `.settings-btn` styles.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/branding.test.mjs`
Expected: PASS (all tests, including the 3 new ones).

- [ ] **Step 6: Commit**

```bash
git add web/index.html test/branding.test.mjs
git commit -m "feat(web): Government of Barbados crest masthead and service bar"
```

---

### Task 3: Gov footer + "Was this page helpful?" feedback box

**Files:**
- Modify: `web/index.html` — footer markup (lines 762–767) and inline `<style>`
- Modify: `test/branding.test.mjs`

**Interfaces:**
- Consumes: tokens from Task 1, `read`/`html` helper.
- Produces: a `<section class="gov-feedback">` and a restyled `<footer class="gov-footer">`.

- [ ] **Step 1: Extend the failing test**

Append to `test/branding.test.mjs`:

```js
test("feedback box is present and uses mailto", () => {
  assert.match(html, /Was this page helpful\?/i, "missing feedback prompt");
  assert.match(html, /href="mailto:feedback@gov\.bb/, "feedback box must use the placeholder mailto");
});

test("footer carries the gov copyright, not a personal credit", () => {
  assert.match(html, /Government of Barbados/, "footer missing gov attribution");
  assert.doesNotMatch(html, /Built by Christopher/i, "personal credit still in footer");
  assert.doesNotMatch(html, /christophercorbin/i, "personal link still in page");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — "missing feedback prompt" and "personal credit still in footer".

- [ ] **Step 3: Replace the footer markup**

In `web/index.html` replace the `<footer>...</footer>` block (lines 762–767) with:

```html
    <section class="gov-feedback" aria-labelledby="feedback-h">
      <h2 id="feedback-h">Was this page helpful?</h2>
      <p>Give us your feedback to help improve this page.
        <a href="mailto:feedback@gov.bb?subject=Barbados%20Weather%20%26%20Storm%20Watch%20feedback">Send feedback</a>.</p>
    </section>

    <footer class="gov-footer">
      <p class="disclaimer"><strong>Forecasts and threat levels are generated automatically and may be wrong.</strong>
      Always follow official guidance from <a href="https://www.barbadosweather.org">Barbados Meteorological Services</a>
      and the Department of Emergency Management.</p>
      <p>Storm data from the NOAA National Hurricane Center · Weather &amp; marine from Open-Meteo.</p>
      <p class="gov-footer__copyright">© 2026 Government of Barbados</p>
    </footer>
```

- [ ] **Step 4: Add footer + feedback CSS**

Append inside the inline `<style>` (just before the closing `</style>` at line 458):

```css
    /* Was-this-page-helpful box — gov.bb yellow-bordered feedback pattern. */
    .gov-feedback { background: var(--card-2); border: 1px solid var(--gold); border-left-width: 6px; border-radius: 8px; padding: 1rem 1.15rem; margin: 1.5rem 0; }
    .gov-feedback h2 { font-size: 1.05rem; color: var(--heading); margin-bottom: 0.3rem; }
    .gov-feedback a { color: var(--gov-link); text-decoration: underline; }
    .gov-footer { border-top: 3px solid var(--gold); padding-top: 1rem; margin-top: 1.5rem; color: var(--muted); font-size: 0.85rem; }
    .gov-footer a { color: var(--gov-link); text-decoration: underline; }
    .gov-footer__copyright { margin-top: 0.6rem; font-weight: 600; color: var(--heading); }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/branding.test.mjs`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add web/index.html test/branding.test.mjs
git commit -m "feat(web): gov footer and Was this page helpful feedback box"
```

---

### Task 4: Personal-reference sweep (assets, src, README)

**Files:**
- Modify: `web/index.html` (canonical + OG/Twitter URLs, lines 9, 25, 26, 33; meta names/titles already say "Bim Weather" at lines 6, 18, 22, 23, 29, 31)
- Modify: `web/manifest.webmanifest`, `web/sw.js`
- Modify: `src/nhc.mjs`, `src/tropical.mjs`, `src/advisory.mjs`, `src/civil.mjs`, `src/weather.mjs`, `src/push.mjs`, `src/server.mjs`, `src/notify.mjs`
- Modify: `README.md`
- Modify: `test/branding.test.mjs`

**Interfaces:**
- Consumes: `read` helper.
- Produces: a repo-wide assertion that no personal strings remain in shipped files.

- [ ] **Step 1: Extend the failing test**

Append to `test/branding.test.mjs`:

```js
import { readdirSync } from "node:fs";

test("no personal strings in shipped web/src files", () => {
  const banned = [/christophercorbin/i, /christopher\.corbin/i, /hurricane-ready\.local/i, /d1a03jmlh4dne2\.cloudfront\.net/i];
  const files = [
    "../web/index.html", "../web/manifest.webmanifest", "../web/sw.js",
    ...readdirSync(new URL("../src", import.meta.url)).map((f) => `../src/${f}`),
  ];
  for (const f of files) {
    const body = read(f);
    for (const re of banned) {
      assert.doesNotMatch(body, re, `${f} still contains ${re}`);
    }
  }
});

test("user-agent strings are gov-neutral", () => {
  for (const f of ["../src/weather.mjs", "../src/nhc.mjs", "../src/tropical.mjs"]) {
    assert.match(read(f), /gov\.bb/, `${f} user-agent not rebranded`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/branding.test.mjs`
Expected: FAIL — files still contain `christophercorbin` / `d1a03jmlh4dne2.cloudfront.net` / `hurricane-ready.local`.

- [ ] **Step 3: Rewrite the User-Agent strings**

In each of `src/nhc.mjs`, `src/tropical.mjs`, `src/advisory.mjs`, `src/civil.mjs`, `src/weather.mjs`, replace every occurrence of:

```
hurricane-ready (github.com/christophercorbin/hurricane-ready)
```

with:

```
barbados-weather (gov.bb)
```

(In `src/weather.mjs` this includes the `const UA = ...` at line 20.)

- [ ] **Step 4: Rewrite the VAPID subject and app strings**

In `src/push.mjs` line 23, replace:

```js
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:alerts@hurricane-ready.local";
```

with:

```js
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:alerts@gov.bb";
```

`src/server.mjs` and `src/notify.mjs` reference "Bim Weather" — leave the functional log/subject text but update the user-facing email subject in `src/notify.mjs` line 24 from `[Bim Weather]` to `[Barbados Weather]`, and the `src/server.mjs` startup log string at line 487 from `Bim Weather watching` to `Barbados Weather watching`. (These are cosmetic; no personal data.)

- [ ] **Step 5: Rewrite web asset URLs and names**

In `web/index.html`:
- Line 9 `<link rel="canonical" href="https://d1a03jmlh4dne2.cloudfront.net/" />` → `href="https://weather.gov.bb/"`.
- Lines 25, 26, 33 (og:url, og:image, twitter:image) — replace the `d1a03jmlh4dne2.cloudfront.net` host with `weather.gov.bb`.
- Replace the remaining `Bim Weather` strings (lines 6, 18, 22, 23, 29, 31 — title/meta) with `Barbados Weather & Storm Watch` (or `Barbados Weather` for `apple-mobile-web-app-title`).

In `web/manifest.webmanifest`: set `"name": "Barbados Weather & Storm Watch"` and `"short_name": "Barbados Weather"`.

In `web/sw.js`: replace the `Bim Weather` strings in the comment (line 1) and the push fallback title (line 74) with `Barbados Weather`. Bump the cache name constant (search for the `CACHE`/version string at the top of `sw.js`) to a new version (e.g. append `-gov1`) so the rebranded shell supersedes the cached old one.

- [ ] **Step 6: Sweep the README**

In `README.md`: remove the `Built by [Christopher Corbin](https://christophercorbin.cloud)` credit (line ~197) and the same credit in the header paragraph; replace `ghcr.io/christophercorbin/hurricane-ready` image paths with `ghcr.io/OWNER/barbados-weather` (placeholder `OWNER`, resolved in Workstream B); change the title from `Hurricane-Ready` to `Barbados Weather & Storm Watch`.

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/branding.test.mjs`
Expected: PASS (all tests).

Then confirm with a raw grep:

Run: `grep -rniE "christophercorbin|christopher\.corbin|hurricane-ready\.local|d1a03jmlh4dne2" web src README.md`
Expected: no output (exit 1).

- [ ] **Step 8: Commit**

```bash
git add web src README.md test/branding.test.mjs
git commit -m "chore: remove personal references; gov-neutral user-agents and URLs"
```

---

### Task 5: e2e smoke assertion + full verification

**Files:**
- Modify: `e2e/smoke.spec.mjs`

**Interfaces:**
- Consumes: the rebranded `web/index.html` served by the running container.
- Produces: an e2e guarantee that the gov masthead renders and no personal credit ships.

- [ ] **Step 1: Add the failing assertion**

In `e2e/smoke.spec.mjs`, inside the existing `test("dashboard renders every section with real data", ...)` block, after the `await page.goto(BASE, ...)` line, add:

```js
  // Gov.bb masthead and clean footer.
  await expect(page.locator(".gov-header")).toContainText("Government of Barbados");
  await expect(page.locator("h1")).toContainText("Barbados Weather & Storm Watch");
  expect(await page.content()).not.toMatch(/christophercorbin/i);
```

- [ ] **Step 2: Run the unit suite**

Run: `npm test`
Expected: PASS — existing `test/*.test.mjs` plus `test/branding.test.mjs` all green.

- [ ] **Step 3: Run the app and the e2e smoke test**

Run:
```bash
docker compose up -d --build
BASE_URL=http://localhost:8080 npm run test:e2e
docker compose down
```
Expected: the smoke test PASSES, including the new gov masthead assertions. (If Open-Meteo is blocked in the environment, the weather sub-assertions self-skip per existing logic — the masthead assertions still run.)

- [ ] **Step 4: Final manual visual check**

Run: `docker compose up -d --build` then open `http://localhost:8080`. Confirm: navy "Government of Barbados" crest bar, service title row with working settings gear / units / theme, weather panels intact, yellow feedback box, gov footer with © line and no personal credit. Tab through the page and confirm the yellow focus ring appears. Then `docker compose down`.

- [ ] **Step 5: Commit**

```bash
git add e2e/smoke.spec.mjs
git commit -m "test(e2e): assert gov masthead renders and no personal credit ships"
```

---

## Self-Review

**Spec coverage:**
- Gov shell (header/footer) → Tasks 2, 3 ✓
- Design tokens + GDS focus ring → Task 1 ✓
- "Was this page helpful?" mailto box → Task 3 ✓
- Personal-reference sweep (index.html, README, src/*.mjs, push.mjs, manifest, sw, canonical/OG URLs) → Task 4 ✓
- SW cache bump → Task 4 Step 5 ✓
- Testing (unit grep assertions + Playwright smoke) → Tasks 1–5 ✓
- Threat-level colors stay vivid → untouched by design (we only edit header/footer/token rules), preserved by default ✓

**Deferred to later workstreams (correctly out of plan):** final service domain, official crest/fonts/hex, SNS feedback backend, repo org path (`OWNER` placeholder), CI/CD retarget.

**Placeholder scan:** `OWNER` in README and `weather.gov.bb`/`feedback@gov.bb`/`gov.bb` are intentional, documented placeholders tied to Workstream C, not unfilled plan steps. All code steps contain concrete code.

**Type/name consistency:** class names `gov-header`, `gov-header__inner`, `gov-crest`, `gov-wordmark`, `gov-service-bar`, `gov-feedback`, `gov-footer` are used consistently between markup (Tasks 2–3) and CSS (Tasks 2–3) and tests. Required IDs list is identical between the constraint block and Task 2's test.
