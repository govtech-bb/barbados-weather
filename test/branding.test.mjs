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
