# Hooks Reference
## Claude Code automation hooks for the SAP Figma Builder project
## Added: 2026-07-15

Five hooks are configured in `.claude/hooks/`. They require a **Claude Code restart** to activate after any change to `settings.json`.

---

## Critical lessons (confirmed 2026-07-15)

### Hook stdin format — NOT environment variables

**❌ WRONG** — `$CLAUDE_TOOL_INPUT_FILE_PATH` does not exist in hook context:
```bash
file_path="$CLAUDE_TOOL_INPUT_FILE_PATH"
```

**✅ CORRECT** — read stdin as JSON, extract `.tool_input.file_path`:
```bash
input=$(cat)
file_path=$(echo "$input" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))")
```

### settings.json requires restart to activate

Hooks defined in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global) are only loaded at Claude Code startup. Adding or editing a hook **does NOT take effect in the current session** — you must restart Claude Code.

---

## The 5 hooks

| Hook | File | Trigger | Purpose |
|---|---|---|---|
| block-codejs-read | `.claude/hooks/block-codejs-read.sh` | PreToolUse: Read | Blocks reads of `code.js` (~45k tokens) — use SAP_BUILD_MANIFEST.md instead |
| block-generated-files | `.claude/hooks/block-generated-files.sh` | PreToolUse: Edit | Blocks direct edits to bundled/generated files |
| registry-rebuild | `.claude/hooks/registry-rebuild.sh` | PostToolUse: Edit | Auto-rebuilds bundle when a registry JSON is edited |
| manifest-sync-check | `.claude/hooks/manifest-sync-check.sh` | PostToolUse: Edit | Drift check when SAP_BUILD_MANIFEST.md is edited |
| feedback-learn | `.claude/hooks/feedback-learn.sh` | PostToolUse: Edit | Detects good/bad feedback phrases → captures lesson to memory |

---

## block-codejs-read.sh — why it exists

The plugin runtime `plugin/figma-builder/code.js` is ~132.5 KB (~33k tokens). Reading it wastes a full context budget and provides no useful information for `use_figma` builds — all component keys, token hexes, and build patterns live in `SAP_BUILD_MANIFEST.md` instead (~28.6 KB / ~7.1k tokens as of 2026-09-14 — re-check with `wc -c SAP_BUILD_MANIFEST.md` if this drifts; still ~4-5x cheaper than reading code.js).

The hook cites **RULE 28** in its block message. If you see it fire, do NOT try to bypass it — use `SAP_BUILD_MANIFEST.md §3` for keys and `§4` for tokens instead.

---

## feedback-learn.sh — detection phrases

The feedback hook fires when a PostToolUse Edit event contains any of these (case-insensitive):

**Positive (save lesson as canonical):**
- "perfect", "bingo", "100%", "great result", "rock solid", "bravo", "exactly right", "well done"

**Negative (save lesson as anti-pattern):**
- "wrong", "don't do that", "I told you", "not SAP", "violated", "again", "fix this"

When triggered, it appends a capture prompt to the session so the lesson is written to memory before the session ends.

---

## Activation checklist

After editing any hook or `settings.json`:
1. `Cmd+Q` Claude Code (quit fully)
2. Reopen Claude Code
3. First session prompt: verify hooks fire on a test Read of a blocked file
