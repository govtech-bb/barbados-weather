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

test("feedback box is present and uses mailto", () => {
  assert.match(html, /Was this helpful\?/i, "missing feedback prompt");
  assert.match(html, /Help us to improve alpha\.gov\.bb/i, "missing alpha.gov.bb feedback copy");
  assert.match(html, /href="mailto:feedback@gov\.bb/, "feedback box must use the placeholder mailto");
});

test("footer carries the gov copyright, not a personal credit", () => {
  assert.match(html, /Government of Barbados/, "footer missing gov attribution");
  assert.doesNotMatch(html, /Built by Christopher/i, "personal credit still in footer");
  assert.doesNotMatch(html, /christophercorbin/i, "personal link still in page");
});

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

test("no stale Bim Weather brand in src/web shipped files", () => {
  for (const f of ["../src/server.mjs", "../web/icon.svg", "../web/manifest.webmanifest", "../web/sw.js"]) {
    assert.doesNotMatch(read(f), /Bim Weather/, `${f} still contains stale Bim Weather brand`);
  }
});

test("near-black top utility strip is present", () => {
  assert.match(html, /class="gov-strip"/, "missing gov-strip");
  assert.match(html, /Official government website/, "missing official-website strip text");
});

test("full-bleed inner helper exists", () => {
  assert.match(html, /\.gov-bleed__inner\s*\{/, "missing .gov-bleed__inner helper");
});

test("white header has brand and Home/Services nav", () => {
  assert.match(html, /class="gov-nav"/, "missing gov-nav");
  assert.match(html, />\s*Home\s*</, "missing Home link");
  assert.match(html, />\s*Services\s*</, "missing Services link");
  assert.match(html, /Government of Barbados/, "missing wordmark");
});

test("full-bleed navy footer with gov links", () => {
  assert.match(html, /class="gov-footer"/, "missing gov-footer");
  assert.match(html, /Terms &amp; Conditions/, "missing Terms link");
  assert.match(html, /© 2026 Government of Barbados/, "missing copyright");
});

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
