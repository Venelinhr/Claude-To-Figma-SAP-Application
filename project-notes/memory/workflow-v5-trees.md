---
name: workflow-v5-trees
description: "v5 (branch v5, 2026-09-28): /screen — Claude builds in Figma from a gold LAYOUT TREE via one render call; bar = 95 % reference AND SAP execution"
metadata:
  type: project
---

v5 = the user's chosen default: "Claude → Figma, same as main branch, but with v4 quality — 95 % match with an
image, really good results from a prompt, fewer tokens". User bar (verbatim): "min 95% quality match with
reference and execution (SAP components, states, figma layer naming, variables, etc)" — lower = failure.

How it works: an approved build is dumped once (`build/templates/dump-layout.use_figma.js`) into a gold tree
(`knowledge/gold/trees/`); a new screen adapts the closest tree; `build/render.js` turns it into ONE use_figma
call (runtime stored in the file once with `--install`, then `--lean`). Checks: `gates.js` (image: MATCH +
HYGIENE + EYE) or `verify-tree.js` (text: every layer vs its tree). First screen before building:
`node build/tree.js show` (ASCII · layers · lists · lint) — the user asked for that "like main".

**Why trees:** rows-only plans lose the structure (gaps, paddings, spacers, sizes) → headless builds got
EYE 9–13 %. The tree renderer rebuilt gold 435:9066 with 0 differing pixels.

**How to apply:** image/text request → `/screen`. Text: never leave kit placeholders ("Typed Text",
"Placeholder", "Description", "Product Identifier", default status words) — the PO gold 403:6701 had them.
Proven: 440:9214 (image, EYE 95 %, MATCH 100 %), 445:9214 (text, MATCH 100 %). See [[workflow-v4-split]],
[[pitfall-branch-main-is-v2]].
