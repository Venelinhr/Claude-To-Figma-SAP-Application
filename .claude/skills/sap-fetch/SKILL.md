---
name: sap-fetch
description: Fetch SAP Fiori guidelines, API reference, or samples for any component. Checks local cache first (instant), falls back to live Chrome MCP fetch if stale. Returns structured Markdown ready to use. Invoke as /sap-fetch <ComponentName> — e.g. /sap-fetch Switch, /sap-fetch Button, /sap-fetch FilterBar.
---

# /sap-fetch — SAP Component Data Fetcher

## When to invoke

Auto-invoke (without user asking explicitly) whenever:
- User asks to build, fix, or validate a SAP Fiori screen and the component spec is not yet in context
- User says "fetch SAP guideline for X", "get the SAP spec for X", "read the SAP page for X", "what does SAP say about X"
- A build is about to start and no guideline was provided

Explicit invoke: `/sap-fetch <ComponentName>`

---

## 4-Step Pipeline

### Step 1 — Check local cache (always first, <10ms)

```
mcp__sap-fiori-guidelines__getFioriGuideline({ componentName: "<Name>" })
```

- If result exists and `lastChecked` is within 7 days → **use it, skip to output**
- If missing or stale → proceed to Step 2

### Step 2 — Resolve slug

Use this lookup table for known slug variations:

| Component name | URL slug |
|---|---|
| FilterBar | filter-bar |
| Table | responsive-table |
| TableCell | responsive-table |
| ProgressStep | wizard |
| ShellBar | shell-bar |
| OverflowToolbar | toolbar-overflow |
| DynamicPage | dynamicpage |
| IconTabBar | icontabbar |
| ObjectPage | object-page |
| MessageBox | message-box |
| MessageStrip | messagestrip |

For all others: lowercase the component name (e.g. `Switch` → `switch`, `Button` → `button`).

### Step 3 — Fetch guideline via Chrome MCP

```
navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/{slug}")
wait_for(["When to Use", "Anatomy", "Intro"])
evaluate_script(async () => {
  // Use extension extractor if available (window.__sapFetch exposed by the Chrome Extension)
  if (typeof window.__sapFetch === 'function') {
    const result = await window.__sapFetch();
    return result?.doc || null;
  }
  // Fallback: inline extraction
  const main = document.querySelector('main#main');
  if (!main) return null;
  const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content?.trim() || '';
  return {
    title: document.querySelector('h1')?.innerText?.trim() || document.title,
    status: getMeta('uielementsstatus'),
    category: getMeta('uielementscategory'),
    content: main.innerText,
    apiLinks: Array.from(new Set(Array.from(main.querySelectorAll('a[href*="ui5.sap.com"]')).map(a => a.href)))
  };
})
```

### Step 4 — Fetch API reference (JSON endpoint, no navigation needed)

Run this **in parallel with or after Step 3** — it does not require navigation:

```
evaluate_script(async () => {
  const lib = 'sap/m'; // adjust for sap.f.*, sap.uxap.* etc.
  const res = await fetch(`https://ui5.sap.com/test-resources/${lib}/designtime/apiref/api.json`);
  const json = await res.json();
  const sym = json.symbols.find(s => s.name === 'sap.m.{ComponentName}');
  if (!sym) return null;
  const meta = sym['ui5-metadata'] || {};
  return {
    description: sym.description?.replace(/<[^>]+>/g, '').trim(),
    availableSince: sym.since || '',
    properties: (meta.properties || []).filter(p => p.visibility === 'public').map(p => ({
      name: p.name,
      type: p.typeInfo?.template || p.type || '',
      default: String(p.defaultValue ?? ''),
      since: p.since || '',
      desc: p.description?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 150)
    })),
    events: (sym.events || []).filter(e => !e.borrowedFrom).map(e => ({
      name: e.name,
      desc: e.description?.replace(/<[^>]+>/g, '').trim().slice(0, 120)
    })),
    uxGuidelinesLink: sym.uxGuidelinesLink || ''
  };
})
```

**Library mapping** (for the `lib` variable above):

| Component prefix | lib path |
|---|---|
| sap.m.* | sap/m |
| sap.f.* | sap/f |
| sap.uxap.* | sap/uxap |
| sap.ui.table.* | sap/ui/table |

---

## Output format

Combine Step 3 + Step 4 into one structured response:

```markdown
## [ComponentName] — SAP Fiori Specification

**Source:** [guideline URL]
**Status:** Available | Deprecated
**Category:** [category]
**Available Since:** [version]
**API:** sap.m.[ComponentName]

### Design Guidelines
[guideline content from Step 3]

### API Reference

#### Properties
| Property | Type | Default | Since | Description |
| --- | --- | --- | --- | --- |
[properties from Step 4]

#### Events
| Event | Description |
| --- | --- |
[events from Step 4]

### Links
* [Guideline](https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/{slug})
* [API Reference](https://ui5.sap.com/#/api/sap.m.{ComponentName})
* [Samples](https://ui5.sap.com/#/entity/sap.m.{ComponentName})
```

---

## Error handling

- **404 on guideline URL** → try alternate slug (e.g. try without hyphens, then with)
- **Chrome MCP not available** → use local cache only, note it may be stale
- **JSON API returns nothing** → check if component is in `sap.f` or `sap.uxap` instead of `sap.m`
- **Both fail** → return what's in local cache with a staleness warning

---

## Examples

```
/sap-fetch Switch
→ Returns Switch guideline (types, accessibility, keyboard nav) + API (state, type, customTextOn/Off properties, change event)

/sap-fetch FilterBar
→ Resolves slug to filter-bar, returns FilterBar design guidelines + API

/sap-fetch Button
→ Returns full Button spec: 4 types, priority/emphasis rules, all properties (type, icon, text, enabled...), press event
```
