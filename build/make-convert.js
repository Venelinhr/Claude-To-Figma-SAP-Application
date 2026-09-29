// make-convert.js — PURE converter: a probed SAPUI5 Make app (build/templates/make-probe.browser.js) → a v5 layout tree.
// No fs / path / require: the same text runs in node (build/make2tree.js) and inside the SAP Bridge plugin (build/plugin-bundle.js).
// Deterministic, table-driven, NO model: UI5 controls become SAP Web UI Kit instances (props from the control's real state),
// flex layout becomes auto layout (gap / padding / FILL·HUG·FIXED from the live boxes), colours and text styles become SAP
// variables and styles by value match.
//   convert(D, KIT, MAP, EXTRA, name) → { tree, images: [{element, src}], post: {nav, shell}, warn: [string] }
function convert(D, KIT, MAP, EXTRA, nameArg) {
  const NAV = [], SHELL = {}, WARN = [], IMAGES = [], R = v => Math.round(v * 10) / 10, R5 = v => Math.round(v * 2) / 2;

  // ── control index ────────────────────────────────────────────────────────────────────────
  const by = {}, lay = {}, kids = {};
  D.controls.forEach(c => { by[c.id] = c; });
  D.controls.forEach(c => { if (c.cls === 'sap.m.FlexItemData' && by[c.parent]) lay[c.parent] = c.st; });
  const skip = new Set(MAP.skip_cls);
  const vparent = c => { let p = c.parent; while (p && by[p] && skip.has(by[p].cls)) p = by[p].parent; return p; };
  D.controls.forEach(c => { if (!skip.has(c.cls)) (kids[vparent(c)] = kids[vparent(c)] || []).push(c); });
  const ch = c => (kids[c.id] || []).filter(k => !(c.cls === 'sap.f.DynamicPageHeader' && MAP.skip_in_dynamic_header.includes(k.cls)));
  const grow = c => parseFloat((lay[c.id] || {}).grow) || 0;
  const px = v => { const m = /^(\d+(\.\d+)?)(px|rem)$/.exec(v || ''); return m ? parseFloat(m[1]) * (m[3] === 'rem' ? 16 : 1) : null; };

  // ── colours → SAP variables by VALUE and ROLE ────────────────────────────────────────────
  const KV = new Set(Object.keys(KIT.vars).map(n => n.split('/').pop()));
  const hexOf = v => { v = String(v || '').trim().toLowerCase(); let m = /^#([0-9a-f]{6})$/.exec(v); if (m) return '#' + m[1];
    m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v); if (m) return '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
    m = /^rgba?\(([^)]+)\)/.exec(v); if (m) { const p = m[1].split(',').map(parseFloat); if (p.length > 3 && p[3] < 1) return null; return '#' + p.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); } return null; };
  const VAL = {};
  for (const [n, v] of Object.entries(D.vars || {})) { if (!KV.has(n)) continue; const h = hexOf(v); if (h) (VAL[h] = VAL[h] || []).push(n); }
  const ROLE = { fill: /Background|BaseColor|ShellColor/, border: /Border|Separator|Selected/, ink: /(Color|Text)$/ };
  const PREF = { fill: MAP.fill_pref, border: MAP.border_pref, ink: MAP.ink_pref };
  const roleOk = (role, n) => ROLE[role].test(n) && (role !== 'ink' || !/Background|Border/.test(n));
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function tok(hex, role) {
    if (!hex) return undefined;
    if (role === 'ink' && hex === '#000000') hex = '#131e29';          // a control with no colour set inherits browser black; SAP's default ink is #131e29
    const c = (VAL[hex] || []).filter(n => roleOk(role, n));
    for (const p of PREF[role]) if (c.includes(p)) return p;
    if (c.length) return c[0];
    let best = null, bd = 1e9;
    for (const [h2, names] of Object.entries(VAL)) { const n = names.find(x => roleOk(role, x)); if (!n) continue; const a = rgb(hex), b = rgb(h2), d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (d < bd) { bd = d; best = n; } }
    if (best && bd < 40) return best;
    WARN.push(`no SAP ${role} token for ${hex}`); return 'RAW#' + hex.slice(1);
  }

  // ── text style by size + weight ──────────────────────────────────────────────────────────
  const TS = Object.entries(KIT.text).map(([n, v]) => ({ n, size: parseFloat(String(v).split('|')[2]), bold: /Bold|Semibold/.test(n) })).filter(t => !isNaN(t.size) && /^(H\d|SmallText|MediumText|LargeText)\//.test(t.n));
  function style(c) {
    const t = c.tx || {}, fs = Math.round(t.fs || 14), bold = /Bold|Black/.test(t.ff || '') || t.fw >= 600;
    const pool = TS.filter(x => c.cls === 'sap.m.Title' ? /^H\d/.test(x.n) : /Text\//.test(x.n));
    let cand = pool.filter(x => x.size === fs && x.bold === bold);
    if (!cand.length) cand = pool.filter(x => x.size === fs);
    if (!cand.length) cand = pool.slice().sort((a, b) => Math.abs(a.size - fs) - Math.abs(b.size - fs)).filter(x => x.bold === bold);
    return (cand[0] || pool[0]).n;
  }
  const ICONS = new Set([...Object.keys(KIT.icons).map(k => k.split('/').pop()), ...Object.keys(EXTRA)]);
  function icon(src) {
    const raw = String(src || '').replace('sap-icon://', ''), n = MAP.icon_alias[raw] || raw;
    if (!ICONS.has(n)) { WARN.push(`icon "${raw}" is not in the SAP kit`); return null; }
    return n;
  }

  // ── node makers ──────────────────────────────────────────────────────────────────────────
  const CONTAINERS = new Set(['sap.f.DynamicPage', 'sap.f.DynamicPageTitle', 'sap.f.DynamicPageHeader', 'sap.tnt.ToolPage', 'sap.tnt.NavigationList', 'sap.m.IconTabHeader', 'sap.m.ScrollContainer', 'sap.m.Page', 'sap.m.Panel', 'sap.m.List', 'sap.m.OverflowToolbar', 'sap.m.Toolbar', 'sap.ui.layout.VerticalLayout', 'sap.ui.layout.HorizontalLayout']);
  const box = c => c.box.slice();
  const inst = (c, cp, pr, label, tx) => ({ _b: cp === 'Switch' && KIT.components[cp] ? [c.box[0], c.box[1] + (c.box[3] - KIT.components[cp].h) / 2, KIT.components[cp].w, KIT.components[cp].h] : box(c), _k: 'inst', _grow: grow(c), _w: px(c.props.width), n: label || cp, k: 'i', cp, pr, w: (cp === 'Switch' || cp === 'Icon Button') && KIT.components[cp] ? KIT.components[cp].w : R(c.box[2]), h: (KIT.components[cp] && KIT.components[cp].h && cp !== 'Shell Bar' && cp !== 'Tab' && cp !== 'Navigation Item') ? KIT.components[cp].h : R(c.box[3]), _intr: (KIT.components[cp] || {}).h, ...(tx ? { tx } : {}) });
  function text(c, t) {
    const tx = c.tx || {}, fs = tx.fs || 14, wrap = c.box[3] > fs * 1.9;
    return { _b: box(c), _k: 'text', _grow: grow(c), _wrap: wrap, _lineFix: !wrap, n: String(t).slice(0, 28), k: 't', t: String(t), w: R(c.box[2]), h: R(c.box[3]), st: style(c), bg: tok(hexOf(tx.fg), 'ink'), ...(wrap ? { wrap: 1 } : {}), ...(c.props.textAlign === 'Center' ? { ta: 'C' } : {}) };
  }
  function iconNode(name, c, w) { return name ? { _b: box(c), _k: 'icon', _grow: 0, n: 'Icon ' + name, k: 'ic', ic: name, bg: tok(hexOf((c.tx || {}).fg || c.st.fg), 'ink'), w } : null; }
  const nameOf = c => c.css.includes('flyDateTile') ? 'Fare Tile' : c.css.includes('flyFlightRow') ? 'Flight Row' : c.css.includes('flyCardContent') ? 'Card Content'
    : { 'sap.m.VBox': 'Column', 'sap.m.HBox': 'Row', 'sap.m.FlexBox': 'Row', 'sap.f.DynamicPage': 'Dynamic Page', 'sap.f.DynamicPageTitle': 'Page Title', 'sap.f.DynamicPageHeader': 'Page Header', 'sap.f.Card': 'Card' }[c.cls] || c.cls.split('.').pop();

  function conv(c) {
    const p = c.props;
    switch (c.cls) {
      case 'sap.tnt.ToolHeader': return shell(c);
      case 'sap.tnt.SideNavigation': return sidenav(c);
      case 'sap.m.IconTabBar': return tabs(c);
      case 'sap.m.Button': case 'sap.m.ToggleButton': {
        const type = MAP.button_type[p.type || 'Default'] || 'Secondary', ic = p.icon ? icon(p.icon) : null;
        return p.text ? inst(c, 'Button', { Type: type, 'Form Factor': 'Compact', '✏️ Text': p.text, ...(ic ? { 'Icon Left': true, Icon: ic } : {}) }, 'Button ' + p.text)
          : inst(c, 'Icon Button', { Type: type === 'Primary' ? 'Primary' : type === 'Tertiary' ? 'Tertiary' : 'Secondary', 'Form Factor': 'Compact', ...(ic ? { Icon: ic } : {}) }, 'Icon Button ' + (ic || ''));
      }
      case 'sap.m.Input': return inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || '' }, 'Input ' + (p.value || '').slice(0, 24));
      case 'sap.m.CheckBox': return inst(c, 'Check Box', { 'Form Factor': 'Compact', Label: true, '✏️ Text': p.text || '', Check: p.selected ? 'Checked' : 'Unchecked' }, 'Check Box ' + (p.text || ''));
      case 'sap.m.Switch': return inst(c, 'Switch', { 'Form Factor': 'Compact', Checked: p.state ? 'True' : 'False' }, 'Switch');
      case 'sap.m.Select': return inst(c, 'Select', { 'Form Factor': 'Compact' }, 'Select ' + (c.selText || ''), { 'Input Text': c.selText || '' });
      case 'sap.m.Link': return inst(c, 'Link', { Type: 'Regular', 'Icon Position': 'N/A', '✏️ Text': p.text || '' }, 'Link ' + (p.text || ''));
      case 'sap.m.Label': return inst(c, 'Label', { '✏️ Label': p.text || '' }, 'Label ' + (p.text || ''));
      case 'sap.m.ObjectNumber': return inst(c, 'Object Number', { Type: p.emphasized === false ? 'Regular' : 'Emphasized', Semantic: p.state && p.state !== 'None' ? p.state : 'None' }, 'Object Number ' + p.number, { '956.00 EUR': [p.number, p.unit].filter(Boolean).join(' ') });
      case 'sap.m.Avatar': {
        if (p.initials) return inst(c, 'Avatar', { Type: 'Initials', Size: p.displaySize || 'S', Color: MAP.avatar_color[p.backgroundColor] || '6', '✏️ Initials': p.initials }, 'Avatar ' + p.initials);
        const g = iconNode(icon(p.src), c, 24); return { _b: box(c), _k: 'frame', _grow: 0, n: 'Icon Tile', d: 'H', a: 'CC', w: R(c.box[2]), h: R(c.box[3]), c: g ? [{ ...g, s: 'XX', w: 24, h: 24 }] : [] };
      }
      case 'sap.m.Text': return text(c, p.text || '');
      case 'sap.m.Title': return text(c, p.text || '');
      case 'sap.ui.core.Icon': return iconNode(icon(p.src), c, px(p.size) || (parseFloat(p.size) * 16) || c.box[3]);
      case 'sap.m.Image': {
        const el = 'Logo ' + String(p.src || 'image').split('/').pop().replace(/\.[a-z]+$/, '').replace(/^(airline-)/, '');
        IMAGES.push({ element: el, src: p.src }); return { _b: box(c), _k: 'img', _grow: 0, n: el, w: R(c.box[2]), h: R(c.box[3]) };
      }
      case 'sap.f.cards.Header': return cardHeader(c);
      case 'sap.f.Card': return frame(c, 'Card', { border: true });
      case 'sap.m.VBox': case 'sap.m.HBox': case 'sap.m.FlexBox':
        if (!ch(c).length && grow(c) > 0) return { _b: box(c), _k: 'spacer', _grow: grow(c) };
        return frame(c, nameOf(c));
      case 'sap.ui.core.HTML': return htmlNode(c);
      case 'sap.m.Panel': {                                    // UI5 paints a Panel's white on its inner content area, not on the panel element the probe reads
        const n = frame(c, 'Panel'); if (!n.bg) n.bg = tok('#ffffff', 'fill'); return n;
      }
      case 'sap.f.DynamicPageTitle': {
        const all = ch(c), tb = all.find(k => k.cls === 'sap.m.OverflowToolbar');
        if (!tb) return frame(c, nameOf(c));
        const inTb = k => k !== tb && k.box[0] >= tb.box[0] - 1 && k.box[0] + k.box[2] <= tb.box[0] + tb.box[2] + 1 && k.box[1] >= tb.box[1] - 1 && k.box[1] + k.box[3] <= tb.box[1] + tb.box[3] + 1;
        const inside = all.filter(inTb), rest = all.filter(k => k !== tb && !inTb(k));
        const tbNode = layout({ _b: box(tb), _k: 'frame', _grow: 1, n: 'Actions', d: 'H' }, inside.map(conv).filter(Boolean), { V: false, st: { ai: 'center', jc: 'flex-end' }, flex: true });
        const node = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Page Title', d: 'H' }; if (c.st.bg) node.bg = tok(hexOf(c.st.bg), 'fill');
        return layout(node, [...rest.map(conv).filter(Boolean), tbNode], { V: false, st: { ai: 'center', jc: 'flex-start', pad: c.st.pad }, flex: true });
      }
      case 'sap.m.GenericTile': return tile(c);
      case 'sap.m.NumericContent': return numeric(c);
      case 'sap.m.ObjectStatus': {
        const t = text(c, p.text || '');                       // the kit has no positive/negative TEXT variable: state colour needs a kit Object Number, so the text stays sapTextColor
        if (p.state && p.state !== 'None') WARN.push(`Object Status "${p.text}" state ${p.state}: colour not available as a text variable — plain text colour`);
        return t;
      }
      case 'sap.ui.layout.DynamicSideContent': {              // side column (fixed) beside the main content (takes the free width)
        const kids = ch(c).map(conv).filter(Boolean);
        if (kids.length > 1) { kids[0]._w = kids[0]._b[2]; kids[kids.length - 1]._grow = 1; }
        return layout({ _b: box(c), _k: 'frame', _grow: grow(c), n: 'Side Content Layout', d: 'H' }, kids, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
      }
      case 'sap.m.CustomListItem': {                           // its content row spans the whole item
        const kids = ch(c).map(conv).filter(Boolean); kids.forEach(k => { k._grow = 1; });
        const n = { _b: box(c), _k: 'frame', _grow: 0, n: 'List Item', d: 'H' }; if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
        return layout(n, kids, { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true });
      }
      default:
        if (!CONTAINERS.has(c.cls)) WARN.push(`control ${c.cls} is not mapped to a SAP kit component — plain frame`);
        return frame(c, nameOf(c));
    }
  }
  // ── composites ───────────────────────────────────────────────────────────────────────────
  function numeric(c) {                                       // NumericContent: big value + scale, drawn as one text in the H-style that matches its size
    const t = [c.props.value, c.props.scale].filter(Boolean).join(' ');
    if (!t) return null;
    const n = text({ ...c, cls: 'sap.m.Title', props: {}, tx: { ...(c.tx || {}), fg: '#131e29' } }, t);   // state colour (Good/Error) has no text variable in the kit
    if (c.props.valueColor && c.props.valueColor !== 'Neutral') WARN.push(`Numeric "${t}" ${c.props.valueColor}: colour not available as a text variable — plain text colour`);
    return n;
  }
  function tile(c) {                                          // GenericTile: card with header text + numeric value
    const title = ch(c).find(k => k.cls === 'sap.m.Text'), tc = ch(c).find(k => k.cls === 'sap.m.TileContent'), nc = tc && ch(tc).find(k => k.cls === 'sap.m.NumericContent');
    const kids = [title && text(title, title.props.text || ''), nc && numeric(nc)].filter(Boolean), st = c.st;
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Fare Tile', d: 'V', _sized: true, s: 'XX' };
    if (st.bg) n.bg = tok(hexOf(st.bg), 'fill');
    if (st.br) n.r = Math.round(st.br);
    if (st.sh) n.fxk = KIT.effects['Shadow/sapContent_Shadow1'];
    return layout(n, kids, { V: true, st: {}, flex: false });
  }
  // ── raw HTML (sap.ui.core.HTML): UI5 gives only the markup string — read its text, flex direction, gap, padding, weight, size ─────
  const cssOf = st => { const o = {}; String(st || '').split(';').forEach(x => { const k = x.indexOf(':'); if (k > 0) o[x.slice(0, k).trim().toLowerCase()] = x.slice(k + 1).trim(); }); return o; };
  const cssPx = v => { if (!v) return null; const m = /^(-?[\d.]+)(px|rem)?$/.exec(v.trim()); if (m) return parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1); if (/sapFontSizeSmall/.test(v)) return 12; if (/sapFontSize/.test(v)) return 14; return null; };
  const cssPad = v => { const a = String(v || '0').trim().split(/\s+/).map(cssPx); const [t, r = t, b = t, l = r] = a; return [t, r, b, l].map(x => Math.round(x || 0)); };
  function htmlTree(src) {
    const root = { kids: [] }, stack = [root], re = /<(\/?)(div|span)([^>]*)>|([^<]+)/gi; let m;
    while ((m = re.exec(src))) {
      if (m[4] !== undefined) { const t = m[4].replace(/\s+/g, ' ').trim(); if (t) stack[stack.length - 1].kids.push({ text: t }); }
      else if (m[1]) { if (stack.length > 1) stack.pop(); }
      else { const el = { tag: m[2].toLowerCase(), css: cssOf((/style="([^"]*)"/.exec(m[3]) || [])[1]), kids: [] }; stack[stack.length - 1].kids.push(el); stack.push(el); }
    }
    return root;
  }
  function htmlText(el, inh) {
    const css = { ...inh, ...el.css }, t = el.kids.map(k => k.text !== undefined ? k.text : (k.css && /50%/.test(k.css['border-radius'] || '') ? '' : htmlText(k, css))).join(' ').replace(/\s+/g, ' ').trim();
    return t;
  }
  function htmlNode(c) {
    const src = String(c.props.content || ''), tree = htmlTree(src), tops = tree.kids.filter(k => k.tag);
    const box0 = { _b: box(c), _k: 'frame', _grow: grow(c), _sized: true };
    const inkFor = (css, hexFb) => { const v = /var\(--(\w+)/.exec(css.color || ''); if (v && KV.has(v[1]) && !/Background|Border/.test(v[1])) return v[1]; const h = hexOf(css.color) || hexOf(hexFb); const t = h ? tok(h, 'ink') : 'sapTextColor'; return /^RAW/.test(t) ? 'sapTextColor' : /Focus|Marker/.test(t) ? 'sapLinkColor' : t; };
    const leaf = (el, inh) => {
      const css = { ...inh, ...el.css }, t = htmlText(el, inh); if (!t) return null;
      const fs = Math.round(cssPx(css['font-size']) || 14), bold = /^(6|7|8|9)00$|bold/.test(css['font-weight'] || '');
      return { _k: 'text', n: t.slice(0, 28), k: 't', t, st: style({ cls: 'sap.m.Text', tx: { fs, fw: bold ? 700 : 400, ff: bold ? '72-Bold' : '72' } }), bg: inkFor(css, '#131e29'), w: Math.max(8, Math.round(t.length * fs * 0.56)), h: Math.round(fs * 1.4), s: 'HH' };
    };
    const build = (el, inh, top) => {
      const css = { ...inh, ...el.css }, sub = el.kids.filter(k => k.tag), own = el.css;
      if (!sub.length) return leaf(el, inh);
      const row = /flex/.test(own.display || '') && !/column/.test(own['flex-direction'] || '');
      const parts = el.kids.map(k => k.text !== undefined ? leaf({ css: {}, kids: [k] }, css) : (/50%/.test(k.css['border-radius'] || '') ? null : build(k, { 'font-size': css['font-size'], 'font-weight': css['font-weight'], color: css.color }, false))).filter(Boolean);
      if (!parts.length) return null;
      if (parts.length === 1 && !top) return parts[0];
      const gap = Math.round(cssPx((own.gap || '').split(' ')[0]) || (!row ? cssPx((sub[0].css || {})['margin-bottom']) || 0 : 0));
      const n = { _k: 'frame', n: top ? 'HTML' : (row ? 'Row' : 'Column'), d: row ? 'H' : 'V', a: row ? 'MC' : 'MM', c: parts, s: 'HH', w: parts.reduce((a, k) => a + (k.w || 0), 0), h: Math.max(...parts.map(k => k.h || 0)) };
      if (gap) n.g = gap;
      if (el.css.padding) { const pd = cssPad(el.css.padding); if (pd.some(x => x)) n.p = pd; }
      return n;
    };
    if (tops.length === 1 && htmlText(tops[0], {}) && (tops[0].kids.some(k => k.tag) || true)) {
      const n = build(tops[0], {}, true);
      if (n) {
        Object.assign(n, box0, { w: R(c.box[2]), h: R(c.box[3]), s: c.box[2] > 120 ? 'FX' : 'HX' });
        if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
        if (c.st.bw > 0) { n.bc = 'sapList_BorderColor'; n.bw = 1; } if (c.st.br) n.r = Math.round(c.st.br);
        const bl = /(\d+(?:\.\d+)?)px\s+solid\s+(#[0-9a-f]{3,8})/i.exec(tops[0].css['border-left'] || '');     // accent bar on the left edge
        if (bl) { const t = tok(hexOf(bl[2]), 'border'); if (t && !/^RAW/.test(t)) { n.bc = t; n.bw = [0, 0, 0, Math.round(parseFloat(bl[1]))]; } }
        if (n.d === 'V') n.a = 'MM';
        return n;
      }
    }
    // no readable text: a fixed-size frame that keeps the box (divider line, coloured bar)
    const thin = c.box[2] <= 2 || c.box[3] <= 2, n = { ...box0, n: thin ? 'Divider' : 'HTML', d: 'V', w: R(c.box[2]), h: R(c.box[3]), s: c.box[2] > 120 ? 'FX' : 'XX' };
    if (c.st.bg) n.bg = tok(hexOf(c.st.bg), thin ? 'border' : 'fill'); return n;
  }
  function shell(c) {
    const htmlTitle = ch(c).filter(k => k.cls === 'sap.ui.core.HTML').map(k => htmlText(htmlTree(String(k.props.content || '')), {})).find(Boolean);
    const title = (ch(c).find(k => k.cls === 'sap.m.Title') || { props: {} }).props.text || htmlTitle || '';
    const menu = ch(c).some(k => k.cls === 'sap.m.Button' && /menu/.test(k.props.icon || ''));
    Object.assign(SHELL, { title, initials: ((ch(c).find(k => k.cls === 'sap.m.Avatar') || { props: {} }).props.initials) || '' });
    return Object.assign(inst(c, 'Shell Bar', { ...(menu ? { Hamburger: 'True' } : {}), 'Shell Search': ch(c).some(k => k.cls === 'sap.m.SearchField'), Help: false, Overflow: false }, 'Shell Bar', { Text: title }), { av: SHELL.initials });
  }
  function sidenav(c) {
    const list = ch(c).find(k => k.cls === 'sap.tnt.NavigationList') || c, items = ch(list).filter(k => k.cls === 'sap.tnt.NavigationListItem');
    const n = inst(c, 'Side Navigation', { Type: 'Expanded', 'Form Factor': 'Compact' }, 'Side Navigation');
    n.nav = items.map((it, i) => ({ text: it.props.text || '', icon: icon(it.props.icon), selected: !!(it.props.selected || (it.aria && it.aria.sel === 'true')) || (i === 0 && !items.some(k => k.props.selected)) }));
    NAV.push(...items.map((it, i) => ({ text: it.props.text || '', icon: icon(it.props.icon), selected: !!(it.props.selected || (it.aria && it.aria.sel === 'true')) || (i === 0 && !items.some(k => k.props.selected)) })));
    return n;
  }
  function tabs(c) {
    const hdr = D.controls.find(k => k.cls === 'sap.m.IconTabHeader' && k.parent === c.id) || { props: {}, st: c.st }, sk = hdr.props.selectedKey;
    const nodes = ch(c).filter(k => k.cls === 'sap.m.IconTabFilter').map(t => ({ ...inst(t, 'Tab', { Type: 'Inline', 'Interaction State': t.props.key === sk ? 'Regular Active' : 'Regular Inactive', 'Menu Arrow': false, '✏️ Text': t.props.text || '' }, 'Tab ' + t.props.text), _w: null }));
    const content = ch(c).filter(k => k.cls !== 'sap.m.IconTabFilter' && k.cls !== 'sap.m.IconTabHeader' && k.cls !== 'sap.m.IconTabFilterExpandButtonBadge');
    const hdrNode = layout({ _b: (hdr.box && c.box[3] - hdr.box[3] > 8 ? hdr.box : box(c)).slice(), _k: 'frame', n: 'Icon Tab Bar', d: 'H', bg: tok(hexOf((hdr.st && hdr.st.bg) || '#ffffff'), 'fill'), bc: tok('#d9d9d9', 'border'), bw: [0, 0, 1, 0] }, nodes, { V: false, st: c.st, flex: false });
    if (hdrNode.p && hdrNode.p[1] > 200) hdrNode.p[1] = 0;          // tabs sit at the start; the free width to the right is not padding
    if (!content.length) return hdrNode;                          // a tab bar that also holds the tab content (cards, lists…): headers on top, content below
    return layout({ _b: box(c), _k: 'frame', _grow: grow(c), n: 'Icon Tab Bar', d: 'V' }, [hdrNode, ...content.map(conv).filter(Boolean)], { V: true, st: {}, flex: false });
  }
  function cardHeader(c) {
    const av = ch(c).find(k => k.cls === 'sap.m.Avatar'), tx = ch(c).find(k => k.cls === 'sap.m.Text'), out = [];
    if (av) out.push(conv(av)); if (tx) out.push(text(tx, tx.props.text || ''));
    return layout({ _b: box(c), _k: 'frame', n: 'Card Header', d: 'H' }, out.filter(Boolean), { V: false, st: { ai: 'center' }, flex: true });
  }
  function frame(c, name, o = {}) {
    const st = c.st, flex = /flex/.test(st.display), V = flex ? /column/.test(st.dir) : true;
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), _w: /px$/.test(c.props.width || '') ? px(c.props.width) : null, _wfill: c.props.width === '100%', n: name, d: V ? 'V' : 'H' };
    if (st.bg) n.bg = tok(hexOf(st.bg), 'fill');
    if (o.border || st.bw > 0) { n.bc = tok(hexOf(st.bc), 'border') || 'sapTile_BorderColor'; n.bw = st.bw > 0 ? st.bw : 1; }
    if (st.br) n.r = Math.round(st.br);
    if (c.cls === 'sap.f.Card' && st.sh) { n.fxk = KIT.effects['Shadow/sapContent_Shadow1']; delete n.bc; delete n.bw; }   // Make draws a card with a shadow, not a border
    const kids = ch(c).map(conv).filter(Boolean);
    if (flex && !V && /wrap/.test(st.wrap) && kids.length > 1) {          // a wrapped row that broke into several lines → a column of line rows
      const lines = []; let bottom = -1e9;
      for (const k of kids) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } }
      if (lines.length > 1) {
        n.d = 'V';
        const rows = lines.map(ln => {
          if (ln.length === 1) return ln[0];
          const row = layout({ _b: union(ln), _k: 'frame', n: 'Row', d: 'H' }, ln, { V: false, st: { ai: 'flex-start' }, flex: true });
          if (!row.c.some(k => /^F/.test(k.s || ''))) row.c.push({ _k: 'frame', n: 'Spacer', d: 'H', w: 1, h: 1, s: 'FH', _sized: true });   // one part of the row must flex
          return row;
        });
        return layout(n, rows, { V: true, st: {}, flex: false });
      }
    }
    const out = layout(n, kids, { V, st, flex });
    if (flex && !V && /wrap/.test(st.wrap) && out.c.some(k => k.n === 'Fare Tile') && !out.c.some(k => /^F/.test(k.s || '')))
      out.c.push({ _k: 'frame', n: 'Spacer', d: 'H', w: 1, h: 1, s: 'FH', _sized: true });   // a row of fixed tiles needs one flexible part
    return out;
  }

  // ── auto layout: order, gap, padding, alignment, sizing letters ──────────────────────────
  const union = ks => { const x0 = Math.min(...ks.map(k => k._b[0])), y0 = Math.min(...ks.map(k => k._b[1])), x1 = Math.max(...ks.map(k => k._b[0] + k._b[2])), y1 = Math.max(...ks.map(k => k._b[1] + k._b[3])); return [x0, y0, x1 - x0, y1 - y0]; };
  function layout(node, list, o) {
    const V = o.V, b = node._b, st = o.st || {}, flex = o.flex;
    const ai = flex ? st.ai || '' : '', jc = flex ? st.jc || '' : '';
    const counter = /center/.test(ai) ? 'C' : /end/.test(ai) ? 'X' : 'M';
    let primary = /space-between/.test(jc) ? 'S' : /center/.test(jc) ? 'C' : /end/.test(jc) ? 'X' : 'M';
    let ks = list.slice();
    if (ks.some(k => k._k === 'spacer')) {                    // flexible spacers → space-between over the groups between them
      const segs = [[]]; for (const k of ks) { if (k._k === 'spacer') segs.push([]); else segs[segs.length - 1].push(k); }
      ks = segs.filter(s => s.length).map((s, i) => s.length === 1 ? s[0] : layout({ _b: union(s), _k: 'frame', n: i === 0 ? 'Leading Content' : 'Trailing Content', d: V ? 'V' : 'H' }, s, { V, st: { ai: 'center' }, flex: true }));
      (ks.length >= 3 ? ks.slice(1, -1) : ks.slice(0, 1)).forEach(k => { k._flexSeg = true; });   // the part between the spacers takes the free space
    }
    const mi = V ? 1 : 0, me = V ? 3 : 2, ci = V ? 0 : 1, ce = V ? 2 : 3;
    const gs = []; for (let i = 1; i < ks.length; i++) gs.push(ks[i]._b[mi] - (ks[i - 1]._b[mi] + ks[i - 1]._b[me]));
    const gap = primary === 'S' || !gs.length ? 0 : Math.max(0, R(Math.min(...gs)));
    if (primary !== 'S') ks = ks.map((k, i) => { const e = i > 0 ? gs[i - 1] - gap : 0; return e > 0.6 ? lead(k, e, V) : k; });
    let p = [0, 0, 0, 0];
    if (ks.length) {
      const f = ks[0]._b, l = ks[ks.length - 1]._b, ms = f[mi] - b[mi], mEnd = b[mi] + b[me] - (l[mi] + l[me]);
      const cs = Math.min(...ks.map(k => k._b[ci])) - b[ci], cEnd = b[ci] + b[ce] - Math.max(...ks.map(k => k._b[ci] + k._b[ce]));
      const css = st.pad || [0, 0, 0, 0], useMain = primary === 'M' || primary === 'S';
      const mS = useMain ? Math.max(0, R5(ms)) : 0, mE = useMain ? Math.max(0, R5(mEnd)) : 0;
      const sym = Math.max(0, R5(Math.min(cs, cEnd))), cS = counter === 'M' ? Math.max(0, R5(cs)) : counter === 'C' ? sym : (V ? css[3] : css[0]), cE = counter === 'M' ? Math.max(0, R5(cEnd)) : counter === 'C' ? sym : (V ? css[1] : css[2]);
      p = V ? [mS, cE, mE, cS] : [cS, mE, cE, mS];
    }
    ks = ks.map(k => crossOffset(k, node, p, V, counter));
    const inner = [b[2] - p[1] - p[3], b[3] - p[0] - p[2]];
    if (ks.some(k => k._k === 'inst' && k._intr && k._intr < k._b[3] - 1)) node._fixH = true;
    if (!V && ks.length) {                                   // the last column of a row that reaches the row's end and holds wrapping text takes the free width
      const l = ks[ks.length - 1], endGap = b[0] + b[2] - p[1] - (l._b[0] + l._b[2]);
      if (l._k === 'frame' && !l._grow && !l._w && Math.abs(endGap) < 1.5 && (l.c || []).some(x => x._k === 'text' && x._wrap)) l._grow = 1;
    }
    ks.forEach(k => { if (!k._sized) k.s = letters(k, V, inner, counter); });
    Object.assign(node, { w: R(b[2]), h: R(b[3]), ...(gap ? { g: gap } : {}), ...(p.some(x => x) ? { p } : {}), a: primary + counter, c: ks });
    return node;
  }
  const lead = (k, e, V) => ({ _b: [k._b[0] - (V ? 0 : e), k._b[1] - (V ? e : 0), k._b[2] + (V ? 0 : e), k._b[3] + (V ? e : 0)], _k: 'frame', _grow: k._grow, n: 'Item', d: V ? 'V' : 'H', p: V ? [R5(e), 0, 0, 0] : [0, 0, 0, R5(e)], a: 'MM', w: R(k._b[2] + (V ? 0 : e)), h: R(k._b[3] + (V ? e : 0)), c: [Object.assign(k, { s: (() => { const L = letters(k, V, [k._b[2], k._b[3]], 'M'); return V ? L[0] + (L[1] === 'X' ? 'X' : 'H') : (L[0] === 'X' ? 'X' : 'H') + L[1]; })() })], _wrapped: true, _lead: true });
  function crossOffset(k, parent, p, V, counter) {        // a child that starts inside the parent's padding box keeps its start/end offsets
    if (counter === 'M' && k._lead) {                       // a gap wrapper already exists: fold the side offsets into its padding
      const bb = parent._b, cj = V ? 0 : 1, cw = V ? 2 : 3, st0 = bb[cj] + (V ? p[3] : p[0]), en0 = bb[cj] + bb[cw] - (V ? p[1] : p[2]);
      const o1 = k._b[cj] - st0, r1 = en0 - (k._b[cj] + k._b[cw]);
      if (o1 > 0.6) { const e1 = R5(o1), r2 = r1 > 0.6 ? R5(r1) : 0; if (V) { k.p[3] += e1; k.p[1] += r2; k._b = [k._b[0] - e1, k._b[1], k._b[2] + e1 + r2, k._b[3]]; k.w = R(k._b[2]); } else { k.p[0] += e1; k.p[2] += r2; k._b = [k._b[0], k._b[1] - e1, k._b[2], k._b[3] + e1 + r2]; k.h = R(k._b[3]); } }
      return k;
    }
    if (counter !== 'M' || k._wrapped) return k;
    const b = parent._b, ci = V ? 0 : 1, ce = V ? 2 : 3, start = b[ci] + (V ? p[3] : p[0]), end = b[ci] + b[ce] - (V ? p[1] : p[2]);
    const off = k._b[ci] - start, right = end - (k._b[ci] + k._b[ce]); if (off <= 0.6) return k;
    const e = R5(off), r = right > 0.6 ? R5(right) : 0, ext = k._b[ce] + e + r;
    const nb = V ? [k._b[0] - e, k._b[1], ext, k._b[3]] : [k._b[0], k._b[1] - e, k._b[2], ext];
    k.s = letters(k, V, [k._b[2], k._b[3]], 'M'); k._sized = true;
    return { _b: nb, _k: 'frame', _grow: k._grow, n: 'Item', d: V ? 'V' : 'H', p: V ? [0, r, 0, e] : [e, 0, r, 0], a: 'MM', w: R(nb[2]), h: R(nb[3]), c: [k], _wrapped: true };
  }
  function letters(k, V, inner, counter) {
    const L = [];
    for (const i of [0, 1]) {
      if (i === 0 && k._wfill) { L.push('F'); continue; }          // width 100% in Make = fills the parent
      const main = (V ? 1 : 0) === i, ext = k._b[i === 0 ? 2 : 3], spans = Math.abs(ext - inner[i]) <= 1.5, g = k._grow > 0;
      let l;
      if (k.cp === 'Switch' || k.cp === 'Icon Button' || k.n === 'Icon Tile') l = 'X';
      else if (k._flexSeg && main) l = 'F';
      else if (k._k === 'text') l = i === 1 ? (k._lineFix ? 'X' : 'H') : k._wrap ? ((main && g) || (!main && spans) ? 'F' : 'X') : 'H';
      else if (k._k === 'inst' || k._k === 'icon' || k._k === 'img') l = i === 1 ? 'X' : (i === 0 && k._w ? 'X' : ((main && g) || (!main && spans) ? 'F' : 'X'));
      else if (i === 0 && k._w) l = 'X';
      else if (i === 1 && k._fixH) l = 'X';
      else l = main ? (g ? 'F' : 'H') : (spans && (i === 0 || counter === 'M') ? 'F' : 'H');
      L.push(l);
    }
    return L.join('');
  }

  // ── root: ToolPage → Shell Bar + [Side Navigation | Dynamic Page] ────────────────────────
  // the probe can name a wrong root (a hidden text at 0,0): use the ToolPage, else the largest control without a parent
  const root = (by[D.root] && by[D.root].cls === 'sap.tnt.ToolPage' && by[D.root]) || D.controls.find(c => c.cls === 'sap.tnt.ToolPage') ||
    D.controls.filter(c => !by[c.parent]).sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3])[0] || by[D.root], rk = ch(root), find = cls => rk.find(k => k.cls === cls);
  const header = find('sap.tnt.ToolHeader'), side = find('sap.tnt.SideNavigation'), page = find('sap.f.DynamicPage');
  if (root.cls !== 'sap.tnt.ToolPage' || !header || !page) WARN.push('root is not a ToolPage(header, page) — generic layout used');
  const W = D.viewport[0], H = D.viewport[1], hh = header ? header.box[3] : 0;
  const body = layout({ _b: [0, hh, W, H - hh], _k: 'frame', n: 'Body', d: 'H' }, [side && conv(side), page && conv(page)].filter(Boolean), { V: false, st: {}, flex: false });
  const rootNode = layout({ _b: [0, 0, W, H], _k: 'frame', n: nameArg || D.title || 'Make screen', d: 'V', bg: tok(hexOf(root.st.bg), 'fill') || 'sapBackgroundColor', clip: 1 }, [header && conv(header), body].filter(Boolean), { V: true, st: {}, flex: false });
  rootNode.sz = 'x'; delete rootNode.s; body.s = 'FF';
  if (rootNode.c[0] && rootNode.c[0].cp === 'Shell Bar') rootNode.c[0].s = 'FX';
  const sn = body.c.find(k => k.n === 'Side Navigation'); if (sn) { sn.s = 'XF'; sn.w = 256; }
  if (page) body.c[body.c.length - 1].s = 'FF';
  const tree = JSON.parse(JSON.stringify(rootNode, (k, v) => (k[0] === '_' || v === undefined) ? undefined : v));
  return { tree, images: IMAGES, post: { nav: NAV, shell: SHELL }, warn: [...new Set(WARN)], controls: D.controls.length };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { convert };
