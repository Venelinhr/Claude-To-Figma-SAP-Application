#!/bin/bash
# enforce-wireframe-first.sh — UserPromptSubmit hook. MANDATORY PRESENTATION GATE.
#
# HARD RULE (confirmed 2026-07-20): whenever the user attaches a reference image,
# the agent MUST run the full Gate 0→3 pipeline and show the ASCII wireframe + L1-L5
# layer tree BEFORE writing any other response. This is MANDATORY — not optional,
# not skippable for clones, not skippable for "same screen". The wireframe IS the
# visual confirmation the user needs back when they share an image.
#
# Also fires for build/edit/improve requests without images.
# Skips only when .wireframe-approved already exists this session.
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' | tr '[:upper:]' '[:lower:]')
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

[ -n "$PROMPT" ] || exit 0

# Skip if wireframe already approved this session
if [ -f "$PROJ/.claude/.wireframe-approved" ]; then
  exit 0
fi

IS_BUILD=false
IS_NEW_SCREEN=false
IS_EDIT=false

# ── HARD RULE: reference image present → ALWAYS mandatory (new screen) ───────
# Any image attachment or image reference in a build/design context = full gate.
echo "$PROMPT" | grep -qiE "image|screenshot|reference|photo|sketch|wireframe|\.png|\.jpg|\.jpeg|\.webp" && { IS_BUILD=true; IS_NEW_SCREEN=true; }

# ── New-screen build verbs → full Gate 0→3 ──────────────────────────────────
echo "$PROMPT" | grep -qiE "build|create.*screen|make.*screen|design.*screen|implement|generate.*screen|new screen|sap screen" && { IS_BUILD=true; IS_NEW_SCREEN=true; }
echo "$PROMPT" | grep -qiE "save it here|save here|build this|build it here|place it|figma\.com/design" && { IS_BUILD=true; IS_NEW_SCREEN=true; }

# ── Edit / fix / improve verbs on an EXISTING screen → short-form gate ───────
# F-3 (2026-07-22, Performance Recovery, RC-4): a small edit/fix on a screen already built this
# session must NOT pay the full new-screen presentation cost (VDI table + floorplan tree +
# confidence table + full ASCII). It gets a one-line change summary + confirm instead. The full
# gate is reserved for genuinely NEW screens and new reference images.
echo "$PROMPT" | grep -qiE "improve|fix (this|the|it)|update (this|the|it)|edit (this|the|it)|next step|suggest improvement|improve this|suggest better|adjust|tweak|change (the|this|it)|resize|rename|re-?order" && { IS_BUILD=true; IS_EDIT=true; }

# An edit is only "on an existing build" if a build already ran this session (.last-build-node)
# OR the prompt clearly points at an existing thing ("this"/"it"/a node-id). Otherwise treat as new.
EDIT_ON_EXISTING=false
if [ "$IS_EDIT" = "true" ]; then
  if [ -f "$PROJ/.claude/.last-build-node" ]; then EDIT_ON_EXISTING=true; fi
  echo "$PROMPT" | grep -qiE "node-?id|[0-9]+[:-][0-9]{3,}|(this|the) (wizard|dialog|screen|header|table|form|card|panel|button|field)" && EDIT_ON_EXISTING=true
fi

# A new-screen signal always wins over an edit signal (image + "improve" → still a new screen).
if [ "$IS_NEW_SCREEN" = "true" ]; then EDIT_ON_EXISTING=false; fi

# ── Branch: short-form for edits on existing builds ─────────────────────────
if [ "$IS_BUILD" = "true" ] && [ "$EDIT_ON_EXISTING" = "true" ] && [ "$IS_NEW_SCREEN" = "false" ]; then
  # Same proof-of-demand stamp as the full gate below — a short-form mini-ASCII
  # still requires something to have been shown before "go"/"yes" can approve it.
  echo "pending $(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo session)" > "$PROJ/.claude/.wireframe-pending" 2>/dev/null
  cat << 'SHORTFORM'
<wireframe-edit-gate>
✎ EDIT ON AN EXISTING SCREEN — SHORT-FORM GATE (F-3, RC-4).

This is a change to a screen already built this session, not a new screen. You do NOT need the
full Gate 0→3 (VDI table + floorplan tree + confidence table + full ASCII). Instead:

  1. State the target node (node-id) and ONE-LINE summary of exactly what changes.
  2. If the change is structural (adds/removes zones, new floorplan), show a MINI ASCII of just
     the affected region — not the whole screen.
  3. STOP and wait for a short confirm ("go", "yes", "approved").

Keep it tight — a label fix or resize should be 2-3 lines, then build. Reuse the existing
.wireframe-approved if it is still active for this same node (approvals are build-scoped now).
For a genuinely NEW screen or a new reference image, the full Gate 0→3 still applies.
</wireframe-edit-gate>
SHORTFORM
  echo "<gate-status>"; bash "$PROJ/build/gate-status.sh" 2>/dev/null; echo "</gate-status>"
  exit 0
fi

if [ "$IS_BUILD" = "true" ]; then
  # F-11 (2026-09-01): stamp proof that the mandatory wireframe was actually demanded
  # THIS turn, before any approval word can be accepted for it. Closes the gap found
  # live: capture-approvals.sh could write .wireframe-approved off approval-shaped
  # words alone, even if no wireframe had ever been shown — "approved... of what?"
  # was never asked. Cleared at SessionStart alongside the other gate markers.
  echo "pending $(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo session)" > "$PROJ/.claude/.wireframe-pending" 2>/dev/null
  cat << 'DIRECTIVE'
<wireframe-first-gate>
⛔ HARD RULE — MANDATORY GATE 3 (RULE 19) — SHOW WIREFRAME BEFORE ANYTHING ELSE.

A reference image was shared OR a build/edit/improve request was detected.
Your FIRST and ONLY output before user approval MUST be ALL 4 SECTIONS in this exact order:

  1. Gate 0 — VDI Sector Analysis TABLE (format updated 2026-07-22 — EVERYTIME):
     | Zone | Content | SAP Component | Key properties |
     Every visible zone A/B/C… mapped to a REAL SAP component (sap.x.Name) with key properties.

  2. Floorplan recommendation TREE (sap.x.ComponentName notation with └─ ├─ │ branch chars):
     sap.f.DynamicPage
     └─ content: sap.m.VBox
        ├─ sap.m.Table
        └─ ...
     NOT "L1-L5 prefix" format. Show every component, container, relationship.

  3. Confidence table:
     | Area | Conf. | Notes |
     All major areas rated with % confidence and a concrete note.

  4. Full ASCII wireframe — every zone, every component, every row.

  5. Gate 0.7 — SELECT & RECORD the canonical reference (HIGHEST-LEVERAGE STEP):
     score candidates (score-canonical.js), pick the gold node, then
     `node build/record-reference.js --node "<id>" --name "<name read LIVE via use_figma>" --score <n> --rationale "..." --effort "..."`.
     READ THE NODE FIRST (name + width): ids drift between files and docs — the index's "Outage List"
     id is a 560px dialog in the live file. The clone code must assert src.name === that name.
     guard-reference-gate.sh hard-blocks the build until this is recorded. Gold set + default
     anchor 9:1550 (dialogs) → memory reference_gold_standard_screen_set.md.
  6. Gate 1 — Canonical search: CLONE (with node ID) or BUILD. Never skip.
  7. Gate 2 — State the exact width.
  8. ⚡ Suggestions — applicable entries from docs/SAP-SUGGESTION-CATALOG.md.
  9. STOP. WAIT for the user to type explicit approval.

THIS IS A HARD RULE — NO EXCEPTIONS — EVERYTIME:
  • Reference image attached → MANDATORY (even if you recognize the screen)
  • Clone of existing canonical → MANDATORY (wireframe = visual confirmation)
  • "Same screen as before" → MANDATORY
  • Small edit or improvement → MANDATORY
  • ALL 4 SECTIONS required — the VDI table, floorplan tree, confidence table, ASCII wireframe

DO NOT: write implementation steps, call use_figma, describe build steps, or
propose anything else before the 4 sections + STOP.

The .wireframe-approved marker is written ONLY by the user's approval words.
You cannot write it yourself.

⚡ COST RULE (AUDIT-V2 P0'): do NOT write build code until EVERY line of the gate status
below is ✓. Satisfy all of them in one pass, then ONE use_figma build call (zone by zone
for 8+ components). Re-check any time with:  bash build/gate-status.sh
</wireframe-first-gate>
DIRECTIVE
  echo "<gate-status>"; bash "$PROJ/build/gate-status.sh" 2>/dev/null; echo "</gate-status>"
fi

exit 0
