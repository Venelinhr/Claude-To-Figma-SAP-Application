# SAP Figma Design Agent — Evolution Comparison

> Before/after comparison showing the evolution from native frames to real SAP instances.


## How the approach evolved across three stages

---

## Stage 1 — Before Designer Approach
*Early plugin / pre-rosetta sessions (before 2026-06-27)*

| Dimension | Stage 1 Behavior |
|---|---|
| **Starting point** | Guessed the structure from scratch |
| **Component philosophy** | Build it if it looks right — generic Frames + Text + Rectangle |
| **Dialog** | Native FRAME named "Dialog" — synthesized title bar, wizard steps, footer |
| **Wizard steps** | Native circles (24px) + label text — no SAP instance involved |
| **Footer buttons** | All three rendered as Emphasized (blue) — no intent distinction |
| **Table** | Always imported SAP Table instance with hardcoded "Sales Orders" demo data — spec columns/rows ignored |
| **Text rendering** | `figma.createText()` → `t.characters = txt` — no font load, silent failure common |
| **List items** | Native rows with RadioButton + Text — no SAP List instance |
| **Content injection** | appendChild to locked SAP instance internals → Plugin API error |
| **Color** | Mixed raw hex + SAP tokens, no enforcement |
| **Layer panel** | Mostly grey Frame icons — nothing shows as a SAP purple diamond instance |
| **Reference analysis** | None — jumped straight to spec generation |
| **Failure detection** | Screenshots only — root cause often missed |
| **Iteration** | Patched symptoms repeatedly without root-cause diagnosis |
| **When user said "fixed"** | Kept trying to improve the already-confirmed solution |
| **Quality bar** | "Does it look like SAP?" |

---

## Stage 2 — The Designer's Actual Approach
*Reference: SAP designer file, nodes 138:17478, 76:75439, 143:98040*

| Dimension | Designer's Actual Method |
|---|---|
| **Starting point** | Start from the highest-level SAP container component — Dialog, Panel, Table, etc. |
| **Component philosophy** | SAP linked instances first, everywhere. Purple diamonds in every layer. |
| **Dialog** | Real SAP Dialog component → `detachInstance()` → mutable FRAME with real SAP Header + Content + Footer children |
| **Wizard steps** | Real `.base/Wizard Step` SAP instances with State variants (Active/Visited/Inactive) + Active Plate (3px blue underline) |
| **Footer buttons** | Previous = `Default` (white + border), Next = `Emphasized` (blue), Cancel = `Transparent` (no border) — intent-matched |
| **Wizard Page Header** | Separate SAP `Wizard Page Header` instance (72px tall, sapObjectHeader_Background, subtle shadow, 1px bottom border) |
| **Table** | Native VERTICAL FRAME + SapColHeader + ColumnListItem rows with real SAP cell instances — NOT the SAP Table instance (which has hardcoded demo content) |
| **List items** | SAP `List Item` instances with full structure: Selector Container + Thumbnail (hidden) + Text Container + Trailing Icon (hidden) + Navigation Indicator |
| **Selected row** | `sapList_SelectionBackgroundColor` background token, OR separate composition for selected state |
| **Content injection** | `detachInstance()` on outer → outer becomes mutable FRAME → inject via `appendChild` or SLOT nodes |
| **Color** | Every fill bound to SAP variable — no raw hex anywhere |
| **Layer panel** | Primarily purple-diamond SAP instances — immediately inspectable, swappable, detachable |
| **Documentation first** | Reads official SAP docs for every container before building its children |
| **Reference analysis** | Reads actual canvas metadata, not screenshots — inspects `x/y/width/height/type/name` of every node |
| **Failure detection** | `get_metadata` on the actual built node tree — sees empty cells, wrong widths, missing children |
| **Naming** | SAP component name OR domain-specific semantic name — never "Frame 12345" unless mechanical |
| **Quality bar** | "Is the layer panel structurally correct SAP?" |

---

## Stage 3 — After Designer Approach
*Current state — 2026-06-28, all rules encoded*

| Dimension | Stage 3 Behavior |
|---|---|
| **Starting point** | Container-First (RULE 14): highest-level SAP component first, read its docs, then build children |
| **Component philosophy** | SAP linked instances throughout. Detach = documented exception with reason in `meta.decisions` |
| **Dialog** | Real SAP Dialog → `detachInstance()` → inject Header title via text node re-find after await, inject Wizard Page Header via `insertChild`, inject content into `⿻ Content` slot, replace SAP Footer with native Footer + fresh SAP Button instances |
| **Wizard steps** | Native `.base/Wizard Step` VERTICAL frames (72px, stretch-to-fill). Active = solid blue circle + 3px Active Plate. Visited = white + 2px blue border + blue number. Future = white + 1px grey border + grey text |
| **Step connectors** | 1px-tall horizontal lines, `layoutGrow=1`, color = blue (after visited/active) or grey (before future) |
| **Footer buttons** | Intent → kit `Type` map: `back-action`=Tertiary, `primary-action`=Primary, `safe-escape`=Tertiary, `destructive`=Reject. `props.type` override available (must also be a valid kit value) |
| **Footer height** | Always HUGs — `layoutSizingVertical='HUG'` — adapts to button size (26px Compact / 32px Cozy) |
| **Table** | Native FRAME when spec has columns/items. SAP Table instance fallback only for placeholder. Column widths from `props.width` (% or px). `slot.layoutSizingHorizontal='FILL'` on the SAP List slot |
| **Text rendering** | Text in Panel children + Table cells: direct inline `figma.createText()` at the call site — bypasses buildTree Text handler font-race. `makeText()` is now `async` with `setTextSafe()` |
| **OverflowToolbar** | Borderless by default inside Panel/Dialog/Table. `props.bordered:true` opt-in only |
| **SAP tokens** | 26 whitelisted tokens including 7 new wizard-step tokens (sapList_HighlightColor, sapContent_Selected_ForegroundColor, sapNeutralColor, etc.) |
| **Reference analysis** | Step 0: 12-step pipeline + 7 verification passes run BEFORE any generation. Zero-Omission Policy |
| **Failure detection** | `get_metadata` on actual node → read exact `id/x/y/width/height/children` → patch specific node by ID not by guessing |
| **Positive feedback** | "Fixed / working / bravo" = canonical → do not re-iterate. Document as default for similar future scenarios (RULE 15) |
| **Engineering rule** | When a code path fails repeatedly and another works: adopt the working pattern, not more try/catch (RULE 13) |
| **Suggestion mode** | Always propose SAP best-practice improvements when generating from a reference — not just replication |
| **Quality bar** | "Is it structurally correct SAP? Does the layer panel show real instances? Does the spec follow SAP composition rules?" |

---

## Delta Summary — What Changed Most

| Area | Stage 1 → Stage 3 |
|---|---|
| **Dialog** | Fake FRAME → Real SAP detached instance with real children |
| **Wizard steps** | 24px native circles → 32px `.base/Wizard Step` frames with Active Plate, correct state colors, properly sized connectors |
| **Footer** | All buttons one type → Intent-mapped kit `Type` (Primary / Secondary / Tertiary). HUG height |
| **Table** | SAP demo Sales Orders → Native table with spec data |
| **Text** | Silent failures → Direct inline render bypassing the broken handler |
| **OverflowToolbar** | Had border → Borderless (correct SAP convention) |
| **Layer panel** | Mostly grey Frames → Primarily purple-diamond SAP instances |
| **Iteration** | Patch symptoms forever → Adopt working pattern, stop at confirmation |
| **Reference** | Generate immediately → Analyze first (12 steps, 7 passes, Container-First) |
| **Design intent** | Replicate visually → Optimize for SAP Fiori + suggest improvements |

<!-- part of the SAP Fiori knowledge base -->
