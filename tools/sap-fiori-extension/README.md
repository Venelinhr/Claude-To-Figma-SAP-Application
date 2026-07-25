# SAP Fiori → LLM Chrome Extension

A Chrome Extension that solves the **403 Forbidden problem**: SAP Fiori guideline pages
block all programmatic HTTP fetches (bots, LLMs, `curl`). This extension runs *inside your
real browser session* where SAP already trusts you — so it reads everything.

## What It Does

- **One click** → extracts the full structured guideline from any SAP Fiori spec page
- Outputs **YAML frontmatter + Markdown** compatible with the project's 17-field `_schema.json`
- Captures: guidelines text, keyboard shortcuts tables, image alt-text descriptions,
  UI5 API links, related components, and component metadata (status, category, version)
- **Bulk mode**: append `?bulk_export=true` to any URL → auto-downloads the `.md` and
  closes the tab (process 400+ pages unattended)

## Install (Developer Mode — no store needed)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select this folder (`tools/sap-fiori-extension/`)
4. The SAP blue icon appears in your toolbar

## Usage

### Single page
1. Navigate to any SAP Fiori guideline page, e.g.:
   `https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/switch`
2. Click the extension icon
3. Click **Copy for Claude** → paste into Claude
   OR click **Download .md** → save as a file

### Bulk (400 pages)
1. Get your list of component URLs (e.g. from `build/refresh-guidelines.py --status`)
2. Append `?bulk_export=true` to each URL
3. Open all URLs with a "Bulk URL Opener" extension
4. Each tab extracts its content, downloads the `.md`, and closes automatically
5. Upload the folder of `.md` files to a Claude Project as Knowledge

## Output Format

```markdown
---
componentName: "Switch"
slug: "switch"
sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/switch"
status: "Available"
category: "Input and Selection"
version: "v1-148"
lastChecked: "2026-07-25"
---

# Switch

## Intro
The switch is a UI component used to toggle…

## When to Use
* Set a setting as active or inactive…

## Technical Implementation (API & Samples)
* **sap.m.Switch**: https://ui5.sap.com/#/entity/sap.m.Switch
* **Switch (API reference)**: https://ui5.sap.com/#/api/sap.m.Switch
```

## Demo: The 403 Problem + Solution

The Chrome DevTools AI session at
`devtools_do_you_see_any_informatioon_on_this_page_https_www_s.md`
demonstrates exactly why this is needed:

| Method | Result |
|---|---|
| `fetch("https://www.sap.com/design-system/…")` from LLM | **403 Forbidden — 0 bytes** |
| `curl https://www.sap.com/design-system/…` | **403 Forbidden** |
| This extension (runs in real browser) | **Full content — all sections** |

The extension is the correct injection point: it runs in the authenticated browser session,
not as a bot. SAP's `botDefinitions` config targets `bot, spider, crawler` — a real user
session with this extension is invisible to that filter.

## Integration with Project Pipeline

The `.md` files this extension produces can be:

1. **Pasted directly into Claude** for one-off guideline queries
2. **Uploaded to a Claude Project** as Knowledge (permanent guideline database)
3. **Fed into `build/refresh-guidelines.py`** — extend it to parse the YAML frontmatter
   and write the 17-field JSON into `knowledge/guidelines/`

The Chrome MCP (`chrome-devtools` in `~/.claude/settings.json`) uses the same browser-session
approach programmatically — this extension is the human-operated equivalent.
