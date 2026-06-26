# 0001. No em-dashes in public copy

## Status
Accepted (2026-06-26)

## Context
This is a Government of Barbados service. Public copy should read plainly and
consistently. Em-dashes (—) had crept into static HTML, client JS, server-side
strings, and were also being modelled to the AI briefing layer, so generated
text inherited them too.

## Decision
User-facing copy never uses em-dashes (—). Use commas, colons, or separate
sentences instead. This applies everywhere copy is produced:

- Static markup (`web/index.html`).
- Client-rendered strings (`web/app.js`).
- Server-side strings (`src/*` notifications, fallbacks, labels).
- AI-generated text: the Bedrock briefing system prompt carries an explicit
  rule forbidding em-dashes, and its own examples avoid them so the model is
  not shown the pattern.

En-dashes in numeric ranges (e.g. `2.5–4 m`, `30–45 min`) are not affected.
Code comments are developer-facing, not public copy, and are out of scope.

## Consequences
- New copy and any prompt that generates copy must follow this. A reviewer
  seeing an em-dash in user-facing text should treat it as a defect.
- "No-data" placeholders use a plain hyphen (`-`) or a word (e.g. `Unknown`),
  not an em-dash.
