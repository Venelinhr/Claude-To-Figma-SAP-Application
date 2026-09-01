#!/bin/bash
# capture-approvals.sh — UserPromptSubmit hook. Writes INDEPENDENT approval markers.
#
# The core defect the invariant audit found: build gates validated markers CLAUDE wrote by hand,
# which Claude could fabricate to skip a gate. The fix: the approval markers must come from an
# INDEPENDENT event — the USER's own words — not from Claude. This hook is that independent source.
#
# It scans the user's prompt for two kinds of explicit approval and writes the matching marker:
#   1. Wireframe/plan approval  → .claude/.wireframe-approved   (satisfies Gate 3, RULE 19)
#   2. Build-from-scratch consent → .claude/.scratch-approved   (satisfies ask-before-scratch)
#
# Because ONLY this hook (fired by a real user prompt) writes these files, Claude cannot self-echo
# them to skip the gate. clear-reuse-marker.sh removes them at SessionStart so consent never leaks
# across sessions.
#
# Stdout → context, exit 0, never blocks.
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' | tr '[:upper:]' '[:lower:]')
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
[ -n "$PROMPT" ] || exit 0

# ── Architecture brief approval (Gate 0.5 — architect-first reasoning) ────────
# DISTINCT from the wireframe approval below: requires an architecture-specific keyword so a
# bare "approve" (which satisfies the wireframe gate) does NOT silently satisfy the architect
# gate. The user must consciously approve the business→IA→floorplan brief.
if echo "$PROMPT" | grep -qE "(architecture|information architecture|\bia\b|floorplan|architect brief|business statement).*(approve|approved|ok|good|yes|correct|right|proceed)" \
   || echo "$PROMPT" | grep -qE "(approve|approved|ok|yes|looks?).*(architecture|information architecture|\bia\b|floorplan|architect brief|business statement)"; then
  echo "{\"architectApprovedBy\":\"user-prompt\",\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo session)\"}" > "$PROJ/.claude/.architect-approved"
  echo "<approval-captured marker=\".architect-approved\">User approved the architecture brief — Gate 0.5 (architect-first reasoning) is satisfied. Next present the ASCII wireframe for wireframe approval, then build. Marker clears at session end.</approval-captured>"
fi

# ── Wireframe / plan approval ────────────────────────────────────────────────
# TIGHTENED 2026-08-28. The previous single regex treated bare "do it", "make it"
# and "proceed" as wireframe approval. Those are ordinary English — verified false
# positives included "do it now, run the tests" and "make it faster", each of which
# silently satisfied Gate 3 for the NEXT build. That is precisely the self-approval
# the marker exists to prevent, arriving through the user's own unrelated words.
#
# Approval words are now split by strength:
#   STRONG — unambiguous, accepted standalone.
#   WEAK   — everyday phrases, accepted ONLY alongside build/wireframe context.
# A negation anywhere in the prompt ("don't approve", "not approved") vetoes both.
#
# TIGHTENED AGAIN 2026-09-01 (F-11). The regex above answers "did the user say an
# approval-shaped word?" but never asked "was there a wireframe to approve?". Live
# failure: a user's ordinary reply ("yeah go ahead") satisfied WEAK+CONTEXT and
# wrote .wireframe-approved even though enforce-wireframe-first.sh's directive had
# never actually been shown back — Claude skipped straight to building, no ASCII,
# no VDI table, no approval question asked. The hard gate then passed correctly
# per ITS OWN rule (a marker existed) while the actual promise — "show it, THEN
# ask" — was broken upstream. Fix: require .wireframe-pending (stamped by
# enforce-wireframe-first.sh the moment it decides a wireframe is mandatory) to
# exist BEFORE any approval phrase can convert into .wireframe-approved. No
# pending stamp = nothing was ever demanded this turn = an approval-shaped word
# is almost certainly about something else entirely (approving a PR, a plan, an
# unrelated idea) — write nothing, let the next build's gate still block honestly.
if [ -f "$PROJ/.claude/.wireframe-pending" ]; then
  STRONG='(approve|approved|lgtm|ship it|build it|yes,? build)'
  WEAK='(go ahead|looks good|proceed|do it|make it)'
  CONTEXT='(wireframe|layer structure|layer tree|floorplan|layout|screen|build|gate|mockup|design)'
  NEGATION='(do ?n.?t|do not|never|not) +(approve|approved|build|proceed|go ahead)|no,? +(approve|build)'

  if echo "$PROMPT" | grep -qE "$NEGATION"; then
    :   # explicit refusal — write nothing, leave .wireframe-pending in place
  elif echo "$PROMPT" | grep -qE "(^|[^a-z])$STRONG([^a-z]|$)" \
     || { echo "$PROMPT" | grep -qE "(^|[^a-z])$WEAK([^a-z]|$)" && echo "$PROMPT" | grep -qE "$CONTEXT"; } \
     || echo "$PROMPT" | grep -qE "wireframe.*(approve|ok|good|yes)|(approve|ok|yes).*wireframe" \
     || echo "$PROMPT" | grep -qE "layer structure.*(approve|ok|good|yes)|(approve|ok|yes).*layer structure"; then
    echo "{\"approvedBy\":\"user-prompt\",\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo session)\"}" > "$PROJ/.claude/.wireframe-approved"
    rm -f "$PROJ/.claude/.wireframe-pending" 2>/dev/null
    echo "<approval-captured marker=\".wireframe-approved\">User approval detected — the ASCII-wireframe gate (RULE 19 / Gate 3) is satisfied for the next build. If this was NOT a wireframe approval, ignore; the marker clears at session end.</approval-captured>"
  fi
fi

# ── Explicit consent to build from scratch (pure Figma frames, no canonical) ──
# WIDENED 2026-08-28. The old list required the exact words "from scratch". A real
# reply of "build form scratch" (a one-letter typo) therefore wrote no marker, the
# build stayed blocked, and the reason was invisible — the user had plainly consented.
# Typos and word order are now tolerated; the intent is still unambiguous.
if echo "$PROMPT" | grep -qE "fro?m scratch|form scratch|scratch build|build.*scratch|from zero|build new|no reference|no canonical|pure figma|start fresh|nothing to clone|build it from" ; then
  echo "{\"scratchApprovedBy\":\"user-prompt\",\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo session)\"}" > "$PROJ/.claude/.scratch-approved"
  echo "<approval-captured marker=\".scratch-approved\">User consent to build from scratch detected — the ask-before-scratch gate is satisfied. Still: prefer cloning an approved screen if one exists (RULE 28).</approval-captured>"
fi

exit 0
