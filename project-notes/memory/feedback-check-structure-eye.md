---
name: feedback-check-structure-eye
description: MATCH 100 % missed a lost pink box, a 1-px tab bar and a wrong frame size — structure.js now fails those; a low EYE is never dismissed
metadata:
  type: feedback
---
User (2026-09-29), important, "make sure you don't miss it next time": the terminal build 471:9819 made the pink surround a
message strip (card outside it); the reference has a pink box with the card inside, padded. The terminal Claude's own root
causes: (1) audit-plan.js never checks nesting/position, so MATCH said 100 %; (2) EYE 12 % was dismissed as "unreliable" and
fix.md was not read; (3) the root frame clips, so collapsed tabs (h=1) and a misplaced card looked like "needs scrolling".

**Why:** MATCH = layers exist with right props. It cannot see where they are. My own checks added: the log said "from zero" but
the layer names were the gold tree's; the frame was 1142×609 (reference 1159×616); EYE by my measure 29 %; its "fix" moved the
card out of the pink box (worse than the gold nesting).

**How to apply:** always dump geometry and run `gates.js` (it runs `build/structure.js`: BOX, FRAME, COLLAPSED, OUTSIDE,
OVERLAP). STRUCTURE ≠ 0 or EYE < 95 = FAILED; quote the FIX LINES; never "known limitation". Fixes must keep the reference's
nesting. State provenance. See [[feedback-screen-cheap-fast]], [[workflow-v5-trees]].
