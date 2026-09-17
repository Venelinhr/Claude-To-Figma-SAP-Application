# knowledge/schemas/  — ⛔ DEPRECATED / DARK, DO NOT USE

**Declared dead in `docs/PHASE2-CONSOLIDATION-2026-07-09.md` (Round 1, item 1): "The legacy
`knowledge/schemas/` folder (40 partial files) is now dark; `knowledge/components/registry/`
(152 files, 100% enriched) is authoritative."**

- `build/validate-spec.js` does **not** read anything in this directory (verified 2026-09-14 —
  zero references to `knowledge/schemas` in that file or anywhere else in `build/`). The line
  below claiming it enforces the registry gate from here is **false** and kept only as a record
  of the old (pre-2026-07-09) intent.
- The per-component files here also **actively disagree** with the real source of truth. Example:
  `Button.json` in this folder lists `type` enum values `Default/Emphasized/Accept/Reject/
  Transparent/Back/Up/Navigation` — raw UI5 API vocabulary. `knowledge/components/registry/
  Button.json` explicitly documents that `Emphasized`/`Transparent`/`Default` are **NOT** valid
  SAP Web UI Kit variant values and must never be set via `setProperties`; the real kit values are
  `Primary/Secondary/Accept/Reject/Attention/Tertiary`. Reading this folder for variant truth will
  produce a build that 404s or sets an invalid property.

**Use `knowledge/components/registry/{Component}.json` instead for everything in this folder.**

This directory is kept only for historical/regression-test reference (see
`expected-output-schema.json`, used by old test fixtures if any still exist) and should not be
read by any build, skill, or agent going forward.

<details>
<summary>Original (stale) contents description — do not treat as current</summary>

JSON schemas for spec validation. Each file defines the allowed structure and properties for a
specific SAP UI5 component when used in a JSON spec.

| Schema file | Purpose (as originally intended, now unused) |
|-------------|-------------|
| `component_spec.schema.json` | Root schema for the full spec document |
| `componentspec-schema.json` | Alternative spec schema (legacy path) |
| `expected-output-schema.json` | Schema for regression test expected outputs |
| `Button.json`, `Input.json`, `Select.json`… | Per-component property schemas (UI5 vocabulary — wrong for Figma kit builds) |

</details>
