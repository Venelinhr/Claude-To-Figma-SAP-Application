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
3. **Measure.** `python3 build/measure-ref.py ref.png --json > ref.json`, then read the human output
   once (`python3 build/measure-ref.py ref.png`): frame, READ tree, ACCENTS. Box labels are hints only.
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
8. **Hand off.** `pbcopy < plan.min.json`. Show the user: the ASCII + SAP map, the suggestions,
   the questions, and this line to paste in the Figma Agent together with the clipboard:
   > Build this plan (PLAN MODE): every row, in order, exact kind/component/props/style/token/icon/text. Keep the text language. New frame next to the last one. Name layers after the plan elements. Return WARN and the node link.
9. Stop. Do not call `use_figma`. Step 2 of 2 = `/check-build <node link>` after the build.
