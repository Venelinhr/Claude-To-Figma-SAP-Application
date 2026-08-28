# Component Dependencies

The component architect reads this file at Step 4 to validate the component hierarchy.
Every rule here is a hard constraint — violating it produces an invalid SAP Fiori screen.

---

## Page-level containers

### ShellBar
- **Always** the topmost element — first item in `hierarchy[]`
- **Never** inside a Page, DynamicPage, or any other container
- **One per screen** — exactly one ShellBar per Figma frame
- Required: `productName` prop always set

### DynamicPage
- Children must follow this slot order: `title` → `header` → `content` → `footer`
- `title` slot (DynamicPageTitle): **always required**
- `header` slot (DynamicPageHeader): present on List Report and ALP, **absent on Worklist**
- `content` slot: **always required** — the main content (Table, Form, etc.)
- `footer` slot (OverflowToolbar): only for finalising actions (Save/Cancel draft) — **never informational**
- FilterBar lives in the `header` slot — **never in content**

### ObjectPageLayout
- Requires `headerTitle` slot (ObjectPageDynamicHeaderTitle) — **mandatory**
- Requires at least one `ObjectPageSection` in `sections` — **mandatory**
- Each section contains `ObjectPageSubSection[]`
- Each subsection contains `blocks[]` — the actual content (Form, Table, etc.)
- Library: `sap.uxap` — must be imported in bootstrap, not just `sap.m`
- Use `ObjectPageDynamicHeaderTitle`, **not** the deprecated `ObjectPageHeader`

### FlexibleColumnLayout
- `beginColumnPages`: the master/list view (full page)
- `midColumnPages`: the detail view (full page)
- `endColumnPages`: sub-detail (rarely needed, three-level drill-down only)
- Each column slot contains a **full page** (DynamicPage or ObjectPageLayout), not individual components
- `layout` property controls the column split — programmatically changed on navigation
- **Only correct container for Master-Detail floorplan** — never simulate with HBox/VBox

---

## Filtering components

### FilterBar
- Lives in `DynamicPageHeader` → `DynamicPage` header slot
- **Never** in the content area
- **Never** on a Worklist screen — Worklist has no DynamicPageHeader
- **Requires** VariantManagement on List Report screens (`showVariantManagement: true` on DynamicPageTitle)
- Filter fields: each is a `FilterItem` containing a control (Input, Select, DateRangeSelection)
- Team rule: always `showGoButton: true` — never live search for our backend

### VariantManagement
- Lives in DynamicPageTitle — **not** in FilterBar itself
- Required on List Report, ALP
- **Never** on Worklist, Object Page, Wizard

---

## Table components

### Table (sap.m.Table — Responsive)
- Always has a `headerToolbar` slot containing an `OverflowToolbar`
- OverflowToolbar must contain: `Title` (with item count) + `ToolbarSpacer` + action buttons
- `columns` slot: `Column[]` — each Column contains a header label
- `items` slot: `ColumnListItem[]` — each row with `cells` matching the column count
- Selection mode: `None` (default) / `MultiSelect` (bulk) / `SingleSelectLeft` (drill-down)
- `SingleSelect` is **deprecated** in UI5 1.147.0 — use `SingleSelectLeft`
- For large datasets: `growing: true` + `growingScrollToLoad: true`

### Table (sap.ui.table.Table — Grid/Analytical)
- Use only for analytical scenarios with fixed columns and virtual scrolling
- Not interchangeable with sap.m.Table — different API, different component name
- Component name in spec: `"GridTable"` (not `"Table"`)

---

## Toolbar components

### OverflowToolbar
- Standard toolbar for table headers and page footers
- Actions flow into overflow menu automatically — do not try to control overflow manually
- **Never** use `sap.m.Toolbar` where `OverflowToolbar` is expected (loses overflow behaviour)
- Always contains `ToolbarSpacer` to push actions to the right

### Action placement rules

| Action scope | Where it goes | Component |
|---|---|---|
| Page-level (Create, Export all) | DynamicPageTitle `actions` slot | Button in OverflowToolbar |
| List-level (bulk: Delete selected, Export selected) | Table `headerToolbar` | Button in OverflowToolbar |
| Row-level (inline: Edit, Delete this row) | ColumnListItem `type` or `deleteButton` | NavigationRow or DeleteButton |
| Finalising (Save draft, Submit) | DynamicPage `footer` slot | Button (Type=Primary) in OverflowToolbar |
| Object-level (Edit, Delete entity) | ObjectPageDynamicHeaderTitle `actions` | Button |

---

## Message components

Use the right message component for the scope of the message:

| Component | Scope | Persistence | Use when |
|---|---|---|---|
| `MessageStrip` | Section or page | Persistent until dismissed | Informational or warning affecting the whole screen |
| `MessageToast` | Page | Auto-dismisses (3s) | Confirmation of a completed action (Save successful) |
| `MessagePopover` | Page | Trigger-based | Multiple validation errors, accessible from a footer button |
| `MessageBox` | Application (modal) | Until user responds | Destructive action confirmation (Delete this record?) |

**Never use native `alert()`** — always use `sap.m.MessageBox`.

---

## Object display components

### ObjectStatus
- Use for semantic status values (Approved/Pending/Rejected) — always set `state` property
- States: `Success` / `Warning` / `Error` / `Information` / `None`
- **Never** use plain `Text` for status columns — use `ObjectStatus`

### ObjectIdentifier
- Use for the primary identity of a row item: title + subtitle
- Title is the clickable element for navigation (if row is navigable)
- **Never** use two separate `Text` nodes for title + subtitle

### ObjectNumber
- Use for amounts, quantities, and measurements with units
- Always set both `number` and `unit` props
- **Never** use `Text` for numeric values that carry a unit

---

## Forbidden combinations

| Combination | Why it's wrong |
|---|---|
| FilterBar in a Worklist | Worklist is pre-scoped — filtering defeats the purpose |
| FilterBar in content area | FilterBar belongs in DynamicPageHeader, not content |
| VariantManagement on Worklist | Worklist has no user-defined filters to save |
| ShellBar inside a Page | ShellBar is always the outermost shell element |
| Multiple ShellBars per screen | One shell per screen, always |
| Wizard with non-sequential steps | Wizard implies each step depends on the previous — use Object Page sections instead |
| ObjectPageLayout inside DynamicPage | These are peer containers — never nest them |
| sap.m.Table for analytical data | Use sap.ui.table.AnalyticalTable instead |
| native `alert()` or `confirm()` | Use sap.m.MessageBox |
| Custom CSS to simulate Fiori components | Always use real library instances |
| Non-SAP components (Material UI, Ant, Bootstrap) | Hard constraint — SAP components only |
