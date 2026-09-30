---
name: project-v6-lessons
description: "v6 live-test lessons 2026-09-30 (flight + hotel): gold vs structure, phone 3x scale, kit inner-text names, hidden kit defaults, frame placement far right, EYE dark vs light, what the permission classifier blocks"
metadata:
  node_type: memory
  type: project
  originSessionId: a1d0debc-88f1-4329-8ff6-34de9ce7bc61
  modified: 2026-09-30T07:17:47.318Z
---

**Results:** flight ref, gold adapted (`job-09300515`): built in 12 s but STRUCTURE 17 / EYE 19 % (gold had another structure; 'Sort tabs' `FF` in a hug column collapsed to 1 px). Fix: `run.js` keeps a gold tree only if STRUCT-SIM finds 0 missing reference boxes, else builds from zero.
Hotel phone screen, dark, from the image with no gold (`job-09300557`): 20 min / $12 / STRUCTURE 21 / EYE 2 % — the model fixed it by hand. Redone as plan → real-kit tree (`bridge-out/hotel-v6/tree.json`, 49 layers) → door ALL IN first pass → built in 3.6-6.7 s: MATCH 100, HYGIENE 0, STRUCTURE 0, EYE 2-6 % (light build vs dark reference — by design, user chose Horizon Light).

**Gotchas found (all fixed in code unless marked):**
- A phone screenshot at 3× (1170×2532) was read as ×1 → frame 3× too big. Manual fix used: crop the iOS status bar (top 138 px), resize to 780 wide (= the 2× export), frame 390×798. NOT automated yet (`front.js`/`see.py` only detect ×2).
- Dark reference → the page fill got `sapContent_IconColor` (a text/icon role used as a fill). Build in Horizon Light (SAP rule) unless told otherwise.
- The from-zero path (`spec2tree`) measures boxes/texts/icons; it does NOT choose SAP components/floorplan/density. For a new screen type the model writes the tree from an approved plan (real kit components).
- MATCH / HYGIENE skip kit internals: a kit switch that is ON by default draws placeholder content (List Item `Attachment` showed a stray "Attachment"; also `Separator`). Door rule `DEFAULT_ON_PLACEHOLDER` added (List Item). Other components may need entries.
- Inner text layer names (tree `tx` keys), read once from the library: Header → `Title` · Object Attribute → `Text` · Object Status → `Text` (Semantic None/Information/Success/Warning/Error, Inverted, Large Design) · Object Number → its default text `956.00 EUR` · Link/Button → `✏️ Text` prop · List Item → `Title` + `✏️ Byline` · Progress Indicator → `✏️ Text Value`, `Text` (switch), `Value State`; its bar FILL = the width of the hugged text `✏️ Progress Bar` (default 39 chars = 157 px = 60 % of 256; ~34 chars ≈ 38 % of 358). Footer has no text and cannot hold a Button (use a frame + Button Primary); Header cannot hold icon buttons (put them beside it).
- Kit icons that exist: favorite share slim-arrow-down pushpin-on travel-itinerary suitcase decline media-forward thumb-up accept …; NO map-pin / bus / location icon. Semantic colours in the cached vars: `sapErrorColor` only (no success/positive token found).
- The plugin puts every new frame at the far right of the page (x ≈ 134,000) → the user could not find results ("missing", "gone"). Moving a frame I built is allowed (`use_figma`, position only). The user said they fixed the plugin placement (unverified).
- The first hotel frame `566:64162` vanished (not deleted by Claude — only read calls were made); a rebuild from the saved tree takes ~4 s. The saved `tree.json` is the recovery.
- A cropped reference (section cut at the bottom edge) makes `structure.js` report OUTSIDE → STRUCTURE ≠ 0 even when the build is right. **DECIDED 2026-09-30 (user: "leave it"): keep `structure.js` strict — do NOT add an edge tolerance.** A cropped reference stays a DRAFT with OUTSIDE lines; report them, never dismiss them.
- The permission classifier blocks: writes to `.claude/commands/` and `SKILL.md`, loosening a gate, downloading a signed screenshot URL. It allowed: edits to `.claude/agents`, `.claude/settings.json`, `CLAUDE.md`, live `run.js` builds. The user runs `cp docs/v6/screen.md .claude/commands/screen.md` himself.
- Another Claude session shares this folder and moved HEAD to v5 once. Check the branch before every write.

**How to apply:** for a new screen type follow the user's plan format ([[feedback-show-plan-fully]]): read the image → 5 sections → approve → tree → `node build/run.js --job … --resume --file <KEY>`. See [[workflow-v6-build-first]], [[feedback-check-structure-eye]].
