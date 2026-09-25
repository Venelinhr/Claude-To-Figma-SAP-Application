---
name: sap-build-v3
description: Build or edit an SAP Fiori screen in Figma using the real SAP Web UI Kit. Use for any request to build, improve, fix, or extend a screen — with or without a reference image.
---

# SAP Build v3

Full system: `CLAUDE.md` at the project root. Summary:

**Front gate: `measure-ref.py`. End gate: `audit-screen.py`. Never skip either.**

1. **Measure the reference first, always**: `python3 build/measure-ref.py <image>` (add
   `--crop x,y,w,h` to zoom a region). Read the whole output — real px spacing, colours→
   tokens, and the READ tree (reading order: top-left→right→down) — before picking
   anything. Then *analyze*: write down section order, row vs column, roughly how big
   each piece is. This is what prevents building sections in the wrong place.
2. **Pick the floorplan** from task shape (Object Page / List Report / Wizard / Dialog /
   Drawer / Overview) — table in CLAUDE.md.
3. **Look up real components/tokens**, never guess: `node build/kit.js c <Component>`, `node build/kit.js v <token>`, `node build/kit.js hex <#hex>`, `node build/kit.js i <icon>`, or bulk with `node build/kit.js pack <names...>`.
4. **Build**: one `use_figma` call. Paste `build/templates/sap-kit.prelude.js` at the top + the `const KIT = {...}` from `pack`. Use `I()`, `T()`, `fill()`, `stroke()`, `AL()`, `put()` — never raw `createFrame`/raw hex/raw font. Give every auto-layout node an explicit HUG/FILL/FIXED — see CLAUDE.md "Auto-layout sizing". Return `WARN` — must be empty.
5. **Audit at the end, always**: export the built frame with Figma's `get_screenshot`
   tool, then `python3 build/audit-screen.py <reference> <build.png>`. Fix everything in
   MISSING / WRONG COLOUR / EXTRA (real tokens, not eyeballed), re-export, re-audit.
   **Do not trust the TOTAL/POSITION/SIZE number** — its box-finder can misjudge a
   genuinely close screen (see CLAUDE.md). Confirm the finished screen against the
   reference by eye before calling it done.
6. **Hand off**: the Figma node URL + the (empty) `WARN` array + the audit's checklist
   state (clean, or what's left and why it's an accepted gap).

The v3 build guard hook blocks any build call that skips the runtime or paints raw hex/font — fix and resend if you see it.
