---
name: sap-figma-act
description: SAP Figma instant edits. Use for ANY small change to something that already exists — state, border, colour, padding, gap, text, visibility, density, button type (e.g. "check box off", "unselect card border", "gap 12", "button Primary"). One use_figma call, no plan, no screenshot, one-line reply. For new screens, layout changes, or design ideas use sap-figma-agent instead.
---

# SAP Figma — instant edits

**Act at once. First output is the `use_figma` call.** No plan, no restating, no lookups,
no screenshot. All parts of the request in ONE call. Reply in one line: "Checkbox → Unchecked."

Target = `figma.currentPage.selection` (or the node the user linked).

```js
const n = figma.currentPage.selection[0];
// 1-5 lines: set exactly what the user named
return { done: true, changed: '<what you set>' };
```

**State = the instance's own variant prop** (checked against the SAP kit):

| Ask | Prop → value |
|---|---|
| check box on / off | `Check` → `Checked` / `Unchecked` |
| switch on / off | `Checked` → `True` / `False` |
| radio / row selected | `Selected` → `True` / `False` |
| button type | `Type` → `Primary` / `Secondary` / `Tertiary` |
| density | `Form Factor` → `Compact` / `Cozy` |
| field state | `Value State` → `None` / `Negative` / `Critical` / `Positive` / `Information` |
| status | `Semantic` → `Success` / `Error` / `Warning` / `Information` / `None` |
| disabled / read only | `Interaction State` → `Disabled` / `Read Only` / `Regular` |

Set with `inst.setProperties({ Check: 'Unchecked' })`. If the selection is a frame, find the
instance inside: `n.findOne(x => x.type === 'INSTANCE')`. Unsure of a prop name → read
`inst.componentProperties` in the same call.

**Colour = copy a bound paint from a sibling that already has it** (16 ms):
`n.strokes = sib.strokes`. Only if none exists, import by key (1.6 s) and bind:
`figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}}, 'color', v)`.

| Role | Key |
|---|---|
| sapActiveColor (selected border, 2 px) | `8280fcbaf014930076ff69cc352ce47246d4829c` |
| sapList_BorderColor (normal border, 1 px) | `ae5e040923e301aea32233ae118cc187149588b0` |
| sapTextColor | `ddcb06d470abeacc7195a4bd4908b969ac8bad6c` |
| sapField_PlaceholderTextColor | `b83a7b7711f1705c7717a83b6eb5c915298201e8` |
| sapLinkColor | `d3df28203fe7452c7ed42bad054ac10fe75d7751` |
| sapField_SuccessColor | `d58c45eb345a8f440d318289ecfc617c190fc150` |
| sapField_WarningColor | `4cfd933a8462a2fd0951a539a5eea61382a0dc9b` |

**Other:** padding / gap = plain numbers 0/4/8/12/16/24/32 (`itemSpacing`, `paddingLeft`…) ·
text = `await figma.loadFontAsync(t.fontName); t.characters = '…'` (keep its style) ·
hide = `visible = false`. Never raw hex. Never detach. Wrong result → one more call.
