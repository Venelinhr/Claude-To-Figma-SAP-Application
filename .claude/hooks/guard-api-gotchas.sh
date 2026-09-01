#!/bin/bash
# guard-api-gotchas.sh — PreToolUse(use_figma). Blocks build code that WILL throw inside Figma.
#
# Why (AUDIT-V2 §2.1, P1): on 2026-09-01 two of three full-screen builds died on traps that
# were already written in skill/references/figma-build-patterns.md (gotcha table rows 3, 15):
#   18:27:44  primaryAxisSizingMode … received 'HUG'   (valid: FIXED | AUTO)          — 8,420 tokens lost
#   18:28:58  FILL can only be set on children of auto-layout frames (FILL before append) — 7,060 tokens lost
# Prose does not stop a throw. This grep does. Only DEFINITE errors are blocked — every
# pattern here fails in Figma 100% of the time — so a block never costs a good build.
#
# exit 2 = block (message names the line and the fix); exit 0 = allow.
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
echo "$TOOL" | grep -qi "use_figma" || exit 0
CODE=$(printf '%s' "$INPUT" | jq -r '.tool_input.code // ""' 2>/dev/null)
[ -n "$CODE" ] || exit 0
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0

FAILS=""
add() { FAILS="$FAILS  • $1"$'\n'"      fix: $2"$'\n'; }

# 1 ── sizing-mode enums: 'HUG' / 'FILL' are NOT values of primaryAxisSizingMode / counterAxisSizingMode
while IFS= read -r hit; do
  [ -n "$hit" ] && add "line ${hit%%:*}: ${hit#*:}  → Figma throws \"Invalid enum value. Expected 'FIXED' | 'AUTO'\"" \
    "use 'AUTO' (= hug) or 'FIXED' on the parent; to hug/fill a CHILD use child.layoutSizingHorizontal/Vertical = 'HUG' | 'FILL' AFTER appendChild"
done <<EOF
$(printf '%s\n' "$CODE" | grep -nE "(primaryAxisSizingMode|counterAxisSizingMode)[[:space:]]*=[[:space:]]*['\"](HUG|FILL)['\"]" | sed -E 's/^([0-9]+):[[:space:]]*/\1:/' )
EOF

# 2 ── counterAxisAlignItems = 'STRETCH' is invalid (MIN | MAX | CENTER | BASELINE)
while IFS= read -r hit; do
  [ -n "$hit" ] && add "line ${hit%%:*}: ${hit#*:}  → 'STRETCH' is not a counterAxisAlignItems value" \
    "use MIN / MAX / CENTER; to stretch a child set child.layoutSizingHorizontal = 'FILL' after appendChild"
done <<EOF
$(printf '%s\n' "$CODE" | grep -nE "counterAxisAlignItems[[:space:]]*=[[:space:]]*['\"]STRETCH['\"]" | sed -E 's/^([0-9]+):[[:space:]]*/\1:/')
EOF

# 3 ── individualStrokeWeights is not supported in use_figma
while IFS= read -r hit; do
  [ -n "$hit" ] && add "line ${hit%%:*}: individualStrokeWeights is not supported" \
    "set strokeTopWeight / strokeBottomWeight / strokeLeftWeight / strokeRightWeight individually"
done <<EOF
$(printf '%s\n' "$CODE" | grep -nE "individualStrokeWeights" | sed -E 's/^([0-9]+):[[:space:]]*/\1:/')
EOF

# 4 ── FILL ordering / parent checks (definite cases only):
#   a) X.layoutSizing* = 'FILL' on a line BEFORE the line that appends X          → throws
#   b) X appended into P where P came from figma.createFrame() and P never gets layoutMode → throws
#   c) X appended to figma.currentPage (a page child) then given FILL                → throws
while IFS=$'\t' read -r kind v ln extra; do
  [ -n "$kind" ] || continue
  case "$kind" in
    FILL_BEFORE_APPEND) add "line $ln: $v.layoutSizing…='FILL' is set BEFORE $v is appended (later, line $extra)  → \"FILL can only be set on children of auto-layout frames\"" \
                            "move the FILL line after \`parent.appendChild($v)\`" ;;
    FILL_INTO_NON_AUTOLAYOUT) add "line $ln: $v gets FILL but its parent '$extra' is a createFrame() with no layoutMode  → same throw" \
                            "set $extra.layoutMode = 'HORIZONTAL' | 'VERTICAL' before appending children" ;;
    FILL_ON_PAGE_CHILD) add "line $ln: $v is a page-level frame (appended to figma.currentPage) — FILL is meaningless there and throws" \
                            "size the root with resize(width, height) / primaryAxisSizingMode='FIXED'; FILL is for children of auto-layout frames" ;;
  esac
done <<EOF
$(printf '%s\n' "$CODE" | perl -e '
  # Positions are CHARACTER OFFSETS, not line numbers: "i.layoutSizingHorizontal = \x27FILL\x27; p.appendChild(i);"
  # on ONE line is still FILL-before-append and still throws.
  my $all = do { local $/; <STDIN> };
  my (%append, %parentOf, %cf, %lm);
  while ($all =~ /([\w\$.]+)\.(?:appendChild|insertChild)\(\s*(?:\d+\s*,\s*)?([\w\$]+)\s*\)/g) {
    my ($p, $c) = ($1, $2); $append{$c} //= $-[0]; $parentOf{$c} //= $p;
  }
  while ($all =~ /(?:const|let|var)\s+([\w\$]+)\s*=\s*figma\.createFrame\(\)/g) { $cf{$1} = 1; }
  while ($all =~ /([\w\$]+)\.layoutMode\s*=/g) { $lm{$1} = 1; }
  sub ln { my $o = shift; my $pre = substr($all, 0, $o); return ($pre =~ tr/\n//) + 1; }
  while ($all =~ /([\w\$]+)\.layoutSizing(?:Horizontal|Vertical)\s*=\s*[\x27"]FILL[\x27"]/g) {
    my $v = $1; my $o = $-[0];
    next unless defined $append{$v};
    if ($append{$v} > $o) { print "FILL_BEFORE_APPEND\t$v\t" . ln($o) . "\t" . ln($append{$v}) . "\n"; next; }
    my $p = $parentOf{$v} // "";
    if ($p =~ /currentPage$/) { print "FILL_ON_PAGE_CHILD\t$v\t" . ln($o) . "\t$p\n"; next; }
    if ($cf{$p} && !$lm{$p}) { print "FILL_INTO_NON_AUTOLAYOUT\t$v\t" . ln($o) . "\t$p\n"; }
  }' 2>/dev/null)
EOF

if [ -n "$FAILS" ]; then
  {
    echo "⛔ API-GOTCHA BLOCKED — this code will throw inside Figma (documented traps, figma-build-patterns.md gotcha table):"
    printf '%s' "$FAILS"
    echo "Fix these lines and resend the SAME code — do not regenerate the screen from scratch."
  } >&2
  exit 2
fi
exit 0
