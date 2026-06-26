# 0002. Minimum 16px body text

## Status
Accepted (2026-06-26)

## Context
The dashboard had accumulated many sub-16px sizes (captions, labels, pills,
chips, table cells, down to ~10px). Small text hurts readability and
accessibility, especially for a public emergency-information service.

## Decision
No text renders below 16px. In this codebase the root font-size is the browser
default 16px, so the floor is `font-size: 1rem`. Any value below `1rem` (or any
sub-16px pixel value) is raised to `1rem`.

Exception: elements that deliberately match the live gov.bb design system
pixel-for-pixel may stay below 16px, but only when they do, and the rule must
carry a comment marking it intentional. Today the sole exception is the
"Official government website" strip (`.gov-official p`, 12px to match
alpha.gov.bb).

`em`-based icon scales (sized relative to their parent text) are not text and
are not affected.

## Consequences
- New CSS must not introduce font sizes below `1rem` for text.
- Any future sub-16px exception must be a documented gov.bb pixel-match, with an
  inline comment, not a stylistic choice.
- This is a step toward the WCAG 2.2 AA work tracked in issue #2; it is not a
  full audit on its own.
