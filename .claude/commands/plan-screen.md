---
description: v4 — reference image → validated SAP element plan on the clipboard (≤5 min, ≤12k tokens). Never touches Figma.
argument-hint: <image path or pasted image> [what the screen is, in a few words]
---

# /plan-screen — v4 split flow, step 1 of 2 (Claude Code plans, the Figma Agent builds)

Budget: ≤ 12k tokens, ≤ 5 min. Fail twice on the same step → stop and say what blocks you.
Reply to the user in short, plain sentences. Input: $ARGUMENTS

1. **Branch.** `git branch --show-current` must print `v4`. If not → stop, tell the user
   `git checkout v4`, do nothing else.
2. **Image.** Save the reference to the scratchpad as `ref.png` (convert webp with PIL).
   `SHA=$(shasum -a 1 ref.png | cut -c1-12)`. If `knowledge/plans-cache/$SHA.plan.json` exists and
   `node build/route.js --plan` passes on it → use it, jump to step 7.
3. **Measure.** `python3 build/measure-ref.py ref.png --json > ref.json` (frame, spacing scale), then read it
   like a person — **GATE 1**: `python3 build/see.py spec ref.png --lang bg --out see-ref` → the screen as
   sections → boxes (size, fill, border px + token, radius, padding, shadow) → rows/columns with gaps →
   components with states (Radio Button Selected, Button Primary Cozy + width, Range Slider, collapse
   arrows), SAP text styles (brand sites step down to Compact ×0.85), logo crops — and an ASK list.
   Answer every ASK line (look at `see-ref/tile-*.png`; icons from `router-table.json` icon_meanings;
   brand colours → roles). No plan before ASK is empty. The target is the REFERENCE itself: a crop keeps its
   measured size (1000 wide stays 1000 — a 1440 re-layout scored EYE 19% on 348:8435), texts keep the measured
   SAP size (no Compact step-down when the eye must match). A gold plan is only a start for rows (components,
   roles, icons); every number — box, padding, gap, width, x — comes from the spec. Fix the plan where the gold
   disagrees with the reference (the gold had down chevrons, 2 suitcases, Compact radios; the reference did not).
   Copy the spec's numbers into the plan rows and section `layout` — the Figma Agent must not guess any.
4. **Start from gold.** `node build/route.js --closest-gold ref.json "<words you can read in the image>"`.
   If it says "start from …" → copy that gold plan and change only what differs. Else write new.
   **If you change `frame.w` from the gold's, rescale every logo `crop` by newW ÷ goldW** —
   crops are in frame px; unscaled crops cut random text pieces instead of the badges (seen live).
5. **Plan** `plan.json` (schema + worked example: `knowledge/gold/plans/*.plan.json`):
   frame → sections A, B, C… in Z order, each FIRST described in plain words with positions →
   one row per visible element. Colour by ROLE, one SAP icon per meaning, every Icon Button names
   its icon, every logo has `crop` in frame px, texts in the image's own language.
6. **Validate.** `node build/route.js --plan plan.json --map --min` — fix every ✗ and re-run until
   exit 0. Answer each `?` with the SAP option you recommend.
7. **Logos.** `python3 build/crop-logos.py plan.json ref.png logos/` — look at the crops once.
8. **Hand off — no paste (SAP Bridge).** `node build/mailbox.js push plan.min.json --ref ref.png` → the
   SAP Bridge plugin (open in Figma) writes the plan into the file. Show the user the ASCII + SAP map, the
   suggestions, the questions, and one line: *In the Figma Agent type: `build plan`*. Then run
   `node build/mailbox.js wait <jobId>` in the background: the bridge places the logos and runs the check
   (MATCH + EYE, fix rounds via `apply fixes`) by itself; report its result when it ends.
   Exit 3 (bridge or plugin not reachable) → old way: `pbcopy < plan.min.json` and this line to paste:
   > Build this plan (PLAN MODE): every row, in order, exact kind/component/props/style/token/icon/text. Keep the text language. New frame next to the last one. Name layers after the plan elements. Return WARN and the node link.
9. Stop. Do not call `use_figma`. Without the bridge, step 2 of 2 = `/check-build <node link>`.
   (Fastest path of all: the user types or drops the image in SAP Bridge and presses Go — no terminal.)
