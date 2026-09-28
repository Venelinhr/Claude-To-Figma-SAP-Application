// ── PLAN RENDERER — after the prelude + const KIT + const PLAN + const ROLE ──
// A validated element plan → the screen, same way every time. No hand-written build code.
// Sections: at their measured box (image plans) or stacked (text plans). Groups "Card 1 / Leg 1" → nested
// auto-layout; a container row styles its group as a card; a 2nd container in one group nests inside it.
// Runs of small items → one horizontal row; dividers and long texts break a run. Layers = plan element names.
const tokOf = r => r.token || (ROLE[r.role] || null);
async function _icon(name, colour) {
  const key = _k('i', name); if (!key) return null;
  const c = await _imp('c', key);
  const inst = (c.type === 'COMPONENT_SET' ? c.defaultVariant : c).createInstance();
  inst.name = name;                                       // audit-plan finds icons by name
  if (colour) for (const v of inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION')) if (v.fills && v.fills.length) await fill(v, colour);
  return inst;
}
async function _leaf(r) {
  if (r.kind === 'text') {
    const t = await T(r.text, r.style, tokOf(r) || ROLE.body_text, { name: r.element });
    return { node: t, wide: String(r.text).length > 60 };
  }
  if (r.kind === 'component') return { node: await I(r.component, r.props || {}, r.element) };
  if (r.kind === 'icon') return { node: await _icon(r.icon, tokOf(r) || ROLE.icon) };
  if (r.kind === 'logo') {
    const f = figma.createFrame(); f.name = r.element; f.fills = [];
    const c = r.crop || [0, 0, 32, 32]; f.resize(Math.max(1, c[2]), Math.max(1, c[3])); return { node: f };
  }
  if (r.kind === 'divider') {
    const f = figma.createFrame(); f.name = r.element; f.fills = []; f.resize(10, 1);
    await stroke(f, r.token || ROLE[r.role || 'divider'] || ROLE.divider, { t: 1 }); return { node: f, line: true };
  }
  return null;
}
async function _card(r, frame) {
  const bt = r.selected ? ROLE.selected_border : r.border_role ? ROLE[r.border_role] : null;
  const ft = r.fill_role ? ROLE[r.fill_role] : null;
  if (ft) await fill(frame, ft);
  if (bt) await stroke(frame, bt, { a: r.selected ? 2 : 1 });
  frame.cornerRadius = 8;
  const p = bt ? 16 : 4;
  frame.paddingTop = frame.paddingRight = frame.paddingBottom = frame.paddingLeft = p;
  frame.itemSpacing = bt ? 12 : 4;
  frame.name = r.element;
}
async function BUILD(P) {
  const F = P.frame || {};
  const root = figma.createFrame();
  root.name = P.name || F.name || `SAP · ${F.floorplan || 'screen'}`;
  root.resize(F.w || 1440, F.h || 900);
  await fill(root, ROLE.page_background);
  let maxX = 0; for (const n of figma.currentPage.children) if (n !== root) maxX = Math.max(maxX, n.x + n.width);
  root.x = maxX + 200; root.y = 0;
  const secs = (P.sections || []).slice();
  for (const r of P.rows) if (!secs.find(s => s.id === r.section)) secs.push({ id: r.section, name: r.section });
  const absolute = secs.every(s => Array.isArray(s.box));
  if (!absolute) {
    root.layoutMode = 'VERTICAL'; root.primaryAxisSizingMode = 'AUTO'; root.counterAxisSizingMode = 'FIXED';
    root.itemSpacing = 16; root.paddingTop = root.paddingRight = root.paddingBottom = root.paddingLeft = 16;
  }
  for (const s of secs) {
    const horiz = /^\s*row\b/i.test(s.layout || '');
    const sf = AL(horiz ? 'HORIZONTAL' : 'VERTICAL', { name: `${s.id} · ${s.name || ''}`.trim(), gap: horiz ? 0 : 12 });
    root.appendChild(sf);
    if (absolute) {                                       // the measured box: fixed width, height hugs (rows) or fixed (a row section)
      sf.x = s.box[0]; sf.y = s.box[1]; sf.resize(Math.max(1, s.box[2]), Math.max(1, s.box[3]));
      if (horiz) { sf.primaryAxisSizingMode = 'FIXED'; sf.counterAxisSizingMode = 'FIXED'; } else sf.counterAxisSizingMode = 'FIXED';
    } else sf.layoutSizingHorizontal = 'FILL';
    const G = new Map([['', { frame: sf, run: null, styled: false, horiz }]]);   // group path → its frame + open row
    const groupOf = path => {
      if (G.has(path)) return G.get(path);
      const parts = path.split(' / ');
      const parent = groupOf(parts.slice(0, -1).join(' / '));
      const leafish = !P.rows.some(r => r.section === s.id && norm(r.group).startsWith(path + ' /'));
      const f = AL(leafish ? 'HORIZONTAL' : 'VERTICAL', { name: parts[parts.length - 1], gap: leafish ? 8 : 12, align: leafish ? 'CENTER' : undefined });
      parent.run = null; put(parent.frame, f, parent.horiz ? 'HUG' : 'FILL');
      const g = { frame: f, run: null, styled: false, horiz: leafish };
      G.set(path, g); return g;
    };
    for (const r of P.rows.filter(r => r.section === s.id && !r.ask)) {
      const g = groupOf(norm(r.group));
      if (r.kind === 'container') {
        if (!g.styled) { await _card(r, g.frame); g.styled = true; g.frame.layoutMode = 'VERTICAL'; g.frame.counterAxisAlignItems = 'MIN'; g.horiz = false; }
        else {                                            // 2nd container in one group: nest, keep filling inside it
          const inner = AL('VERTICAL', { name: r.element, gap: 12 }); await _card(r, inner);
          g.run = null; put(g.frame, inner, 'FILL'); g.frame = inner; g.horiz = false;
        }
        continue;
      }
      const l = await _leaf(r); if (!l || !l.node) continue;
      if (g.horiz) { put(g.frame, l.node, l.line ? 'FILL' : 'HUG'); continue; }
      if (l.line || l.wide) { g.run = null; put(g.frame, l.node, 'FILL'); if (l.wide) l.node.textAutoResize = 'HEIGHT'; continue; }
      if (!g.run) { g.run = AL('HORIZONTAL', { name: `${r.element} row`, gap: 8, align: 'CENTER' }); put(g.frame, g.run, 'FILL'); }
      put(g.run, l.node, 'HUG');
    }
    // a row of 2–3 items spreads over the width (title + icon, price + button); longer rows stay packed left
    for (const n of sf.findAll(n => n.type === 'FRAME' && n.layoutMode === 'HORIZONTAL' && / row$/.test(n.name)))
      if (n.children.length >= 2 && n.children.length <= 3) n.primaryAxisAlignItems = 'SPACE_BETWEEN';
  }
  root.clipsContent = true;
  figma.currentPage.selection = [root]; figma.viewport.scrollAndZoomIntoView([root]);
  return { nodeId: root.id, name: root.name, rows: P.rows.length, WARN };
}
function norm(g) { return String(g || '').split('/').map(x => x.trim()).filter(Boolean).join(' / '); }
// ── end PLAN RENDERER ──
