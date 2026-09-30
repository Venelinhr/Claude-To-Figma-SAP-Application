# Make link → SAP frame: copy the link, paste it, done (no extension)

## Context

Today the user must run a browser extension (or a console script) to copy the running app. The user wants one gesture:
**copy the Make link → paste it in the SAP Bridge plugin (or the Figma Agent chat) → SAP frame.**

**What I verified (read-only):**
- The plugin can call only `http://localhost:41778` (manifest `allowedDomains: ["none"]`, `devAllowedDomains: localhost:41778`). It cannot open the app itself, and a hidden iframe cannot be read across origins. So a helper on the Mac must open the link. The always-on **bridge** (`bridge/server.js`, already running, plugin already shows "Connected") is that helper.
- The bridge has **no** Make route and spawns **no** Chrome. `build/make-fetch.js` (headless Chrome over the DevTools protocol, no install) exists but is **untested** and unwired. Its header comment claims a `POST /make/fetch` route that does not exist.
- Figma's REST API cannot read Make files. Only the Figma MCP `get_design_context` returns Make **source code**, and only for a logged-in reader. Source code has no measured boxes, so it cannot replace a rendered app.
- A published site (`*.figma.site`) serves the built app to anyone. The editor link (`figma.com/make/<key>/…`) shows the app inside a cross-origin iframe (`app-<hash>.makeproxy-c.figma.site`) and needs a Figma login.
- The Figma Agent chat cannot run JavaScript or fetch a page. Its skill (`.claude/skills/sap-figma-agent/SKILL.md`) has no tree mode.

**Not verified (I could not fetch the page in this session):** whether the `makeproxy-c` URL opens without a login. This decides everything, so it is Step 0.

## Step 0 — one 30-second test by the user (decides the route)

Open the `…makeproxy-c.figma.site/` address in a **private (incognito) Chrome window**.
- App shows → the link is public → **Route 1 works for the editor link too** (the plugin reads the iframe address, opens it headless).
- Login page or blank → headless Chrome cannot open it. The editor link is then **not possible without a login**. Route 1 works only with a published `*.figma.site` link. (I will not copy Chrome cookies or read the Keychain: that is a security risk.)

## Route 1 (main): paste the link in the plugin

```
 user copies link ──Cmd+V──▶ SAP Bridge plugin (Make → SAP card)
                                 │ looks like a URL? → link mode (a copied dump is still accepted)
                                 ▼  code.js api() POST /make/fetch {url}
                              bridge (localhost:41778, token-checked)
                                 │ allow-list: https + *.figma.site / makeproxy / figma.com/make
                                 ▼  build/make-fetch.js  (headless Chrome, temp profile, 1440×900)
                              wait for SAPUI5 → run make-probe.browser.js → dump (JSON)
                                 ▼  GET /make/job?id  (poll every 2 s, 15–40 s)
                              plugin: makeBuild(dump)  ← the same converter + RUN_TREE as today
                                 ▼
                              SAP frame in the file (+ WARN list, "Show in canvas")
```

Plugin card after the change:
```
┌ MAKE → SAP ─────────────────────────────┐
│ Paste a Make link (Cmd+V) — or a copied │
│ design.                                 │
│ Opening the app… 12 s                   │
│ [ Show in canvas ]                      │
└─────────────────────────────────────────┘
```

**Layers (what changes):** plugin UI → plugin code → bridge route → headless-Chrome fetch → existing converter and builder (unchanged).

**Files to change (small):**
1. `build/make-fetch.js` — fix and test. If the top page is figma.com/make, read the `iframe[src*=makeproxy]` address and `Page.navigate` to it (no `setAutoAttach` needed). Give a clear error for login pages ("This link needs a login. Publish and paste the *.figma.site link."). Return the dump. Fix the stale header comment.
2. `bridge/server.js` — add `POST /make/fetch` (start job, return id) and `GET /make/job` (status + dump). Reuse the existing job and token pattern (`/job`, `authOf`). Add the host allow-list, one job at a time, 90 s timeout, kill Chrome in `finally`.
3. `plugin/sap-bridge/code.js` — new message `make-link`: call the route, poll, then call the existing `makeBuild(dump)`; show progress through the existing `makeSay`. If the bridge is offline (`status 0`), say so and how to start it (`node build/mailbox.js ensure`).
4. `plugin/sap-bridge/ui.html` — paste handler: if the clipboard text is a URL (`^https://`), post `make-link` (today only `looksLikeDump` is handled, lines ~786–796). No manifest change.
5. `docs/MAKE-TO-FIGMA.md` and `CLAUDE.md` (one line): the link is now the main way; the extension is the fallback.
6. Tests: a unit test for the URL allow-list and for the job state machine (stubbed fetch); a fixture test that `make-fetch` returns the same dump shape (`{origin, controls, vars, imageData}`).

**Reuse, do not rewrite:** `make-probe.browser.js` (`cfg.ret`), `make-convert.js`, `make-verify.js`, `makeBuild` in `code.js`, the bridge job and token code.

## Route 2 (Agent chat): honest verdict

The Agent chat cannot open a link, so **"paste the link in the Agent chat" cannot build the frame**. Two things it can do:
- **Edits after the build** (already works): "make Suchen secondary".
- **Build from a pasted tree**: `make-to-figma.js` `agentPrompt` makes a ~19 KB prompt. Whether the chat accepts it is **untested**.

Step 0b, a 2-minute user test: paste a small tree prompt in the Agent chat and see if it builds. If yes, add a plugin button **"Copy for Agent"** (uses the existing tree and prompt). If no, drop it. Lower quality than Route 1, so it stays a fallback.

## Rejected (and why)

- **Hidden iframe in the plugin**: cross-origin, cannot read the app.
- **Read the Make source and re-run it**: needs a TSX build (no installs allowed); no measured boxes without rendering. Too fragile.
- **Copy-design paste decoder**: no control types (358 frames, 0 instances); a guessing recogniser.
- **Use the user's Chrome login or cookies**: security risk; not doing it.

## Risks (plain)

- Editor links may need a login (Step 0 decides). Then only published links work.
- Headless Chrome launch was blocked by the auto-mode classifier in Claude's shell. The **bridge** (the user's own process) launches it. I test by asking the user to run `node build/make-fetch.js <url> out.json` in their terminal.
- The bridge must be restarted after `server.js` changes. The plugin must be closed and reopened after `code.js` changes (`node build/plugin-bundle.js` first).
- The capture size is the headless window (1440×900), not the user's window. Fine for XL; a width choice can come later.
- SSRF: the allow-list keeps the bridge from fetching arbitrary addresses.
- Stay on the current git branch. Do not switch branches or stash.

## Verification

1. Step 0 and 0b results written down before any code.
2. `node build/make-fetch.js <published or makeproxy url> /tmp/d.json` (user's terminal) → "N controls · KB".
3. `node build/make-verify.js /tmp/d.json` → STRUCTURE ≥ 97 %, GROSS 0; `node build/door.js` → ALL IN.
4. In Figma: paste the link in SAP Bridge → frame in under 60 s. Compare with the extension build of the same app (same layer count ± text lines).
5. `node --test test/*.test.js`, `node build/plugin-bundle.js --check`.
6. Test the two failure paths: a login-page link (clear message) and the bridge stopped (clear message).
