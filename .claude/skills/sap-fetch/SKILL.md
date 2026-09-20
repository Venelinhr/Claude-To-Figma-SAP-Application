---
name: sap-fetch
description: Fetch SAP Fiori guidelines, API reference, or samples for any component. Checks the live SAP knowledge server first (source of truth) in parallel with the local cache, and flags any disagreement before a build proceeds. Falls back to local-only if the live server is unreachable. Returns structured Markdown ready to use. Invoke as /sap-fetch <ComponentName> — e.g. /sap-fetch Switch, /sap-fetch Button, /sap-fetch FilterBar.
---

# /sap-fetch — SAP Component Data Fetcher

## When to invoke

Auto-invoke (without user asking explicitly) whenever:
- User asks to build, fix, or validate a SAP Fiori screen and the component spec is not yet in context
- User says "fetch SAP guideline for X", "get the SAP spec for X", "read the SAP page for X", "what does SAP say about X"
- A build is about to start and no guideline was provided

Explicit invoke: `/sap-fetch <ComponentName>`

---

## Source of truth — live + legacy, in parallel

Follow `docs/TIER-FALLBACK.md` for the full contract. Summary: **both systems run,
every time.** The live server is checked before any build to confirm the legacy
data is still correct — not consulted only after the legacy path fails.

**Step 1 — always call the live server first:**
```
mcp__sap-design-cf-live__get_component_hub({ name: "<ComponentName>" })
```
One call. Returns the merged, live-fetched guideline + API + tokens + accessibility
+ `conflicts[]`, already resolved across sap.com/UI5/wiki sources. This is the
authority when it disagrees with anything local.

**Step 2 — also check the local/legacy cache (runs regardless of Step 1's result):**
```
mcp__sap-fiori-guidelines__getFioriGuideline({ componentName: "<Name>" })
```
The legacy system (`knowledge/guidelines/*.json`, `knowledge/components/registry/*.json`,
`mcp__sap-fiori-guidelines__*`, `mcp__sap-figma-community__*`) keeps running exactly
as before — nothing here is retired or bypassed. It stays the fast local path and
the whole system's fallback if the live server is ever unreachable.

**Step 3 — reconcile:**
- **Live reachable, both agree** → proceed, cite the live source (it's authoritative,
  but no correction was needed).
- **Live reachable, they disagree** → **the live server wins.** Surface the
  disagreement plainly (what the legacy cache said vs. what's actually live) before
  using the live value — never silently pick one, per `docs/TIER-FALLBACK.md`.
- **Live unreachable** → fall back to the legacy cache alone, notify the user once
  in one sentence, and stamp the output `⚠ UNVERIFIED — live source was
  unreachable` in the build handoff.

**The old raw-scrape steps are retired**, not the legacy cache. Previously this
skill's Steps 3–4 drove Chrome DevTools by hand (`navigate_page` + DOM scraping of
sap.com, plus a raw `fetch()` against `ui5.sap.com/test-resources/.../api.json`)
as its *only* live check. `get_component_hub` already returns everything those
steps existed to produce — live, merged, in one call, without the brittleness of
scraping a page's DOM by hand — so they're no longer needed. The legacy *cache*
(Step 2 above) is untouched and still runs every time.

---

## Output format

```markdown
## [ComponentName] — SAP Fiori Specification

**Live source:** sap-design-cf-live — [checked | unreachable]
**Legacy cache:** [agrees | disagrees — see below | not checked]
**Status:** Available | Deprecated
**Available Since:** [version, from the live hub response]

### Design Guidelines
[guideline content from get_component_hub / get_live_guideline]

### API Reference
[properties/events from get_component_hub's merged API section]

### Conflicts / drift (if any)
[live hub's conflicts[] array AND/OR any live-vs-legacy disagreement found in
Step 3, verbatim — never silently resolved]

### Links
[sources[] URLs from the live hub response]
```

---

## Error handling

- **Live call fails** → follow `docs/TIER-FALLBACK.md`: notify once, use the legacy cache automatically, stamp UNVERIFIED. No open-ended retry loop.
- **Legacy cache missing/stale but live succeeds** → proceed on live alone, note the legacy cache should be refreshed (see `sap-registry-update`).
- **Component not found even in the live hub** → say so plainly, try `search_knowledge(query)` for a fuzzy/misspelled match. Never invent a plausible-sounding component.
- **Both fail** → report the component cannot currently be verified; ask the user how to proceed rather than guessing.

---

## Examples

```
/sap-fetch Switch
→ Checks live hub + legacy cache in parallel. If legacy still says
  customTextOn/customTextOff and live confirms textOn/textOff for Web Components,
  the disagreement is surfaced and live wins.

/sap-fetch FilterBar
→ get_component_hub("FilterBar") — no slug table needed, the hub resolves the name.
  Legacy cache checked alongside it.

/sap-fetch Button
→ Live kit variant values (Primary/Secondary/Accept/Reject/Attention/Tertiary)
  confirmed against whatever the legacy registry currently has on file.
```
