#!/bin/bash
# guard-marker-write.sh — stops the agent forging gate markers, without blocking reads.
#
# Replaces an inline settings.json one-liner that had three defects, all seen live
# on 2026-08-28:
#   1. It matched a write operator ANYWHERE in the command, so `cat x 2>/dev/null`
#      tripped on the `>` inside the redirect and a plain READ was refused.
#   2. It treated every marker the same, so `node build/record-reference.js` — the
#      SANCTIONED writer for Gate 0 — was blocked from doing its designed job.
#   3. It matched only literal paths, so `node -e "fs.writeFileSync(path.join(...))"`
#      built the path at runtime and sailed straight through. The agent used exactly
#      that to write its own .reuse-declared, twice.
#
# TWO TIERS. They are not the same thing and must not share one rule:
#
#   TIER 1 — CONSENT markers. Proof the USER said yes. Only capture-approvals.sh,
#            fired by a real user prompt, may write these. The agent never may.
#   TIER 2 — DECISION markers. The agent records these by design, but ONLY through
#            the audited build/record-*.js scripts, never by raw shell.
#
# Reads are always allowed. Exit 2 blocks; exit 0 permits.

TIER1='wireframe-approved|scratch-approved|architect-approved'
TIER2='reference-selected|reuse-declared|workflow-loaded|last-build-node'
ALL="$TIER1|$TIER2"

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

deny() {
  echo "⛔ BLOCKED — $1" >&2
  echo "" >&2
  echo "Consent markers (.wireframe-approved, .scratch-approved, .architect-approved) are" >&2
  echo "written ONLY by the user's own words, via capture-approvals.sh. Present the wireframe" >&2
  echo "and wait for a real approval." >&2
  echo "" >&2
  echo "Decision markers (.reference-selected, .reuse-declared) are written ONLY by their" >&2
  echo "scripts:  node build/record-reference.js …   /   node build/record-reuse-decision.js …" >&2
  exit 2
}

# ── Write / Edit tool: judge by destination path only ────────────────────────
case "$TOOL" in
  Write|Edit|NotebookEdit)
    FP=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
    echo "$FP" | grep -qE "[.]claude/[.]($ALL)$" \
      && deny "the Write/Edit tool cannot create gate markers."
    exit 0
    ;;
esac

[ "$TOOL" = "Bash" ] || exit 0
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -n "$CMD" ] || exit 0

# ── The sanctioned writers. Allowed for TIER 2 only. ─────────────────────────
# Checked before anything else so the designed Gate 0 / RULE 31 flow keeps working.
if echo "$CMD" | grep -qE 'node +[^|;&]*build/record-(reference|reuse-decision)\.js'; then
  echo "$CMD" | grep -qE "[.]claude/[.]($TIER1)" \
    && deny "a record-*.js invocation may not also touch a consent marker."
  exit 0
fi

# ── 1. A redirect / copy whose TARGET is a marker. ───────────────────────────
# The operator must be immediately followed by the marker path — so an unrelated
# `2>/dev/null` elsewhere in a read command no longer trips this.
echo "$CMD" | grep -qE '(>>?|\btee\b|\bcp\b|\bmv\b|\bln\b|\binstall\b)[[:space:]]+[^|;&]*[.]claude/[.]('"$ALL"')' \
  && deny "that command writes a gate marker directly."

# ── 2. Inline interpreters. ──────────────────────────────────────────────────
# The runtime-path bypass: `node -e "fs.writeFileSync(path.join(ROOT,'.claude','.reuse-declared'))"`
# never contains the literal path, so pattern 1 cannot see it. Any inline script
# that so much as names a marker is refused — inline code is not an audited writer.
if echo "$CMD" | grep -qE '\b(node|nodejs)[[:space:]]+(-e|--eval|-p|--print)|\bpython3?[[:space:]]+-c|\bperl[[:space:]]+-e|\bruby[[:space:]]+-e|\bosascript[[:space:]]+-e'; then
  echo "$CMD" | grep -qE "($ALL)" \
    && deny "inline interpreter code may not write gate markers — use the record-*.js script."
  # Also catch a marker assembled from parts: a write call plus the .claude dir.
  if echo "$CMD" | grep -qE 'writeFileSync|appendFileSync|createWriteStream|open\([^)]*["'"'"']w|>[[:space:]]*open|File\.write'; then
    echo "$CMD" | grep -qE '\.claude' \
      && deny "inline interpreter code may not write into .claude/ — use the record-*.js script."
  fi
fi

# ── 3. Shell builtins used as writers (printf/echo into a marker). ───────────
echo "$CMD" | grep -qE '\b(printf|echo)\b[^|;&]*[.]claude/[.]('"$ALL"')' \
  && deny "printf/echo may not write a gate marker."

# Everything else — including every read (cat, ls, grep, jq) — passes.
exit 0
