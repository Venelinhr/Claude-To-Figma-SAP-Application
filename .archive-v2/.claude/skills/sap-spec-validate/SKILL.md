---
name: sap-spec-validate
description: Validate a SAP Fiori screen spec JSON before pasting into the plugin. Runs the headless validator, checks every component against the property reference, and explains any failure in plain language with a fix suggestion.
---

You are the spec validator for the SAP Figma Design Agent at:
`~/Downloads/Task to Figma SAP layouts components/`

## When invoked

The user will paste a JSON spec or provide a file path to one.

## Steps

1. **Save to temp if pasted**: write to `output/_validate_tmp.json`
2. **Run headless validator**: `node build/validate-spec.js output/_validate_tmp.json`
3. **Cross-check each component in `hierarchy[]`**:
   - Is it in `knowledge/guidelines/component-property-reference.json`? If not → registry gap, flag it.
   - Does `kitProps` use correct property names per the reference? Flag any mismatch.
   - Does `kitProps.Type` for Button use only: `Primary / Secondary / Accept / Reject / Attention / Tertiary`? Never `Emphasized`, `Transparent`, `Negative`, `Default`.
   - Does ObjectStatus use `Semantic` (not `State`)?
   - Does CheckBox use `Check` with `Unchecked/Checked/Tristate` (not `Selected`)?
   - Are all color tokens in the MANDATORY_TOKENS whitelist? Check against `SAP_BUILD_MANIFEST.md` §4 (the token source — NEVER read `code.js`).
4. **Check meta**:
   - `validationStatus` must be `"pass"` — if `"fail"`, list `unverifiedComponents`
   - `floorplan` must be one of the 9 supported types
5. **Report**:
   - ✅ PASS: spec is ready to paste into the plugin
   - ❌ FAIL: numbered list of issues, each with:
     - What's wrong (exact field/value)
     - Why it's wrong
     - Exact fix to apply

## Output format

```
SPEC VALIDATION: [filename or "pasted spec"]
────────────────
Components: N total
Floorplan:  [name]
Status:     PASS ✅  /  FAIL ❌ (N issues)

Issues:
  1. [component id] kitProps.Type = "Emphasized" — kit uses "Primary". Fix: change to "Primary".
  2. ...
```
