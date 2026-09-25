#!/bin/bash
# guard-manifest-drift.sh — PreToolUse hook · Gate 4 (keys verified). BLOCKING.
#
# SAP_BUILD_MANIFEST.md §3 is the component-key source the build agent reads. If it has drifted
# from the registry (a stale/wrong figmaComponentId), a build's importComponentSetByKeyAsync will
# 404 at runtime — the exact fail-closed case that must NOT be reached silently. This gate runs the
# drift checker BEFORE a key-dependent use_figma build and blocks (exit 2) if the manifest is stale.
#
# Complements manifest-sync-check.sh (PostToolUse notice on manifest edit). This one is the hard
# pre-build gate. Read-only use_figma calls pass silently.
# 2026-09-14: when run inside guard-chain.sh, INPUT/TOOL/CODE are already parsed and exported —
# skip the duplicate cat+jq. Falls back to self-parsing when run standalone (unchanged behavior).
INPUT="${GUARD_CHAIN_INPUT:-$(cat)}"
TOOL="${GUARD_CHAIN_TOOL:-$(echo "$INPUT" | jq -r '.tool_name // empty')}"
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE="${GUARD_CHAIN_CODE:-$(echo "$INPUT" | jq -r '.tool_input.code // ""')}"
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# Only gate builds that import SAP component keys (the drift-sensitive operation).
echo "$CODE" | grep -qE "importComponentSetByKeyAsync" || exit 0

cd "$PROJ" 2>/dev/null || exit 0

# F-5 (Performance Recovery, RC-5): check-manifest-sync.js parses 152 registry JSONs + reads the
# 132KB code.js + 4 doc files on EVERY key-importing build. That is wasted work when none of those
# inputs changed since the last successful check. Cache the "OK" result keyed by a signature of the
# input mtimes; skip the full node scan on a cache hit. Any edit to a source file changes the
# signature → the full scan runs again (and manifest-sync-check.sh already re-checks on edits).
SIG_INPUTS="SAP_BUILD_MANIFEST.md knowledge/guidelines/horizon-variable-keys.json skill/SYSTEM_PROMPT.md plugin/figma-builder/code.js knowledge/components/registry"
sig() {
  # mtime of each input (dir mtime changes when files are added/removed; also fold in file count).
  local s=""
  for p in $SIG_INPUTS; do
    if [ -e "$p" ]; then
      s="$s$(stat -f '%m' "$p" 2>/dev/null || stat -c '%Y' "$p" 2>/dev/null):"
    fi
  done
  # include registry file count so add/remove of a JSON invalidates even if dir mtime is coarse
  s="$s$(ls knowledge/components/registry/*.json 2>/dev/null | wc -l | tr -d ' ')"
  echo "$s"
}
CACHE="$PROJ/.claude/.manifest-sync-ok"
CUR="$(sig)"
if [ -f "$CACHE" ] && [ "$(cat "$CACHE" 2>/dev/null)" = "$CUR" ]; then
  exit 0   # inputs unchanged since last OK → skip the full scan
fi

if ! node build/check-manifest-sync.js >/dev/null 2>&1; then
  rm -f "$CACHE" 2>/dev/null
  echo "⛔ GATE 4 BLOCKED — SAP_BUILD_MANIFEST.md has drifted from the registry/token source." >&2
  echo "A build that imports component keys from a stale manifest will 404 at importComponentSetByKeyAsync." >&2
  echo "Fix: regenerate the manifest §3/§4 from source, then re-run:  node build/check-manifest-sync.js" >&2
  echo "(Details:  node build/check-manifest-sync.js )" >&2
  exit 2
fi

# Passed — cache the current input signature so the next build skips the scan.
echo "$CUR" > "$CACHE" 2>/dev/null

# Advisory-only staleness note (2026-09-14, audit finding F): the registry has no mechanical
# freshness check anywhere in the build path, so silent drift vs. the live (daily-changing) SAP
# kit accumulates undetected. This never blocks — it only runs on a cache-MISS (i.e. same
# frequency as the drift scan above, not every build) and only prints once per session via its
# own cache file, so it costs nothing on the hot path.
FRESH_CACHE="$PROJ/.claude/.registry-freshness-notified"
if [ ! -f "$FRESH_CACHE" ]; then
  node build/check-registry-freshness.js 2>/dev/null >&2
  touch "$FRESH_CACHE" 2>/dev/null
fi

exit 0
