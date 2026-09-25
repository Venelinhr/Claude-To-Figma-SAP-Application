#!/bin/bash
# lib-build-detect.sh — the SINGLE definition of "does this use_figma call build?"
#
# WHY THIS EXISTS (audit 2026-08-28):
# The same question was answered by seven hand-copied greps that had drifted into
# three different token sets:
#   4 tokens — guard-figma-code.sh, guard-reuse-gate.sh
#   6 tokens — guard-wireframe-gate.sh, guard-architect-gate.sh   (no setProperties)
#   7 tokens — guard-reference-gate.sh, mark-build.sh             (with setProperties)
# So a call that mutated an existing screen purely through setProperties was
# recorded as a build by mark-build.sh, yet sailed past the wireframe, architect
# and reuse gates as if it were read-only. guard-agent-turn1.sh documents this
# exact leak, but the fix was only ever applied to the bridge path.
#
# One definition now, sourced everywhere. Change it here and every gate agrees.
#
# Usage:
#   source "$(dirname "$0")/lib-build-detect.sh"
#   is_build "$CODE" || exit 0

# Canonical mutation surface. Anything that creates, clones, attaches or
# re-configures a node counts as a build.
BUILD_TOKENS='createInstance|createFrame|createText|createNodeFromSvg|importComponentSetByKeyAsync|importComponentByKeyAsync|\.clone\(|appendChild|insertChild|setProperties|\.remove\('

# is_build <code> → 0 (true) when the code mutates the canvas, 1 otherwise.
is_build() {
  printf '%s' "$1" | grep -qE "$BUILD_TOKENS"
}

# NOTE — guard-figma-code.sh deliberately does NOT use this.
# Its check is a RATIO (createFrame count vs instance count), so it is only
# meaningful when createFrame is already present. Widening its trigger would
# add work without changing any outcome. That narrowness is intentional, not drift.
