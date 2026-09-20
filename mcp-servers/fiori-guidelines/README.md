# SAP Fiori Guidelines MCP Server

**MCP server exposing the local SAP Fiori Design Guidelines cache as runnable tools.**

Wraps the JSON cache at `knowledge/guidelines/*.json` and exposes 5 tools via stdio MCP transport.
The server loads whatever `*.json` files exist in that directory at startup (no hardcoded count),
so this count reflects disk state, not server logic — verify with `listComponents` if in doubt.

---

## Status

- **Installed**: ✓ Registered with Claude Code as `sap-fiori-guidelines`
- **Connected**: ✓ Health check passes
- **Cache**: 154 components loaded (verified 2026-09-14; was stale at "28/28 Group A" since 2026-06-25 — the cache grew well past the original Group A launch set)
- **Tools**: 5 exposed

## Tools

| Tool | Input | Output |
|---|---|---|
| `getFioriGuideline` | `{ componentName }` | Full cached guideline JSON for one component |
| `refreshGuideline` | `{ componentName }` | Instructions for re-fetching from SAP source |
| `searchGuidelines` | `{ query }` | Top 10 fuzzy matches across all entries (ranked) |
| `getPattern` | `{ patternName }` | All components participating in a UX pattern |
| `listComponents` | `{}` | All cached component names (154 as of 2026-09-14) + last-checked dates |

## Architecture

```
mcp-servers/fiori-guidelines/
├── package.json       — npm metadata; @modelcontextprotocol/sdk dependency
├── server.js          — stdio MCP server (Node ESM)
├── node_modules/      — installed deps
└── README.md          — this file

../../knowledge/guidelines/
├── _schema.json       — JSON Schema for entries
├── README.md          — cache documentation
├── Button.json        — guideline cache (one per component)
├── IconTabBar.json
├── Input.json
└── …154 total entries (2026-09-14)
```

## How it works

1. On startup, server loads all `*.json` files (except `_schema.json`) from `knowledge/guidelines/`
2. Caches them in memory by `componentName`
3. Exposes tools via stdio MCP transport
4. stdout = MCP protocol; stderr = startup/error logs

## Run manually

```bash
cd mcp-servers/fiori-guidelines
node server.js
# logs to stderr:
# [sap-fiori-guidelines-mcp] Started. Cache: /…/knowledge/guidelines
# [sap-fiori-guidelines-mcp] Loaded 28 component guidelines.
```

Then send JSON-RPC requests via stdin.

## Run with Claude Code

Already registered. From any Claude Code session:

```
Use the sap-fiori-guidelines MCP to look up the Fiori design guideline for ShellBar.
```

Claude will call `getFioriGuideline({ componentName: 'ShellBar' })` and receive the full cached entry — purpose, when-to-use, do/don't, accessibility, etc.

## Example tool calls

### getFioriGuideline

```json
{"name":"getFioriGuideline","arguments":{"componentName":"IconTabBar"}}
```

Returns full JSON: purpose, whenToUse, whenNotToUse, do/don't, layout, content, responsive, accessibility, patterns, compatibility, exceptions.

### searchGuidelines

```json
{"name":"searchGuidelines","arguments":{"query":"toolbar"}}
```

Returns top 10 components mentioning "toolbar" in name, purpose, rules, or patterns — ranked by relevance.

### getPattern

```json
{"name":"getPattern","arguments":{"patternName":"Object Page"}}
```

Returns all components that participate in the Object Page pattern (DynamicPage, DynamicPageTitle, DynamicPageHeader, ObjectPageLayout, IconTabBar, …).

### listComponents

```json
{"name":"listComponents","arguments":{}}
```

Returns the 28 component names with their `lastChecked` dates.

## How it differs from `chrome-devtools-mcp`

| Aspect | sap-fiori-guidelines | chrome-devtools-mcp |
|---|---|---|
| Source | Local JSON cache (fast, offline) | Live web pages (slow, requires Chrome) |
| Refresh | Manual via `refreshGuideline` | Automatic per-call |
| Use case | AI design layer queries during spec generation | One-off scraping or visual inspection |
| Latency | <10ms | 1–5 seconds |

Use `sap-fiori-guidelines` for the design pipeline; use `chrome-devtools-mcp` only when refreshing the cache or scraping new components.

## Updating the cache

The server reads from disk on startup — restart it after changing cache files:

1. Edit or add files in `knowledge/guidelines/{Component}.json`
2. Validate against `knowledge/guidelines/_schema.json`
3. Restart the MCP host (Claude Code) — server reloads

## Adding new components

To add a Group B or custom component:

1. Fetch the guideline from `https://experience.sap.com/fiori-design-web/{slug}/`
2. Map content into the `_schema.json` structure
3. Write `knowledge/guidelines/{ComponentName}.json`
4. Restart Claude Code → server picks up the new file

---

## Removal

```bash
claude mcp remove sap-fiori-guidelines
```

---

Generated 2026-06-25. Server version 0.1.0. Cache version: schema v1.
