// Run with use_figma on the SAP Web UI Kit. Read-only.
// PART = 'vars' or 'styles' (text/effect/paint styles + collections). For vars, VPART = which ~14KB chunk (-1 = count only).
// Variable encoding: name -> "<key>|<C|F|S|B>|<Morning Horizon value or →alias>" (Horizon Light only).
const PART = 'vars'; const VPART = 0;
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') + (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '');
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const all = (await figma.variables.getLocalVariablesAsync()).sort((a, b) => a.name < b.name ? -1 : 1);
const byId = {}; for (const v of all) byId[v.id] = v;
const light = cols[0].modes[0].modeId;
if (PART === 'vars') {
  const ents = [];
  // Build-relevant groups only. Component-internal tokens (Button/*, Avatar/*, Slider/* …) live inside kit instances.
  const DROP = /^(Additional Variables|Chart|Legend|Illustrative|HighContrast|Internal|Do not use!|Slider|Progress|Scrollbar|Busy|Badge|Tile|Avatar|Button|Assistant|Resource)\//;
  for (const v of all) {
    if (DROP.test(v.name)) continue;
    const val = v.valuesByMode[light] !== undefined ? v.valuesByMode[light] : Object.values(v.valuesByMode)[0];
    let s = val;
    if (val && val.type === 'VARIABLE_ALIAS') s = '→' + (byId[val.id] ? byId[val.id].name : val.id);
    else if (val && typeof val === 'object' && 'r' in val) s = hex(val);
    ents.push([v.name, v.key + '|' + v.resolvedType[0] + '|' + s]);
  }
  const chunks = chunkOf(ents);
  if (VPART < 0) return { parts: chunks.length, total: ents.length };
  const data = Object.fromEntries(chunks[VPART]);
  return { part: VPART, parts: chunks.length, hash: djb2(JSON.stringify(data)), count: chunks[VPART].length, data };
}
const text = {};
for (const s of await figma.getLocalTextStylesAsync()) {
  const lh = s.lineHeight.unit === 'AUTO' ? 'auto' : s.lineHeight.value + (s.lineHeight.unit === 'PERCENT' ? '%' : '');
  text[s.name] = s.key + '|' + s.fontName.family + ' ' + s.fontName.style + '|' + s.fontSize + '|' + lh;
}
const effects = {};
for (const s of await figma.getLocalEffectStylesAsync()) effects[s.name] = s.key;
const paints = {};
for (const s of await figma.getLocalPaintStylesAsync()) paints[s.name] = s.key;
const data = { collections: cols.map(c => ({ name: c.name, key: c.key, modes: c.modes.map(m => m.name) })), text, effects, paints };
return { hash: djb2(JSON.stringify(data)), data };
function djb2(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(16);}
// Split into chunks of <= 14000 JSON chars (use_figma output is cut at ~20KB).
function chunkOf(entries) {
  const chunks = [[]]; let size = 2;
  for (const e of entries) { const s = JSON.stringify(e).length + 1;
    if (size + s > 14000 && chunks[chunks.length - 1].length) { chunks.push([]); size = 2; }
    chunks[chunks.length - 1].push(e); size += s; }
  return chunks;
}
