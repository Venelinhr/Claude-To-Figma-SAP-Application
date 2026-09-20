# SAP Web UI Kit — Complete Component Registry
<!-- VERIFIED 2026-07-21 · Kit file: SILcWzK5uFghKun9jx6D7c -->
<!-- All TEXT/BOOLEAN/SWAP keys harvested via use_figma — exact hashed form required by setProperties() -->
<!-- SINGLE SOURCE OF TRUTH: never look up property keys live for components listed here -->
<!-- Short names (no #hash) DO NOT WORK in setProperties() — always use the full key from this file -->

## Quick Usage Pattern

```js
// Import + instantiate
const set = await figma.importComponentSetByKeyAsync('KEY');
const inst = set.defaultVariant.createInstance();
parent.appendChild(inst);

// Set VARIANT / BOOLEAN (short names work here)
inst.setProperties({ 'Form Factor': 'Compact', 'Type': 'Secondary' });

// Set TEXT — MUST use full hashed key (e.g. "✏️ Text#145508:461")
inst.setProperties({ '✏️ Text#145508:461': 'My label' });

// INSTANCE_SWAP — pass icon component.id
inst.setProperties({ 'Icon#112533:584': myIcon.id });

// Components with NO TEXT prop → inject via sub-layer text node
const t = inst.findOne(n => n.type === 'TEXT');
if (t) { await figma.loadFontAsync(t.fontName); t.characters = 'Ready'; }

// After appendChild, set FILL width
inst.layoutSizingHorizontal = 'FILL';
```

## ⚠ NO `Form Factor` prop on these — do NOT setProperties Form Factor:
ObjectStatus · ObjectNumber · ObjectAttribute · ObjectIdentifier · Avatar · Tag · Link · Toast · Breadcrumb · Switch · Progress Indicator · Rating Indicator · Step Input · Slider · Text · Scrollbar

## ⚠ NO TEXT componentProperty — inject text via findOne(TEXT) sub-layer:
ObjectStatus · ObjectNumber · ObjectAttribute · MessageStrip (find n.name==="Text Message")

## ⛔ Dialog = NATIVE FRAME (not a component instance in MCP)
Never call importComponentSetByKeyAsync for a screen-level dialog.
Build: native VBOX + border(#E5E5E5) + cornerRadius:8 + dropShadow.
Clone source: node 727:42563 in file p7zm5EMBk5DRRZdxNeJ4f5.

---

## BUTTONS

### Button
**Key:** `91805fa199b1fd247d76a9c08bbe0982b49065c4`

| Prop | Type | Key / Options |
|---|---|---|
| Text | TEXT | `✏️ Text#145508:461` |
| Type | VARIANT | Primary / Secondary / Accept / Reject / Attention / Tertiary |
| Form Factor | VARIANT | **Compact** / Cozy |
| Interaction State | VARIANT | Regular / Hover / Down / Disabled |
| Toggled | VARIANT | False / True |
| Counter Badge | VARIANT | False / True |
| Icon Left | BOOLEAN | `Icon Left#112533:293` — enables left icon |
| Icon | INSTANCE_SWAP | `Icon#112533:487` — icon component.id |
| Attention Badge | BOOLEAN | `Attention Badge#269292:0` |

### IconButton
**Key:** `c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63`
> Always use Type=Tertiary for toolbar/action icon buttons (RULE)

| Prop | Type | Key / Options |
|---|---|---|
| Icon | INSTANCE_SWAP | `Icon#112533:584` — icon component.id |
| Type | VARIANT | Primary / Secondary / **Tertiary** |
| Form Factor | VARIANT | **Compact** / Cozy |
| Interaction State | VARIANT | Regular / Hover / Down / Disabled |
| Toggled | VARIANT | False / True |
| Counter Badge | VARIANT | False / True |
| Attention Badge | BOOLEAN | `Attention Badge#112533:390` |

### MenuButton
**Key:** `1d667088d93c355c2bd9bafac57147286206e799`

| Prop | Type | Key / Options |
|---|---|---|
| Text | TEXT | `✏️ Text#145508:546` |
| Type | VARIANT | Primary / Secondary / Accept / Reject / Attention / Tertiary |
| Form Factor | VARIANT | **Compact** / Cozy |
| Interaction State | VARIANT | Regular / Hover / Down / Disabled |
| Icon Left | BOOLEAN | `Icon Left#112572:0` |
| Icon | INSTANCE_SWAP | `Icon#112572:97` |

### SegmentedButton
**Key:** `308476a5285b5a132241dc1c118d09ecf8d82273`
> Enable 3rd/4th Button booleans, then inject labels into slot frames

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | **Compact** / Cozy |
| Type | VARIANT | Text / Icon |
| 3rd Button | BOOLEAN | `3rd Button#167915:5` |
| 4th Button | BOOLEAN | `4th Button#167915:10` |
| 5th Button | BOOLEAN | `5th Button#167915:15` |
| ⿻ Text Segments Compact | SLOT | `⿻ Text Segments Compact#425845:10` |
| ⿻ Icon Segments Compact | SLOT | `⿻ Icon Segments Compact#425845:15` |

---

## INPUTS & FORM FIELDS

### Input
**Key:** `0f4366cb3065919e8f3deb0462f1a5a3633d6b50`

| Prop | Type | Key / Options |
|---|---|---|
| Typed Text | TEXT | `✏️ Typed Text#145437:221` |
| Placeholder | TEXT | `✏️ Placeholder#145437:156` |
| Description Text | TEXT | `✏️ Description Text#267656:0` |
| Form Factor | VARIANT | **Compact** / Cozy |
| Content | VARIANT | Placeholder / Typed Text |
| Value State | VARIANT | **None** / Negative / Critical / Positive / Information |
| Interaction State | VARIANT | Regular / Hover / Active / Read Only / Disabled |
| Trailing Action | BOOLEAN | `Trailing Action#144344:0` |
| 2nd Action | BOOLEAN | `2nd Action#144344:3` |
| Message Popover | BOOLEAN | `Message Popover#154602:0` |
| Description Text (show) | BOOLEAN | `Description Text#267637:0` |

### Select
**Key:** `5ce369ff7fb0cce28984eec8dd9973ccde82facb`

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | **Compact** / Cozy |
| Drop-Down | VARIANT | **False** / True |

### CheckBox
**Key:** `23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071`

| Prop | Type | Key / Options |
|---|---|---|
| Text | TEXT | `✏️ Text#154638:49` |
| Form Factor | VARIANT | **Compact** / Cozy |
| Check | VARIANT | **Unchecked** / Checked / Tristate |
| Value State | VARIANT | None / Information / Positive / Critical / Negative |
| Interaction State | VARIANT | Regular / Hover / Disabled / Read Only / Display Only |
| Label | BOOLEAN | `Label#125545:8` — show label text |

### RadioButton
**Key:** `9308f27ef27fbb28bc7d167c52494aa41a21610f`

| Prop | Type | Key / Options |
|---|---|---|
| Text | TEXT | `✏️ Text#154638:0` |
| Form Factor | VARIANT | **Compact** / Cozy |
| Selected | VARIANT | **False** / True |
| Value State | VARIANT | None / Information / Positive / Critical / Negative |
| Interaction State | VARIANT | Regular / Hover / Disabled / Read Only |
| Label | BOOLEAN | `Label#125545:8` |

### DatePicker
**Key:** `ad1f84e6293671f80ff8dd174b1da0cbacf0fa48`
> Always set Calendar=false to hide the calendar overlay

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | **Compact** / Cozy |
| Type | VARIANT | **One-Month** / Two-Month |
| Orientation | VARIANT | **N/A** / Horizontal / Vertical |
| Calendar | BOOLEAN | `Calendar#165202:0` — **set false to hide** |

### Label
**Key:** `b38ac753648ad298c1e2dd02d71417566dd6095c`

| Prop | Type | Key / Options |
|---|---|---|
| Label Text | TEXT | `✏️ Label#237212:48` |
| Type | VARIANT | Regular |
| Required | BOOLEAN | `Required#104646:0` |

---

## DISPLAY COMPONENTS

### ObjectStatus
**Key:** `748d609ead5d4a246d7cd7c144b94b518c467e58`
> ⚠ No Form Factor prop · No TEXT prop — inject text via findOne(TEXT)

| Prop | Type | Key / Options |
|---|---|---|
| Semantic | VARIANT | **None** / Information / **Success** / Warning / Error |
| Inverted | VARIANT | **No** / Yes |
| Large Design | VARIANT | **No** / Yes |

### ObjectNumber
**Key:** `7b67d22ed19f246b708dc4664808a45f314a7414`
> ⚠ No Form Factor · No TEXT prop — inject via findOne(TEXT)

| Prop | Type | Key / Options |
|---|---|---|
| Type | VARIANT | **Regular** / Emphasized / Large / Inverted |
| Semantic | VARIANT | None / Information / Success / Warning / **Error** |

### ObjectAttribute
**Key:** `080ead216322befe153704bf8f11373158fea34a`
> ⚠ No Form Factor · No TEXT prop — inject via findOne(TEXT)

| Prop | Type | Key / Options |
|---|---|---|
| Type | VARIANT | **Regular** / Active |

### MessageStrip
**Key:** `f0e77f8888796e35c0e791ddc0b38535eda6ec31`
> ⚠ No TEXT prop — inject text via: inst.findOne(n => n.name === "Text Message")
> ⚠ No "Type" prop — use Value State. Warning = **Critical**

| Prop | Type | Key / Options |
|---|---|---|
| Value State | VARIANT | **Information** / **Critical** (=Warning) / Negative / Positive / Indication Color |
| Icon | VARIANT | **True** / False |
| Color | VARIANT | None / Indication 1–10 (+ b variants) |
| Close Button | BOOLEAN | `Close Button#102938:0` |

### Avatar
**Key:** `71a3389ecbd47822b3184700766e30963fc2f220`
> ⚠ No Form Factor prop

| Prop | Type | Key / Options |
|---|---|---|
| Initials | TEXT | `✏️ Initials#143938:0` |
| Type | VARIANT | **Image** / Icon / **Initials** |
| Size | VARIANT | XS / **S** / M / L / **XL** |
| Color | VARIANT | Image / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / Transparent / Tile / Placeholder |
| Content | VARIANT | **Person** / Object |
| Interaction State | VARIANT | Regular / Hover / Active / Toggled Hover / Disabled |
| Badge | BOOLEAN | `Badge#98694:0` |
| Optional Border | BOOLEAN | `Optional Border#98694:211` |
| Person Icon | INSTANCE_SWAP | `Person Icon#112262:148` |
| Object Icon | INSTANCE_SWAP | `Object Icon#114257:7` |

### Tag
**Key:** `20c3d78c97a2a1f8d63f8cdf85cba49a028a96ea`
> ⚠ No Form Factor prop

| Prop | Type | Key / Options |
|---|---|---|
| Value State | VARIANT | None / Information / Success / Warning / Error |
| Interaction State | VARIANT | Active / Hover / Regular |

### Link
**Key:** `2e67b5399e9f05950c6f6ea6f244a1a9736c8a56`
> ⚠ No Form Factor prop

| Prop | Type | Key / Options |
|---|---|---|
| Text | TEXT | `✏️ Text#142188:0` |
| Type | VARIANT | **Regular** / Emphasized / Subtle / Icon Link |
| Interaction State | VARIANT | Regular / Hover / Visited / Down / Disabled |
| Icon Position | VARIANT | Left / Right / **N/A** |
| Icon | INSTANCE_SWAP | `Icon#283747:121` |

---

## LAYOUT & NAVIGATION

### ShellBar
**Key:** `169cfd74c0be329c56b4c79b9404c978ff10cb60`

| Prop | Type | Key / Options |
|---|---|---|
| Size | VARIANT | S / M / L / **XL** / XXL |
| Hamburger | VARIANT | **False** / True |
| Overflow | BOOLEAN | `Overflow#285285:0` |
| Notification | BOOLEAN | `Notification#285285:11` |
| Help | BOOLEAN | `Help#285285:22` |
| Shell Search | BOOLEAN | `Shell Search#328265:0` |
| Product Switch | BOOLEAN | `Product Switch#285220:27` |
| Back Button | BOOLEAN | `Back Button#104186:9` |
| ⿻ Extra Left Area | SLOT | `⿻   Extra Left Area#422659:0` |
| ⿻ Extra Right Area | SLOT | `⿻ Extra Right Area#422659:11` |

### DynamicPageHeader
**Key:** `dc90c8dbf7714f165ed79357e9ba6ade5b3701ae`

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | **Compact** / Cozy |
| Size | VARIANT | S / M / L / **XL and XXL** |
| Collapsed | VARIANT | True / **False** |
| Interaction State | VARIANT | **Regular** / Hover |
| Expand and Pin Buttons | BOOLEAN | `Expand and Pin Buttons#416566:0` |
| Header Shadow | BOOLEAN | `Header Shadow#416566:18` |
| ⿻ Content | SLOT | `⿻ Content#416566:6` |
| ⿻ Header Area | SLOT | `⿻ Header Area#416566:9` |

### IconTabBar
**Key:** `4aafcbf55528c439876b314d155438884b614722`

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | Cozy / **Compact** / N/A |
| Type | VARIANT | **Inline Mode** / Icon Only / Process Tabs / Shell Navigation / Filter Tabs |
| Semantic | VARIANT | **No** / Yes |
| Size | VARIANT | **S** / M and L / XL |
| Overflow | BOOLEAN | `Overflow#103133:0` |
| ⿻ Tabs Inline Non Semantic | SLOT | `⿻ Tabs Inline, Non Semantic#425676:0` |
| ⿻ Tabs Inline Semantic | SLOT | `⿻ Tabs Inline, Semantic#426727:0` |
| ⿻ Tabs Icon Only Compact | SLOT | `⿻ Tabs Icon Only, Non Semantic, Compact#426736:0` |
| ⿻ Tabs Process Compact | SLOT | `⿻ Tabs Process, Non Semantic, Compact#426762:92` |
| ⿻ Tabs Filter Compact | SLOT | `⿻ Tabs Filter Tabs, Non Semantic, Compact#426762:184` |

### SideNavigation
⛔ DEAD KEY (404) — do not use: `a2c4e73b0d9f817f6e3b4a26f8d9e4c7b2a1c308`
> Use manifest §3 live key instead. Clone from node 701:119633 (p7zm5EMBk5DRRZdxNeJ4f5) for slot injection.

### Panel
**Key:** `4d19c2a24896033fe5b04bcc5dfdf43e9626283d`

| Prop | Type | Key / Options |
|---|---|---|
| Title | TEXT | `✏️ Title#145524:0` |
| Form Factor | VARIANT | **Compact** / Cozy |
| Collapsed | VARIANT | **False** / True |
| Fixed | VARIANT | **False** / True |
| ⿻ Content | SLOT | `⿻  Content#422655:24` |
| 1st Action | BOOLEAN | `1st Action#146223:28` |
| 2nd Action | BOOLEAN | `2nd Action#146223:21` |
| 3rd Action | BOOLEAN | `3rd Action#146223:14` |
| 4th Action | BOOLEAN | `4th Action#146223:7` |

### Toolbar
**Key:** `58a258bf5813e59cec4dfc684c8cdb2a6ca6721f`

| Prop | Type | Key / Options |
|---|---|---|
| Title Text | TEXT | `✏️ Title Text#186490:0` |
| Form Factor | VARIANT | **Compact** / Cozy |
| Title | BOOLEAN | `Title#186167:0` |
| 1st Action | BOOLEAN | `1st Action#186482:6` |
| 2nd Action | BOOLEAN | `2nd Action#186482:9` |
| 3rd Action | BOOLEAN | `3rd Action#186464:3` |
| 4th–13th Action | BOOLEAN | `4th Action#186601:9` … `13th Action#186601:42` |
| Segmented Button | BOOLEAN | `Segmented Button#186514:15` |
| Input | BOOLEAN | `Input#186514:12` |
| ⿻ Actions Compact | SLOT | `⿻ Actions Compact#425685:6` |
| ⿻ Left Area | SLOT | `⿻ Left Area#425685:12` |
| ⿻ Actions Cozy | SLOT | `⿻ Actions Cozy#427338:3` |

---

## LISTS & TABLES

### Table
**Key:** `03ea321822c4e99c27de4d9c2524bdec9c6e0972`

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | **Compact** / Cozy |
| Structure | VARIANT | **Columns** / Rows |
| Highlight | BOOLEAN | `Highlight#200542:0` |
| ⿻ Columns Compact | SLOT | `⿻ Columns Compact#426001:0` |
| ⿻ Rows Compact | SLOT | `⿻ Rows Compact#426001:5` |
| ⿻ Columns Cozy | SLOT | `⿻ Columns Cozy#426001:10` |
| ⿻ Rows Cozy | SLOT | `⿻ Rows Cozy#426001:15` |

### List
**Key:** `4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25`

| Prop | Type | Key / Options |
|---|---|---|
| Form Factor | VARIANT | **Compact** / Cozy |
| ⿻ List Items Compact | SLOT | `⿻ List Items Compact#427968:0` |
| ⿻ List Items Cozy | SLOT | `⿻ List Items Cozy#427968:3` |

### StandardListItem
**Key:** `f7bc6526a9f16608747a4141800146ebd3f4e835`

| Prop | Type | Key / Options |
|---|---|---|
| Text | TEXT | `✏️ Text#152462:90` |
| Byline | TEXT | `✏️ Byline#152704:108` |
| Counter Value | TEXT | `✏️ Counter Value#152451:54` |
| Group Name | TEXT | `✏️ Group Name#152767:195` |
| Footer Text | TEXT | `✏️ Footer Text#152767:225` |
| Growing Text | TEXT | `✏️ Growing Text#155999:31` |
| Form Factor | VARIANT | **Compact** / Cozy / N/A |
| Type | VARIANT | **Single Line** / Byline / List Header / Group Header / Growing List Item / Footer |
| Interaction State | VARIANT | **Regular** / Hover / Down / N/A |
| Selected | VARIANT | **False** / True |
| Separator | BOOLEAN | `Separator#123475:0` |
| Leading Icon | BOOLEAN | `Leading Icon#147034:54` |
| Navigation Indicator | BOOLEAN | `Navigation Indicator#147034:36` |
| Selector | BOOLEAN | `Selector#147034:72` |
| Trailing Icon | BOOLEAN | `Trailing Icon#147034:144` |
| Object Status | BOOLEAN | `Object Status#155958:0` |
| Leading Icon Swap | INSTANCE_SWAP | `Leading Icon Swap#152431:18` |
| Trailing Icon Swap | INSTANCE_SWAP | `Trailing Icon Swap#155542:7` |
| ⿻ Content | SLOT | `⿻ Content#415971:0` |

---

## ICON KEYS (importComponentByKeyAsync — single component, not set)

| Icon name | Key |
|---|---|
| home | `ddf4537c2f792179f11f64cae869cd1241e5ec7e` |
| favorite-list | `54a20db7cb800219f99739af69d8195b2c7beedd` |
| gear | `265629e8409332355482d6b3cf1d03f664f3880d` |
| edit (pencil) | `b346b05bc52f9d648ead280cfbd17baacea391f2` |
| delete (trash) | `6da9bfb78bb57cc96d015531ac16e201423d8558` |
| show (eye) | `f4d889dde94203c7d563db1cde8ec8ae695395bd` |
| date-time | `f8211de35a7e07c14fa178fa3769db7b16306f11` |
| add-calendar | `035388107a60472d49a67c55e79c775c24239330` |
| slim-arrow-right | `3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d` |
| slim-arrow-down | `d206a924630cb08c1b62f4c2ddef383b8142e519` |
| wrench | `75f0fa42efe3014f303b55ca1b4f37552f592af1` |
| overflow/more | `6a0c2f0be4be541cc17870a7a633b19e3cb2d1df` |
| crm-sales | `3d74518d3f5035e8343bde96de99bd24a44fe079` |
| customer-and-contacts | `5b7cfcdaad20640db22b7b6396b8a744d3b1d9fd` |

> For icons not listed: run plugin "Harvest Icon Keys" or use importComponentByKeyAsync with assetKey from SAP-COMPONENT-REGISTRY.md.

---

## SAP TOKENS — Horizon Light (exact hex for use_figma fills)

| Token name | Hex | r,g,b (0–1) | Use |
|---|---|---|---|
| sapBackgroundColor | #F5F6F7 | 0.961, 0.965, 0.969 | Page / dialog background |
| sapShellColor | #FFFFFF | 1, 1, 1 | Surface / section white |
| sapList_Background | #FFFFFF | 1, 1, 1 | Table / list rows |
| sapList_BorderColor | #E5E5E5 | 0.898, 0.898, 0.898 | Dividers / borders |
| sapTitleColor | #1D2D3E | 0.114, 0.176, 0.243 | Page titles H1 |
| sapList_TextColor | #131E29 | 0.075, 0.118, 0.161 | Body / table text |
| sapContent_LabelColor | #556B82 | 0.333, 0.420, 0.510 | Labels / captions |
| sapButton_Emphasized_Background | #0070F2 | 0, 0.439, 0.949 | Primary button bg |
| sapPositiveTextColor | #1E8F56 | 0.118, 0.561, 0.337 | Success text |
| sapCriticalTextColor | #DF7B01 | 0.875, 0.482, 0.004 | Warning text |
| sapNegativeTextColor | #BB0000 | 0.733, 0, 0 | Error text |
| sapInformativeTextColor | #0064D9 | 0, 0.392, 0.851 | Info text |
| sapLinkColor | #0064D9 | 0, 0.392, 0.851 | Links |

---

## TYPOGRAPHY ROLES — native createText() nodes

| Tag | Size | Weight | Use |
|---|---|---|---|
| `[typo:heading]` | 20px | Bold | Page title H1 |
| `[typo:title]` | 16px | Bold | Section heading |
| `[typo:subtitle]` | 14px | Regular | Subtitle |
| `[typo:labelBold]` | 14px | Bold | Values, emphasis |
| `[typo:label]` | 14px | Regular | Form labels |
| `[typo:body]` | 14px | Regular | Body text |
| `[typo:tableHeader]` | 13px | Bold | Column headers |
| `[typo:caption]` | 12px | Regular | Timestamps, meta |

> Every native createText() node name MUST include [typo:role] — Bind plugin uses this to apply SAP text styles.


---

## COMPLETE COMPONENT SET INDEX — all 139 (assetKey for importComponentSetByKeyAsync)

> The components with detailed property tables above are the 24 most-used. Every remaining kit component set is listed here with its key + variant props.
> For a component's full BOOLEAN/SLOT/TEXT keys, create the instance and read `set.componentPropertyDefinitions` — or ask to harvest it into the detailed section.

### Avatar
| Component | Key | Variants |
|---|---|---|
| Avatar ⭐ | `71a3389ecbd47822b3184700766e30963fc2f220` | Type=Image/Icon/Initials · Interaction State=Regular/Hover/Active/Toggled Hover · Conte… |
| Avatar Badge | `51e6293e8c85efccecd24db4e06563cf91135cb1` | Size=XL and Bigger/L/M and Smaller · Value State=None/Positive/Critical/Negative · Colo… |
| Avatar Group | `6a0aaf6146d77af3f51fbfa3fefa879ea25bc167` | Type=Group/Individual · Interaction State=Regular/Hover/Active/Toggled Hover · Size=XS/… |
### Bars
| Component | Key | Variants |
|---|---|---|
| Footer | `e563bc3291a07a5eb4d97b2083355cc54023c377` | Form Factor=Compact/Cozy · Type=Footer/Floating Footer |
| Header | `d4560b56c7b5aa9476e6b23bfaf869166b7fff47` | Form Factor=Compact/Cozy · Type=Title/Title with back button/Error/Warning |
### Breadcrumb
| Component | Key | Variants |
|---|---|---|
| Breadcrumb | `5743166bac11fdf110a54fd7d85436fed186d3b2` | Overflow=False/True · Popover=False/True |
### Busy Indicator
| Component | Key | Variants |
|---|---|---|
| Animated Busy Indicator | `0ab83b6053ab4cc53135dd1cc72ac37ed0c0b984` | Size=Small/Medium/Large |
| Busy Indicator | `e328630d6c564d1f312256254e0543d41bacbb84` | Size=Small/Medium/Large |
| Busy Indicator Dot | `f5778faa7a1014cd3f64b56ae554927c9386fc96` | Size=XXS/XS/S/M |
### Buttons
| Component | Key | Variants |
|---|---|---|
| Button ⭐ | `91805fa199b1fd247d76a9c08bbe0982b49065c4` | Form Factor=Compact/Cozy · Type=Primary/Secondary/Accept/Reject · Interaction State=Reg… |
| Button Badge | `3e1f709f433a935f42e51361f06f4382fcc87eed` | Form Factor=Compact/Cozy/N/A · Type=Attention Badge/Counter Badge |
| Icon Button | `c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63` | Form Factor=Compact/Cozy · Type=Primary/Secondary/Tertiary · Interaction State=Regular/… |
| Icon Menu Button | `c455c46ed2cea345c534193c1598e5459aaadd11` | Form Factor=Compact/Cozy · Type=Primary/Secondary/Tertiary · Interaction State=Regular/… |
| Icon Split Button | `9afdf08f8ae226b175d0a3be79f24454d4b12928` | Form Factor=Compact/Cozy · Type=Primary/Secondary/Tertiary · Left Interaction State=Reg… |
| Menu Button ⭐ | `1d667088d93c355c2bd9bafac57147286206e799` | Form Factor=Compact/Cozy · Type=Primary/Secondary/Accept/Reject · Interaction State=Reg… |
| Segmented Button ⭐ | `308476a5285b5a132241dc1c118d09ecf8d82273` | Form Factor=Compact/Cozy · Type=Text/Icon |
| Segmented Button Singular | `48543fa02ef1fb57b829cd3feb92b21f618e693a` | Form Factor=Compact/Cozy · Type=Icon/Text · Interaction State=Regular/Hover/Down/Disabled |
| Split Button | `8aba512152f89d81e9c9b804d8da3114b1a83a93` | Form Factor=Compact/Cozy · Type=Primary/Secondary/Accept/Reject · Left Interaction Stat… |
### Calendar
| Component | Key | Variants |
|---|---|---|
| Calendar | `16743cba69c57792417e8f6b51d347cc29bd2d95` | Form Factor=Compact/Cozy · Selection=Day/Month/Year/Year Range · Mixed Calendar=False/True |
| Calendar Date Types | `f1bc2531da1359d378b30d7e77aed0871860fcd6` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Disabled · Day=Work Day/Non-… |
| Legend Item | `17121720df001ce4519e88e0be53a87f8a8d5ade` | Day Type=Today/Selected/Work Day/Non-Work Day |
| Mixed Calendar Button | `13d82218f6ea8486c962a686688bd883854e9a5e` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Down/Disabled · Toggled=True… |
| Two-Month Calendar | `ad5ce462d34460d73eda13cd7ea3e2677fc27048` | Form Factor=Compact/Cozy · Selection=Day/Month/Year/Year Range · Layout=Horizontal/Vert… |
### Card
| Component | Key | Variants |
|---|---|---|
| Banner | `64034a60b543539b407e8534b05454add9a49baf` | Type=Text Block with Image/Text Container on Image/Text on Colorful Background |
| Card | `76fbadb97db272943b14aff18ee5809d0360795f` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover · ▶️ Interactive Header=True… |
| Card Badge | `faba12964cad31f90762107683e4de4076d80c15` | Color=Default/Indication 1/Indication 2/Indication 3 |
| Card Extended Header | `afb650e10ee7351cf96c6d23760327363878613c` | Form Factor=Compact/Cozy |
| Card Footer | `b8c16272d1c8537bb36d78e61ffd6b989e6ed894` | Form Factor=Compact/Cozy |
| Card Main Header | `d20f393387802cbd209a35144b63cb141071d425` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Active |
| Card Media Block | `0e527d14fcf51a06dbf14c007f665cbe120761b9` | Type=Image/Image with Padding/Title |
| Card Timestamp and Counter | `139b8dd3708af7c5e33d40a0b8f197fd77c1bf55` | Type=Counter/Timestamp |
### Carousel
| Component | Key | Variants |
|---|---|---|
| Carousel | `bf174ffb841e4b27947d0be558656bb80238fe0d` | Indicator Position=Bottom/Top · Buttons Position=On Bar/On Image · On Content=False/True |
| On Content Page Indicator | `3d231b180bc3714fb77579ff247ac80034930afe` | Type=Dots/Numbers/Hidden |
| Page Indicator | `3e63ec191515e58a2d415d116859ffb258200212` | Type=Dots/Numbers |
| Page Indicator Dots | `af2036b3b2522c651423b627b9131bbb77ed31f1` | Selected=True/False |
### Check Box
| Component | Key | Variants |
|---|---|---|
| Check Box ⭐ | `23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Disabled/Read Only · Value S… |
### Color Palette
| Component | Key | Variants |
|---|---|---|
| Color Palette | `069afa265e88bd027cd6116017c671ed31298293` | Form Factor=Compact/Cozy |
| Swatch | `3b2b7f89d4e9d4d56052ca032a3960f4e6aeebc9` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover / Pressed / Selected · Color… |
### Color Picker
| Component | Key | Variants |
|---|---|---|
| Color Picker | `da4ac5fe23880bbdefabbf0059891eb289b5a52a` | Form Factor=Compact/Cozy · Gradient Field=Blue Hue/Red Hue |
| Color Picker Color Mode Panel | `e919349b1d24b93b604545642264832be781b51c` | Color Mode=HSLA/RGB · Form Factor=Compact/Cozy |
| Color Picker Comparison Color Fields | `ded942d4b81f74b8c71ad35b2f4993e819cae7d1` | Form Factor=Compact/Cozy · Color=Blue/Red |
| Color Picker Slider | `8add25e353e79555009489541ac15ffef58e6dc3` | Form Factor=Compact/Cozy · Color=Blue/Red · Percentage=30%/100% |
### Date (Range) Picker
| Component | Key | Variants |
|---|---|---|
| Date (Range) Picker ⭐ | `ad1f84e6293671f80ff8dd174b1da0cbacf0fa48` | Form Factor=Compact/Cozy · Type=One-Month/Two-Month · Orientation=N/A/Horizontal/Vertical |
### Date Time Picker
| Component | Key | Variants |
|---|---|---|
| Date Time Dropdown | `535a20585281f1d3fd2aa056260a6986d883f9e8` | Form Factor=Compact/Cozy · Type=Date and Time/Date/Time |
| Date Time Picker | `377d76d309f4e5ee7e12132eba0df4e29686a4f7` | Form Factor=Compact/Cozy · Dropdown=False/True |
### Dialog
| Component | Key | Variants |
|---|---|---|
| Dialog | `5b965b1eda133ac521b42fa20b201e9491f4bf83` | Form Factor=Compact/Cozy · Scrollable Content=False/True |
### Dynamic Page Header
| Component | Key | Variants |
|---|---|---|
| Dynamic Page Header ⭐ | `dc90c8dbf7714f165ed79357e9ba6ade5b3701ae` | Form Factor=Compact/Cozy · Size=S/M/L/XL and XXL · Interaction State=Regular/Hover |
| Expand / Collapse and Pin Buttons | `459b2167d1ce63b2dc1c7da01676aa3f29c49fa2` | Header Behaviour=Collapsed/Expanded · Pin Button=True/False |
### File Uploader
| Component | Key | Variants |
|---|---|---|
| File Uploader | `b7532a6da2cb7677348b5d4bbb81952c9224e984` | Form Factor=Compact/Cozy · Text=Placeholder/Uploaded File |
### Form
| Component | Key | Variants |
|---|---|---|
| Form | `6603eb3ebde2c1c763f2ae450df2cbb799ba640d` | Type=4:8 Horizontal with groups/4:7:1 Horizontal/Vertical with groups/Vertical · Form F… |
| Form Item | `1ddf647c238f6e94a75b886bc1fcf2e45d74a547` | Type=Input/Tokenizer/Text Area/Check Box · Form Factor=Compact/Cozy/N/A · Mode=Edit Mod… |
### Grid
| Component | Key | Variants |
|---|---|---|
| Grid Layout | `9f4187c277b114612743e2a4a6d146f763517a65` | Screen Size=L/M/S/XL · Type=Application/Home |
### Homepage Hero Banner
| Component | Key | Variants |
|---|---|---|
| Homepage Hero Banner | `6b540d39a63d837e652b82675136e991ebdd0192` | Size=XS/S/M/L · Form Factor=Compact/Cozy · Variation=True/False |
### Illustrated Message
| Component | Key | Variants |
|---|---|---|
| Illustrated Message | `eba579505df21536654910797f94b3784248807b` | Form Factor=Compact/Cozy · Size=Extra Small (XS)/Small (S)/Medium (M)/Large (L) |
### Input
| Component | Key | Variants |
|---|---|---|
| Input ⭐ | `0f4366cb3065919e8f3deb0462f1a5a3633d6b50` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Active/Read Only · Value Sta… |
| Input Button | `cde8a0d2581cbe7561c99a10457123bfe8fe42f2` | Interaction State=Regular/Hover/Active/Disabled · Value State=None/Negative/Critical/Po… |
| Input Message Popover | `1acdc092cfb399b0c33d1d6484c77ae58fe75242` | Value State=Negative/Critical/Positive/Information |
### Label
| Component | Key | Variants |
|---|---|---|
| Label ⭐ | `b38ac753648ad298c1e2dd02d71417566dd6095c` | Type=Regular |
### Link
| Component | Key | Variants |
|---|---|---|
| Link ⭐ | `2e67b5399e9f05950c6f6ea6f244a1a9736c8a56` | Type=Regular/Emphasized/Subtle/Icon Link · Interaction State=Regular/Hover/Visited/Down… |
### List
| Component | Key | Variants |
|---|---|---|
| List ⭐ | `4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25` | Form Factor=Compact/Cozy |
| List Attachment | `e394409638f79174366eb586a41a1214986e68ee` | Type=Attachment/Object Status |
| List Item ⭐ | `f7bc6526a9f16608747a4141800146ebd3f4e835` | Form Factor=Compact/Cozy/N/A · Type=List Header/Group Header/Single Line/Byline · Inter… |
| List Thumbnail | `d28077bc628b705c17445b910ca36f707a22dfb5` | Thumbnail=Avatar/Icon |
| Selector | `1e995040306b20c0eb707ceb613737b8971b4365` | Form Factor=Compact/Cozy · Selector Type=Check Box/Radio Button · Selected=Selected/Tri… |
### Menu
| Component | Key | Variants |
|---|---|---|
| Menu | `ba51eb54cba79d6795057e5df5ff853d361ee799` | Form Factor=Compact/Cozy |
| Menu List Item | `689013924aedb868b8d65be6f249643d45e00a44` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Down/Disabled · Selected=Fal… |
| Trailing Container | `09d417201eba5efb296df84af4c1f848bc8d7b80` | Form Factor=Compact/Cozy · Type=Shortcut/Arrow/Checkmark |
### Message Strip
| Component | Key | Variants |
|---|---|---|
| Message Strip ⭐ | `f0e77f8888796e35c0e791ddc0b38535eda6ec31` | Value State=Information/Positive/Critical/Negative · Icon=True/False · Color=None/Indic… |
| Message Strip Icon Button | `32538ec27bd700ea577639cb301f64ae3a29078f` | Interaction State=Regular/Hover/Down · Type=Indication 1 to 10/Indication 1b to 10b |
### Multi Combobox
| Component | Key | Variants |
|---|---|---|
| Multi Combobox | `cc0631141a7083096632c6161ee15448ced39ec3` | Form Factor=Compact/Cozy · Drop-Down=True/False |
### Multi Input
| Component | Key | Variants |
|---|---|---|
| Multi Input | `1dac6b2be28e60c6ff7a5752182d97f5033d3fc8` | Form Factor=Compact/Cozy · Display Only=False/True |
### Notifications
| Component | Key | Variants |
|---|---|---|
| Notification Banner | `aa8ef403a7c765acf86d2e6fc887a6cb496a3371` | Size=S/M / L |
| Notification List Item | `6fe89ae5f6a512bebad2f9737ed134bccac1faed` | Form Factor=N/A/Compact/Cozy · Interaction State=Regular/Hover/Down · Selected=False/True |
| Notifications | `af1b29be8db435ed790d87721cff4d7efe2217bd` | Size=S/M / L · Scrollbar=False/True |
| Notifications Growing Item | `b64369bba447338dfcf54f408d43c6fd6ee211f1` | Interaction State=Regular/Hover/Down · Busy Indicator=True/False |
| Notifications Status Indicator | `4e94f59dfaccfbb6edbb9d6d0fc56d2fbbcea245` | Type=Positive/Negative/Critical/Information |
### Object Attribute
| Component | Key | Variants |
|---|---|---|
| Object Attribute ⭐ | `080ead216322befe153704bf8f11373158fea34a` | Type=Regular/Active |
### Object Identifier
| Component | Key | Variants |
|---|---|---|
| Object Identifier ⭐ | `8e1e45c5a89b540f6ec53542279c7711d4020d81` | Hover=No/Yes · Link=No/Yes · Emphasis=No/Yes |
### Object Number
| Component | Key | Variants |
|---|---|---|
| Object Number ⭐ | `7b67d22ed19f246b708dc4664808a45f314a7414` | Type=Regular/Emphasized/Large/Inverted · Semantic=None/Information/Success/Warning |
### Object Status
| Component | Key | Variants |
|---|---|---|
| Object Status ⭐ | `748d609ead5d4a246d7cd7c144b94b518c467e58` | Semantic=None/Information/Success/Warning · Inverted=No/Yes · Large Design=No/Yes |
### Panel
| Component | Key | Variants |
|---|---|---|
| Panel ⭐ | `4d19c2a24896033fe5b04bcc5dfdf43e9626283d` | Form Factor=Compact/Cozy · Fixed=False/True · Collapsed=False/True |
### Popover
| Component | Key | Variants |
|---|---|---|
| Popover | `5f472d6482ed33c9967694fa411c675e3b214d39` | Form Factor=Compact/Cozy · Arrow=False/True · Arrow Position=None/↖ Top Left/↑ Top Cent… |
### Product Switch
| Component | Key | Variants |
|---|---|---|
| Product Icon | `2dd0b7bceffa99417d7b589aba9de70fd09c2fd3` | Type=Product Switch Icon/Icon · Size=Small/Large |
| Product Switch | `22a7c83b19c183e92577ec43dd01eaa188739cd9` | Size=Small/Large · Scrollbar=True/False |
| Product Switch Element | `17c7a3c13577e6e0018d65c09d948b07d701df85` | Size=Small/Large · Interaction State=Regular/Hover/Pressed/Selected |
### Progress Indicator
| Component | Key | Variants |
|---|---|---|
| Progress Indicator | `c355f86d77c4e5a8aa2366b83179896f7d172462` | Value State=None/Information/Positive/Critical · Interaction State=Disabled/Regular |
### Radio Button
| Component | Key | Variants |
|---|---|---|
| Radio Button ⭐ | `9308f27ef27fbb28bc7d167c52494aa41a21610f` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Disabled/Read Only · Value S… |
### Rating Indicator
| Component | Key | Variants |
|---|---|---|
| Rating Indicator | `4e75dd8968be7061ba703e3f5fb4364b558acb04` | Form Factor=Compact/Cozy · Interaction State=Regular/Read Only/Disabled |
| Rating Indicator Single | `35cf292c745706e23a621d794dc5e346b2bacfbb` | Form Factor=Compact/Cozy · Interaction State=Hover/Read-Only/Regular · Selected=False/True |
### Scrollbar
| Component | Key | Variants |
|---|---|---|
| Scrollbar | `ccf83f17bfdbce52e81e61d775c4eed5d41b2258` | Interaction State=Regular/Hover |
### Select
| Component | Key | Variants |
|---|---|---|
| Drop-Down | `d74d4ae8eb549d3cc54b7d345e3b17f90c543817` | Form Factor=Compact/Cozy |
| Drop-Down Base | `20f94133bdeced52335c202e20200c79d3e766ea` | Form Factor=Compact/Cozy |
| Drop-Down Item | `8ae33d5baeedff3874688177de1f23bd966d1002` | Form Factor=Cozy/Compact/N/A · Type=Single Line/Group Header · Interaction State=Regula… |
| Drop-Down Value Message Item | `4716ba278a5c3d09e874f85c43370e6b9f3186c5` | Type=Negative/Critical/Positive/Information |
| Select ⭐ | `5ce369ff7fb0cce28984eec8dd9973ccde82facb` | Form Factor=Compact/Cozy · Drop-Down=False/True |
### Settings
| Component | Key | Variants |
|---|---|---|
| Settings | `a337e8f637533682b7a0a8082f6db074c5082c81` | Form Factor=Compact/Cozy |
### Shell Bar
| Component | Key | Variants |
|---|---|---|
| Branding Button | `7d9a2765e4d5fd5d9dc841551d138311b9d7a31b` | Interaction State=Regular/Hover/Active |
| Shell Bar ⭐ | `169cfd74c0be329c56b4c79b9404c978ff10cb60` | Size=S/M/L/XL · Hamburger=False/True |
| Shell Button | `33fc31d716608f54280c869ad21323f1863b4005` | Interaction State=Regular/Hover/Active/Toggled |
| Shell Search | `e60b0ec134635c92ca558125083fe11242997e98` | Interaction State=Regular/Hover/Active/Searched · Expanded=False/True · Selector=False/… |
| Shell Search Button | `4316105b082691ee1014f2a152deca35112f49e0` | Interaction State=Regular/Hover/Active/While Typing |
| Shell Search Selector | `638666324a5f4e850f73c23a15cd8124a51920f5` | Interaction State=Regular/Hover/Hover on Icon/Active · Advanced Filtering=True/False |
### Side Navigation
| Component | Key | Variants |
|---|---|---|
| Navigation Item | `9d0734a384e9b67475e7b5a357e8c32070a7c2ca` | Form Factor=Compact/Cozy/N/A · Type=Navigation Item/Child Item/Navigation Group/Quick C… |
| Side Navigation | `d680af6d72f9421fe3f8712bf0ce171308963d3a` | Form Factor=Compact/Cozy · Type=Collapsed/Expanded/Floating |
### Slider
| Component | Key | Variants |
|---|---|---|
| Range Slider | `34d973fcb4c85d6517c8e5c3079e2b40d14d0fe8` | Form Factor=Compact/Cozy · Interaction State=Disabled/Regular · Left Value=0%/25%/50%/75% |
| Range Slider Handle | `1b9c916117bc532ef17d023a5c7926ad2cabe354` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Down |
| Slider | `ee3b9995f1484c6d008bbac9dba2bd8a0026c160` | Form Factor=Compact/Cozy · Interaction State=Regular/Disabled · Value=0%/25%/50%/75% |
| Slider Handle | `9eb5d2a4acefa98a5db1b746d8cbfaf1e06417a9` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Down |
| Tooltip and Input | `7b831cad640b9d64456b24cca552e4972481024e` | Tooltip / Input=Tooltip/Input · Form Factor=Compact/Cozy |
### Step Input
| Component | Key | Variants |
|---|---|---|
| Step Input | `69f0f7acf68766ac89890d0c119f64bfd50e693a` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Active/Disabled · Value Stat… |
### Switch 
| Component | Key | Variants |
|---|---|---|
| Switch | `c63509f642cdabbeb8c1878dd125ee006481631c` | Form Factor=Compact/Cozy · Type=Non-Semantic/Semantic · Interaction State=Disabled/Hove… |
### Tab Bar
| Component | Key | Variants |
|---|---|---|
| Icon Tab Bar | `4aafcbf55528c439876b314d155438884b614722` | Form Factor=Cozy/Compact/N/A · Type=Inline Mode/Icon Only/Process Tabs/Shell Navigation… |
| Tab ⭐ | `6cce9469ce9de689ee610fc7125b500c0b4421e7` | Form Factor=Compact/Cozy/N/A · Type=Inline/Icon Only/Shell Navigation/Process and Filte… |
| Tab Bar Overflow | `7daa9b988442efaf07553e8f4fe1fa4e8a550c41` | Type='More' Text/Count · Interaction State=Regular/Hover/Down |
### Table
| Component | Key | Variants |
|---|---|---|
| Table ⭐ | `03ea321822c4e99c27de4d9c2524bdec9c6e0972` | Form Factor=Compact/Cozy · Structure=Columns/Rows |
| Table Cell | `e717737e98a40a8619e315ca1b4b04646b93b541` | Form Factor=Compact/Cozy · Hierarchy=Cell/Column Header/Group Header · Type=Text/Check … |
| Table Highlight | `1ce451bc0b726c4cf17cb15977b320253d543ba4` | Value State=Information/Error/Warning/Success |
### Tag
| Component | Key | Variants |
|---|---|---|
| Tag ⭐ | `9b55bf702befd73b2e28f800ee4d0033bc0e0e95` | Interaction State=Regular/Hover/Down · Value State=Information/Positive/Critical/Negati… |
### Text
| Component | Key | Variants |
|---|---|---|
| Text | `56363ecadd65adb509e4549882737234ad652c2d` | Selected=True/False |
### Text Area
| Component | Key | Variants |
|---|---|---|
| Text Area | `bee4738dd5e5856a3b88eae341b47376a3269d87` | Form Factor=Compact/Cozy · Content=Placeholder/Typed Text · Interaction State=Regular/H… |
### Time Picker
| Component | Key | Variants |
|---|---|---|
| Clock-face | `09d8873989d113dde702987f86566691dd2928d9` | Form Factor=Cozy/Compact · Type=12 hours/24 hours/Minutes/Seconds |
| Hours and Minutes Output | `f057e33d74714c78f5981d01d8a5c955dd350644` | Form Factor=Compact/Cozy |
| Number Selector | `5becd6374a0e90c19de672d2d817e5cd4d0257e9` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Selected |
| Tick Mark | `1954dda5aedface7f38494643d3e8d509fe8bafa` | Size=Large/Small |
| Time Dropdown | `046b2b86296a9a57168423671d3ea23833b27b7a` | Form Factor=Compact/Cozy |
| Time Picker | `f07044ee64f4abfc857543051806986d49a54b68` | Form Factor=Compact/Cozy · Dropdown=True/False |
### Toast
| Component | Key | Variants |
|---|---|---|
| Toast | `bbe4c3f7114a2eb4286844102f42c909bf0798eb` | Type=Regular |
### Tokenizer
| Component | Key | Variants |
|---|---|---|
| Overflow Link and Typing  | `0f71952fc797e565f455596a4e4caa44c8318608` | Type=Overflow Link/Typing |
| Token | `5664972429518d07040a3cadfa2d5a28cf19b8a7` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Selected/Selected Hover |
| Tokenizer | `da76d0413ed1f1f40d6f23e7732c9aca0b17ef5b` | Form Factor=Compact/Cozy · Type=Single Line/Multiline · Input=False/True |
### Tool Header
| Component | Key | Variants |
|---|---|---|
| Tool Header | `73a0370a9342211081a4ace445d10ab064963624` | Form Factor=Compact/Cozy |
### Toolbar
| Component | Key | Variants |
|---|---|---|
| Toolbar ⭐ | `58a258bf5813e59cec4dfc684c8cdb2a6ca6721f` | Form Factor=Compact/Cozy |
| Toolbar Items | `ad45e5bf267d83ee320902263db8887f71e97026` | Form Factor=Compact/Cozy · Type=Separator/Spacer (set to fill) |
### Tree
| Component | Key | Variants |
|---|---|---|
| Tree | `93fca87e34305e0a8e036acdd51e7cdc870d4e0d` | Form Factor=Compact/Cozy |
| Tree Item | `5142305385e26387daddd9af7b58a7da66a9f8fd` | Form Factor=Compact/Cozy · Levels=1/2/3/4-6 · Selection=None/Independent/Dependent |
| Tree Item Base | `e857ab95d74c1c163f29a414fcc9b13979332b5c` | Form Factor=Compact/Cozy · Interaction State=Regular/Hover/Active/Disabled · Selected=F… |
### User Menu
| Component | Key | Variants |
|---|---|---|
| User Menu | `c9bbc83c501d55048df4f68df50d920a9e85002c` | Form Factor=Compact/Cozy · Header Content Area=True/False |
| User Menu Custom List Item | `6aff6013fa7332879703327b27f73a71040a849a` | Interaction State=Regular/Hover/Down/Disabled · Selected=True/False |
| User Menu Custom Menu List Item | `8fbd44e86371a90c9626aea06768b5ed4d01238f` | Interaction State=Regular/Hover/Down/Disabled · Selected=False/True |

**Total: 139 component sets. ⭐ = full property table in detailed sections above.**
