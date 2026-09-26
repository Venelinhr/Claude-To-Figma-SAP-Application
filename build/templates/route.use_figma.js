A = Object.assign({ node: '', state: null, border: '', exclusive: false, pad: null, side: null, gap: null }, A);
const B = { selected: ["226689172d58b3e41784155d818f632f9c7f332b",2], normal: ["ae5e040923e301aea32233ae118cc187149588b0",1] }, S = {"primary":{"props":["Type"],"values":["Primary"]},"secondary":{"props":["Type"],"values":["Secondary"]},"tertiary":{"props":["Type"],"values":["Tertiary"]},"compact":{"props":["Form Factor"],"values":["Compact"]},"cozy":{"props":["Form Factor"],"values":["Cozy"]},"disabled":{"props":["Interaction State"],"values":["Disabled"]},"readonly":{"props":["Interaction State"],"values":["Read Only","Display Only"]},"error":{"props":["Value State","Semantic","State"],"values":["Negative","Error"]},"warning":{"props":["Value State","Semantic","State"],"values":["Critical","Warning"]},"success":{"props":["Value State","Semantic","State"],"values":["Positive","Success"]},"information":{"props":["Value State","Semantic","State"],"values":["Information"]},"off":{"props":["Check","Checked","Selected","Toggled"],"values":["Unchecked","False"]},"active":{"props":["Check","Checked","Selected","Toggled","Interaction State"],"values":["Checked","True","Active"]},"on":{"props":["Check","Checked","Selected","Toggled"],"values":["Checked","True"]}};
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
