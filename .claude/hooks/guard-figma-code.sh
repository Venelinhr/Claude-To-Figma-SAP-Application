#!/bin/bash
# guard-figma-code.sh — PreToolUse hook · Gate 5 (INVARIANT 1, code-semantics). BLOCKING.
#
# Fires before a use_figma build and inspects the CODE ITSELF for the #1 historical failure:
# native figma.createFrame() substituted for a real SAP Web UI Kit component.
#
# Three blocks (exit 2):
#   1. createFrame() present with ZERO instance-creation calls = a pure native wireframe, not SAP.
#   2. A createFrame()/createText() VARIABLE named after a registry component, or a text node
#      whose characters are a checkbox glyph = a fake component. (Reliable at code level because
#      the name is tied to the variable that came from figma.create*(), not to any `.name`.)
#   3. More createFrame() calls than instance/clone calls (≥6 frames) = native-heavy build.
#
# Read-only use_figma calls (get/find/inspect, no frame mutation) pass silently.
# This complements guard-reuse-gate.sh (reuse decision) and verify-invariants.js (post-build truth).
#
# Tool input arrives as JSON on stdin (.tool_name, .tool_input.code). exit 2 = block; exit 0 = allow.
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE=$(echo "$INPUT" | jq -r '.tool_input.code // ""')

# Only inspect calls that mutate the canvas (build calls).
echo "$CODE" | grep -qE "createInstance|createFrame|importComponentSetByKeyAsync|\.clone\(" || exit 0

CF=$(echo "$CODE" | grep -oE "createFrame\(" | wc -l | tr -d ' ')
INST=$(echo "$CODE" | grep -oE "createInstance\(|importComponentSetByKeyAsync\(|\.clone\(" | wc -l | tr -d ' ')

# Block 1 — native-frame wireframe: createFrame present, zero SAP instances/clones.
# Exception: presentation/pitch slides are legitimate native-frame builds (they are
# not SAP application screens). If the code contains slide/presentation markers, allow.
IS_PRESENTATION=false
echo "$CODE" | grep -qiE "makeSlide|Pitch|PRESENTATION|1920.*1080|slide.*1920|\"[0-9]+ (Pitch|Slide|Hero|Closing)\"" && IS_PRESENTATION=true

if [ "$CF" -gt 0 ] && [ "$INST" -eq 0 ] && [ "$IS_PRESENTATION" = "false" ]; then
  echo "⛔ GATE 5 BLOCKED (INVARIANT 1) — this use_figma code calls figma.createFrame() with ZERO SAP instance/clone calls." >&2
  echo "That produces a native-frame wireframe, NOT a SAP screen. Every UI element must be a real SAP Web UI Kit instance:" >&2
  echo "  • importComponentSetByKeyAsync(<key>) → defaultVariant.createInstance()  (build new)" >&2
  echo "  • OR clone an approved canonical node: canonicalNode.clone()  (RULE 28 clone-first)" >&2
  echo "Native frames are allowed ONLY for documented primitives (divider, ◆ICON/ placeholder, progress-bar fill, layout container)." >&2
  exit 2
fi

# Block 2 — a fake component we CAN see at code level (added 2026-09-01, AUDIT-V2 P3).
# The old note said `.name = "Button"` is ambiguous at code level. It is — on its own. But when
# the VARIABLE was assigned from figma.createFrame()/createText()/createRectangle() and THAT
# variable is then named after a registry component, there is no ambiguity: it is a fake.
# Same for a text node whose characters are a checkbox glyph (☐ ☑ ✓ □ ■) — the 2026-09-01
# build drew 8 checkboxes that way ("Replaced 8 native checkbox text nodes"). Registry names
# come from knowledge/components/registry/*.json (152), so the list never drifts.
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
REG=$(ls "$PROJ"/knowledge/components/registry/*.json 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/\.json$//' | paste -sd'|' -)
FAKES=$(printf '%s\n' "$CODE" | REG="$REG" perl -e '
  binmode(STDIN, ":encoding(UTF-8)"); binmode(STDOUT, ":encoding(UTF-8)");
  my $reg = $ENV{REG} // ""; my @l = split /\n/, do { local $/; <STDIN> };
  my %native;
  for my $i (0..$#l) {
    if ($l[$i] =~ /(?:const|let|var)\s+([\w\$]+)\s*=\s*figma\.create(Frame|Text|Rectangle|Ellipse|Line)\(\)/) { $native{$1} = "$2:" . ($i+1); }
  }
  for my $i (0..$#l) {
    my $s = $l[$i];
    if ($reg ne "" && $s =~ /([\w\$]+)\.name\s*=\s*[\x27"`]([^\x27"`]*)[\x27"`]/ && $native{$1}) {
      my ($v, $n) = ($1, $2); (my $bare = $n) =~ s/\s*\[[^\]]*\]//g; $bare =~ s/^\s+|\s+$//g;
      if ($bare =~ /^(?:$reg)$/i) { print "line " . ($i+1) . ": $v = figma.create" . (split /:/, $native{$v})[0] . "() is named \x27$n\x27 — a native node standing in for SAP $bare\n"; }
    }
    if ($s =~ /([\w\$]+)\.characters\s*=\s*[\x27"`]\s*[\x{2610}\x{2611}\x{2612}\x{2713}\x{2714}\x{25A1}\x{25A0}\x{25FB}\x{25FC}]/ ) {
      print "line " . ($i+1) . ": $1.characters is a checkbox glyph — a text node standing in for SAP CheckBox\n";
    }
  }' 2>/dev/null)
if [ -n "$FAKES" ]; then
  {
    echo "⛔ GATE 5 BLOCKED (INVARIANT 1) — native nodes standing in for SAP components:"
    printf '%s\n' "$FAKES" | sed 's/^/  • /'
    echo "Every UI element must be a kit instance: importComponentSetByKeyAsync(<key from SAP_BUILD_MANIFEST.md §3>) → defaultVariant.createInstance()."
    echo "Native frames are for layout containers only (root, rows, columns) — never named after a component."
  } >&2
  exit 2
fi

# Block 3 — native-heavy code (added 2026-09-01, AUDIT-V2 P3). Block 1 only fired at ZERO
# instances; the 2026-09-01 build shipped createFrame ×17 against createInstance ×3 and passed.
# A screen is layout containers (few) + kit instances (many). More frames than instances means
# table rows / cells / fields / badges were drawn by hand. Declare genuine layout-only frames
# with a comment `// layout-only: N` and they are subtracted.
LAYOUT_ONLY=$(printf '%s\n' "$CODE" | grep -oE "//[[:space:]]*layout-only:[[:space:]]*[0-9]+" | grep -oE "[0-9]+$" | head -1); LAYOUT_ONLY=${LAYOUT_ONLY:-0}
EFF=$((CF - LAYOUT_ONLY)); [ "$EFF" -lt 0 ] && EFF=0
if [ "$CF" -ge 6 ] && [ "$EFF" -gt "$INST" ] && [ "$IS_PRESENTATION" = "false" ]; then
  {
    echo "⛔ GATE 5 BLOCKED (INVARIANT 1) — native-heavy build: createFrame ×$CF vs SAP instance/clone calls ×$INST."
    echo "Rows, cells, filter fields, checkboxes, badges and buttons must each be a kit instance (createInstance / .clone)."
    echo "Layout containers (root, rows, columns) are the only legitimate createFrame() uses."
    echo "If the extra frames really are layout containers, declare them:  // layout-only: <N>   and resend the same code."
  } >&2
  exit 2
fi

exit 0
