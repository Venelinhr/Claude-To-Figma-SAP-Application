# SAP Invariant Architecture — From Guidance to Enforcement

**Status:** Redesign specification · 2026-07-18
**Author:** Forensic synthesis of 40 CONFIRMED findings
**Supersedes (enforcement model of):** RULE 1–31 as prose · guard-reuse-gate.sh as the only real gate

---

## The one-sentence thesis

> The pipeline produces non-SAP output because **the build always ends `type:'success'` and no gate ever consumes the real built frame.** Every rule is *guidance* a model can forget; this document converts the five that matter into *invariants* a machine enforces. An invariant cannot be forgotten — the build either satisfies it or FAILS.

Guidance says "use SAP components." Instructions get dropped under load.
An invariant says **"0 native frames outside the allowlist — proven by a tree walk that exits 2 otherwise."** That cannot be dropped.

---

## 1. ROOT CAUSE

**The single earliest wrong decision:** the system was designed so that *build success is self-declared by the builder, and every quality rule is advisory prose checked (if at all) against the SPEC or a self-attested MARKER — never against the actual frame that was produced in Figma.**

Concretely, this one decision cascades into inevitability:

- The plugin's bind handler **always** posts `type:'success'` (code.js:1450) with violations folded in as *counts* (`rawFills`, `typoFails`, fallback metrics) — there is **no error branch**. A screen that is 100% raw hex still "succeeds."
- `applyFill` (code.js:891–919), on a failed variable link or disconnected library, **writes a raw-RGB fallback fill and increments a metric** instead of aborting. The disconnected-library case was *designed* to degrade silently.
- The only PreToolUse gate on `use_figma` (`guard-reuse-gate.sh`) validates a **self-typed marker** (`.reuse-declared`) for internal consistency — it never recomputes the score, never inspects the code, and whitelists `createFrame` as a valid "build." A 100%-native-frame Level-5 wireframe passes with zero warnings.
- The one detector that would catch native-frame substitution (`lint-instance-ratio.js`) is an **orphan** — wired to no hook, no test.
- Both Stop-hook linters (`lint-on-stop.sh`) run only against `output/*-spec.json`, which **the default MCP-first path never produces**, and even then only *remind*, never block.

Because nothing ever reads the produced frame and returns a hard fail, **non-SAP output is not a bug — it is the designed default outcome.** Everything below exists to reverse exactly this: *the truth of a build is the frame tree, and one gate must read it and be allowed to say FAIL.*

---

## 2. THE 5 BUILD INVARIANTS

Each invariant has three parts: **the statement** (what must always be true), **the check** (the automated code that proves it against the *real frame tree*, not the spec or a marker), and **the failure action** (fail-closed — exit non-zero, no silent fallback).

All five checks run inside one new post-build script, **`build/verify-invariants.js`**, which ingests a serialized frame dump (`output/<node>-tree.json`) produced by a `use_figma` walk of `root.findAll(() => true)`. The script emits `output/<node>-verify.json` with a per-node verdict and a top-level `overallPass`. Any single FAIL sets `overallPass:false` and exits 2. **There is no ratio, no "warnings only," no partial credit.**

---

### INVARIANT 1 — Zero native frames outside the allowlist

**Statement.** Every visible node is exactly one of: (a) a real SAP kit `INSTANCE` whose main component resolves to kit file `SILcWzK5uFghKun9jx6D7c`, (b) an allowlisted layout container (`PASS_CONTAINER`), or (c) an allowlisted primitive (`PASS_PRIMITIVE_EXCEPTION`). A `FRAME`/`RECTANGLE`/`TEXT` standing in for a component is a hard FAIL. There is no ratio — **one fake component fails the build.**

**Check.** `verify-invariants.js` walks `findAll(() => true)`, asserts `visitedCount === findAll().length` (INV-1: total node coverage, none skipped), and assigns every visible node exactly one verdict:
- `INSTANCE` → assert `getMainComponentAsync()` (serialized as `mainComponentKey` in the dump) resolves into the kit key set → `PASS_INSTANCE`; null/local/foreign → `FAIL_DETACH_OR_FOREIGN`.
- `FRAME` with `layoutMode !== 'NONE'` AND ≥1 child AND a semantic L2/L3 name matching `layer-naming.json` AND no self-owned SAP-role content AND not a spacer → `PASS_CONTAINER`.
- Any node whose name/type matches `build/primitive-exceptions.json` exactly → `PASS_PRIMITIVE_EXCEPTION`.
- Everything else, especially a `FRAME`/`RECT` whose name matches a SAP component name → `FAIL_FAKE_COMPONENT`.

**Failure action.** Any `FAIL_*` → `overallPass:false`, exit 2. The PreToolUse code-semantics hook (§4) additionally blocks *before* the build if `createFrame` count > 0 while instance-creation calls == 0, or if a `createFrame` name matches a SAP component name.

*(Kills F1, F4-detach, L3-01, INV-1/2/3/6, F8-registry-allowlist.)*

---

### INVARIANT 2 — Zero raw hex (every fill/stroke is a bound SAP variable)

**Statement.** Every visible `SOLID` fill and stroke on every non-instance node has `boundVariables.color` pointing at a SAP Horizon variable. Zero unbound fills. Zero off-whitelist hex.

**Check.** In the same walk, for each non-`INSTANCE` node with a visible `SOLID` paint (fill or stroke): assert `paint.boundVariables?.color` is present (INV-4). The dump serializes `fills[].boundVariables` and `fillHex`. Reuse `lint-mcp-frame.js` check 6, but **promoted from `warnings.push` to `errors.push`**: an untagged/off-whitelist hex is an error, not a warning.

**Failure action.** Any unbound visible fill/stroke → exit 2. In the plugin, `applyFill` is changed to **throw** (not fallback-and-count) when a variable link fails; the bind handler aborts with `type:'error'` when the library variable index is empty (0 collections) — see INVARIANT 5.

*(Kills F5-raw-hex-frame, F6-silent-token-fallback, INV-4.)*

---

### INVARIANT 3 — Zero non-SAP typography

**Statement.** Every `TEXT` node uses font family `72` AND carries a `[typo:role]` tag naming a valid `SAP_TYPOGRAPHY` role whose size matches the role scale (±1px). A missing tag, wrong family, or size mismatch is a FAIL.

**Check.** In the walk, for each `TEXT` node: assert `fontName.family === '72'`, assert `[typo:<role>]` present in the name, assert the role exists in the typography registry, assert `fontSize` matches the role's canonical size ±1px (INV-5). This closes the gap where an *untagged* TEXT node was never flagged and off-scale sizes were recorded as non-fatal.

**Failure action.** Any TEXT failing any clause → exit 2. In the plugin, `typoFails > 0` is promoted from a success-string count to a **blocking** result.

*(Kills F3-raw-font, INV-5.)*

---

### INVARIANT 4 — Clone-first when a canonical exists

**Statement.** If `score-canonical.js` (recomputed at gate time, not read from the marker) returns a top match ≥ its Level-1 threshold, the build **must** be a clone of that canonical (`.clone(` present, provenance stamped), and the built frame must carry `basedOnCanonical:"<figNode>"`. Declaring Level 5 while a canonical scores ≥60 is forbidden.

**Check.** Two-stage.
- *Pre-build (PreToolUse `guard-reuse-gate.sh`, rewritten):* recompute the score by running `score-canonical.js` from the marker's declared `floorplan`/`regions`/`components`; **reject if the declared level disagrees with the computed top match.** Require the marker to carry `topMatches` output as proof the search ran. For declared Level 1–4, require the code contain `.clone(` and reject `createInstance`/`createFrame` on a composite root. For Level 1–4, `deltaSpec` is **mandatory** (exit 2 if null/empty/missing) and must pass `validate-delta-spec.js` (whose L2/L3 band warnings are promoted to errors). Add hard bands: L1 ≥85, L2 70–84, L3 60–69, L5 <60; L4 is undefined and rejected.
- *Post-build (`verify-invariants.js`):* assert the frame carries `basedOnCanonical` provenance when a canonical was applicable; if a canonical existed and was not cloned → FAIL.

**Failure action.** Pre-build disagreement or missing `.clone(`/`topMatches`/`deltaSpec` → exit 2. Post-build missing provenance → exit 2.

*(Kills F5-records-not-executes, L2-04, L3-03, L3-04, L2-07, L2-10, F7-canonical-ignored.)*

---

### INVARIANT 5 — Fail-closed on any SAP resource error

**Statement.** Any failure to resolve a SAP resource — component key 404, `importComponentSetByKeyAsync` throw, variable/token bind failure, missing text style, or a disconnected library (0 indexed variables) — **aborts the build with an error.** Never `createFrame` as a fallback. Never degrade to a metric line and continue.

**Check.**
- *Plugin:* the bind handler counts indexed library variables at pre-flight; if `count === 0`, post `type:'error'` and stop. `applyFill`/`applyStroke` throw on link failure instead of writing raw RGB. The handler posts `type:'error'` when aggregate violations (`rawFills + rawStrokes + typoFails`) > 0.
- *Build code:* every `importComponentSetByKeyAsync`/`createInstance` is wrapped in try/catch that **re-throws** (never `createFrame` fallback).
- *Post-build:* `verify-invariants.js` computes a fallback ratio (`linked / attempted`) and fails if below threshold; a fully-fallback screen fails.

**Failure action.** `type:'error'` from the plugin; exit 2 from `verify-invariants.js`; exit 1 from build code on any import throw. The Stop hook blocks on a missing or failing `verify.json` for a marked build.

*(Kills F6-silent-token-fallback, F8-meta-gap, L2-08, F1/F2/F3 fallback paths, INV-7.)*

---

## 3. THE NON-NEGOTIABLE BUILD CONTRACT (Gate 1..9)

An ordered pipeline. **Each gate is PASS/FAIL. On FAIL: STOP. No silent fallback.** Gates 1–5 are enforced *before* the build by PreToolUse hooks + markers; Gates 6–8 are enforced *after* the build by `verify-invariants.js`; Gate 9 is the hand-off. This is the mechanical realization of the prose GATE SEQUENCE already at the top of `SYSTEM_PROMPT.md`.

| # | Gate | Enforced by | PASS condition | FAIL action |
|---|------|-------------|----------------|-------------|
| **1** | **Reference analyzed** | `.inspect-done` marker (written after `get_design_context`/VDI) checked by `guard-reuse-gate.sh` | A reference was inspected (VDI artifacts or `get_design_context` recorded) | Block build (exit 2): "inspect before build (RULE 28-A)" |
| **2** | **Canonical match** | `guard-reuse-gate.sh` recomputes `score-canonical.js`; `.canonical-selected` marker carries `topMatches` | Score recomputed; declared level == computed top match; `.clone(` present for L1–4 | Block (exit 2): level/score disagreement or no search proof |
| **3** | **ASCII wireframe approved** | `.wireframe-approved` marker set on explicit user approval | Marker present for the first build of a screen | Block (exit 2): "show wireframe + L1–L5 tree, wait for approval (RULE 19)" |
| **4** | **Keys verified + library connected** | `manifest-sync-check` promoted to PreToolUse gate; build code try/catch | Every component key resolves; 0 empty non-allowlisted `figmaComponentId`; library indexes >0 variables | Block (exit 2): registry drift or unresolved key; plugin `type:'error'` if 0 variables |
| **5** | **Only SAP instances (code semantics)** | `guard-figma-code.sh` (NEW PreToolUse) inspects the `use_figma` code | `createFrame`-as-component count == 0; no `createFrame` name matches a SAP component; instance-creation present for a build | Block (exit 2): "native frame substituted for a SAP component" |
| **6** | **Tokens verified** | `verify-invariants.js` INV-2 (raw hex) + INV-3 (typography) | Every fill/stroke bound; every TEXT family 72 + valid role | exit 2, write `verify.json` FAIL |
| **7** | **Zero native frames** | `verify-invariants.js` INV-1 (full-tree walk) | Every node PASS_INSTANCE / PASS_CONTAINER / PASS_PRIMITIVE_EXCEPTION | exit 2, name each `FAIL_FAKE_COMPONENT` node |
| **8** | **Hierarchy verified** | `verify-invariants.js` + `lint-layer-names.js` | Layer names match `layer-naming.json` L1–L5 (allow/deny regex); no decorative chars | exit 2, list violating names |
| **9** | **Hand off** | Stop hook `lint-on-stop.sh` (rewritten) reads most-recent `verify.json` | `overallPass:true` and node ID + validated figma URL reported | Block hand-off (surface FAIL); missing artifact for a marked build = FAIL |

**Marker lifecycle.** `SessionStart` clears `.wireframe-approved`, `.inspect-done`, `.canonical-selected`, `.reuse-declared`, `.last-build-node` (extend `clear-reuse-marker.sh`). Markers are set only by the events they attest (approval, inspect, score) — never self-echoed to skip a gate. `guard-reuse-gate.sh` writes `.last-build-node` on a passing build; Claude overwrites it with the real node ID post-build; it is cleared only on confirmed bind.

---

## 4. CONCRETE IMPLEMENTATION

Exactly which files to create and edit. Paths are relative to the project root.

### 4.1 NEW — `.claude/hooks/guard-figma-code.sh` (PreToolUse `mcp__figma__use_figma`, Gate 5)

Blocks native-frame-as-component **before** the build (findings L2-01, INV-3). Reads `.tool_input.code` from stdin.

```bash
#!/bin/bash
INPUT=$(cat); TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
echo "$TOOL" | grep -qi "use_figma" || exit 0
CODE=$(echo "$INPUT" | jq -r '.tool_input.code // ""')
# read-only calls pass
echo "$CODE" | grep -qE "createInstance|createFrame|importComponentSetByKeyAsync|\.clone\(" || exit 0
CF=$(echo "$CODE" | grep -oE "createFrame\(" | wc -l | tr -d ' ')
INST=$(echo "$CODE" | grep -oE "createInstance\(|importComponentSetByKeyAsync\(|\.clone\(" | wc -l | tr -d ' ')
# 1. createFrame with no instance creation at all = pure wireframe
if [ "$CF" -gt 0 ] && [ "$INST" -eq 0 ]; then
  echo "⛔ GATE 5 BLOCKED — createFrame() with zero SAP instances = native-frame wireframe, not a SAP build. Use importComponentSetByKeyAsync + createInstance, or .clone() a canonical." >&2; exit 2
fi
# 2. createFrame named like a SAP component (fake component)
if echo "$CODE" | grep -qiE "createFrame\(\)[^;]*\.name\s*=\s*['\"](ShellBar|Button|Table|Input|Select|ObjectStatus|IconTabBar|DynamicPage|FilterBar|Card)"; then
  echo "⛔ GATE 5 BLOCKED — a createFrame() is named after a SAP component (fake component). That element MUST be a kit INSTANCE." >&2; exit 2
fi
exit 0
```

Wire into `settings.json` `PreToolUse` under matcher `mcp__figma__use_figma`, **after** `guard-reuse-gate.sh`.

### 4.2 NEW — `build/verify-invariants.js` (post-build invariant linter, Gates 6/7/8)

The reality gate. Ingests `output/<node>-tree.json` (a `use_figma`-serialized dump), walks it, and enforces INVARIANTS 1–5/8/9 with per-node verdicts. Replaces the orphan `lint-instance-ratio.js` "ratio" model with a **one-FAIL-fails** model.

Node dump shape (each element from `root.findAll(()=>true)` mapped to):
```json
{ "id": "...", "name": "...", "type": "INSTANCE|FRAME|TEXT|RECTANGLE|...",
  "visible": true, "layoutMode": "HORIZONTAL|VERTICAL|NONE", "childCount": 3,
  "mainComponentKey": "…or null", "fontFamily": "72", "fontSize": 14,
  "fills": [{ "type":"SOLID", "hex":"#…", "boundVariable": "…or null" }],
  "componentName": "Button", "componentProperties": { "Type": "Primary", "Form Factor": "Compact" } }
```
`componentName`/`componentProperties` are OPTIONAL (INV 9, 2026-09-14) — include them on every
INSTANCE to get variant-value checking (wrong Button.Type, wrong ObjectStatus.Semantic, etc.);
omit both to keep the old behavior exactly. Read them live via:
```js
const main = await n.getMainComponentAsync();
const setNode = main?.parent?.type === 'COMPONENT_SET' ? main.parent : main;
componentName = setNode?.name;              // the SAP registry name, e.g. "Button"
componentProperties = n.componentProperties; // Figma's own instance property map
```
Do NOT use `mainComponentKey` for `componentName` lookup — it is a per-VARIANT key, not the
per-component-set key the registry is indexed by; they will not match.
Output `output/<node>-verify.json`:
```json
{ "node": "804:44859", "overallPass": false,
  "nodes": [{ "id":"…", "verdict":"FAIL_FAKE_COMPONENT", "invariant":1, "why":"FRAME named 'ShellBar'" }],
  "summary": { "instances": 61, "containers": 12, "primitives": 3, "fails": 1 } }
```
Exit 0 iff `overallPass`; exit 2 otherwise. Loads `build/native-frame-allowlist.json`, `build/primitive-exceptions.json`, `layer-naming.json`, the kit key set, and the typography role map.

### 4.3 NEW — `build/lint-layer-names.js` (Gate 8)

Walks the dump; loads `layer-naming.json` (allow/deny regex for L1–L5 semantic names; deny decorative chars `◆■▲`, token tags in names, redundant nesting). Exit 1 on any violation. Called by `verify-invariants.js` and added to `test-build.sh`.

### 4.4 EDIT — `build/lint-instance-ratio.js`

De-orphaned but demoted: keep as a **fast pre-screen** feeding `verify-invariants.js`; the authoritative verdict is now per-node, not ratio. Add per-type allowlist loading from `native-frame-allowlist.json`. Add `FAIL` when any non-allowlisted component renders as FRAME (not just when the aggregate ratio is low).

### 4.5 EDIT — `.claude/hooks/guard-reuse-gate.sh` (Gates 1/2/3/4)

- Run `score-canonical.js` from the marker's `floorplan`/`regions`/`components`; reject if declared level ≠ computed top match (L2-04, L3-03).
- Require `.canonical-selected` to carry `topMatches` (proof of search) (L3-04).
- Require `.inspect-done` for L1–4 builds (L2-05, Gate 1).
- Require `.wireframe-approved` for a screen's first build (L2-06, Gate 3).
- For L1–4: require `.clone(` in code, `deltaSpec` non-null/existing, and reject `createInstance`/`createFrame` on a composite root (F5-records-not-executes).
- Hard bands L1 ≥85 / L2 70–84 / L3 60–69 / L5 <60; reject L4 (L2-07).
- Write `.last-build-node` on pass (L2-03).

### 4.6 EDIT — `.claude/hooks/lint-on-stop.sh` (Gate 9)

Find the most-recent `output/*-verify.json`; if `overallPass:false` → emit a blocking-severity FAIL block. If a build was marked (`.last-build-node` exists) but **no** matching `verify.json` exists → FAIL ("build produced no verification artifact"). Keep the existing bind reminder. (INV-7, L2-08, L3-02.)

### 4.7 EDIT — `.claude/hooks/manifest-sync-check.sh` → PreToolUse gate

Promote from non-blocking PostToolUse to a PreToolUse(`use_figma`) gate that exits 2 on registry drift before a key-dependent build (L2-09, Gate 4). Upgrade `check-manifest-sync.js` hex-mismatch from `warnCount++` to `process.exit(1)` (F6-registry-tokens).

### 4.8 EDIT — `plugin/figma-builder/code.js` (INVARIANTS 2 & 5, fail-closed)

- `applyFill`/`applyStroke` (891–952): **throw** on variable-link failure instead of writing raw RGB + counting.
- Bind pre-flight: if indexed library variables == 0 → `postMessage({type:'error'})` and return.
- Bind handler (~1450): post `type:'error'` when `rawFills + rawStrokes + typoFails > 0`. Remove the unconditional `type:'success'`.
- Make `slotNames` authoritative: add `injectIntoSlot(instance, slotName)` reading the registry (F3-registry-slots).

### 4.9 EDIT — `skill/SYSTEM_PROMPT.md` (reordering)

The GATE SEQUENCE already leads the file (lines 17–72) — good. The remaining defect is that **RULE 28 (Clone-Canonical) and RULE 31 sit at lines 1093/1216**, far below the RULE 24 build-contract prose at line 803/897, so a model reading top-to-bottom hits "build via use_figma" before "clone first." Fix: **hoist a one-screen "GATE CHECKLIST + RULE 28 clone-first mandate" block to immediately after line 72 (before line 76 "Who you are"), above line 835.** Leave the numbered rules as a glossary. This makes clone-first the first *procedural* instruction, not the 28th.

### 4.10 NEW / BACKFILL — permanent registries

| File | Purpose | Finding |
|------|---------|---------|
| `build/native-frame-allowlist.json` | Legit native-frame types (auto-layout containers) with matchers | F8-registry-allowlist, INV-6 |
| `build/primitive-exceptions.json` | Legit primitives (Image, DynamicSideContent, ToolbarSpacer) as `PASS_PRIMITIVE_EXCEPTION` | INV-3 |
| `layer-naming.json` | L1–L5 allow/deny regex, machine-readable | F7-registry-layer-naming |
| Component key registry | Harvest the **21 empty `figmaComponentId`** (App, Column, DynamicPage, FilterBar, FCL, OverflowToolbar, …); `test-build.sh` fails on any non-allowlisted empty | F2-registry-keys |
| `MANDATORY_TOKENS` | Generate hex **from** `horizon-variable-keys.json` at bundle time; kill the second hardcoded copy | F6-registry-tokens |
| Typography role→style map | Generate from registry `typographyRules` at bundle time; gate on divergence | F5-registry-typography |

Template to replicate for all of the above: the **canonical registry** (`canonical-index.json` + `score-canonical.js` reader + `check-reuse-integrity.js` CI gate) — the one registry already done right (F1-registry-done-right).

### 4.11 EDIT — `build/test-build.sh`

Add: `lint-layer-names.js`, `verify-invariants.js` (against a committed golden `*-tree.json` fixture), the empty-key gate, and the bundle-divergence gates. This closes the CI hole where `test-build.sh` consumed only spec JSON + 5 static fixtures and never a real built-frame dump (F8-meta-gap, L2-02).

---

## 5. WHY THIS MAKES NON-SAP OUTPUT ARCHITECTURALLY IMPOSSIBLE

Each historical failure mode maps to an invariant that now *mechanically* kills it. The word "mechanically" is load-bearing: the check runs whether or not the model remembers the rule.

| Failure mode (was CONFIRMED) | Killed by | Why it can no longer ship |
|------------------------------|-----------|---------------------------|
| Native FRAME substituted for a SAP component (F1) | INV 1 + Gate 5 + Gate 7 | Pre-build: `createFrame`-as-component blocks (exit 2). Post-build: any `FAIL_FAKE_COMPONENT` node fails the walk. No ratio to hide behind. |
| Detached instance masquerading as a component (F4-detach) | INV 1 (kit-provenance) | `getMainComponentAsync` must resolve into the kit key set; null/local/foreign = FAIL. A detach is no longer invisible. |
| Wrong component variant (F2-variant) | INV 1 + delta-spec variant assertion | Spec carries expected variant; post-build asserts `variantProperties` deep-equals intent. |
| Raw hex reaches the frame (F5-raw-hex) | INV 2 | Every visible fill/stroke must have `boundVariables.color`; one unbound fill exits 2. Promoted from warning to error. |
| Silent token/library fallback (F6, F8-meta-gap) | INV 5 + INV 2 | `applyFill` throws instead of falling back; 0-variable library aborts with `type:'error'`; fully-fallback screen fails the ratio gate. The `type:'success'` escape hatch is removed. |
| Raw / missing typography (F3-raw-font) | INV 3 | Every TEXT must be family 72 + valid `[typo:role]` at the right size; untagged text now fails (was silently allowed). |
| Canonical ignored though one exists (F7, L3-01) | INV 4 | Gate recomputes the score (can't be self-typed to Level 5); L1–4 require `.clone(` + provenance stamp; missing provenance fails post-build. |
| Build ends `success` with violations embedded; frame never inspected (F8-meta-gap, INV-7) | INV 5 + Gate 9 | One post-build reality gate reads the *real frame tree* and returns hard pass/fail; the plugin posts `type:'error'` on any aggregate violation; the Stop hook blocks hand-off on a FAIL or a missing artifact. |
| Only RULE 31 had a real gate; RULES 1–30 prose-only (F4-only-rule31-gate) | Gates 1/3/4/5 as marker+code hooks | Wireframe, inspect, keys, and code-semantics are now `exit 2` gates, mirroring the reuse gate — not prose. |
| Orphan detector never fires (L2-02, L3-02) | Gate 6/7 wired into Stop + `test-build.sh` | `verify-invariants.js` runs automatically at Stop and in CI against a real tree dump. |
| Self-attested score forces Level 5 (L2-04, L3-03) | INV 4 pre-build recompute | `score-canonical.js` is re-run from declared inputs; a disagreement blocks. The marker can no longer lie. |

**The structural guarantee:** there is now exactly one path from "code that builds a frame" to "hand-off," and that path runs through `verify-invariants.js`, which reads the produced frame and is *allowed to return FAIL*. A build that violates any of the five invariants cannot reach the user, because the only exit is gated on `overallPass:true`. Guidance could be forgotten; a gate that owns the exit cannot be.

---

## Appendix — Implementation order (highest leverage first)

> **Status 2026-07-18: all 5 items DONE.** Items 1-4 landed in the invariant-enforcement merge;
> item 5 (registries + drift gates) completed in the hardening pass:
> - `build/keyless-components-allowlist.json` — the 22 keyless-by-design components; build-registry-bundle.js
>   now exits 2 on any UNEXPECTED empty figmaComponentId (F2 closed).
> - `.claude/hooks/guard-manifest-drift.sh` — PreToolUse Gate 4; blocks a key-importing build on manifest drift.
> - `check-manifest-sync.js` — token-hex drift promoted from warn → HARD FAIL (F6 closed); the sapList_TextColor
>   class of contradiction now fails the build instead of shipping.

1. **`build/verify-invariants.js` + wire into `lint-on-stop.sh` and `test-build.sh`.** ✅ DONE. (F8-meta-gap / INV-7 — the single root fix.) Turns "always success" into "success only if the frame proves it."
2. **`.claude/hooks/guard-figma-code.sh`** (Gate 5) ✅ DONE — blocks native-frame wireframes before they build.
3. **De-orphan + rewrite `guard-reuse-gate.sh`** ✅ DONE — clone-first (.clone required for L1-4) + ask-before-scratch (.scratch-approved) + wireframe gate (guard-wireframe-gate.sh) + independent approval markers (capture-approvals.sh).
4. **`code.js` fail-closed** ✅ DONE — bind handler posts type:'error' on any unbound fill/typo (removed unconditional type:'success').
5. **Backfill registries** ✅ DONE — `native-frame-allowlist.json`, `primitive-exceptions.json`, `layer-naming.json`, `keyless-components-allowlist.json` (22 keys allowlisted, unexpected empties fail), token-hex drift now hard-fails in check-manifest-sync.js.
