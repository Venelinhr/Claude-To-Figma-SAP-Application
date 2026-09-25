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
# 2026-09-14: when run inside guard-chain.sh, INPUT/TOOL/CODE are already parsed and exported —
# skip the duplicate cat+jq. Falls back to self-parsing when run standalone (unchanged behavior).
INPUT="${GUARD_CHAIN_INPUT:-$(cat)}"
TOOL="${GUARD_CHAIN_TOOL:-$(echo "$INPUT" | jq -r '.tool_name // empty')}"
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE="${GUARD_CHAIN_CODE:-$(echo "$INPUT" | jq -r '.tool_input.code // ""')}"

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

# Block 3 — native-heavy code (added 2026-09-01, AUDIT-V2 P3; rewritten 2026-09-02 after a
# gate-integrity failure). Block 1 only fired at ZERO instances; the 2026-09-01 build shipped
# createFrame ×17 against createInstance ×3 and passed. A screen is layout containers (few) +
# kit instances (many). More frames than instances means table rows / cells / fields / badges
# were drawn by hand.
#
# KNOWN LIMITATION (audit finding D, 2026-09-14, investigated not just flagged): this is a
# RAW CALL COUNT, not real coverage. Confirmed exploitable: code that clones the SAME small
# component N times (e.g. `for (...) { const x = icon.clone(); ... }`) inflates INST by N,
# which can outnumber N unnamed/unrecognized createFrame() calls that are the actual hand-drawn
# screen skeleton — tested directly, this passes Block 3 with exit 0.
# NOT FIXED HERE, on purpose: the obvious static fix (flag repeated .clone() of the same source
# variable as suspicious) was tested against this exact bypass AND against
# skill/references/figma-build-patterns.md's own documented, ENCOURAGED pattern ("Duplicate
# rows, don't regenerate" — clone one real row N times to build a table) and cannot tell them
# apart from code text alone: both are "the same variable .clone()'d in a loop". A fix here
# needs real post-build subtree size, not a pre-build grep, and forcing a static heuristic would
# either miss the bypass or break correct 20-row-table code — worse than the status quo.
# WHY THIS IS NOT A SILENT-FAILURE RISK: verified directly — a dump matching this exact bypass
# (real clones + unnamed FRAME siblings) is caught by verify-invariants.js INV 1 (FAIL_FAKE_COMPONENT
# on the unrecognized-name frames, since it inspects the real built tree, not code call counts),
# and lint-on-stop.sh (Gate 7) hard-blocks hand-off unless that check's overallPass:true. The
# bypass costs a wasted pre-build pass (caught later than it could be), never a shipped bad screen.
#
# ORIGINAL DESIGN (retired): a free-text `// layout-only: N` comment was subtracted from the
# frame count, self-declared by the same agent being gated. AUDIT-V2 2026-09-02: an agent wrote
# `// layout-only: 120` when the code had only 7 real createFrame() calls, unconditionally
# zeroing the excess and passing the gate with zero verification. A cap at the real createFrame
# count does not fix this either — `// layout-only: <anything >= CF>` still zeroes EFF every
# time; the self-declaration itself is the hole, not its size.
#
# NEW DESIGN: don't trust a declaration at all. Reuse the SAME source of truth the post-build
# verifier already trusts — build/native-frame-allowlist.json's containerNamePatterns (legit
# layout-container names: Wrapper$, Row$, Header$, Section$, …) and forbiddenContainerNames
# (component names that must NEVER be a bare frame, e.g. Button, Table, Input). For each
# `const x = figma.createFrame()` in the code, look at that variable's later `x.name = "…"`
# assignment: matches an allowlist pattern and not a forbidden name → legitimate layout frame,
# subtracted for free, no declaration needed. Anything else (no name set yet, or a name that
# matches neither list) counts as unexplained and must be covered by real instances/clones.
ALLOWLIST="$PROJ/build/native-frame-allowlist.json"
if [ -f "$ALLOWLIST" ]; then
  PATTERNS=$(node -e "const a=require('$ALLOWLIST'); console.log((a.containerNamePatterns||[]).join('|'))" 2>/dev/null)
  FORBIDDEN=$(node -e "const a=require('$ALLOWLIST'); console.log((a.forbiddenContainerNames||[]).join('|'))" 2>/dev/null)
else
  PATTERNS=""; FORBIDDEN=""
fi
UNEXPLAINED=$(printf '%s\n' "$CODE" | PATTERNS="$PATTERNS" FORBIDDEN="$FORBIDDEN" perl -e '
  binmode(STDIN, ":encoding(UTF-8)");
  my $pat = $ENV{PATTERNS} // ""; my $forb = $ENV{FORBIDDEN} // "";
  # Split on statement boundaries, not newlines — model-generated code is multi-line, but
  # test payloads and minified code can put several statements on one line. Splitting on `;`
  # (real JS statement terminator here) makes the var/name association work regardless.
  my @l = split /;/, do { local $/; <STDIN> };
  my %frameVar; # var => declared (0/1)
  for my $i (0..$#l) {
    if ($l[$i] =~ /(?:const|let|var)\s+([\w\$]+)\s*=\s*figma\.createFrame\(\)/) { $frameVar{$1} = 0; }
  }
  for my $i (0..$#l) {
    if ($l[$i] =~ /([\w\$]+)\.name\s*=\s*[\x27"`]([^\x27"`]*)[\x27"`]/ && exists $frameVar{$1}) {
      my ($v, $n) = ($1, $2); (my $bare = $n) =~ s/\s*\[[^\]]*\]//g; $bare =~ s/^\s+|\s+$//g;
      my $ok = 0;
      if ($forb ne "" && $bare =~ /^(?:$forb)$/i) { $ok = 0; }
      elsif ($pat ne "" && $bare =~ /(?:$pat)/) { $ok = 1; }
      $frameVar{$v} = $ok;
    }
  }
  my $unexplained = 0;
  $unexplained += (1 - $_) for values %frameVar;
  print $unexplained;
' 2>/dev/null)
UNEXPLAINED=${UNEXPLAINED:-$CF}
if [ "$CF" -ge 6 ] && [ "$UNEXPLAINED" -gt "$INST" ] && [ "$IS_PRESENTATION" = "false" ]; then
  {
    echo "⛔ GATE 5 BLOCKED (INVARIANT 1) — native-heavy build: $UNEXPLAINED of $CF createFrame() calls have no name matching a legitimate layout-container pattern, vs SAP instance/clone calls ×$INST."
    echo "Rows, cells, filter fields, checkboxes, badges and buttons must each be a kit instance (createInstance / .clone)."
    echo "A createFrame() only counts as legitimate layout if its .name matches build/native-frame-allowlist.json's containerNamePatterns (e.g. ends in Row/Header/Section/Wrapper) and is not a forbiddenContainerNames component name."
    echo "There is no self-declaration escape hatch — name the frame correctly (it also has to pass verify-invariants.js post-build) and resend."
  } >&2
  exit 2
fi

# Block 4 — a sidebar/nav region built without the SAP SideNavigation component (added
# 2026-09-03, AUDIT-V2 "Software Hub Product Search" investigation). Root cause there was
# upstream: SAP_BUILD_MANIFEST.md §3 did not list SideNavigation, so the model's own `K`
# component-key object never had a key for it and hand-drew the whole sidebar as native
# frames — Block 1/2/3 above all missed it because the SAME call also created plenty of
# real instances elsewhere (ShellBar, Button, Input…), so the whole-call instance count was
# never zero. §3 now lists SideNavigation (clone-only, like Dialog) — this block is a second
# line of defense: if the code clearly intends a left-nav region (a frame/const named for
# one) but the code has neither `SideNavigation` in a key/import string nor a `.clone(` call
# anywhere, flag it. Heuristic, so it warns rather than hard-blocks — a screen legitimately
# without a sidebar (e.g. a dialog) must not be forced to add one.
if echo "$CODE" | grep -qiE '\b(const|let|var)\s+\w*(sideNav|sidenav|leftNav|navPanel|navRail)\w*\s*=' ; then
  if ! echo "$CODE" | grep -qiE 'SideNavigation|d680af6d72f9421fe3f8712bf0ce171308963d3a|68:3262|701:119633|699:37890'; then
    echo "⚠ GATE 5 WARNING (not blocking) — this code names a sidebar/left-nav variable but never references the real SAP SideNavigation component (key d680af6d72f9421fe3f8712bf0ce171308963d3a, or clone 68:3262 / 701:119633 / 699:37890 — see SAP_BUILD_MANIFEST.md §3). If this sidebar is being hand-built with createFrame(), stop and clone the real component instead (RULE 28)." >&2
  fi
fi

# Block 6 — oversized build payload (added 2026-09-12, AUDIT-V2 P2 "zone-by-zone").
# Sized from measured history, not a guess:
#   Run A's three monolithic builds were 21.7 KB, 18.1 KB, 16.3 KB — the first two DIED on a
#   documented API trap, taking ~15.5k output tokens and ~2.5 min with them. One error in a
#   20 KB payload costs the whole payload.
#   The clone-first build that worked was 8.2 KB TOTAL across two calls (4.0 + 4.2 KB).
# So: a single call over ~12 KB is a monolith, and a monolith is what makes a retry expensive.
# Warn at 12 KB, block at 20 KB. A clone-and-adapt call never legitimately reaches 20 KB;
# if the screen truly needs that much code, it needs to be split into zones (skeleton →
# header → filters → table), which also makes a failure cost one zone instead of everything.
CODE_BYTES=$(printf '%s' "$CODE" | wc -c | tr -d ' ')
if [ "$CODE_BYTES" -gt 20000 ]; then
  {
    echo "⛔ GATE 6 BLOCKED — build payload is ${CODE_BYTES} bytes (cap 20000)."
    echo ""
    echo "Why this is blocked: in the measured baseline (docs/AUDIT-V2.md §2) the three"
    echo "monolithic builds were 21.7 KB / 18.1 KB / 16.3 KB and TWO of them died on a single"
    echo "documented API trap — ~15.5k output tokens and ~2.5 min lost, because one bad line"
    echo "throws away the entire payload. The clone-first build that succeeded was 8.2 KB total"
    echo "across two calls."
    echo ""
    echo "Split this into zones and send them as separate use_figma calls:"
    echo "  1. skeleton (root frame + layout)   2. header   3. filters   4. table/content"
    echo "Each zone verifies before the next is sent, so one API error costs one zone."
    echo ""
    echo "If you are cloning a canonical (RULE 28 / the default path), this payload should be"
    echo "an ADAPT of the clone — not a re-assembly of the screen from parts. Re-check that you"
    echo "cloned instead of rebuilding."
  } >&2
  exit 2
elif [ "$CODE_BYTES" -gt 12000 ]; then
  echo "⚠ GATE 6 WARNING (not blocking) — build payload is ${CODE_BYTES} bytes. The measured clone-first build was 8.2 KB across TWO calls; payloads above ~12 KB are the monolithic shape that lost ~15.5k tokens to single API errors in the baseline (AUDIT-V2 §2). Consider splitting into zones (skeleton → header → filters → table) so one error costs one zone." >&2
fi

# Block 5 — wrong side-padding value on a root/page-level container (added 2026-09-12, full
# audit "Spacing/Padding Rules" root cause #3). CLAUDE.md Rule 1 ("Side padding ALWAYS 32px
# (NEVER 48px)") had ZERO mechanical enforcement — validate-lesson.sh only checked lesson TEXT
# being saved to memory, never the actual paddingLeft/paddingRight values in submitted build
# code. Scope: only a root-ish container name (page/header/filter/table/wrapper/shell), so this
# does not fire on legitimate internal padding for cards, form fields, or table cells, which
# follow a different (correct) convention.
if echo "$CODE" | grep -qiE '\.(name)\s*=\s*["'"'"'][^"'"'"']*(page|header|filter|table|wrapper|shell)[^"'"'"']*["'"'"']' ; then
  WRONG_PAD=$(echo "$CODE" | grep -oE '\.(paddingLeft|paddingRight)\s*=\s*[0-9]+' | grep -vE '=\s*32$' | head -3)
  if [ -n "$WRONG_PAD" ]; then
    {
      echo "⛔ GATE 5 BLOCKED — non-32px side padding found on what looks like a root/page-level container:"
      echo "$WRONG_PAD"
      echo ""
      echo "CLAUDE.md Rule 1: side padding is ALWAYS 32px on page header / filter area / table wrapper"
      echo "containers — never 48px, never any other value. Set paddingLeft = paddingRight = 32."
      echo "(If this genuinely is NOT a root/page-level container — e.g. a card or form-field internal"
      echo "padding, which follows its own convention — rename the variable so it doesn't match"
      echo "page/header/filter/table/wrapper/shell, since that name pattern is what triggered this check.)"
    } >&2
    exit 2
  fi
fi

exit 0
