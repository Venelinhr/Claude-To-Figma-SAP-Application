#!/bin/bash
# recall-lessons.sh — UserPromptSubmit hook (task-matched recall).
#
# The #1 cause of repeated mistakes is that ALL lessons load flat and Claude
# self-selects relevance. This hook scans the user's prompt for build-task
# keywords and surfaces ONLY the matching lesson index lines from MEMORY.md —
# pulling the right lesson to the front at the moment it's needed.
#
# Matches against the global memory index (MEMORY.md descriptions already contain
# task keywords + ⭐ / "READ BEFORE any X build" hints), so no per-file re-tagging
# is required. Runs alongside feedback-learn.sh on UserPromptSubmit.
#
# Stdout → context, exit 0, never blocks.
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' | tr '[:upper:]' '[:lower:]')

MEM="$HOME/.claude/projects/-Users-C5408360/memory/MEMORY.md"
[ -f "$MEM" ] || exit 0
[ -n "$PROMPT" ] || exit 0

# Task keyword → grep pattern that finds matching MEMORY.md index lines.
# Left = what the user might type; right = terms that appear in relevant index lines.
declare -a MATCHES=()
add() { echo "$PROMPT" | grep -qE "$1" && MATCHES+=("$2"); }

add 'side ?nav|navigation (rail|menu|panel)|sidenav'      'SideNav|sidenav|Navigation'
add 'list report|worklist|activities|list (of|overview|report)|table of'  'List Report|Activities|worklist'
add 'object page|steps|yanatest|detail (page|column|pane)'  'yanatest|Object Page|Steps'
add 'dialog|modal|schedule op|recurrence'                  'Dialog|Schedule|schedule'
add 'wizard|multi.?step|step [0-9]'                        'Wizard|wizard|step'
add 'flight|card|result card'                              'card|Flight|Card'
add 'progress|percent|%'                                   'Progress Row|progress'
add 'filter bar|search|filter'                             'Filter|filter'
add 'token|color|hex|typography|font'                      'token|Token|typography|hex'
add 'naming|layer name|l1|l5'                              'naming|Naming|L1-L5'
add 'validate system|log|message|severity'                'Validate System|log'
add 'governance|dashboard|fcl|flexible column'             'Governance|FCL|DynamicSideContent'
add 'purchase order|procurement|\bpo\b|approval|approve|package detail'  'Purchase|procurement|PO|approval|Package'
add 'outage'                                               'Outage'

[ ${#MATCHES[@]} -gt 0 ] || exit 0

# Build one combined pattern, pull matching index lines (dedupe, cap at 8)
PAT=$(IFS='|'; echo "${MATCHES[*]}")
HITS=$(grep -iE "$PAT" "$MEM" 2>/dev/null | grep -E '^\- \[' | sort -u | head -8)

[ -n "$HITS" ] || exit 0

echo "<recall-lessons>Relevant saved lessons for this task (read the linked memory before building — this is the reference-first / clone-canonical path):
$HITS</recall-lessons>"

exit 0
