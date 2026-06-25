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
