---
name: sap-build-v3
description: Build or edit an SAP Fiori screen in Figma using the real SAP Web UI Kit. Use for any request to build, improve, fix, or extend a screen — with or without a reference image.
---

# SAP Build v3

Full system: `CLAUDE.md` at the project root. Summary:

1. **Reference image?** Measure it: `python3 build/measure-ref.py <image>` (add `--crop x,y,w,h` to zoom a region). Read real px spacing, colours→tokens, and the layout tree before picking anything.
2. **Pick the floorplan** from task shape (Object Page / List Report / Wizard / Dialog / Drawer / Overview) — table in CLAUDE.md.
3. **Look up real components/tokens**, never guess: `node build/kit.js c <Component>`, `node build/kit.js v <token>`, `node build/kit.js hex <#hex>`, `node build/kit.js i <icon>`, or bulk with `node build/kit.js pack <names...>`.
4. **Build**: one `use_figma` call. Paste `build/templates/sap-kit.prelude.js` at the top + the `const KIT = {...}` from `pack`. Use `I()`, `T()`, `fill()`, `stroke()`, `AL()`, `put()` — never raw `createFrame`/raw hex/raw font. Return `WARN` — must be empty.
5. **Hand off**: the Figma node URL + the (empty) `WARN` array.

The v3 build guard hook blocks any build call that skips the runtime or paints raw hex/font — fix and resend if you see it.
