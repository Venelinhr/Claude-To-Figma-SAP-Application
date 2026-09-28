[SAP v4 BRIDGE CHECK · job {{jobId}} · round {{round}} of {{maxRounds}} · built by {{builder}}]

The screen is built: node `{{nodeId}}` in file `{{fileKey}}`. Logos placed by the plugin: {{logos}}.
Plan: `{{plan}}` · Reference image: {{ref}} · Job folder: `{{jobDir}}`.
Same rules as the job task: only `STAGE` / `AGENT_` lines are read, one-line markers, SAP only, change
nothing but this node. A hook asks for facts → give them in 4 short lines and retry. Shell: one plain
command per call, no `>` `|` `&&` (blocked) — save printed output with the Write tool.

1. **Layers.** One read-only `use_figma` with `build/templates/dump-tree.use_figma.js` (ROOT = `'{{nodeId}}'`)
   → save the returned JSON to `{{jobDir}}/tree.json` →
   `node build/audit-plan.js {{plan}} {{jobDir}}/tree.json` → MATCH % + HYGIENE.
2. **Eye** (only with a reference image). `download_assets` of `{{nodeId}}` (png, defaultScale 2) →
   `curl -s -o {{jobDir}}/build@2x.png "<export url>"`; one read-only `use_figma` with
   `build/templates/dump-geometry.use_figma.js` → `{{jobDir}}/geometry.json`;
   `python3 build/see.py diff {{ref}} {{jobDir}}/build@2x.png --tree {{jobDir}}/geometry.json --out {{jobDir}}/see-out`
   → EYE %, fix lines with node ids. Look at `{{jobDir}}/see-out/diff-sheet.png` once; drop reading errors.
   No reference image → EYE = null.
   → `STAGE check <MATCH n% · EYE n% · hygiene n>`
3. **Pass** = audit-plan exit 0 (MATCH ≥ 90 %, hygiene 0) and, with a reference, see.py exit 0 (EYE ≥ 95 %).
   Do not write the plan cache or the run log — the bridge does that itself after it has re-measured both
   gates. Report only numbers a script printed; "the eye tool is wrong" is never a pass.
   → `STAGE done <MATCH n% · EYE n%>` →
   `AGENT_RESULT {"nodeId":"{{nodeId}}","mode":"{{routeMode}}","match":<n>,"eye":<n or null>,"WARN":[],"pass":true,"blocks":[]}`
4. **Not passed, round < {{maxRounds}}:**
   - built by claude → fix the lines yourself (hygiene first) with small `use_figma` calls that use the prelude
     runtime → `STAGE fix <n lines fixed>` → steps 1–3 again (that is the next round).
   - built by figma-agent → write the fix lines (hygiene first, one per line:
     `<node id> · <element> · <change>`) to `{{jobDir}}/fix.md` → `AGENT_FIX {"fixFile":"{{jobDir}}/fix.md"}`
     and stop.
5. **Not passed, round = {{maxRounds}}** → `STAGE done <MATCH · EYE · not passed>` →
   `AGENT_RESULT {"nodeId":"{{nodeId}}","mode":"{{routeMode}}","match":<n>,"eye":<n or null>,"WARN":[],"pass":false,"blocks":["<main reasons, ≤ 5>"]}`
