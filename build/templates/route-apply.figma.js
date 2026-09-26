// route-apply.figma.js — the ACT code. The agent must type as little as possible, so it is
// SAVED once in the file (sharedPluginData) and run with a ~250-char call that passes A.
// gen-router.js fills __SEL__ / __NORMAL__ / __STATES__ from build/router-table.json.
// A = { node, state: 'on'|'off'|'active'|'primary'|…, border: 'selected'|'normal', exclusive, pad, side, gap }
// Measured 2026-09-26: Figma Agent floor ≈ 11 s with NO skill; with this skill 11-14 s ("radio button off").
A = Object.assign({ node: '', state: null, border: '', exclusive: false, pad: null, side: null, gap: null }, A);
const B = { selected: __SEL__, normal: __NORMAL__ }, S = __STATES__;
if (typeof A.state === 'string') A.state = S[A.state];
const sel = figma.currentPage.selection.length ? figma.currentPage.selection : [await figma.getNodeByIdAsync(A.node)];
const done = [];
const setState = async (n, st) => {
for (const i of n.type === 'INSTANCE' ? [n] : n.findAll(x => x.type === 'INSTANCE')) {
const m = await i.getMainComponentAsync(), s = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
const d = (s && s.componentPropertyDefinitions) || {};
const p = st.props.find(p => d[p]), v = p && st.values.find(v => d[p].variantOptions.includes(v));
if (v) { i.setProperties({ [p]: v }); done.push(`${p}=${v}`); } } };
const paint = async (n, [key, w]) => {
let pt = null;
for (const s of n.parent.children) { const id = s !== n && s.strokes && s.strokes[0] && s.strokes[0].boundVariables && s.strokes[0].boundVariables.color && s.strokes[0].boundVariables.color.id;
if (id && (await figma.variables.getVariableByIdAsync(id) || {}).key === key) { pt = s.strokes[0]; break; } }
pt = pt || figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', await figma.variables.importVariableByKeyAsync(key));
n.strokes = [pt]; n.strokeAlign = 'INSIDE'; n.strokeWeight = w; };
for (const n of sel) {
if (A.state) await setState(n, A.state);
if (A.border) { await paint(n, B[A.border]); done.push(`border ${A.border}`); }
if (A.exclusive) for (const o of n.parent.children) if (o !== n && o.type === n.type) {
await paint(o, B.normal); await setState(o, S.off); }
if (A.pad != null) { n.paddingTop = n.paddingRight = n.paddingBottom = n.paddingLeft = A.pad; done.push(`padding ${A.pad}`); }
if (A.side != null) { n.paddingLeft = n.paddingRight = A.side; done.push(`side ${A.side}`); }
if (A.gap != null) { n.itemSpacing = A.gap; done.push(`gap ${A.gap}`); } }
return { done: [...new Set(done)], exclusive: A.exclusive };
