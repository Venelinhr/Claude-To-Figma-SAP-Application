# VD Scan & Measurement Engine

**Added 2026-09-08** — upgrades Gate 0 (VDI) from "identify elements" to "reconstruct the design
system logic behind the pixels." Triggered by real defects: a rebuilt screen used guessed round
numbers for gaps/padding instead of measured or tokenized values, forced 6 filter columns to equal
widths when their content clearly needed different widths, and treated every visible rectangle as
its own component instead of recognizing composite structures.

**Core principle:** do not scan pixels only. Reconstruct the design system logic behind the pixels.
Every VD Scan must be able to answer: What is it? Where is it? How large is it? What is it aligned
to? What is it grouped with? What is the spacing relationship? Why is it a component? Should it
stand alone? Which SAP component represents it? Which token/variable controls it? How confident
are we? How do we validate it?

This reference is used during **Gate 0** (Analyze reference) and by any repair pass (`/sap-fix`)
that needs to re-derive correct measurements for an existing screen. It does not replace
`sector-analysis.md` (the zone table format) — it defines HOW to arrive at trustworthy numbers
before that table is filled in.

---

## 1. Accurate measurements

Measure and validate, not guess:

- Overall page/frame dimensions
- Section dimensions
- Component width and height
- X/Y position
- Margins, padding, gaps (horizontal and vertical)
- Alignment and baseline relationships
- Container boundaries
- Column and row dimensions
- Content density
- Minimum/maximum dimensions
- Relative proportions

Measurements are **hierarchical**, not a flat coordinate list:

```
Page → Section → Container → Component → Element → Content
```

For every measurement, tag its source:

| Tag | Meaning |
|---|---|
| **Measured** | Directly read from the reference (a real pixel/px value you can point to) |
| **Calculated** | Derived arithmetically from other measured values |
| **Inferred** | Estimated from a visual relationship (e.g. "looks evenly spaced") |
| **Design-system** | Mapped to an existing SAP token/component default |

**Never silently upgrade an inferred value into a measured one.** If you had to eyeball it, say so.

---

## 2. Spacing & gap analysis

Before choosing any gap/padding number, check `mcp__sap-design__getFoundation` (name: `spacing`)
or `mcp__sap-design__get_tokens_for` for the component in question — SAP's real spacing scale,
not invented pixel counts. This project's one fixed exception is the 32px side-padding hard rule
(CLAUDE.md) — everything else (internal gaps, vertical rhythm) should come from real SAP spacing
tokens (typically 8/16/24px increments).

Detect and record:
- Repeated spacing values (these are almost always the real system, not coincidence)
- Horizontal and vertical gaps
- Internal component padding
- Section spacing
- Distance: label→control, control→control, group→group, section→section
- Alignment offsets

**Flag, don't silently fix:**
- Outliers (one value that breaks an otherwise consistent pattern)
- One-off spacing that matches nothing else on the screen
- Visually inconsistent gaps
- Accidental alignment (looks aligned but isn't, by a few px)
- Anything that looks like an implementation error in the reference itself

Goal: reconstruct the underlying spacing **logic**, not report a table of pixel distances.

---

## 3. Component boundary detection

Not every visible rectangle is a component. For each visual region, decide:

**Should this be one component, a component + supporting elements, or multiple independent
components?**

Identify:
- Standalone components
- Component groups
- Containers
- Repeated patterns (these usually indicate a single reusable component, not N separate ones)
- Composite components (component built from several sub-parts that always travel together)
- Nested components
- Sections
- Supporting elements (a label next to a control is supporting, not standalone)
- Decorative elements (dividers, spacing — never a "component")

## 4. Standalone vs grouped components

Classify each meaningful visual region:

| Classification | Example |
|---|---|
| Standalone component | Button, single Input field |
| Composite component | Label + input + validation message as one field structure; a Card with avatar+title+badge+footer |
| Container | A card wrapper, a filter-row wrapper |
| Layout structure | The page's overall column split |
| Supporting element | A helper icon next to a label |
| Content | Body text, data values |
| Decoration | Dividers, spacers |

Base the classification on **behavior, reuse, hierarchy, and SAP component architecture** — not
on "it looks like its own box." A page section (e.g. "Filters") is a layout/container, never a
component in its own right.

---

## 5. Alignment & geometry analysis

Scan the whole visual grid for:
- Shared left/right edges
- Common baselines
- Center alignment
- Column/row alignment (including nested)
- Unequal widths that are intentional vs accidental misalignment
- Optical alignment vs mathematical alignment (designers sometimes nudge for optical balance —
  don't "correct" this back to exact math if the reference clearly intends the optical version)

Identify the likely underlying layout mechanism (flex row, grid, stack, form layout, toolbar,
table/list structure, fixed layout) and **infer the layout rule**, rather than hardcoding
per-element coordinates that happen to look right for one screen size.

**Concrete failure this section exists to prevent:** a 6-item filter row (1 toggle + 5 dropdowns)
was built with all 6 columns forced to equal width. The toggle control is visually and
functionally much narrower than a dropdown with placeholder text like "Select Categories /
Subc...". Check what each column's content actually needs before dividing space evenly.

---

## 6. Visual hierarchy analysis

Map: **Page → Section → Group → Component → Element → Content**

Identify: primary vs secondary content, primary vs secondary actions, visual emphasis, supporting
information, headers, labels, metadata, status indicators, navigation, actions, empty states,
feedback states. Decide which elements should visually dominate and which stay subordinate — this
drives font weight/size/color token choices later, it isn't just a labeling exercise.

---

## 7. Measurement confidence table

Every important measurement or inferred relationship gets a row:

| Measurement | Value | Method | Evidence | Confidence |
|---|---:|---|---|---|
| Section gap | 24 px | Direct measurement | Visible repeated gap between 3 cards | High |
| Card padding | 16 px | Derived | Consistent internal spacing across all text rows | High |
| Grid columns | 3 | Inferred | Repeated card width + equal gaps | Medium |
| Component boundary | Form Group | Structural inference | Shared label/control behavior | Medium |

Never present an inference as a direct measurement in this table.

---

## 8. SAP Design System mapping

After extracting the visual structure, map it to real SAP Fiori/SAPUI5 concepts. Determine:
- Which existing SAP component matches
- Which variant matches
- Which properties are required
- Which tokens/variables apply (colors, spacing)
- Which layout pattern applies
- Whether a custom/native element is actually justified (rare — see `native-frame-allowlist.json`
  for the only sanctioned exceptions)

**Prefer an existing SAP component + correct configuration over inventing a custom one**, unless
evidence in the reference clearly requires something SAP doesn't ship (see `component-map.md`'s
"avoid-when" guidance and the failure log in `INDEX.md`).

---

## 9. VD Scan output shape

The scan output should be structured and machine-readable, not narrative-only:

```
Reference
 → Page geometry
 → Sections
 → Layout regions
 → Containers
 → Components
 → Component relationships
 → Measurements (tagged: measured/calculated/inferred/design-system)
 → Spacing system
 → Alignment system
 → Visual hierarchy
 → SAP component mapping
 → Tokens / variables
 → Confidence
 → Validation status
```

The target statement is not:
> "There is a button at X=320, Y=240."

It is:
> "This is a primary action button belonging to the section action group, aligned with the section
> content container, separated by 16px from the preceding control, using SAP spacing tokens, and
> should be implemented as a real SAP Button instance — not a native frame."

---

## 10. Measurement QA — before accepting VD Scan results

Run these checks and **self-correct or flag uncertainty rather than propagate unreliable
measurements downstream**:

- Measurement consistency (do repeated elements actually share the same measured value?)
- Spacing consistency (no orphan one-off gaps unless flagged)
- Alignment consistency
- Component boundary consistency (did the same visual pattern get classified the same way twice?)
- Parent/child relationships (does every measured child actually fit inside its claimed parent?)
- Duplicate components (three identical cards with different data is fine; three identical cards
  with identical default/placeholder data is a build defect — see §3 failure log below)
- Missing components
- Incorrect nesting
- Impossible dimensions (negative sizes, a child wider than its parent)
- Overlapping elements that shouldn't overlap
- Unexpected gaps
- Token mismatches
- SAP component mismatches

---

## Failure log — concrete defects this reference exists to prevent

| Mistake | Why it happens | Correct approach |
|---|---|---|
| Forced-equal-width filter columns | Easiest math, ignores content | Size each column to its actual content (§5) |
| Guessed round-number gaps (e.g. "24px" with no source) | Faster than looking up the real token | Pull the real SAP spacing token before laying out (§2) |
| Every rectangle treated as its own component | No boundary classification step | Run §3/§4 before naming components |
| Card height picked without checking content fit | No verification pass | Check via `get_metadata`/screenshot that all card content fits without clipping or excess empty space |
| Left-over placeholder/default text ("Typed Text", "Label:", sample names) shipped as final content | Component created but its text sub-nodes never explicitly set | After every `createInstance()`, locate real text sub-nodes and set `.characters` explicitly — never trust a component's default sample content to be the real content |
| Loose page-absolute coordinates instead of frame-relative | Elements positioned before a real parent frame existed, then grouped after the fact | Always create the destination frame FIRST, `appendChild` into it, THEN position relative to that frame |
