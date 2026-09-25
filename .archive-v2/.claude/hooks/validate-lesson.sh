#!/bin/bash
# validate-lesson.sh — PostToolUse(Write|Edit) hook.
#
# When a feedback_*.md memory is written/edited, check it follows the lesson
# template (docs/FEEDBACK-MEMORY-TEMPLATE.md): the required body fields must be
# present so a lesson is teachable + recall-matchable, not a sticky note.
# Non-blocking — emits a warning into context (same pattern as manifest-sync-check).
#
# PostToolUse input arrives as JSON on stdin (.tool_input.file_path). exit 0 never blocks.
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only act on feedback_*.md memory files
case "$FILE" in
  *memory/feedback_*.md) : ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

MISSING=""
grep -qiE 'Applies-to:'         "$FILE" || MISSING="$MISSING Applies-to"
grep -qiE 'Signal:'             "$FILE" || MISSING="$MISSING Signal"
grep -qiE 'Mistake|What-worked' "$FILE" || MISSING="$MISSING Mistake/What-worked"
grep -qiE '\*\*Why'             "$FILE" || MISSING="$MISSING Why"
grep -qiE 'How.to.apply'        "$FILE" || MISSING="$MISSING How-to-apply"
grep -qiE 'Evidence:'           "$FILE" || MISSING="$MISSING Evidence"

if [ -n "$MISSING" ]; then
  echo "<lesson-schema-warning file=\"$(basename "$FILE")\">This feedback memory is missing required lesson fields:${MISSING}. Per docs/FEEDBACK-MEMORY-TEMPLATE.md, a lesson needs Applies-to (for recall matching), Signal, Mistake/What-worked, Why (root cause), and How-to-apply. Add the missing field(s) so the lesson is teachable and surfaces correctly via recall-lessons.sh. A lesson without Why is a symptom note, not a lesson.</lesson-schema-warning>"
fi

# ─────────────────────────────────────────────────────────────────────────────
# HARD-RULE CONTRADICTION CHECK (added 2026-07-21 — drift-audit H5). The feedback
# loop auto-saves free-text corrections as severity:critical lessons with no check
# that the lesson AGREES with the 5 mandatory build hard rules. A careless phrase
# ("use Cozy", "48px padding is fine", "make it Emphasized") could persist and be
# surfaced by recall-lessons.sh ABOVE the hard rule it contradicts. Scan the lesson
# body for anti-patterns that violate a hard rule and warn loudly — the hard rule
# always wins; a lesson can never override it.
BODY=$(tr 'A-Z' 'a-z' < "$FILE" 2>/dev/null)
CONTRA=""
case "$BODY" in
  *cozy*)                    echo "$BODY" | grep -qE 'default|always|use cozy|switch to cozy|prefer cozy' && CONTRA="$CONTRA · suggests Cozy (HARD RULE 5: Form Factor is always Compact on desktop back-office)" ;;
esac
echo "$BODY" | grep -qE '48 ?px (padding|side)|padding.*48|side padding.*48' && CONTRA="$CONTRA · suggests 48px padding (HARD RULE 1: side padding is always 32px)"
echo "$BODY" | grep -qE 'type ?= ?.?emphasized|type ?= ?.?transparent|use emphasized|make it emphasized' && CONTRA="$CONTRA · suggests Emphasized/Transparent Button Type (not a live-kit value; kit uses Primary/Tertiary)"
echo "$BODY" | grep -qE 'raw hex|hardcode.*hex|hard-code.*color|#[0-9a-f]{6}.*instead of.*token' && CONTRA="$CONTRA · suggests raw hex (HARD RULE: every color binds a SAP token)"
echo "$BODY" | grep -qE 'native divider|createframe.*divider|divider frame' && CONTRA="$CONTRA · suggests native divider frame (HARD RULE 4: use strokes, never divider frames)"
echo "$BODY" | grep -qE 'dark ?theme|dark ?mode|dark background' && ! echo "$BODY" | grep -qE 'never|not|avoid|ignore' && CONTRA="$CONTRA · suggests dark theme (HARD RULE: always Horizon Light)"

if [ -n "$CONTRA" ]; then
  echo "<lesson-hardrule-conflict file=\"$(basename "$FILE")\">⛔ This saved lesson appears to CONTRADICT a mandatory build hard rule:${CONTRA}. A lesson can NEVER override a hard rule — the hard rule always wins. Do NOT apply this lesson as written. Either (a) the user's correction was context-specific (note the exact context so it doesn't generalise), or (b) it was a mis-captured phrase and this memory should be deleted. Reconcile before this lesson is surfaced by recall-lessons.sh.</lesson-hardrule-conflict>"
fi

exit 0
