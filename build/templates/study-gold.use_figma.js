// study-gold — READ-ONLY. Turns gold-standard SAP screens into compact build facts.
// Set IDS to the node ids of one file. Returns ≤14KB JSON per call.
const IDS = ['__IDS__'];
const out = [];
const r = n => Math.round(n);
async function comp(inst) {
  const mc = await inst.getMainComponentAsync();
  if (!mc) return null;
  const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
  return { name: set ? set.name : mc.name, variant: set ? mc.name : '', remote: mc.remote };
}
async function walk(n, depth, acc) {
  if (n.type === 'INSTANCE') {
    const c = await comp(n);
    if (c) {
      const k = c.name;
      const v = acc.comps[k] || (acc.comps[k] = { n: 0, variants: {}, kit: c.remote });
      v.n++; if (Object.keys(v.variants).length < 4) v.variants[c.variant] = (v.variants[c.variant] || 0) + 1;
      if (acc.tree.length < 60 && depth <= 4) acc.tree.push(`${'  '.repeat(depth)}${k} ${r(n.width)}x${r(n.height)}${c.variant ? ' [' + c.variant.slice(0, 70) + ']' : ''}`);
    }
    return; // don't descend into instances
  }
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    acc.gaps[n.itemSpacing] = (acc.gaps[n.itemSpacing] || 0) + 1;
    const p = `${n.paddingTop}/${n.paddingRight}/${n.paddingBottom}/${n.paddingLeft}`;
    acc.pads[p] = (acc.pads[p] || 0) + 1;
    if (acc.tree.length < 60 && depth <= 4) acc.tree.push(`${'  '.repeat(depth)}[${n.layoutMode[0]} gap${n.itemSpacing} p${p}] "${n.name.slice(0, 30)}" ${r(n.width)}x${r(n.height)}`);
  }
  if (n.type === 'TEXT') {
    const s = n.textStyleId && typeof n.textStyleId === 'string' ? (await figma.getStyleByIdAsync(n.textStyleId))?.name : null;
    const k = s || `raw:${n.fontSize}`;
    acc.text[k] = (acc.text[k] || 0) + 1;
  }
  if (n.boundVariables && n.boundVariables.fills) acc.boundFills++;
  else if ('fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && f.visible !== false)) acc.rawFills++;
  if ('children' in n) for (const c of n.children) await walk(c, depth + 1, acc);
}
for (const id of IDS) {
  const n = await figma.getNodeByIdAsync(id);
  if (!n) { out.push({ id, err: 'not found' }); continue; }
  const acc = { comps: {}, gaps: {}, pads: {}, text: {}, tree: [], boundFills: 0, rawFills: 0 };
  await walk(n, 0, acc);
  const btn = Object.keys(acc.comps).find(k => /^Button/i.test(k));
  out.push({ id, name: n.name, size: `${r(n.width)}x${r(n.height)}`,
    formFactorHint: JSON.stringify(acc.comps[btn]?.variants || {}).match(/Compact|Cozy/gi)?.[0] || '?',
    comps: acc.comps, gaps: acc.gaps, pads: acc.pads, text: acc.text,
    fills: { bound: acc.boundFills, raw: acc.rawFills }, tree: acc.tree });
}
const s = JSON.stringify(out);
return s.length > 14000 ? s.slice(0, 14000) + '…TRUNC' : s;
