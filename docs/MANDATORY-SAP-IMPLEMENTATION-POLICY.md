# Mandatory SAP Implementation Policy

**Status:** Authoritative doctrine · 2026-07-18
**Enforced by:** THE CANONICAL GATE SEQUENCE (`skill/SYSTEM_PROMPT.md`) + the 5 build invariants (`docs/SAP-INVARIANT-ARCHITECTURE.md`)

> The primary objective is to generate **a genuine SAP Fiori screen**, not a screen that merely resembles SAP.

Every generated screen is built using **real SAP Web UI Kit component instances, SAP design tokens, SAP typography tokens, SAP variables, Auto Layout, and approved SAP component compositions** wherever technically possible.

---

## Priority Order (Mandatory)

### 1. Reuse an Approved Implementation (Highest Priority)

Before generating anything, search for an existing approved SAP screen that matches the requested business scenario, floorplan, or structure (`build/score-canonical.js` against `canonical-index.json`).

If a suitable implementation exists — **clone it** and preserve: validated architecture · SAP component instances · Auto Layout · component hierarchy · design tokens · typography tokens · spacing · naming conventions.

Then modify only what is necessary: inject business content · replace labels · update data · swap SAP variants · add/remove required SAP components · update properties, states, icons, actions, layouts.

**Do not rebuild an already-solved screen from scratch.**
→ Enforced by: **INVARIANT 4** (clone-first when a canonical exists) + Gate 1/2.

### 2. Build Using SAP Components Only

If no reusable implementation exists: select the correct floorplan · build exclusively with SAP Web UI Kit instances · use only SAP typography tokens · use only SAP design tokens/variables · follow SAP composition and hierarchy · preserve accessibility and UX best practices.

The result must be a real SAP implementation — not an approximation.
→ Enforced by: **INVARIANT 1** (zero native frames), **INVARIANT 2** (zero raw hex), **INVARIANT 3** (zero non-SAP typography) + Gate 5/6/7.

### 3. Native Figma Frames Are an Explicit Exception

Creating native Figma frames is **not** an acceptable fallback. Native frames may be used only when ONE of:
- The user explicitly requests a native Figma implementation.
- A required SAP component does not exist in the SAP Web UI Kit.
- A technical limitation prevents a correct SAP implementation after all reasonable SAP approaches are exhausted.

Before any native frame, Claude MUST: (1) stop the build, (2) explain why a pure SAP implementation cannot be achieved, (3) identify the specific technical limitation, (4) describe the trade-offs, (5) present the options, (6) obtain user approval.

**Never silently replace SAP components with native Figma objects.**
→ Enforced by: `guard-figma-code.sh` (Gate 5, blocks native-frame wireframes pre-build) + **INVARIANT 5** (fail-closed, never fall back to createFrame).

---

## Zero Fake SAP Policy

Every visible element must be one of:
- A real SAP Web UI Kit component instance.
- A documented SAP-compliant exception (`build/primitive-exceptions.json`).
- A custom element explicitly discussed and approved before implementation.

Native placeholders, fake buttons/tables/cards/dialogs/layouts are **not acceptable**.
→ Enforced by: **INVARIANT 1** post-build tree walk — one `FAIL_FAKE_COMPONENT` fails the build.

---

## Build Decision Tree

```text
User Request
      │
      ▼
Search Approved Screens  (Gate 1 · score-canonical.js)
      │
      ├── Match Found
      │        ▼
      │  Clone Approved Screen  (INVARIANT 4)
      │        ▼
      │  Inject Requested Changes
      │        ▼
      │  Validate SAP Components & Tokens  (Gate 6/7)
      │
      └── No Match
               ▼
      Build with SAP Web UI Kit Only  (INVARIANT 1/2/3)
               ▼
      Validate All SAP Requirements  (verify-invariants.js)
               │
               ├── PASS → Deliver  (Gate 7)
               │
               └── FAIL
                      ▼
      Explain Technical Limitation
                      ▼
      Ask User Before Any Native Figma Implementation
```

## Core Principle

**Reuse before rebuilding. Clone before recreating. Inject before replacing. Validate before delivering.**

The success criterion is **a genuine SAP Fiori screen built from real SAP Web UI Kit assets** — not a visually similar imitation. Native Figma frames are never a silent fallback; they are an explicit, user-approved exception.

---

## How this is mechanically guaranteed (not just guidance)

| Policy statement | Invariant / gate that enforces it | What happens if violated |
|---|---|---|
| Reuse before rebuild | INVARIANT 4 + Gate 1/2 (`guard-reuse-gate.sh` recomputes score) | Build blocked (exit 2) if a canonical exists and wasn't cloned |
| SAP components only | INVARIANT 1 + Gate 5 (`guard-figma-code.sh`) + Gate 6 (`verify-invariants.js`) | Native-frame wireframe blocked pre-build; fake component fails post-build |
| SAP tokens only | INVARIANT 2 (`verify-invariants.js`, Gate 6) | Any unbound fill → exit 2 |
| SAP typography only | INVARIANT 3 (`verify-invariants.js`, Gate 6) | Any non-72 / untagged / wrong-size text → exit 2 |
| No silent native fallback | INVARIANT 5 (plugin fail-closed) | Import/bind failure aborts with `type:'error'`, never createFrame |
| Nothing ships unverified | Gate 7 (`lint-on-stop.sh`) | Hand-off blocked unless `verify.json` `overallPass:true` exists |

See `docs/SAP-INVARIANT-ARCHITECTURE.md` for the full check definitions and `skill/SYSTEM_PROMPT.md` (top) for THE CANONICAL GATE SEQUENCE.
