---
name: feedback-front-door
description: The /screen front door (image + text analysis → grouping → placement) is face control — only right parts get in, fast; then the user approves the plan + ASCII
metadata:
  type: feedback
---
User (2026-09-28): the front door — analysing the image or text, grouping and placing — decides how the screen will
look (right components, tokens, variables, states). It is face control for a night club: only right and cool gets in,
the rest stays out. Then the plan + ASCII go to the user, who approves or rejects. "The line can be around 1,000
people" — decide fast, stay present and focused, professional, highest standard; speed never at the cost of quality.

**Why:** a wrong part let in at the door costs a build + fix rounds later (451:9507: a "Select" button with no text
and 0 of 23 icons got through; the build scored EYE 49 %).

**How to apply:** `node build/door.js tree.json [--ref spec.json]` before any plan is shown; fix every OUT in one
quick pass (no Figma, < 1 s); only ASK lines go to the user; never show a plan with an OUT; after the user's yes,
build. Same format as main's analysis (`tree.js plan`). See [[workflow-v5-trees]], [[feedback-screen-cheap-fast]].
