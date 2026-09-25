---
name: sap-registry-update
description: Update a SAP component registry entry — edit the JSON, rebuild the bundle, run regression tests, and report the result. Use when fixing a variant property name, adding a slot, correcting a token, or any registry maintenance.
---

You are maintaining the SAP Figma Design Agent registry at:
`~/Downloads/Task to Figma SAP layouts components/`

## When invoked

The user will provide: a component name and what to change (e.g. "fix ObjectStatus Semantic property" or "add slotNames to FilterBar").

## Steps

1. **Read** `knowledge/components/registry/{ComponentName}.json`
2. **Apply the change** — follow these rules:
   - Variant property names must match live SAP Web UI Kit (check `knowledge/guidelines/component-property-reference.json`)
   - Token names must be in MANDATORY_TOKENS (check `SAP_BUILD_MANIFEST.md` §4 — the token source. NEVER read `code.js`.)
   - Update `lastValidated` to today's date
3. **Rebuild**: run `node build/build-registry-bundle.js`
   - Confirm output shows `0 inconsistencies` and `SAP_KEYS duplicates: 0`
4. **Test**: run `bash build/test-build.sh`
   - Must show `0 fail`. If any fail, diagnose and fix before proceeding.
5. **Report**:
   - What changed (before / after)
   - Build output summary
   - Test result
   - Remind user to re-import the plugin in Figma to pick up the bundle change

## Hard rules
- Never edit `code.bundled.js` or `registry-bundle.js` directly — they are generated
- Never invent token names — only use names from MANDATORY_TOKENS
- Never invent variant property names — verify against `component-property-reference.json` or live kit
