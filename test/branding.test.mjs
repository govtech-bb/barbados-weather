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
  assert.match(html, /Was this page helpful\?/i, "missing feedback prompt");
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
