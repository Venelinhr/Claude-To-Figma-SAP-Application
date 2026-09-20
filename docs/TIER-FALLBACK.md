# Live-check contract — SAP component/token/variant lookups

Single source of truth for how any skill resolves SAP component data. Referenced
by `sap-fetch`, `sap-figma-agent`, `sap-screen`, and `sap-fix` — never restated
in those files. Edit here only.

## The two systems — both run, every time, in parallel

This is **not** a primary-with-fallback design where the legacy system only
gets consulted on failure. Both systems run on every lookup:

**Live: `sap-design-cf-live`**
The live SAP-hosted MCP server (`https://sap-design-mcp.cfapps.us10-001.hana.ondemand.com/mcp`,
registered in this project's `.mcp.json`). Fetches sap.com/UI5/tokens live at call
time, merges wiki + accessibility + token-conflict data. **This is the source of
truth used to CONFIRM the legacy data is still correct before a build proceeds** —
checked up front, not consulted only after something goes wrong locally.

**Legacy: local registry + local MCP servers**
`knowledge/components/registry/*.json`, `mcp__sap-fiori-guidelines__*`,
`mcp__sap-figma-community__*` — unchanged, kept fully functional, runs in
parallel with the live check on every lookup. This is not a deprecated
leftover — it's the fast local path and the system's fallback if the live
server is ever unreachable.

## The routine

1. Call a live tool (e.g. `get_component_hub(name)`, `get_design_spec(name)`)
   **and** the equivalent legacy tool/registry lookup — both, every time.
2. **Live reachable, both agree** → proceed. Cite the live source as
   confirming authority, but no correction was needed.
3. **Live reachable, they disagree** → **the live server wins, always.**
   Surface the disagreement plainly — what the legacy side said vs. what the
   live side actually says — before using the live value. Never silently
   pick one side. This is the literal fix for "no guessing, no diff,
   no unclear info."
4. **Live unreachable** (network error, timeout, non-2xx, explicit tool
   error) →
   a. Tell the user, once, in one plain sentence — e.g. "Live SAP source
      unreachable, proceeding on local cache alone." Never a silent retry
      loop, never more than one notice per build.
   b. Proceed using the legacy result alone — this is a working fallback,
      not a judgment call requiring user confirmation to continue.
   c. Stamp every output produced this way with **`⚠ UNVERIFIED — live
      source was unreachable, built from local cache alone`** in the build
      handoff, in the same place the validated node URL + Bind reminder
      already goes. Never presented as equivalent to a live-confirmed result.

## Which tool to call for which question

| Question | Live tool | Legacy (runs in parallel) |
|---|---|---|
| "What does this component's guideline/API say?" | `get_component_hub(name)` | `mcp__sap-fiori-guidelines__getFioriGuideline` |
| "What variant properties can I actually set?" | `get_design_spec(name)` | registry JSON `supportedVariants`/`supportedProperties` |
| "Is my planned registry value still correct?" | `get_component_hub(name)` → check `conflicts[]` | the registry value being checked |
| "Exact current token hex?" | `get_tokens_for(component)` / `resolve_component_token` | `knowledge/guidelines/horizon-variable-keys.json` via `SAP_BUILD_MANIFEST.md` §4 |

## Hard rule inherited from the live server (its own `CLAUDE.md` §0.5)

Direct tool calls only. Never spawn a subagent to make a live lookup —
measured 1.9x–11x cost blowup for identical results, and the server is
rate-limited (60 req/min), so parallel agents make it slower, not faster.
A long prompt with multiple components to look up is still direct calls,
batched — not one agent per component. (This applies to the live calls only;
the legacy/local lookups have no such rate limit.)
