# SAP Bridge (v4) — open Figma → click the tool → type → Go

The **SAP Bridge** Figma plugin (`plugin/sap-bridge/`) talks to Claude Code through this local bridge
(`bridge/server.js`, `http://localhost:41778`). You type a request (text, an image, a selected frame, or
any mix) and press **Go**. Headless Claude runs the v4 pipeline in this repo:
**Route → Plan → Analyse → Execute → Check → Done**. No copy/paste, no token, no terminal.

```
SAP Bridge plugin ──HTTP localhost:41778──► bridge/server.js ──spawns──► claude -p (repo, branch v4)
      ▲   (plugin places logos, writes the Figma file mailbox)          │ use_figma (MCP)
      └──────────────────────── Figma canvas ◄───────────────────────────┘
```

## Setup
- **Once, by Claude:** `node build/mailbox.js install` → macOS LaunchAgent `com.sap.v4-bridge` (starts at
  login, restarts if it dies, log `bridge-out/bridge.log`). `node build/mailbox.js uninstall` removes it.
- **Once, by you:** Figma → Plugins → Development → Import plugin from manifest →
  `plugin/sap-bridge/manifest.json`.
- **Each time:** open the file → click **SAP Bridge** (right panel button after the first run, or the
  Plugins menu). It finds Claude by itself ("Connected to Claude · v4").

CLI (`node build/mailbox.js …`): `install` · `uninstall` · `ensure` (start the bridge if down) · `status`
(bridge + Figma connection) · `unpair` (let the plugin pair again) · `push <plan.min.json> [--ref ref.png]`
(send a plan made in a Claude Code session to the Figma Agent mailbox) · `wait <jobId>` (block until the job
ends, print `result.json`).

## Modes (toggle in the plugin)
- **Claude builds** (default, the proven 97 % path): Route → Plan → Analyse → Execute → Check (+ ≤ 2 fix rounds).
- **Figma Agent builds** (cheaper): Claude plans; the plugin writes the plan into the Figma file mailbox;
  you type `build plan` in the Figma Agent; the plugin sees the result and Claude checks it. Fixes: you type
  `apply fixes`.

---

## Protocol v1 (contract between `server.js`, `plugin/sap-bridge/`, `build/mailbox.js`)

### Transport rules (what passes Figma's plugin sandbox)
- URL host **`localhost`** (never an IP), port `41778`. Plugin uses `fetch` from its **main thread**.
- Auth: `?token=<token>` in the query string. **No Content-Type header** from the plugin; body = `JSON.stringify(obj)`.
- Responses are JSON with `Access-Control-Allow-Origin: null`. Server binds 127.0.0.1; Host must be `localhost`/`127.0.0.1`.
- Two tokens are valid on v4 routes: the **pair token** (plugin, trust-on-first-use) and the **CLI token**
  (`.claude/.bridge-token`, read by `mailbox.js`).

### Routes
| Route | Auth | Request | Response |
|---|---|---|---|
| `GET /health` | – | – | `{ok, app:"sap-v4-bridge", version:1, repo, branch, model, paired, busy, figma:{fileKey,fileName,lastSeen}\|null, runs, needToken, pendingApproval}` |
| `GET /pair` | Origin `null` | – | first time `{token}`; after that `409 {error:"already paired"}` |
| `GET /inbox?since=N&fileKey=&fileName=` | yes | – | long-poll ≤ 25 s → `{events:[…], cursor}`. Also the plugin heartbeat. |
| `POST /job` | yes | `{fileKey, fileName, text, selection:[{id,name,type,width,height}], image:{base64,mime,nodeId}\|null, mode:"claude"\|"agent"}` | `{jobId}` · `409` busy · `400` bad input |
| `GET /poll?runId=<jobId>&since=N` | yes | – | long-poll ≤ 25 s → `{events:[…], cursor}` |
| `POST /answer` | yes | `{jobId, text}` | `202` (only while the job asks) |
| `POST /job/logos-done` | yes | `{jobId, placed}` | `202` → the check starts |
| `POST /mbx/done` | yes | `{jobId, nodeId, WARN:[]}` | `202` → logos, then the check starts |
| `POST /mbx/push` | CLI | `{plan, ref:<repo path>\|null, fileKey?}` | `{jobId}` (agent-mode job, no plan run) |
| `GET /job/status?jobId=` | yes | – | `{jobId, phase, mode, stages:[…], result}` |
| `GET /job/last?fileKey=` | yes | – | the last job of that file (same shape) or `{}` |
| `POST /job/cancel` | yes | `{jobId}` | `202` |

Legacy SAP Agent v2 routes stay: `/run`, `/approve`, `/stream` (CLI token only).

### Events (`{seq, type, data, at}`)
| type | data | plugin does |
|---|---|---|
| `stage` | `{name, text}` — name ∈ route, plan, analyse, execute, logos, check, fix, done | show the stage line |
| `progress` | `{text}` | show the last line, small |
| `ask` | `{question}` | show the question + answer box; Go → `POST /answer` |
| `mailbox` | `{jobId, kind:"plan"\|"fix", job, parts:[…]\|null, fix:{…}\|null}` | write the file mailbox (below), tell the user to type `build plan` / `apply fixes` in the Figma Agent |
| `logos` | `{jobId, nodeId, items:[{element, file, base64}]}` | fill the frames named `element` inside `nodeId` with the image (`figma.createImage(figma.base64Decode(b64))`, scaleMode FILL), then `POST /job/logos-done` |
| `done` | `{jobId, nodeId, fileKey, url, mode, match, eye, WARN, pass, blocks}` | select + zoom to `nodeId`, show the scores |
| `error` | `{message}` | show it |

Inbox events (`/inbox`) are `mailbox` events of jobs pushed from the CLI; each carries its `jobId` so the
plugin then follows `/poll?runId=<jobId>`.

### Figma file mailbox (shared plugin data on `figma.root`, namespace `sapfiori`)
| Key | Writer | Value (JSON string) |
|---|---|---|
| `mbx_job` | plugin | `{jobId, kind:"plan", name, frame, parts:["A","B.1","B.2",…], logos:[element…], at}` |
| `mbx_part_<id>` | plugin | `{id, section:{id,name,describe,box,layout,sap,recipe}\|null, rows:[…]}` — each < 8 KB |
| `mbx_fix` | plugin | `{jobId, nodeId, round, lines:["<node id> · <element> · <change>", …]}` |
| `mbx_done` | Figma Agent | `{jobId, nodeId, WARN:[], round, at}` |

On a new plan job the plugin deletes old `mbx_part_*`, `mbx_fix`, `mbx_done`. It reads `mbx_done` every 2 s
and posts `/mbx/done` once per new `at`.

### Headless markers (lines Claude prints; the bridge reads them)
`STAGE <name> <text>` · `AGENT_ASK <question>` · `AGENT_PLAN_READY {"plan":"<job>/plan.json"}` (agent mode,
stop) · `AGENT_BUILT {"nodeId":"1:2"}` (claude mode, stop → logos → check) · `AGENT_FIX {"fixFile":"<job>/fix.md"}`
(agent mode, stop) · `AGENT_RESULT {"nodeId","mode","match","eye","WARN","pass","blocks"}` (end).

Job files live in `bridge-out/<jobId>/` (`request.json`, `ref.png`, `plan.json`, `plan.min.json`,
`logos/` + `logos/index.json`, `tree.json`, `geometry.json`, `build@2x.png`, `see-out/`, `fix.md`,
`result.json`). `bridge-out/` is git-ignored.

### Gates are measured by the bridge, not claimed by the model
After `AGENT_RESULT` (THINK/SPLIT jobs) the bridge itself runs `build/audit-plan.js` on `tree.json` and
`build/see.py diff` on `build@2x.png` (+ `geometry.json`). Only these numbers reach the plugin (`measured:
true`; the model's own numbers are kept as `claimed`). A failed gate sends Claude back with the measured
lines (`audit-bridge.txt`, `see-bridge/fix.md`) — up to `maxFixRounds`; in "Figma Agent builds" mode the lines
go to the mailbox as a fix job. Why: a headless run once reported EYE 97 for a build that measured EYE 9 %.

### Config (`bridge/config.json`)
`model` (default `opus` — an alias; the SAP gateway login rejects full ids such as `claude-opus-5-5`) ·
`maxFixRounds` 2 · `timeoutMin` 30 (per Claude step) · `agentWaitMin` 120 · `logosWaitSec` 120 (the plugin
needs < 1 s; env `SAP_BRIDGE_LOGOS_WAIT` overrides). Headless Claude gets a clean environment (HOME, USER,
PATH, locale) so it uses your own Claude login, never a parent session's short-lived token.

### Safety
Pairing is trust-on-first-use: the first `/pair` wins; `mailbox.js unpair` resets it. `/job` is one job at a
time. Headless Claude runs with an allow-list (no `bypassPermissions`), the request text is framed as data
inside a fixed SAP-only task, and the task never deletes nodes it did not create.

---

## Legacy: SAP Agent v2 (two-turn flow, `/run` + `/approve`)
The old "SAP Agent v2" plugin (other project) uses `/run` (read-only wireframe turn) and `/approve` (build
turn) with the CLI token printed at start. Kept unchanged for compatibility; not used by v4.
