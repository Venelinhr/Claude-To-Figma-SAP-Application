// make-convert.js — PURE converter: a probed SAPUI5 Make app (build/templates/make-probe.browser.js) → a v5 layout tree.
// No fs / path / require: the same text runs in node (build/make2tree.js) and inside the SAP Bridge plugin (build/plugin-bundle.js).
// Deterministic, table-driven, NO model: UI5 controls become SAP Web UI Kit instances (props from the control's real state),
// flex layout becomes auto layout (gap / padding / FILL·HUG·FIXED from the live boxes), colours and text styles become SAP
// variables and styles by value match.
//   convert(D, KIT, MAP, EXTRA, name) → { tree, images: [{element, src}], post: {nav, shell}, warn: [string] }
// ── React / UI5 Web Components apps (kind:'dom'): turn the DOM dump into the same shape as a SAPUI5 control dump, then use the same converter ──
// A DOM node (i, p, t, r, cs, at, tx, wc, sel, svg, img) becomes a pseudo UI5 control: ui5-* tags → the matching sap.m.* control (so the kit-part
// mapping, layout, icons, popups and the self-check all work unchanged); divs/spans → VBox/HBox/Text with their measured boxes and CSS.
function domToUi5(DM) {
  const nodes = DM.nodes || [], px = v => parseFloat(v) || 0, VW = (DM.viewport || [1440, 900]);
  const hex = c => { const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/.exec(String(c || '')); if (!m) return ''; const a = m[4] !== undefined ? parseFloat(m[4]) : 1; if (a < 0.05) return '';
    return '#' + [m[1], m[2], m[3]].map(x => Math.round(a < 1 ? parseFloat(x) * a + 255 * (1 - a) : parseFloat(x)).toString(16).padStart(2, '0')).join(''); };      // a translucent colour is shown as it looks on white
  const gradHex = bgi => { const m = String(bgi || '').match(/rgba?\([^)]+\)|#[0-9a-f]{6}/gi); if (!m || !/gradient/.test(bgi)) return ''; const a = hex(m[0]), b = hex(m[m.length - 1]); if (!a || !b) return a || b || ''; const v = [1, 3, 5].map(i => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2)); return '#' + v.map(x => x.toString(16).padStart(2, '0')).join(''); };
  const bgOf = n => hex((n.cs || {}).bg) || gradHex((n.cs || {}).bgi);
  const kids = {}; nodes.forEach(n => { (kids[n.p] = kids[n.p] || []).push(n); });
  const icn = v => { const x = String(v || '').replace(/^sap-icon:\/\//, ''); return x ? 'sap-icon://' + x : ''; };
  const has = (at, k) => !!at && Object.prototype.hasOwnProperty.call(at, k) && at[k] !== 'false';
  const STATE = { Positive: 'Success', Negative: 'Error', Critical: 'Warning', Information: 'Information', Neutral: 'None', Set1: 'None', Set2: 'None' };
  const BTN = { Emphasized: 'Emphasized', Default: 'Default', Transparent: 'Transparent', Positive: 'Accept', Negative: 'Reject', Attention: 'Attention' };
  const controls = [], emitted = {}, consumed = new Set();
  const under = i => { const out = [], st = (kids[i] || []).slice(); while (st.length) { const k = st.shift(); out.push(k); (kids[k.i] || []).forEach(x => st.push(x)); } return out.sort((a, b) => a.i - b.i); };
  const deepText = n => { const t = []; if (n.tx) t.push(n.tx); under(n.i).forEach(k => { if (k.tx) t.push(k.tx); else if (/^ui5-(tag|badge|label|text|title|link|button)$/.test(k.t) && k.wc) t.push(k.wc); }); return t.join(' ').replace(/\s+/g, ' ').trim(); };
  const iconOf = n => { const k = under(n.i).find(x => x.t === 'ui5-icon'); return k && k.at ? icn(k.at.name || k.at.icon) : ''; };
  const radius = n => { const c = n.cs || {}, r = String(c.rad || '0'); if (/%/.test(r)) return Math.min(n.r[2], n.r[3]) * px(r) / 100; return Math.min(px(r), Math.min(n.r[2], n.r[3]) / 2); };
  const stOf = n => { const c = n.cs || {}, fl = /flex/.test(c.d || ''), g = String(c.gap || '').split(/\s+/).map(px);
    return { display: fl ? 'flex' : (c.d || 'block'), dir: c.fd || 'row', wrap: c.wrap || 'nowrap', ai: c.ai || 'normal', jc: c.jc || 'normal', gap: (g[1] !== undefined ? g[1] : g[0] || 0) + 'px/' + (g[0] || 0) + 'px',
      pad: c.pad || [0, 0, 0, 0], mar: [0, 0, 0, 0], bg: bgOf(n), fg: hex(c.color), fs: px(c.fs) || 14, fw: String(c.fw || '400'), ta: c.ta || 'left',
      bw: (c.bw || [0])[0] || 0, bc: hex((c.bc || [])[0]) || '#000000', br: radius(n), sh: c.sh || '', grow: String(c.fg || '0'), shrink: '1' }; };
  const txOf = n => { const c = n.cs || {}; return { fs: px(c.fs) || 14, fw: parseInt(c.fw, 10) || 400, fg: hex(c.color) || '#131e29', ff: c.ff || '72', lh: px(c.lh) || 0 }; };
  const sides = n => { const c = n.cs || {}, bw = c.bw || [0, 0, 0, 0]; return bw.some(Boolean) ? { bwa: bw.slice(), bca: (c.bc || []).map(hex) } : {}; };
  const parentId = n => { let p = n.p; while (p >= 0 && !emitted[p]) p = (nodes[p] || { p: -1 }).p; return p >= 0 ? '__d' + p : null; };
  const push = (n, cls, props, extra) => { const o = Object.assign({ id: '__d' + n.i, cls, parent: parentId(n), props: props || {}, css: [], box: n.r.slice(), st: stOf(n), tx: txOf(n), aria: {}, i: controls.length }, sides(n), extra || {});
    if (n.cs && n.cs.pos === 'absolute') o.absPos = true; controls.push(o); emitted[n.i] = true; return o; };
  const child = (o, suffix, cls, props, box, n) => { controls.push({ id: o.id + suffix, cls, parent: o.id, props, css: [], box, st: stOf(n), tx: txOf(n), aria: {}, i: controls.length }); };
  const textLike = n => { const t = n.t; return /^h[1-6]$/.test(t) ? 'sap.m.Title' : t === 'label' ? 'sap.m.Label' : (t === 'a' || (n.at && n.at.role === 'link')) ? 'sap.m.Link' : 'sap.m.Text'; };
  const dark = h => { if (!h) return false; const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) < 140; };
  const textBox = (n, t) => { const c = n.cs || {}, fs = px(c.fs) || 14, w = Math.min(n.r[2], Math.ceil(String(t).length * fs * 0.56)), h = px(c.lh) || Math.round(fs * 1.4), pad = c.pad || [0, 0, 0, 0];
    const centre = /center/.test(c.jc || '') || c.ta === 'center', mid = /center/.test(c.ai || '') || /flex/.test(c.d || '') && /center/.test(c.ai || '');
    return [n.r[0] + (centre ? Math.max(0, (n.r[2] - w) / 2) : pad[3]), n.r[1] + (mid || n.r[3] < h * 2.2 ? Math.max(0, (n.r[3] - h) / 2) : pad[0]), w, h]; };
  nodes.forEach(n => {
    if (consumed.has(n.i) || !n.r || (n.r[2] < 0.5 && n.r[3] < 0.5)) return;
    const at = n.at || {}, t = n.t, txt = n.wc || n.tx || '', c = n.cs || {}, role = at.role || '';
    if (c.pos === 'fixed' && n.r[2] >= VW[0] * 0.9 && n.r[3] >= VW[1] * 0.9 && !role) return;                 // a dimming backdrop
    let o = null;
    switch (t) {
      case 'thead': case 'tbody': case 'tfoot': case 'colgroup': case 'col': return;
      case 'tr': if ((kids[n.i] || []).some(k => k.t === 'th')) return; o = push(n, 'sap.m.ColumnListItem', { type: 'Inactive' }); return;
      case 'th': { o = push(n, 'sap.m.Column', {}); const tt = deepText(n); if (tt) child(o, 't', 'sap.m.Text', { text: tt }, textBox(n, tt), n); under(n.i).forEach(k => consumed.add(k.i)); return; }
      case 'table': o = push(n, 'sap.m.Table', {}); return;
      case 'button': case 'ui5-button': case 'ui5-toggle-button': {
        const ic = t === 'button' ? iconOf(n) : at.icon ? icn(at.icon) : '', tt = t === 'button' ? deepText(n) : txt;
        if (t === 'button' && !tt && !ic && !under(n.i).some(k => k.t === 'svg')) break;
        o = push(n, t === 'ui5-toggle-button' ? 'sap.m.ToggleButton' : 'sap.m.Button', Object.assign({ type: t === 'button' ? (bgOf(n) && dark(bgOf(n)) ? 'Emphasized' : (bgOf(n) || (c.bw || []).some(Boolean)) ? 'Default' : 'Transparent') : (BTN[at.design] || 'Default') }, tt ? { text: tt } : {}, ic ? { icon: ic } : t === 'button' && !tt ? { icon: 'sap-icon://overflow' } : {}));
        if (t === 'button') under(n.i).forEach(k => consumed.add(k.i)); o.parent = parentId(n); return;
      }
      case 'ui5-input': case 'ui5-multi-input': o = push(n, 'sap.m.Input', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'input': { const ty = at.type || 'text';
        if (ty === 'checkbox') o = push(n, 'sap.m.CheckBox', Object.assign({ text: at['aria-label'] || '' }, has(at, 'checked') ? { selected: true } : {}));
        else if (ty === 'radio') o = push(n, 'sap.m.RadioButton', Object.assign({ text: at['aria-label'] || '' }, has(at, 'checked') ? { selected: true } : {}));
        else if (ty !== 'hidden') o = push(n, 'sap.m.Input', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {}));
        break; }
      case 'textarea': o = push(n, 'sap.m.TextArea', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'select': o = push(n, 'sap.m.Select', {}, { selText: n.sel || at.value || '' }); under(n.i).forEach(k => consumed.add(k.i)); break;
      case 'ui5-search': o = push(n, 'sap.m.SearchField', at.placeholder ? { placeholder: at.placeholder } : {}); break;
      case 'ui5-textarea': o = push(n, 'sap.m.TextArea', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'ui5-select': case 'ui5-combobox': o = push(n, 'sap.m.Select', {}, { selText: n.sel || at.value || '' }); break;
      case 'ui5-multi-combobox': o = push(n, 'sap.m.MultiComboBox', at.placeholder ? { placeholder: at.placeholder } : {}); break;
      case 'ui5-date-picker': case 'ui5-datetime-picker': o = push(n, 'sap.m.DatePicker', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'ui5-daterange-picker': o = push(n, 'sap.m.DateRangeSelection', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'ui5-time-picker': o = push(n, 'sap.m.TimePicker', at.value ? { value: at.value } : {}); break;
      case 'ui5-checkbox': o = push(n, 'sap.m.CheckBox', Object.assign({ text: at.text || txt }, has(at, 'checked') ? { selected: true } : {})); break;
      case 'ui5-radio-button': o = push(n, 'sap.m.RadioButton', Object.assign({ text: at.text || txt }, has(at, 'checked') ? { selected: true } : {})); break;
      case 'ui5-switch': o = push(n, 'sap.m.Switch', has(at, 'checked') ? { state: true } : {}); break;
      case 'ui5-tag': case 'ui5-badge': case 'ui5-object-status': o = push(n, 'sap.m.ObjectStatus', Object.assign({ text: txt, state: STATE[at.design || at.state] || 'None', inverted: t !== 'ui5-object-status' }, at.icon ? { icon: icn(at.icon) } : {})); break;
      case 'ui5-title': o = push(n, 'sap.m.Title', { text: txt }); break;
      case 'ui5-label': o = push(n, 'sap.m.Label', { text: txt }); break;
      case 'ui5-text': o = push(n, 'sap.m.Text', { text: txt }); break;
      case 'ui5-link': o = push(n, 'sap.m.Link', { text: txt }); break;
      case 'ui5-icon': { const nm = icn(at.name || at.icon); o = push(n, 'sap.ui.core.Icon', nm ? { src: nm } : {}); break; }
      case 'ui5-avatar': o = push(n, 'sap.m.Avatar', Object.assign({}, at.initials ? { initials: at.initials } : {}, at.icon ? { src: icn(at.icon) } : {}, at.size ? { displaySize: at.size } : {})); break;
      case 'ui5-progress-indicator': o = push(n, 'sap.m.ProgressIndicator', { displayValue: (at['display-value'] || (at.value ? at.value + '%' : '')), state: STATE[at['value-state']] || 'None', showValue: true }); break;
      case 'ui5-busy-indicator': o = push(n, 'sap.m.BusyIndicator', at.text ? { text: at.text } : {}); break;
      case 'ui5-message-strip': o = push(n, 'sap.m.MessageStrip', { text: txt, type: STATE[at.design] || 'Information' }); break;
      case 'ui5-step-input': o = push(n, 'sap.m.StepInput', { value: at.value || '0' }); break;
      case 'ui5-slider': o = push(n, 'sap.m.Slider', { value: at.value || '0', min: at.min || '0', max: at.max || '100' }); break;
      case 'ui5-rating-indicator': o = push(n, 'sap.m.RatingIndicator', has(at, 'readonly') ? { editable: false } : {}); break;
      case 'ui5-card': o = push(n, 'sap.f.Card', {}); break;
      case 'ui5-li': case 'ui5-li-custom': o = push(n, 'sap.m.StandardListItem', Object.assign({ title: txt.replace(at.description || '\u0000', '').trim() || txt }, at.description ? { description: at.description } : {}, at.icon ? { icon: icn(at.icon) } : {})); break;
      case 'ui5-li-group-header': o = push(n, 'sap.m.GroupHeaderListItem', { title: txt }); break;
      case 'ui5-list': o = push(n, 'sap.m.List', {}); break;
      case 'ui5-tabcontainer': {
        o = push(n, 'sap.m.IconTabBar', {});
        const tabs = (kids[n.i] || []).filter(k => k.t === 'ui5-tab'), sel = tabs.find(k => has(k.at, 'selected')) || tabs[0], hr = n.r.slice(); hr[3] = Math.min(n.r[3], 48);
        child(o, 'h', 'sap.m.IconTabHeader', { selectedKey: sel ? '__d' + sel.i : '' }, hr, n); break; }
      case 'ui5-tab': {
        const pn = nodes[n.p], tabs = pn ? (kids[pn.i] || []).filter(k => k.t === 'ui5-tab') : [], idx = tabs.indexOf(n), per = pn ? Math.min(pn.r[2] / Math.max(1, tabs.length), 120) : 100;
        o = push(n, 'sap.m.IconTabFilter', Object.assign({ text: at.text || '', key: '__d' + n.i }, at.icon ? { icon: icn(at.icon) } : {}), { box: pn ? [pn.r[0] + idx * per, pn.r[1], per, Math.min(pn.r[3], 48)] : n.r.slice() }); break; }
      case 'ui5-shellbar': {
        o = push(n, 'sap.tnt.ToolHeader', {});
        if (at['primary-title']) child(o, 't', 'sap.m.Title', { text: at['primary-title'] }, [n.r[0] + 64, n.r[1] + 12, 200, 28], n);
        if (has(at, 'show-search') || (kids[n.i] || []).some(k => /search/.test(k.t))) child(o, 's', 'sap.m.SearchField', {}, [n.r[0] + n.r[2] - 300, n.r[1] + 10, 220, 32], n);
        break; }
      case 'ui5-dialog': case 'ui5-popover': case 'ui5-responsive-popover': {
        if (!has(at, 'open')) return;
        o = push(n, t === 'ui5-dialog' ? 'sap.m.Dialog' : 'sap.m.Popover', at['header-text'] ? { title: at['header-text'] } : {}, { hid: '1', parent: 'sap-ui-static' });
        if (at['header-text']) { child(o, 'b', 'sap.m.Bar', {}, [n.r[0], n.r[1], n.r[2], 52], n); controls.push({ id: o.id + 'bt', cls: 'sap.m.Title', parent: o.id + 'b', props: { text: at['header-text'] }, css: [], box: [n.r[0] + 16, n.r[1] + 14, Math.max(80, n.r[2] - 32), 24], st: stOf(n), tx: Object.assign(txOf(n), { fs: 16, fw: 700 }), aria: {}, i: controls.length }); }
        return; }
      case 'img': { const src = n.img || ''; o = push(n, 'sap.m.Image', { src }); if (src.startsWith('data:')) (DM.__img = DM.__img || {})[src] = src; break; }
      case 'svg': if (n.svg) o = push(n, 'x.Svg', { svg: n.svg }); else o = push(n, 'sap.ui.core.Icon', { src: 'sap-icon://hint' }); break;
      default: break;
    }
    if (!o) {
      if (role === 'dialog' || role === 'alertdialog' || role === 'menu' || role === 'listbox' || role === 'tooltip') { o = push(n, role === 'dialog' || role === 'alertdialog' ? 'sap.m.Dialog' : 'sap.m.Popover', {}, { hid: '1', parent: 'sap-ui-static' }); return; }
      if (role === 'switch') { o = push(n, 'sap.m.Switch', at['aria-checked'] === 'true' || at['data-state'] === 'checked' ? { state: true } : {}); under(n.i).forEach(k => consumed.add(k.i)); return; }
      if (role === 'checkbox') { o = push(n, 'sap.m.CheckBox', Object.assign({ text: deepText(n) }, at['aria-checked'] === 'true' || at['data-state'] === 'checked' ? { selected: true } : {})); under(n.i).forEach(k => consumed.add(k.i)); return; }
      if (role === 'radio') { const sib = (kids[n.p] || []).find(k => k !== n && (k.t === 'label' || k.tx)); o = push(n, 'sap.m.RadioButton', Object.assign({ text: sib ? deepText(sib) : '' }, at['aria-checked'] === 'true' || at['data-state'] === 'checked' ? { selected: true } : {})); under(n.i).forEach(k => consumed.add(k.i)); if (sib) { consumed.add(sib.i); under(sib.i).forEach(k => consumed.add(k.i)); } return; }
      if (role === 'tablist') { o = push(n, 'sap.m.IconTabBar', {}); const tb = (kids[n.i] || []).filter(k => k.at && k.at.role === 'tab'), sel = tb.find(k => k.at['aria-selected'] === 'true' || k.at['data-state'] === 'active') || tb[0];
        child(o, 'h', 'sap.m.IconTabHeader', { selectedKey: sel ? '__d' + sel.i : '' }, n.r.slice(), n); return; }
      if (role === 'tab') { o = push(n, 'sap.m.IconTabFilter', { text: deepText(n), key: '__d' + n.i }); under(n.i).forEach(k => consumed.add(k.i)); return; }
      if (role === 'button' && (deepText(n) || iconOf(n) || under(n.i).some(k => k.t === 'svg'))) {
        const tt = deepText(n), ic = iconOf(n);
        o = push(n, 'sap.m.Button', Object.assign({ type: bgOf(n) && dark(bgOf(n)) ? 'Emphasized' : (bgOf(n) || (c.bw || []).some(Boolean)) ? 'Default' : 'Transparent' }, tt ? { text: tt } : {}, ic ? { icon: ic } : !tt ? { icon: 'sap-icon://overflow' } : {}));
        under(n.i).forEach(k => consumed.add(k.i)); return; }
    }
    if (o) { o.parent = o.hid ? 'sap-ui-static' : parentId(n); return; }
    // a plain element (div, span, p, section, li, td …) or a container web component
    const hasKids = (kids[n.i] || []).length > 0, visual = !!(bgOf(n) || c.sh || (c.bw || []).some(Boolean));
    if (n.tx && !hasKids && !/^ui5-/.test(t) && !visual) { o = push(n, textLike(n), { text: n.tx }); return; }
    if (!hasKids && !n.tx && !visual) return;
    o = push(n, /flex/.test(c.d || '') && c.fd !== 'column' ? 'sap.m.HBox' : 'sap.m.VBox', {});
    if (n.tx) { const tb = textBox(n, n.tx), line = (kids[n.i] || []).filter(k => k.r && Math.abs(k.r[1] - n.r[1] - ((n.cs || {}).pad || [0])[0]) < (px((n.cs || {}).fs) || 14));
      if (line.length) tb[0] = Math.max(tb[0], Math.max(...line.map(k => k.r[0] + k.r[2])) + 4);                  // plain text that follows an inline child starts after it
      child(o, 't', textLike(n), { text: n.tx }, tb, n); }
  });
  controls.forEach((x, i) => { x.i = i; });
  { const byId = {}, flex = []; controls.forEach(x => { byId[x.id] = x; });                      // CSS widths in React apps are fractions of the parent (w-full, flex-1): give the converter the signal a SAPUI5 app gives (width 100% / flex-grow)
    controls.forEach(x => { const p = byId[x.parent]; if (!p || x.absPos || !/^sap\.(m\.(VBox|HBox)|f\.Card)$/.test(x.cls) || !/^sap\.(m\.(VBox|HBox)|f\.Card)$/.test(p.cls)) return;
      const pad = p.st.pad || [0, 0, 0, 0], inL = p.box[0] + pad[3], inR = p.box[0] + p.box[2] - pad[1], row = p.cls === 'sap.m.HBox';
      if (!row && Math.abs(x.box[2] - (inR - inL)) <= 1.5 && x.box[2] > 24) x.props.width = '100%';
      if (row && Math.abs(x.box[0] + x.box[2] - inR) <= 1.5 && x.box[0] > inL + 1 && x.box[2] > 40) flex.push({ id: x.id + 'fd', cls: 'sap.m.FlexItemData', parent: x.id, props: {}, css: [], box: [x.box[0], x.box[1], 0, 0], st: Object.assign({}, x.st, { grow: '1' }), tx: x.tx, aria: {}, i: 0 }); });
    flex.forEach(k => controls.push(k)); }
  const root = controls.find(x => !x.parent) || controls[0];
  const pg = DM.page || VW;
  return { origin: DM.url || '', title: DM.title || 'Make screen', ui5: 'webcomponents', theme: DM.theme || '', compact: true, viewport: [Math.max(VW[0], pg[0] || 0), Math.max(VW[1], pg[1] || 0)], root: root ? root.id : '', n: controls.length, controls, vars: DM.vars || {}, imageData: DM.__img || {}, explore: DM.explore };
}
function convert(D, KIT, MAP, EXTRA, nameArg) {
  if (D && D.kind === 'dom' && Array.isArray(D.nodes)) D = domToUi5(D);                 // React / web-component app: same pipeline from here
  D = Object.assign({}, D, { controls: D.controls.map(c => Object.assign({}, c)) });   // this converter re-parents a few controls: never touch the caller's dump
  { const AL = MAP.class_alias || {}; D.controls.forEach(k => { if (AL[k.cls]) { k.cls0 = k.cls; k.cls = AL[k.cls]; } }); }   // OverflowToolbarButton → Button, ShellBar → ToolHeader, ObjectPage → DynamicPage, ui.table → m.Table …
  {                                                                                   // a SimpleForm's fields hang on the Form (FormContainer / FormElement have no DOM): lay them out in its Grid
    const LAY = /^sap\.ui\.layout\.(form\.(Form|SimpleForm|ResponsiveGridLayout)|Grid)$/, byId = new Map(D.controls.map(k => [k.id, k]));
    D.controls.filter(k => k.cls === 'sap.ui.layout.Grid').forEach(g => { let f = byId.get(g.parent); if (f && f.cls === 'sap.ui.layout.form.ResponsiveGridLayout') f = byId.get(f.parent);
      if (f && f.cls === 'sap.ui.layout.form.Form') D.controls.forEach(k => { if (k.parent === f.id && !LAY.test(k.cls)) k.parent = g.id; }); });
  }
  const NAV = [], SHELL = {}, WARN = [], IMAGES = [], R = v => Math.round(v * 10) / 10, R5 = v => Math.round(v * 2) / 2;

  // ── control index ────────────────────────────────────────────────────────────────────────
  const by = {}, lay = {}, kids = {};
  D.controls.forEach(c => { by[c.id] = c; });
  {                                                                                                         // a Dialog's buttons are its own aggregation; the footer toolbar is drawn under them → put them into it
    const oc = c => /^sap\.m\.(Dialog|Popover|ResponsivePopover|ActionSheet)$/.test(c.cls), kidsOf = {};
    D.controls.forEach(c => { (kidsOf[c.parent] = kidsOf[c.parent] || []).push(c); });
    D.controls.filter(c => /^sap\.m\.(AssociativeOverflowToolbar|OverflowToolbar|Toolbar|Bar)$/.test(c.cls) && c.box[2] > 40 && !(kidsOf[c.id] || []).some(k => k.cls !== 'sap.m.FlexItemData')).forEach(t => {
      const owner = by[t.parent] && oc(by[t.parent]) ? by[t.parent] : (() => { let p = by[t.parent], n = 0; while (p && n++ < 8 && !oc(p)) p = by[p.parent]; return p && oc(p) ? p : null; })();
      if (!owner) return;
      (kidsOf[owner.id] || []).filter(k => k !== t && /^sap\.m\.(Button|ToggleButton|MenuButton|Select|SearchField|ToolbarSpacer)$/.test(k.cls) && k.box[2] > 0 && k.box[0] >= t.box[0] - 2 && k.box[0] + k.box[2] <= t.box[0] + t.box[2] + 2 && k.box[1] >= t.box[1] - 2 && k.box[1] + k.box[3] <= t.box[1] + t.box[3] + 2)
        .forEach(k => { k.parent = t.id; });
    });
  }
  D.controls.forEach(c => { if (c.cls === 'sap.m.FlexItemData' && by[c.parent]) lay[c.parent] = c.st; });
  const skip = new Set(MAP.skip_cls);
  const vparent = c => { let p = c.parent; while (p && by[p] && skip.has(by[p].cls)) p = by[p].parent; return p; };
  // a control the user cannot see in Make: hidden by CSS (probe: hid), far outside the page (OverflowToolbar clones, off-screen measuring copies), or an invisible-text helper
  // Overlays (Dialog, Popover, Menu, Action Sheet…) live in the static area, outside the page tree, and are position:fixed (the probe flags them hidden).
  // An OPEN one (it has a real box) becomes its own frame next to the screen; its controls count as visible.
  const OVR = /^sap\.m\.(Dialog|Popover|ResponsivePopover|ActionSheet|Menu)$|^sap\.ui\.unified\.Menu$/;
  const ovs0 = D.controls.filter(c => OVR.test(c.cls) && c.box[2] >= 100 && c.box[3] >= 60);
  const isUnder = (c, a) => { for (let p = by[c.parent], n = 0; p && n++ < 20; p = by[p.parent]) if (p === a) return true; return false; };
  const ovs = ovs0.filter(o => !ovs0.some(a => a !== o && isUnder(o, a) && Math.abs(a.box[0] - o.box[0]) <= 2 && Math.abs(a.box[1] - o.box[1]) <= 2 && Math.abs(a.box[2] - o.box[2]) <= 2)), ovIds = new Set(ovs.map(o => o.id));   // ResponsivePopover → its inner Popover: one frame
  const inOv = c => { for (let p = c, n = 0; p && n++ < 40; p = by[p.parent]) if (ovIds.has(p.id)) return true; return false; };
  // a Table that scrolls sideways: its right-hand columns and their cells are clipped (the probe says hidden) and lie beyond the viewport, but they are real content
  const inTable = c => { for (let p = c, n = 0; p && n++ < 8; p = by[p.parent]) { if (p.cls === 'sap.m.Column' || p.cls === 'sap.m.ColumnListItem') { const t = by[p.parent]; return !!(t && (t.cls === 'sap.m.Table' || t.cls === 'sap.m.ColumnListItem')) || p !== c; } } return false; };
  const scrolled = c => c.box[2] > 0 && c.box[3] > 0 && inTable(c) && !/Toolbar|Bar$/.test(c.cls);
  const off = c => (c.hid === 1 && !inOv(c) && !scrolled(c)) || (c.box[0] > D.viewport[0] - 1 && !scrolled(c)) || c.box[0] + c.box[2] < 1 || /HiddenElement|InvisibleText/.test((c.css || []).join(' '));
  D.controls.forEach(c => { if (!skip.has(c.cls) && !off(c)) (kids[vparent(c)] = kids[vparent(c)] || []).push(c); });
  const ch = c => (kids[c.id] || []).filter(k => !k.absPos && !(c.cls === 'sap.f.DynamicPageHeader' && MAP.skip_in_dynamic_header.includes(k.cls)));
  const grow = c => parseFloat((lay[c.id] || {}).grow) || 0;
  const px = v => { const m = /^(\d+(\.\d+)?)(px|rem)$/.exec(v || ''); return m ? parseFloat(m[1]) * (m[3] === 'rem' ? 16 : 1) : null; };

  // ── colours → SAP variables by VALUE and ROLE ────────────────────────────────────────────
  const KV = new Set(Object.keys(KIT.vars).map(n => n.split('/').pop()));
  const hexOf = v => { v = String(v || '').trim().toLowerCase(); let m = /^#([0-9a-f]{6})$/.exec(v); if (m) return '#' + m[1];
    m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v); if (m) return '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
    m = /^rgba?\(([^)]+)\)/.exec(v); if (m) { const p = m[1].split(',').map(parseFloat); if (p.length > 3 && p[3] < 1) return null; return '#' + p.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); } return null; };
  const VAL = {};
  for (const [n, v] of Object.entries(D.vars || {})) { if (!KV.has(n)) continue; const h = hexOf(v); if (h) (VAL[h] = VAL[h] || []).push(n); }
  if (Object.keys(D.vars || {}).length < 20) for (const [vp, v] of Object.entries(KIT.vars)) { const n = vp.split('/').pop(), h = hexOf(String(v).split('|')[2]); if (h && !(VAL[h] || []).includes(n)) (VAL[h] = VAL[h] || []).push(n); }   // an app that gives no CSS variables (React / web components): the kit's own Horizon values
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
    if (best && bd < 140) { WARN.push(`colour ${hex} has no exact SAP ${role} token — used the nearest: ${best}`); return best; }
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
    if (ICONS.has(n)) return n;
    // not in the kit: never leave a gap — put the closest kit icon (a real icon instance, easy to swap) and say so
    const toks = n.split('-').filter(t => t.length > 2), list = [...ICONS];
    let best = null, sc = 0; for (const k of list) { const kt = k.split('-'); const s = toks.filter(t => kt.includes(t)).length * 10 - Math.abs(kt.length - toks.length); if (s > sc) { sc = s; best = k; } }
    const sub = best || (/(error|fail|cancel|decline|reject)/.test(n) ? 'error' : /(warn|alert|attention|late)/.test(n) ? 'alert' : /(success|accept|done|complete)/.test(n) ? 'accept' : /(add|create|new)/.test(n) ? 'add' : /(edit|change)/.test(n) ? 'edit' : /(delete|remove)/.test(n) ? 'delete' : /(user|person|people|employee|customer)/.test(n) ? 'group' : /(document|file|text)/.test(n) ? 'document' : 'hint');
    WARN.push(`icon "${raw}" is not in the SAP kit — placed "${sub}" (a kit icon: swap it if needed)`); return ICONS.has(sub) ? sub : null;
  }

  // ── node makers ──────────────────────────────────────────────────────────────────────────
  const CONTAINERS = new Set(['sap.f.DynamicPage', 'sap.f.DynamicPageTitle', 'sap.f.DynamicPageHeader', 'sap.tnt.ToolPage', 'sap.tnt.NavigationList', 'sap.m.IconTabHeader', 'sap.m.ScrollContainer', 'sap.m.Page', 'sap.m.Panel', 'sap.m.List', 'sap.m.OverflowToolbar', 'sap.m.Toolbar', 'sap.ui.layout.VerticalLayout', 'sap.ui.layout.HorizontalLayout', 'sap.ui.layout.Grid', 'sap.m.ObjectIdentifier']);   // layout containers: their children are placed by the measured boxes (frame())
  const WIDGET = /(ComboBox|MultiInput|Input|TextArea|Picker|Selection|StepInput|Slider|RangeSlider|RatingIndicator|ProgressIndicator|Tokenizer|Token)$/;   // input-like widgets whose children are internals, not content
  const box = c => c.box.slice();
  const inst = (c, cp, pr, label, tx) => ({ _src: c.id, _b: cp === 'Switch' && KIT.components[cp] ? [c.box[0], c.box[1] + (c.box[3] - KIT.components[cp].h) / 2, KIT.components[cp].w, KIT.components[cp].h] : box(c), _k: 'inst', _grow: grow(c), _w: px(c.props.width), n: label || cp, k: 'i', cp, pr, w: (cp === 'Switch' || cp === 'Icon Button') && KIT.components[cp] ? KIT.components[cp].w : R(c.box[2]), h: (KIT.components[cp] && KIT.components[cp].h && cp !== 'Shell Bar' && cp !== 'Tab' && cp !== 'Navigation Item' && cp !== 'Object Status' && cp !== 'Text Area' && cp !== 'Message Strip') ? KIT.components[cp].h : R(c.box[3]), _intr: (KIT.components[cp] || {}).h, ...(tx ? { tx } : {}) });
  // the app's own icon on a status: the kit status keeps its icon as a nested instance, so the plugin swaps it (the user can swap it again)
  const withIco = (n, src) => { const ic = src ? icon(src) : null; if (ic) n.ico = { Icon: ic }; return n; };
  // a DatePicker keeps an ISO value and shows it with its displayFormat (dd MMM yyyy …)
  function fmtDate(v, f) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || '')); if (!m) return String(v || '');
    const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], y = +m[1], mo = +m[2], d = +m[3];
    return String(f || 'MMM d, y').replace(/yyyy|yy|y|MMMM|MMM|MM|M|dd|d/g, t => ({ yyyy: y, yy: String(y).slice(2), y, MMMM: MN[mo - 1], MMM: MN[mo - 1].slice(0, 3), MM: String(mo).padStart(2, '0'), M: mo, dd: String(d).padStart(2, '0'), d }[t]));
  }
  function text(c, t) {
    { const tx0 = c.tx || {}, fs0 = tx0.fs || 14;                     // UI5 sets a Bar's middle width late: a title that fits the bar many times over is one line
      if (c.box[3] > fs0 * 1.9 && /^sap\.m\.(Title|Text)$/.test(c.cls || '')) { let p = D.controls.find(k => k.id === c.parent), n = 0; while (p && p.cls !== 'sap.m.Bar' && n++ < 6) p = D.controls.find(k => k.id === p.parent);
        if (p && p.cls === 'sap.m.Bar' && String(t).length * fs0 * 0.62 < p.box[2] - 64) c = Object.assign({}, c, { box: [c.box[0], c.box[1], Math.ceil(String(t).length * fs0 * 0.62) + 8, Math.round(fs0 * 1.45)] }); } }
    const tx = c.tx || {}, fs = tx.fs || 14, wrap = c.box[3] > fs * 1.9;
    // Lines Make really shows: the control's own maxLines, else what fits its measured box (line-clamp / fixed height). Figma then
    // truncates with "…" at that many lines instead of letting the extra lines run out of the row and get clipped.
    const lh = tx.lh || fs * 1.4, mx = Number(c.props.maxLines), ml = wrap ? (mx > 0 ? mx : Math.max(2, Math.round(c.box[3] / lh))) : 0;
    return { _src: c.id, _b: box(c), _k: 'text', _grow: grow(c), _wrap: wrap, _lineFix: !wrap, n: String(t).slice(0, 28), k: 't', t: String(t), w: R(c.box[2]), h: R(c.box[3]), st: style(c), bg: tok(hexOf(tx.fg), 'ink'), ...(wrap ? { wrap: 1, ml } : {}), ...(c.props.textAlign === 'Center' ? { ta: 'C' } : {}) };
  }
  function iconNode(name, c, w) { return name ? { _src: c.id, _b: box(c), _k: 'icon', _grow: 0, n: 'Icon ' + name, k: 'ic', ic: name, bg: tok(hexOf((c.tx || {}).fg || c.st.fg), 'ink'), w } : null; }
  const nameOf = c => c.css.includes('flyDateTile') ? 'Fare Tile' : c.css.includes('flyFlightRow') ? 'Flight Row' : c.css.includes('flyCardContent') ? 'Card Content'
    : { 'sap.m.VBox': 'Column', 'sap.m.HBox': 'Row', 'sap.m.FlexBox': 'Row', 'sap.f.DynamicPage': 'Dynamic Page', 'sap.f.DynamicPageTitle': 'Page Title', 'sap.f.DynamicPageHeader': 'Page Header', 'sap.f.Card': 'Card' }[c.cls] || c.cls.split('.').pop();

  function conv(c) {
    const n = conv0(c); if (n && typeof n === 'object' && !n._src) n._src = c.id;
    const ab = (kids[c.id] || []).filter(k => k.absPos);                                   // absolutely positioned children (connector lines, badges on a corner): free placement inside their parent
    if (n && n.c && ab.length) ab.forEach(k => { const m = conv(k); if (m) { m.abs = 1; m.xy = [R(k.box[0] - c.box[0]), R(k.box[1] - c.box[1])]; n.c.push(m); } });
    return n;
  }   // _src = the Make control a node came from (make-verify.js traces it)
  function conv0(c) {
    const p = c.props;
    switch (c.cls) {
      case 'sap.tnt.ToolHeader': return shell(c);
      case 'sap.tnt.SideNavigation': return sidenav(c);
      case 'sap.m.IconTabBar': return tabs(c);
      case 'sap.m.Button': case 'sap.m.ToggleButton': {
        const inBar = /sapMBarChild/.test((c.aria && c.aria.cls) || ''), plain = (!p.type || p.type === 'Default') && inBar && c.st.bw === 0 && !c.st.bg;     // a toolbar / header button (sapMBarChild) is flat; a free-standing Default button IS bordered (the probe reads the outer element, UI5 paints the border on the inner one)
        const type = plain ? 'Tertiary' : (MAP.button_type[p.type || 'Default'] || 'Secondary');
        const blank = !!p.icon && (kids[c.id] || []).some(k => k.cls === 'sap.ui.core.Icon' && !/SAP-icons/i.test((k.tx || {}).ff || 'SAP-icons'));   // Make shows no glyph (the name is not in the SAP icon font) but keeps its room
        const ic = p.icon ? (blank ? (['info', 'accept', 'hint'].find(n => ICONS.has(n)) || [...ICONS][0]) : icon(p.icon)) : null, btn = (n) => { if (blank) n.fade = ['Icon']; return n; };
        return btn(p.text ? inst(c, 'Button', { Type: type, 'Form Factor': 'Compact', '✏️ Text': p.text, ...(ic ? { 'Icon Left': true, Icon: ic } : {}) }, 'Button ' + p.text)
          : inst(c, 'Icon Button', { Type: type === 'Primary' ? 'Primary' : type === 'Tertiary' ? 'Tertiary' : 'Secondary', 'Form Factor': 'Compact', ...(p.enabled === false ? { 'Interaction State': 'Disabled' } : {}), ...(ic ? { Icon: ic } : {}) }, 'Icon Button ' + (ic || '')));
      }
      case 'sap.m.Input': return !p.value && p.placeholder ? inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Placeholder', '✏️ Placeholder': p.placeholder }, 'Input ' + p.placeholder.slice(0, 24)) : inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || '' }, 'Input ' + (p.value || '').slice(0, 24));
      case 'sap.m.MultiComboBox': {                            // nothing selected: hide the kit's sample tokens, show the placeholder in the nested Input
        const n = inst(c, 'Multi Combobox', { 'Form Factor': 'Compact', 'Drop-Down': 'False' }, 'Multi Combobox ' + (p.placeholder || ''));
        n.hide = ['1st Token', '2nd Token', 'Overflow Link / Typing'];                       // the kit's sample tokens
        if (p.placeholder) n.add = [{ into: '⿻ Tokens Compact', t: p.placeholder, st: 'MediumText/LHAuto/Regular', bg: 'sapField_PlaceholderTextColor' }];   // the kit has no placeholder layer: text goes into the tokens slot
        return n;
      }
      case 'sap.m.DateRangeSelection': case 'sap.m.DatePicker': return inst(c, 'Date (Range) Picker', { 'Form Factor': 'Compact', Calendar: false }, 'Date Picker ' + (p.placeholder || ''), { 'Input Text': fmtDate(p.value, p.displayFormat) || p.placeholder || '' });
      case 'sap.m.SearchField': return inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || p.placeholder || '' }, 'Search ' + (p.placeholder || ''));
      case 'sap.m.CheckBox': return inst(c, 'Check Box', { 'Form Factor': 'Compact', Label: true, '✏️ Text': p.text || '', Check: p.selected ? 'Checked' : 'Unchecked' }, 'Check Box ' + (p.text || ''));
      case 'sap.m.Switch': return inst(c, 'Switch', { 'Form Factor': 'Compact', Checked: p.state ? 'True' : 'False' }, 'Switch');
      case 'sap.m.Select': return inst(c, 'Select', { 'Form Factor': 'Compact' }, 'Select ' + (c.selText || ''), { 'Input Text': c.selText || '' });
      case 'sap.m.Link': return inst(c, 'Link', { Type: 'Regular', 'Icon Position': 'N/A', '✏️ Text': p.text || '' }, 'Link ' + (p.text || ''));
      case 'sap.m.Label': return inst(c, 'Label', { '✏️ Label': p.text || '' }, 'Label ' + (p.text || ''));
      case 'sap.m.ObjectNumber': return inst(c, 'Object Number', { Type: p.emphasized === false ? 'Regular' : 'Emphasized', Semantic: p.state && p.state !== 'None' ? p.state : 'None' }, 'Object Number ' + p.number, { '956.00 EUR': [p.number, p.unit].filter(Boolean).join(' ') });
      case 'sap.m.Avatar': {
        if (p.initials) return inst(c, 'Avatar', { Type: 'Initials', Size: p.displaySize || 'S', Color: MAP.avatar_color[p.backgroundColor] || '6', '✏️ Initials': p.initials }, 'Avatar ' + p.initials);
        const sz = { 24: 'XS', 32: 'S', 48: 'M', 64: 'L', 112: 'XL' }[Math.round(c.box[2])];
        if (sz && /^sap-icon:\/\//.test(p.src || '') && p.backgroundColor !== 'Transparent') { const n = inst(c, 'Avatar', { Type: 'Icon', Size: sz, Color: MAP.avatar_color[p.backgroundColor] || '6' }, 'Avatar'); n.w = n.h = R(c.box[2]); n.s = 'XX'; return n; }
        const g = iconNode(icon(p.src), c, 24); return { _b: box(c), _k: 'frame', _grow: 0, n: 'Icon Tile', d: 'H', a: 'CC', w: R(c.box[2]), h: R(c.box[3]), c: g ? [{ ...g, s: 'XX', w: 24, h: 24 }] : [] };
      }
      case 'sap.m.Text': return text(c, p.text || '');
      case 'sap.m.FeedListItem': {                                   // comment / message row: avatar + [sender link + message, info · time]
        const k0 = ch(c), av = k0.find(k => k.cls === 'sap.m.Avatar'), lk = k0.find(k => k.cls === 'sap.m.Link');
        if (!lk || !p.text) return frame(c, 'FeedListItem');
        const x2 = lk.box[0] + lk.box[2] + 4, w2 = Math.max(80, c.box[0] + c.box[2] - x2 - 16), fs = 14, lh = 19.6, x = lk.box[0];
        const lines = Math.max(1, Math.ceil(String(p.text).length * 7.2 / w2)), meta = [p.info, p.timestamp].filter(Boolean).join(' · ');
        const ms = Object.assign({}, c, { id: c.id + '-t', box: [x2, lk.box[1], w2, lines * lh], props: {}, tx: { fs, fw: 400, fg: '#131e29', ff: '72', lh } });
        const mt = Object.assign({}, c, { id: c.id + '-m', box: [x, lk.box[1] + lines * lh + 8, c.box[0] + c.box[2] - x - 16, 16], props: {}, tx: { fs: 12, fw: 400, fg: '#556b82', ff: '72', lh: 16 } });
        const line = layout({ _b: [x, lk.box[1], c.box[0] + c.box[2] - x - 16, lines * lh], _k: 'frame', n: 'Message', d: 'H' }, [conv(lk), text(ms, p.text)], { V: false, st: { ai: 'flex-start' }, flex: true });
        const col = layout({ _b: [x, lk.box[1], c.box[0] + c.box[2] - x - 16, lines * lh + 8 + (meta ? 16 : 0)], _k: 'frame', n: 'Column', d: 'V' }, [line, meta ? text(mt, meta) : null].filter(Boolean), { V: true, st: {}, flex: false });
        const sib = D.controls.filter(k => k.parent === c.parent && k.cls === c.cls), last = c.box[1] >= Math.max(...sib.map(k => k.box[1]));
        const row = layout({ _b: box(c), _k: 'frame', n: 'FeedListItem', d: 'H', bg: 'sapList_Background' }, [av && conv(av), col].filter(Boolean), { V: false, st: { ai: 'flex-start' }, flex: true });
        if (!last) { row.bc = 'sapList_BorderColor'; row.bw = [0, 0, 1, 0]; }
        return row;
      }
      case 'sap.ui.unified.Calendar': return inst(c, 'Calendar', { 'Form Factor': 'Compact', 'Week Numbers': false }, 'Calendar');
      case 'sap.m.ObjectAttribute': return text(c, (p.title ? p.title + ': ' : '') + (p.text || ''));
      case 'sap.m.ObjectHeader': {                                   // title is a property of the header; attributes / statuses are its children
        const extraT = p.title ? [text(Object.assign({}, c, { id: c.id + '-title', box: [c.box[0] + 16, c.box[1] + 16, Math.max(80, c.box[2] - 32), 24], props: {}, tx: { fs: 20, fw: 700, fg: '#131e29', ff: '72-Bold', lh: 24 } }), p.title)] : [];
        return frame(c, 'ObjectHeader', { geo: true, extra: extraT });
      }
      case 'sap.m.TextArea': return inst(c, 'Text Area', { 'Form Factor': 'Compact', Content: p.value ? 'Typed Text' : 'Placeholder', '✏️ Placeholder': p.placeholder || '', '✏️ Typed Text': p.value || '' }, 'Text Area ' + (p.placeholder || p.value || '').slice(0, 24));
      case 'sap.m.FeedInput': {                                      // reply box: text area + send button
        const k0 = ch(c), ta = k0.find(k => k.cls === 'sap.m.TextArea'), bt = k0.find(k => k.cls === 'sap.m.Button');
        if (!ta) return frame(c, 'FeedInput');
        const tn = conv(ta), bn = bt && conv(bt); if (tn) { tn._grow = 1; if (bt && bt.box[0] > ta.box[0]) tn._b = [ta.box[0], ta.box[1], bt.box[0] - ta.box[0] - 8, ta.box[3]]; }   // Make lets the send button sit on the text area's right padding
        return layout({ _b: box(c), _k: 'frame', n: 'FeedInput', d: 'H' }, [tn, bn].filter(Boolean), { V: false, st: { ai: 'center' }, flex: true });
      }
      case 'sap.m.GroupHeaderListItem': {                            // "Sort Order" / "Sort By" band of a list
        const t = Object.assign({}, c, { id: c.id + '-t', box: [c.box[0] + 16, c.box[1] + (c.box[3] - 18) / 2, Math.max(40, c.box[2] - 32), 18], props: {}, tx: { fs: 14, fw: 700, fg: '#131e29', ff: '72-Bold', lh: 18 } });
        return layout({ _b: box(c), _k: 'frame', n: 'Group Header', d: 'H', bg: 'sapList_GroupHeaderBackground', bc: 'sapList_GroupHeaderBorderColor', bw: [0, 0, 1, 0] }, [text(t, p.title || '')], { V: false, st: { ai: 'center' }, flex: true });
      }
      case 'sap.m.StandardListItem': {                               // list row: radio / check box + title (+ description)
        const k0 = ch(c), rb = k0.find(k => k.cls === 'sap.m.RadioButton'), cb = k0.find(k => k.cls === 'sap.m.CheckBox'), ttl = p.title || '';
        let lead;
        if (rb) lead = inst(rb, 'Radio Button', { 'Form Factor': 'Compact', Label: true, '✏️ Text': ttl, Selected: (p.selected || rb.props.selected) ? 'True' : 'False' }, 'Radio Button ' + ttl);
        else if (cb) lead = inst(cb, 'Check Box', { 'Form Factor': 'Compact', Label: true, '✏️ Text': ttl, Check: (p.selected || cb.props.selected) ? 'Checked' : 'Unchecked' }, 'Check Box ' + ttl);
        else if (ttl) lead = text(Object.assign({}, c, { id: c.id + '-t', box: [c.box[0] + 16, c.box[1] + (c.box[3] - 18) / 2, Math.max(40, c.box[2] - 32), 18], props: {}, tx: { fs: 14, fw: 400, fg: '#131e29', ff: '72', lh: 18 } }), ttl);
        if (!lead && !rb && !cb || (!rb && !cb && (p.description || p.icon))) {              // kit List Item: Byline (title + description) with the leading icon
          const ic = p.icon ? icon(p.icon) : null, byl = !!p.description;
          const li = inst(c, 'List Item', Object.assign({ Type: byl ? 'Byline' : 'Single Line', 'Form Factor': 'Compact', Separator: true, Attachment: false, '✏️ Text': ttl }, byl ? { '✏️ Byline': p.description } : { 'Icon / Selector': !!ic, 'Leading Icon': !!ic }, !byl && ic ? { 'Leading Icon Swap': ic } : {}), 'List Item ' + ttl.slice(0, 24));
          li.h = R(c.box[3]); li._intr = li.h; li.s = 'FX';
          if (!(byl && ic)) return li;
          // the kit's Byline row has no icon slot: a real icon instance sits at Make's place (absolute), the text container is pushed right by the icon's width
          const ib = (ch(c).find(k => k.cls === 'sap.ui.core.Icon') || { box: [c.box[0] + 4, c.box[1] + (c.box[3] - 32) / 2, 44, 32] }).box, ix = ib[0] - c.box[0] + (ib[2] - 16) / 2, iy = ib[1] - c.box[1] + (ib[3] - 16) / 2;
          li.shift = { 'Text Container': R(ib[0] - c.box[0] + ib[2] - 16) };
          const icn = { _src: c.id + '-ic', _b: [c.box[0] + ix, c.box[1] + iy, 16, 16], _k: 'icon', _grow: 0, n: 'Icon ' + ic, k: 'ic', ic, bg: tok('#556b82', 'ink'), w: 16, abs: 1, xy: [R(ix), R(iy)] };
          return { _src: c.id, _b: box(c), _k: 'frame', _grow: grow(c), n: 'List Item ' + ttl.slice(0, 24), d: 'V', w: R(c.box[2]), h: R(c.box[3]), s: 'FX', c: [li, icn] };
        }
        if (!lead) return frame(c, 'List Item');
        lead._b = [c.box[0] + 8, c.box[1] + (c.box[3] - (lead.h || 16)) / 2, lead.w || c.box[2] - 16, lead.h || 16];
        return layout({ _b: box(c), _k: 'frame', n: 'List Item ' + ttl.slice(0, 24), d: 'H', bg: 'sapList_Background', bc: 'sapList_BorderColor', bw: [0, 0, 1, 0] }, [lead], { V: false, st: { ai: 'center' }, flex: true });
      }
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
      case 'x.Svg': { const fg = hexOf((c.tx || {}).fg || c.st.fg); return { _src: c.id, _b: box(c), _k: 'vec', _grow: 0, n: 'Icon', k: 'v', svg: String(p.svg), w: R(c.box[2]), h: R(c.box[3]), bg: tok(fg || '#556b82', 'ink'), s: 'XX' }; }
      case 'sap.ui.core.HTML': return htmlNode(c);
      case 'sap.m.Panel': {                                    // UI5 paints a Panel's white on its inner content area, not on the panel element the probe reads
        const n = frame(c, 'Panel'); if (!n.bg) n.bg = tok('#ffffff', 'fill'); return n;
      }
      case 'sap.m.ToolbarSpacer': return { _b: box(c), _k: 'spacer', _grow: 1 };                // a toolbar's flexible gap
      case 'sap.m.Table': return table(c);
      case 'sap.f.DynamicPageTitle': {
        const all = ch(c), tb = all.find(k => k.cls === 'sap.m.OverflowToolbar');
        if (!tb) return frame(c, nameOf(c), { geo: true });                          // the actions toolbar is not on screen: heading and buttons are placed by their boxes (the CSS says 'column')
        const inTb = k => k !== tb && k.box[0] >= tb.box[0] - 1 && k.box[0] + k.box[2] <= tb.box[0] + tb.box[2] + 1 && k.box[1] >= tb.box[1] - 1 && k.box[1] + k.box[3] <= tb.box[1] + tb.box[3] + 1;
        const real = k => k.cls !== 'sap.m.ToolbarSpacer', inside = all.filter(inTb).filter(real), rest = all.filter(k => k !== tb && !inTb(k)).filter(real);
        const tbNode = layout({ _b: box(tb), _k: 'frame', _grow: 1, n: 'Actions', d: 'H' }, inside.map(conv).filter(Boolean), { V: false, st: { ai: 'center', jc: 'flex-end' }, flex: true });
        const node = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Page Title', d: 'H' }; if (c.st.bg) node.bg = tok(hexOf(c.st.bg), 'fill');
        const left = rest.map(conv).filter(Boolean), lead = left.length > 1 ? layout({ _b: union(left), _k: 'frame', n: 'Title Content', d: 'H' }, left, { V: false, st: { ai: 'center' }, flex: true }) : left[0];
        // heading on the left, actions on the right: the title row spreads them (space-between), the actions part takes the free width — no fixed gap that would break when the page resizes
        return layout(node, [lead, tbNode].filter(Boolean), { V: false, st: { ai: 'center', jc: 'space-between', pad: c.st.pad }, flex: true });
      }
      case 'sap.m.GenericTile': return tile(c);
      case 'sap.m.NumericContent': return numeric(c);
      case 'sap.m.ObjectStatus': {
        const sem = { None: 'None', Success: 'Success', Warning: 'Warning', Error: 'Error', Information: 'Information' }[p.state || 'None'] || 'None';   // the kit component carries the state colour (and the badge when Inverted)
        if (p.title && c.box[2] > 40) {                              // "Priority: ● Critical" — the kit status has no title: a muted label in front of it
          const tw = Math.min(Math.round(p.title.length * 6.3) + 6, Math.round(c.box[2] * 0.6));
          const tn = text(Object.assign({}, c, { id: c.id + '-title', box: [c.box[0], c.box[1], tw, c.box[3]], props: {}, tx: Object.assign({}, c.tx, { fw: 400, fg: '#556b82', ff: '72' }) }), p.title + ':');
          const ic1 = sem === 'None' && p.icon ? icon(p.icon) : null;                       // a status without a state has no icon slot: a real icon in front of the text
          const sn = ic1 ? layout({ _b: [c.box[0] + tw, c.box[1], c.box[2] - tw, c.box[3]], _k: 'frame', n: 'Object Status ' + (p.text || ''), d: 'H' }, [iconNode(ic1, Object.assign({}, c, { box: [c.box[0] + tw, c.box[1], 16, c.box[3]] }), 16), inst(Object.assign({}, c, { box: [c.box[0] + tw + 20, c.box[1], c.box[2] - tw - 20, c.box[3]] }), 'Object Status', { Semantic: 'None', Inverted: 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' })], { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true })
            : withIco(inst(Object.assign({}, c, { box: [c.box[0] + tw, c.box[1], c.box[2] - tw, c.box[3]] }), 'Object Status', { Semantic: sem, Inverted: p.inverted === true ? 'Yes' : 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' }), p.icon);
          if (ic1) { sn.g = 4; sn.a = 'MC'; sn.s = 'HH'; }
          sn.s = 'XX'; const rw = layout({ _b: box(c), _k: 'frame', n: 'Object Status ' + p.title, d: 'H' }, [tn, sn], { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true }); rw.g = 4; rw.a = 'MC'; return rw;   // label and badge: vertically centred, a 4 px gap
        }
        { const ic0 = sem === 'None' && p.icon ? icon(p.icon) : null;                        // the kit status without a state has no icon slot: a real icon (swappable) in front of the text
          if (ic0 && c.box[2] > 24) {
            const icn = iconNode(ic0, Object.assign({}, c, { box: [c.box[0], c.box[1], 16, c.box[3]] }), 16);
            const sn = inst(Object.assign({}, c, { box: [c.box[0] + 20, c.box[1], c.box[2] - 20, c.box[3]] }), 'Object Status', { Semantic: 'None', Inverted: 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' });
            const rw = layout({ _b: box(c), _k: 'frame', n: 'Object Status ' + (p.text || ''), d: 'H' }, [icn, sn], { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true }); rw.g = 4; rw.a = 'MC'; return rw;
          } }
        const os = withIco(inst(c, 'Object Status', { Semantic: sem, Inverted: p.inverted === true ? 'Yes' : 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' }), p.icon);
        if (!p.icon && sem !== 'None') { os.hide = ['Icon Container']; os.fit = ['Text']; }
        return os;
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
      case 'sap.m.SegmentedButton': {                          // kit: one Segmented Button Singular per segment (the selected one is Toggled)
        // one segment per position: UI5 renders each SegmentedButtonItem AND its own inner Button ("__item5" + "__item5-button") at the same box —
        // both were converted, so every segment came out twice ("Cheapest | Cheapest", 2026-10-05). The item wins; a lone Button stays.
        const items = ch(c).filter(k => /^sap\.m\.(Button|ToggleButton|SegmentedButtonItem)$/.test(k.cls)).sort((a, b) => a.box[0] - b.box[0] || (a.cls === 'sap.m.SegmentedButtonItem' ? -1 : 1))
          .filter((k, i, arr) => !arr.slice(0, i).some(o => Math.abs(o.box[0] - k.box[0]) < 2 && Math.abs(o.box[2] - k.box[2]) < 2));
        if (!items.length) return frame(c, 'Segmented Button');
        const segs = items.map(k => ({ t: k.props.text || '', ic: k.props.icon ? icon(k.props.icon) : null, on: /SegBBtnSel|ToggleBtnPressed|Pressed/.test((k.aria && k.aria.cls) || '') }));
        if (segs.length > 5) { const nodes = items.map((k, i) => inst(k, 'Segmented Button Singular', Object.assign({ 'Form Factor': 'Compact', Type: segs[i].t ? 'Text' : 'Icon', Toggled: segs[i].on ? 'True' : 'False' }, segs[i].t ? { '✏️ Text': segs[i].t } : {}, segs[i].ic ? (segs[i].t ? { 'Icon Left': true, Icon: segs[i].ic } : { Icon: segs[i].ic }) : {}), 'Segment ' + (segs[i].t || segs[i].ic || ''))); return layout({ _b: box(c), _k: 'frame', n: 'Segmented Button', d: 'H' }, nodes, { V: false, st: {}, flex: false }); }   // the kit part holds at most 5
        const sb = inst(Object.assign({}, c, { box: [c.box[0], c.box[1], c.box[2], c.box[3]] }), 'Segmented Button', { 'Form Factor': 'Compact', Type: segs.some(s => s.t) ? 'Text' : 'Icon', '3rd Button': segs.length >= 3, '4th Button': segs.length >= 4, '5th Button': segs.length >= 5 }, 'Segmented Button');
        sb.seg = segs; sb._w = null;
        return layout({ _b: box(c), _k: 'frame', n: 'Segmented Button Row', d: 'H' }, [sb], { V: false, st: {}, flex: false });
      }
      case 'sap.uxap.AnchorBar': {                             // Object Page: the section buttons are Inline tabs of the kit tab bar
        const bts = ch(c).filter(k => /^sap\.m\.(Button|ToggleButton|MenuButton)$/.test(k.cls) && k.props.text).sort((a, b) => a.box[0] - b.box[0]);
        if (!bts.length) return frame(c, 'Anchor Bar');
        const si = Math.max(0, bts.findIndex(k => /Selected/.test((k.aria && k.aria.cls) || '')));
        const nodes = bts.map((k, i) => ({ ...inst(k, 'Tab', { Type: 'Inline', 'Interaction State': i === si ? 'Regular Active' : 'Regular Inactive', 'Menu Arrow': false, '✏️ Text': k.props.text }, 'Tab ' + k.props.text), _w: null }));
        return layout({ _b: box(c), _k: 'frame', n: 'Anchor Bar', d: 'H', bg: tok(hexOf(c.st.bg || '#ffffff'), 'fill'), bc: tok('#d9d9d9', 'border'), bw: [0, 0, 1, 0] }, nodes, { V: false, st: c.st, flex: false });
      }
      default: {
        const row = MAP.controls && MAP.controls[c.cls], kc = row && KIT.components[row.comp];
        if (row && kc) {                                         // data-driven: make-map.json "controls"
          const pr = {}, kp = new Set(Object.keys(kc.props || {}).map(k => k.replace(/#.*$/, '')));
          if (kp.has('Form Factor')) pr['Form Factor'] = 'Compact';
          for (const [k, spec] of Object.entries(row.props || {})) {
            if (typeof spec === 'string') { pr[k] = spec.slice(1); continue; }
            let v = c.props[spec.from];
            if (spec.icon) { const ic = icon(v); if (ic) pr[k] = ic; continue; }
            if (spec.pct) { const mn = Number(c.props[spec.pct[0]] ?? 0), mx = Number(c.props[spec.pct[1]] ?? 100), q = Math.round(((Number(v ?? mn) - mn) / ((mx - mn) || 1)) * 4) * 25; const lo = spec.clamp ? spec.clamp[0] : 0, hi = spec.clamp ? spec.clamp[1] : 100; pr[k] = Math.max(lo, Math.min(hi, q)) + '%'; continue; }
            if (v === undefined || v === null || v === '') { if (spec.def === undefined) continue; v = spec.def; }
            else if (spec.map) v = spec.map[String(v)] !== undefined ? spec.map[String(v)] : (spec.def !== undefined ? spec.def : v);
            if (spec.not) v = !v;
            if (spec.bool) v = !!v && v !== 'false';
            if (spec.boolStr) v = (v === true || v === 'true' || v === 'True') ? 'True' : 'False';
            pr[k] = v;
          }
          const tx = {}; for (const [layer, from] of Object.entries(row.tx || {})) { const v = c.props[from]; if (v !== undefined && v !== '') tx[layer] = String(v); }
          return inst(c, row.comp, pr, row.comp + ' ' + String(c.props.text || c.props.value || c.props.title || '').slice(0, 24), Object.keys(tx).length ? tx : undefined);
        }
        if (!CONTAINERS.has(c.cls) && WIDGET.test(c.cls)) {      // an unmapped input-like widget: its inner parts (arrow icon, tokenizer, clear button) are not layout — keep only its box, never its innards
          WARN.push(`control ${c.cls} is not mapped to a SAP kit component — empty frame of its size (its inner parts are not converted)`);
          const n = { _src: c.id, _b: box(c), _k: 'frame', _sized: true, _grow: grow(c), n: nameOf(c), d: 'H', w: R(c.box[2]), h: R(c.box[3]), s: c.props.width === '100%' ? 'FX' : 'XX', c: [] };
          if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
          if (c.st.bw > 0) { n.bc = tok(hexOf(c.st.bc), 'border') || 'sapField_BorderColor'; n.bw = c.st.bw; }
          if (c.st.br) n.r = Math.round(c.st.br);
          return n;
        }
        if (!CONTAINERS.has(c.cls) && !(MAP.containers_ok || []).includes(c.cls) && !ch(c).length && (c.props.text || c.props.title || c.props.value) && !WIDGET.test(c.cls)) {      // a control this converter has never seen, with its own text: show the text, never an empty frame
          WARN.push(`control ${c.cls} is not mapped to a SAP kit component — its text is shown as plain text`);
          return text(c, String(c.props.text || c.props.title || c.props.value));
        }
        if (!CONTAINERS.has(c.cls) && !(MAP.containers_ok || []).includes(c.cls)) WARN.push(`control ${c.cls} is not mapped to a SAP kit component — plain frame`);
        return frame(c, nameOf(c));
      }
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
    if (st.sh) { const bl = Math.max(...(String(st.sh).match(/(\d+(?:\.\d+)?)px/g) || ['0px']).map(parseFloat).slice(0, 4)); n.fxk = KIT.effects[bl > 4 ? 'Shadow/sapContent_Shadow1' : 'Shadow/sapContent_Shadow0'] || KIT.effects['Shadow/sapContent_Shadow1']; }
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
      else { const el = { tag: m[2].toLowerCase(), css: cssOf((/style="([^"]*)"/.exec(m[3]) || [])[1]), cls: (/class="([^"]*)"/.exec(m[3]) || [])[1] || '', kids: [] }; stack[stack.length - 1].kids.push(el); stack.push(el); }
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
      const css = { ...inh, ...el.css }, sub = el.kids.filter(k => k.tag), own = top && c.st.display === 'flex' ? { display: 'flex', 'flex-direction': c.st.dir === 'column' ? 'column' : 'row', gap: String(c.st.gap || '').split('/')[0], ...el.css } : el.css;
      if (!top && /line|track/i.test(el.cls || '')) {                                // "fsLine": a rule left and right of its label
        const lf = leaf(el, inh), rule = () => ({ _k: 'frame', n: 'Line', d: 'V', s: 'FX', w: 10, h: 1, bg: tok('#d9d9d9', 'border') });
        if (lf) return { _k: 'frame', n: 'Line', d: 'H', a: 'MC', g: 8, c: [rule(), lf, rule()], s: 'FH', w: lf.w + 28, h: lf.h };
      }
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
    return Object.assign(inst(c, 'Shell Bar', { ...(menu ? { Hamburger: 'True' } : {}), 'Shell Search': ch(c).some(k => k.cls === 'sap.m.SearchField'), Help: false, Overflow: false }, 'Shell Bar', Object.assign({ Text: title }, (ch(c).find(k => k.cls === 'sap.m.SearchField') || { props: {} }).props.placeholder ? { Placeholder: ch(c).find(k => k.cls === 'sap.m.SearchField').props.placeholder } : {})), { av: SHELL.initials });
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
    const filters = ch(c).filter(k => k.cls === 'sap.m.IconTabFilter'), withIcon = filters.length > 0 && filters.every(t => t.props.icon && icon(t.props.icon) && t.box[3] >= 56);   // icon over the label (tall filter); a flat tab keeps the plain kit tab
    const nodes = filters.map(t => {
      const act = t.props.key === sk, tName = 'Tab ' + t.props.text;
      if (!withIcon) return { ...inst(t, 'Tab', { Type: 'Inline', 'Interaction State': act ? 'Regular Active' : 'Regular Inactive', 'Menu Arrow': false, '✏️ Text': t.props.text || '' }, tName), _w: null };
      const ib = inst(Object.assign({}, t, { box: [t.box[0], t.box[1], 38, 38] }), 'Tab', { Type: 'Icon Only', 'Form Factor': 'Compact', 'Interaction State': act ? 'Regular Active' : 'Regular Inactive', 'Icon': icon(t.props.icon), 'Item Count': !!t.props.count, 'Item Count Text': String(t.props.count || '') }, 'Tab icon ' + t.props.text);   // Make: circle icon over the label (the kit's Process and Filter tab is side by side)
      if (!t.props.text) { ib.w = R(t.box[2]); ib.h = R(t.box[3]); return ib; }                       // icon-only tab: the kit part as it is (its own selection bar)
      if (act) ib.hide = ['Selection Bar'];                                                                   // the kit's bar sits under the icon: Make draws it under the label
      const lb = text(Object.assign({}, t, { id: t.id + '-lbl', box: [t.box[0], t.box[1] + 40, t.box[2], 18], props: {}, tx: Object.assign({}, t.tx, { fs: 14, fw: 700, fg: act ? '#0064d9' : '#1d2d3e', ff: '72-Bold', lh: 18 }) }), t.props.text || '');
      Object.assign(lb, { s: 'FH', wrap: 1, ml: 1, ta: 'C' });                        // Make cuts a long label at the tab width with "…"
      const bar = { _src: t.id + '-bar', _b: [t.box[0], t.box[1] + 62, t.box[2], 3], _k: 'frame', _grow: 0, n: 'Selection Bar', d: 'V', w: R(t.box[2]), h: 3, s: 'XX', c: [], ...(act ? { bg: tok('#0064d9', 'border') } : {}) };
      const tf = layout({ _b: box(t), _k: 'frame', n: tName, d: 'V' }, [ib, lb, bar], { V: true, st: {}, flex: false });
      tf.a = 'MC'; tf.s = 'XH'; tf.w = R(t.box[2]);
      tf.c.forEach(k => { if (k.k === 't') { k.s = 'XX'; k.w = R(t.box[2]); k.h = 18; k.ml = 1; k.wrap = 1; } });   // fixed width: a long label is cut with "…"
      return tf;
    });
    const OWN = k => k.cls !== 'sap.m.IconTabFilter' && k.cls !== 'sap.m.IconTabHeader' && k.cls !== 'sap.m.IconTabFilterExpandButtonBadge' && !(withIcon && k.cls === 'sap.ui.core.Icon');
    const selF = filters.find(t => t.props.key === sk) || filters[0];
    const content = ch(c).filter(OWN).concat(selF ? ch(selF).filter(OWN) : []);   // the content of the selected tab sits under its filter
    const hdrNode = layout({ _b: (hdr.box && c.box[3] - hdr.box[3] > 8 ? hdr.box : box(c)).slice(), _k: 'frame', n: 'Icon Tab Bar', d: 'H', bg: tok(hexOf((hdr.st && hdr.st.bg) || '#ffffff'), 'fill'), bc: tok('#d9d9d9', 'border'), bw: [0, 0, 1, 0] }, nodes, { V: false, st: c.st, flex: false });
    if (hdrNode.p && hdrNode.p[1] > 200) hdrNode.p[1] = 0;          // tabs sit at the start; the free width to the right is not padding
    if (!content.length) return hdrNode;                          // a tab bar that also holds the tab content (cards, lists…): headers on top, content below
    const body = content.map(k => { const n = conv(k); if (!n || k.cls !== 'sap.m.List') return n;                         // Make: a list in a tab sits on the grey content area, with the cards inset
      const top = Math.max(k.box[1] - 16, hdr.box ? hdr.box[1] + hdr.box[3] : k.box[1] - 16); return layout({ _b: [c.box[0], top, c.box[2], k.box[1] + k.box[3] + 16 - top], _k: 'frame', n: 'Tab Content', d: 'V', bg: 'sapBackgroundColor' }, [n], { V: true, st: {}, flex: false }); }).filter(Boolean);
    return layout({ _b: box(c), _k: 'frame', _grow: grow(c), n: 'Icon Tab Bar', d: 'V' }, [hdrNode, ...body], { V: true, st: {}, flex: false });
  }
  // ── sap.m.Table: a real <table> (display table / table-row / table-cell), so the controls' boxes say nothing about rows and columns by themselves.
  // The Column controls (the header cells) give the x-range of every column; each ColumnListItem is one row; a cell control belongs to the column its centre sits in.
  // Every row becomes an auto-layout row whose cells have the column widths (the column without a width flexes), so header and rows line up and the table resizes.
  function table(c) {
    const all = ch(c), cols = all.filter(k => k.cls === 'sap.m.Column').sort((a, b) => a.box[0] - b.box[0]);
    const items = all.filter(k => k.cls === 'sap.m.ColumnListItem').sort((a, b) => a.box[1] - b.box[1]);
    if (!cols.length) return frame(c, 'Table');
    const rest = all.filter(k => !cols.includes(k) && !items.includes(k)), TX = c.box[0], TW = c.box[2], right = TX + TW, lastC = cols[cols.length - 1];
    const segs = cols.map(k => ({ k, x: k.box[0], w: k.box[2], hA: k.props.hAlign }));
    if (segs[0].x - TX > 1.5) segs.unshift({ x: TX, w: segs[0].x - TX });                                   // leading cell (selection box)
    if (right - (lastC.box[0] + lastC.box[2]) > 1.5) segs.push({ x: lastC.box[0] + lastC.box[2], w: right - (lastC.box[0] + lastC.box[2]) });   // trailing cell (navigation arrow)
    let flex = segs.filter(s => s.k && !px(s.k.props.width));
    if (!flex.length) flex = [segs.filter(s => s.k).sort((a, b) => b.w - a.w)[0]];
    else if (flex.length > 1 && flex.length === segs.filter(s => s.k).length) flex = [flex.slice().sort((a, b) => b.w - a.w)[0]];   // all auto: fill-sharing would ignore Make's widths (cells with content cannot shrink) → fixed widths, one flexible
    flex.forEach(s => { s.flex = true; });
    segs.forEach(s => { s.ox = s.x; s.ow = s.w; });                                                          // Make's own column geometry: cell contents keep their offsets from it
    {                                                                                                          // Make lets a wide table scroll sideways; a Figma table must fit its width → the flexible column gives way first, then the others shrink in proportion
      let over = Math.max(...segs.map(s => s.ox + s.ow)) - right;
      if (over > 1.5) {
        const minOf = s => (s.flex ? 120 : 64), slack = segs.reduce((q, s) => q + Math.max(0, s.w - minOf(s)), 0);   // every column gives up a share of what it has above its minimum
        if (slack > 0) { const f = Math.min(1, over / slack); segs.forEach(s => { s.w -= Math.max(0, s.w - minOf(s)) * f; }); over -= Math.min(over, slack); }
        if (over > 1.5) { const tot = segs.reduce((q, s) => q + s.w, 0), f = Math.max(0.3, (tot - over) / tot); segs.forEach(s => { s.w = Math.max(40, s.w * f); }); }
        let x = TX; segs.forEach(s => { s.x = x; s.w = R5(s.w); x += s.w; });
      }
    }
    const segOf = k => { const m = k.box[0] + k.box[2] / 2; let j = segs.findIndex(s => m >= s.ox - 0.5 && m <= s.ox + s.ow + 0.5); if (j < 0) j = m < segs[0].ox ? 0 : segs.length - 1; return j; };
    const cell = (s, list, y, h) => {                                                                        // one cell: the control(s) of that column in that row, placed by their real offsets
      const nodes = list.map(conv).filter(Boolean), n = { _b: [s.x, y, s.w, h], _k: 'frame', _sized: true, n: 'Cell', d: 'H', a: 'MC', w: R(s.w), h: R(h), s: (s.flex ? 'F' : 'X') + 'F', c: [] };
      if (!nodes.length) return n;
      const b = union(nodes), l = Math.max(0, R5(b[0] - s.ox)), r = Math.max(0, R5(s.ox + s.ow - (b[0] + b[2]))), top = b[1] - y, bot = y + h - (b[1] + b[3]);
      const endAl = s.hA === 'End' || s.hA === 'Right' || (!s.k && r + 1.5 < l);                           // the column's hAlign decides; a leading / trailing cell has none, there the offsets decide
      const pt = Math.abs(top - bot) <= 2 ? 0 : Math.max(0, R5(top)), pb = Math.abs(top - bot) <= 2 ? 0 : Math.max(0, R5(bot));
      const k = nodes.length === 1 ? nodes[0] : layout({ _b: b, _k: 'frame', n: 'Column', d: 'V' }, nodes, { V: true, st: {}, flex: false });
      k.s = letters(k, false, [s.w - (endAl ? r : l), h - pt - pb], 'C');
      if (s.flex && k._k === 'frame' && !/^F/.test(k.s) && k._b[2] >= s.w - l - r - 1.5 && !k._w) k.s = 'F' + k.s[1];   // a control that spans a flexible column flexes with it
      const pr = endAl ? r : (/^F/.test(k.s) ? r : 0);                                                      // free space right of a hugging control is not padding; a control that fills the cell keeps the cell's own right padding
      Object.assign(n, { a: (endAl ? 'X' : 'M') + (pt || pb ? 'M' : 'C'), c: [k], ...(pt || pb || l || pr ? { p: [pt, pr, pb, endAl ? 0 : l] } : {}) });
      return n;
    };
    const rowOf = (src, name, y, h, cells) => {
      const n = { _src: src.id, _b: [TX, y, TW, h], _k: 'frame', _sized: true, _fixH: true, n: name, d: 'H', a: 'MC', w: R(TW), h: R(h), s: 'FX', c: cells, bc: 'sapList_BorderColor', bw: [0, 0, 1, 0] };
      if (src.st.bg) n.bg = tok(hexOf(src.st.bg), 'fill');
      return n;
    };
    const parts = rest.map(k => ({ y: k.box[1], n: conv(k) }));
    const hy = Math.min(...cols.map(k => k.box[1])), hh = Math.max(...cols.map(k => k.box[3]));
    parts.push({ y: hy, n: rowOf(cols[0], 'Header Row', hy, hh, segs.map(s => cell(s, s.k ? ch(s.k) : [], hy, hh))) });
    items.forEach(it => { const per = segs.map(() => []); ch(it).forEach(k => per[segOf(k)].push(k)); parts.push({ y: it.box[1], n: rowOf(it, 'Row', it.box[1], it.box[3], segs.map((s, i) => cell(s, per[i], it.box[1], it.box[3]))) }); });
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Table', d: 'V' }; if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
    return layout(n, parts.filter(p => p.n).sort((a, b) => a.y - b.y).map(p => p.n), { V: true, st: {}, flex: false });
  }
  function cardHeader(c) {
    const av = ch(c).find(k => k.cls === 'sap.m.Avatar'), tx = ch(c).find(k => k.cls === 'sap.m.Text'), out = [];
    if (av) out.push(conv(av)); if (tx) out.push(text(tx, tx.props.text || ''));
    return layout({ _b: box(c), _k: 'frame', n: 'Card Header', d: 'H' }, out.filter(Boolean), { V: false, st: { ai: 'center' }, flex: true });
  }
  function frame(c, name, o = {}) {
    const st = c.st, flex = !o.geo && /flex/.test(st.display), V = flex ? /column/.test(st.dir) : true;      // o.geo: ignore the CSS, read the layout from the boxes
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), _w: /px$/.test(c.props.width || '') ? px(c.props.width) : null, _wfill: c.props.width === '100%', n: name, d: V ? 'V' : 'H' };
    if (st.bg) n.bg = tok(hexOf(st.bg), 'fill');
    if (c.bwa && c.bwa.some(Boolean)) { const si = c.bwa.findIndex(Boolean); n.bc = tok(hexOf((c.bca || [])[si] || st.bc), 'border') || 'sapTile_BorderColor'; n.bw = c.bwa.every(x => x === c.bwa[0]) ? c.bwa[0] : c.bwa.slice(); }
    else if (o.border || st.bw > 0) { n.bc = tok(hexOf(st.bc), 'border') || 'sapTile_BorderColor'; n.bw = st.bw > 0 ? st.bw : 1; }
    if (st.br) n.r = Math.round(st.br);
    if (st.sh) {                                                           // Make draws a card / popup with a shadow: the kit shadow of the same size
      const bl = Math.max(...(String(st.sh).match(/(\d+(?:\.\d+)?)px/g) || ['0px']).map(parseFloat).slice(0, 4)), nm = bl >= 40 ? 'Shadow/sapContent_Shadow3' : bl >= 12 ? 'Shadow/sapContent_Shadow2' : bl > 4 ? 'Shadow/sapContent_Shadow1' : 'Shadow/sapContent_Shadow0';   // Make's faint card shadow (blur ≤ 4 px) = SAP Shadow0, not the heavier Shadow1 (2026-10-05)
      n.fxk = KIT.effects[nm] || KIT.effects['Shadow/sapContent_Shadow1']; if (c.cls === 'sap.f.Card') { delete n.bc; delete n.bw; }
    }
    let kids = ch(c).map(conv).filter(Boolean);
    if (o.extra && o.extra.length) kids = kids.concat(o.extra).sort((a, b) => a._b[1] - b._b[1] || a._b[0] - b._b[0]);   // controls the frame draws itself (e.g. a header's title)
    const lineGroups = list => { const lines = []; let bottom = -1e9; for (const k of list) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } } return lines; };
    // NOT flexbox (Grid, floats, inline flow, table parts, plain divs): the CSS says nothing about the direction, so read it from where the children really are.
    // One line of children → a row (a row that spans the container shares its width, like grid columns); several lines → a column of line rows.
    const rowOfLine = (ln, name, whole) => {
      const u = whole || union(ln), spans = u[2] > 0.6 * c.box[2] && ln.reduce((a, k) => a + k._b[2], 0) > 0.6 * c.box[2];
      if (spans) ln.forEach(k => { if (k._k === 'frame' && !k._w && !k._grow) k._grow = 1; });
      else ln.forEach(k => { if (k._wfill) { k._wfill = false; k._w = k._b[2]; } });                     // a narrow line keeps the width it has in Make
      const gaps = ln.slice(1).map((k, i) => k._b[0] - (ln[i]._b[0] + ln[i]._b[2])), big = gaps.length ? gaps.indexOf(Math.max(...gaps)) : -1;
      if (big >= 0 && gaps[big] > 48 && gaps[big] > 0.25 * c.box[2] && gaps[big] > 4 * Math.max(8, ...gaps.filter((g, i) => i !== big)))      // one huge gap between two groups = a flexible space (heading left, actions right)
        ln = [...ln.slice(0, big + 1), { _k: 'spacer', _grow: 1, _b: [ln[big]._b[0] + ln[big]._b[2], u[1], gaps[big], u[3]] }, ...ln.slice(big + 1)];
      const row = layout(whole ? Object.assign(n, { d: 'H' }) : { _b: u, _k: 'frame', n: name, d: 'H' }, ln, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
      if (row.a[0] !== 'S' && !row.c.some(k => /^F/.test(k.s || ''))) row.c.push({ _k: 'frame', n: 'Spacer', d: 'H', w: 1, h: 1, s: 'FH', _sized: true });   // one part of a row must flex
      return row;
    };
    if (!flex && kids.length > 1) {
      const lines = lineGroups(kids);
      if (lines.length === 1) return rowOfLine(kids, 'Row', box(c));
      if (lines.some(l => l.length > 1)) { n.d = 'V'; return layout(n, lines.map(ln => ln.length === 1 ? ln[0] : rowOfLine(ln, 'Row')), { V: true, st: {}, flex: false }); }
    }
    if (flex && !V && /wrap/.test(st.wrap) && kids.length > 1) {          // a wrapped row that broke into several lines → a column of line rows
      const lines = []; let bottom = -1e9;
      for (const k of kids) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } }
      // Make wraps these items itself. When every item has its own width (no flex-grow), keep ONE row and let Figma wrap it (auto layout
      // "wrap"): it then re-wraps when the frame gets narrower or wider, like the browser does. Line rows would freeze today's breaks.
      if (lines.length > 1 && !kids.some(k => k._grow) && Math.max(...kids.map(k => k._b[2])) <= 0.4 * Math.max(...lines.map(ln => Math.max(...ln.map(k => k._b[0] + k._b[2])) - Math.min(...ln.map(k => k._b[0]))))) {
        const rowGap = Math.max(0, R5(lines[1].reduce((m, k) => Math.min(m, k._b[1]), 1e9) - lines[0].reduce((m, k) => Math.max(m, k._b[1] + k._b[3]), -1e9)));
        const l0 = lines[0], colGap = l0.length > 1 ? Math.max(0, R5(l0[1]._b[0] - l0[0]._b[0] - l0[0]._b[2])) : 16, top = Math.min(...l0.map(k => k._b[1]));
        const ob = new Map(kids.map(k => [k, k._b])), onb = n._b; let x = kids[0]._b[0]; const flat = [];
        lines.forEach(ln => { const t = Math.min(...ln.map(k => k._b[1])); ln.forEach(k => { const b = k._b.slice(); b[0] = x; b[1] = top + (b[1] - t); k._b = b; x += b[2] + colGap; flat.push(k); }); });
        const one = layout(Object.assign(n, { d: 'H', _b: [kids[0]._b[0], top, x - colGap - kids[0]._b[0], Math.max(...flat.map(k => k._b[1] + k._b[3])) - top] }), flat, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
        ob.forEach((b, k) => { k._b = b; }); one._b = onb; one.h = R(onb[3]);                  // the trace must compare with the REAL Make boxes
        one.wrapRow = 1; one.cg = rowGap; one.s = 'FH';                                  // a wrap row spans its parent and hugs its lines (a fixed height made line 2 overlap line 1)
        one.c.forEach(k => { if (k.s && k.s[1] === 'F') k.s = k.s[0] + 'H'; });
        one.c = one.c.filter(k => !(k.n === 'Spacer' && k.w === 1));
        return one;
      }
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
    let counter = /center/.test(ai) ? 'C' : /end/.test(ai) ? 'X' : 'M';
    let primary = /space-between/.test(jc) ? 'S' : /center/.test(jc) ? 'C' : /end/.test(jc) ? 'X' : 'M';
    let ks = list.slice();
    if (ks.some(k => k._k === 'spacer')) {                    // flexible spacers (a toolbar's ToolbarSpacer, flex-grow filler, a big gap between two groups) → real FILL spacer frames between the groups
      const segs = [[]], gapBox = [null]; for (const k of ks) { if (k._k === 'spacer') { segs.push([]); gapBox.push(k._b); } else segs[segs.length - 1].push(k); }
      const parts = segs.map((sg, i) => ({ sg, gb: gapBox[i] })).filter(x => x.sg.length);
      ks = []; parts.forEach((x, i) => {
        if (i > 0) ks.push({ _b: x.gb, _k: 'frame', _sized: true, n: 'Spacer', d: V ? 'V' : 'H', w: 1, h: 1, s: V ? 'HF' : 'FH' });   // one spacer = start | end, two = the middle part centred — equal shares of the free space, exactly like flex-grow
        ks.push(x.sg.length === 1 ? x.sg[0] : layout({ _b: union(x.sg), _k: 'frame', n: i === 0 ? 'Leading Content' : 'Trailing Content', d: V ? 'V' : 'H' }, x.sg, { V, st: { ai: 'center' }, flex: true }));
      });
      ks = ks.filter((k, i) => !(k.n === 'Spacer' && (i === 0 || i === ks.length - 1)));   // a spacer at the very start or end only pushes: keep it out unless it is the only flexible part
      if (!ks.some(k => k.n === 'Spacer')) { const lsp = list[0]._k === 'spacer', tsp = list[list.length - 1]._k === 'spacer'; primary = lsp && tsp ? 'C' : lsp ? 'X' : primary; }   // only outer spacers: centred / pushed to the end
    }
    const mi = V ? 1 : 0, me = V ? 3 : 2, ci = V ? 0 : 1, ce = V ? 2 : 3;
    // safety net: auto layout puts the children one after another along the main axis. If they overlap along that axis in Make (side by side while the frame stacks them,
    // absolute positioning), the frame will NOT match Make — say so, so it is caught before pasting (build/make-verify.js measures how far off)
    for (let i = 1; i < ks.length; i++) if (ks[i]._b[mi] < ks[i - 1]._b[mi] + ks[i - 1]._b[me] - 2 ) { WARN.push(`layout: children of "${node.n}" overlap along the ${V ? 'vertical' : 'horizontal'} axis in Make (${ks[i - 1].n} | ${ks[i].n}) but the frame places them one after another — will not match`); break; }
    const gs = []; for (let i = 1; i < ks.length; i++) gs.push(ks[i]._b[mi] - (ks[i - 1]._b[mi] + ks[i - 1]._b[me]));
    const gap = primary === 'S' || !gs.length ? 0 : Math.max(0, R(Math.min(...gs)));
    if (primary !== 'S') ks = ks.map((k, i) => { const e = i > 0 ? gs[i - 1] - gap : 0; return e > 0.6 ? lead(k, e, V) : k; });
    let p = [0, 0, 0, 0];
    // the MEASURED boxes win over the CSS alignment: a flex-end row whose children all sit at its top (the row is taller than them) put the
    // search fields 8 px too low (2026-10-05). Only when every child shares one edge and the CSS edge is not shared.
    if (ks.length && counter !== 'M') {
      const st0 = ks.map(k => k._b[ci] - b[ci]), en0 = ks.map(k => b[ci] + b[ce] - (k._b[ci] + k._b[ce]));
      const same = v => Math.max(...v) - Math.min(...v) <= 1;
      const cssOk = counter === 'X' ? same(en0) && Math.min(...en0) <= 1.5 : same(ks.map((k, i) => st0[i] - en0[i]));
      if (!cssOk && same(st0)) counter = 'M';
    }
    if (ks.length) {
      const f = ks[0]._b, l = ks[ks.length - 1]._b, ms = f[mi] - b[mi], mEnd = b[mi] + b[me] - (l[mi] + l[me]);
      const cs = Math.min(...ks.map(k => k._b[ci])) - b[ci], cEnd = b[ci] + b[ce] - Math.max(...ks.map(k => k._b[ci] + k._b[ce]));
      const css = st.pad || [0, 0, 0, 0], useMain = primary === 'M' || primary === 'S';
      const mS = useMain ? Math.max(0, R5(ms)) : 0, mE = useMain ? Math.max(0, R5(mEnd)) : 0;
      const sym = Math.max(0, R5(Math.min(cs, cEnd))), cS = counter === 'M' ? Math.max(0, R5(cs)) : counter === 'C' ? sym : (V ? css[3] : css[0]), cE = counter === 'M' ? Math.max(0, R5(cEnd)) : counter === 'C' ? sym : Math.max(V ? css[1] : css[2], Math.max(0, R5(cEnd)));   // end-aligned: the MEASURED end space (a child's flex margin is not CSS padding: the search fields sat 8 px low)
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
      else if (k.cp === 'Object Status') l = 'X';                                                  // follows Make's size exactly (width x height of the control)
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
  const isTP = root.cls === 'sap.tnt.ToolPage', header = isTP ? find('sap.tnt.ToolHeader') : null, side = isTP ? find('sap.tnt.SideNavigation') : null;
  // the main content: a DynamicPage, else whatever else the ToolPage holds beside header and side navigation (a ScrollContainer, a Page, a NavContainer…).
  // Only a DynamicPage was accepted: an app with its page in a ScrollContainer lost ALL its content (Create SAP Integration: 309 controls → 4 nodes, 2026-10-05)
  let page = isTP ? (find('sap.f.DynamicPage') || rk.find(k => k !== header && k !== side && k.box && k.box[2] > 0 && k.box[3] > 0 && !/^sap\.tnt\.(ToolHeader|SideNavigation)$/.test(k.cls)) || null) : null;
  if (root.cls !== 'sap.tnt.ToolPage' || !header || !page) WARN.push('root is not a ToolPage(header, page) — generic layout used');
  const W = D.viewport[0], hh = header ? header.box[3] : 0;
  // a scrolling app: its content is taller than the window. The Figma frame takes the FULL content height, or the part below the fold is cut off
  const deepBottom = c => ch(c).reduce((m, k) => Math.max(m, deepBottom(k)), c.box ? c.box[1] + c.box[3] : 0);
  const H = Math.max(D.viewport[1], page ? Math.ceil(deepBottom(page)) : 0);
  if (page && H > D.viewport[1]) { page = Object.assign({}, page, { box: [page.box[0], page.box[1], page.box[2], H - page.box[1]] }); WARN.push('The app scrolls: the frame is ' + H + ' px high (window ' + D.viewport[1] + ' px) so nothing below the fold is cut off'); }
  const generic = root.cls !== 'sap.tnt.ToolPage' || (!header && !page && !side);                       // an app without the ToolPage shell (a Grid, a VBox, a Page …): convert the root itself, never drop it
  const body = layout({ _b: [0, hh, W, H - hh], _k: 'frame', n: 'Body', d: 'H' }, generic ? [conv(root)].filter(Boolean) : [side && conv(side), page && conv(page)].filter(Boolean), { V: false, st: {}, flex: false });
  const rootNode = layout({ _b: [0, 0, W, H], _k: 'frame', n: nameArg || D.title || 'Make screen', d: 'V', bg: tok(hexOf(root.st.bg), 'fill') || 'sapBackgroundColor', clip: 1 }, [header && conv(header), body].filter(Boolean), { V: true, st: {}, flex: false });
  rootNode.sz = 'x'; delete rootNode.s; body.s = 'FF';
  if (generic && body.c && body.c[0]) body.c[0].s = 'FF';                               // a page without the ToolPage shell: its root fills the screen
  if (rootNode.c[0] && rootNode.c[0].cp === 'Shell Bar') rootNode.c[0].s = 'FX';
  const sn = body.c.find(k => k.n === 'Side Navigation'); if (sn) { sn.s = 'XF'; sn.w = 256; }
  if (page) body.c[body.c.length - 1].s = 'FF';
  // trace: for every node that came from a Make control, its index path in the tree and the Make box it must land on (build/make-verify.js)
  // a wrapping row spans its parent (FILL width) so Figma can wrap it to the frame's width
  const wrPass = (function wr(n, par) { if (n.wrapRow && par && par.d === 'V') { const pp = Array.isArray(par.p) ? par.p : [par.p || 0, par.p || 0, par.p || 0, par.p || 0]; n.w = R(par.w - pp[1] - pp[3]); n.s = 'FH'; } (n.c || []).forEach(k => wr(k, n)); }); wrPass(rootNode, null);
  // HUG parent + FILL child on the same axis has no definite width (Figma shrinks the child to its minimum: a 100%-wide field collapsed to its
  // label). Make gave that parent a definite width, so it keeps it: FIXED at the Make width.
  const hfPass = (function hf(n, par) {
    (n.c || []).forEach(k => hf(k, n));
    if (!n.d || !n.s || n === rootNode) return;
    [0].forEach(i => {                                        // width only: a hugging row keeps growing in height with its content
      if (n.s[i] !== 'H') return;
      const fills = (n.c || []).some(k => (k.s || '')[i] === 'F' && !k.abs);
      if (fills && (i === 0 ? n.w : n.h) > 0) n.s = n.s.slice(0, i) + 'X' + n.s.slice(i + 1);
    });
  }); hfPass(rootNode, null);
  // EXACT SIZE (2026-10-05, "1:1 with the Make app"): a converted frame keeps the size Make measured instead of hugging its kit parts. Hugging made a 26 px
  // title row 22.5 px (everything below moved up) and grew a 217 px field to its overflowing 256 px input (every later field moved right).
  const PIN = (typeof process !== 'undefined' && process.env && process.env.MAKE_PIN) || 'hug';
  const pinPass = (function pin(n, top) {
    if (PIN !== 'off' && !top && n._k === 'frame' && n._b && n.s && !n.wrapRow && n.n !== 'Spacer' && !['Body', 'Side Navigation', 'Shell Bar'].includes(n.n)) {
      const raw = n._src && by[n._src] && by[n._src].cls === 'sap.ui.core.HTML';   // raw HTML (a route line ✈──●) has no flex size of its own: it keeps Make's box, it never stretches
      [0, 1].forEach(i => { const L = n.s[i]; if (L === 'H' || (raw && L === 'F') || (PIN === 'all' && L !== 'F')) { if (i === 0) n.w = R(n._b[2]); else n.h = R(n._b[3]); n.s = n.s.slice(0, i) + 'X' + n.s.slice(i + 1); } });
    }
    (n.c || []).forEach(k => pin(k, false));
  }); pinPass(rootNode, true);
  const TRACE = [];
  (function walk(n, at) { if (n._src) TRACE.push({ p: at, id: n._src, b: n._b, k: n._k, ta: n.ta }); (n.c || []).forEach((k, i) => walk(k, at.concat(i))); })(rootNode, []);
  const clean = (k, v) => (k[0] === '_' || v === undefined) ? undefined : v;
  const extra = ovs.map(o => {
    const t = String(o.props.title || '').trim(), n = frame(o, o.cls.split('.').pop(), { geo: true });
    n.n = o.cls.split('.').pop() + (t ? ' — ' + t.slice(0, 40) : ''); n.sz = 'x'; delete n.s; n.clip = 1; n.r = /Dialog/.test(o.cls) ? 16 : 8;
    if (!n.bg) n.bg = tok('#ffffff', 'fill') || 'sapGroup_ContentBackground';
    const sh = KIT.effects && (KIT.effects['Shadow/sapContent_Shadow3'] || KIT.effects['Shadow/sapContent_Shadow1']); if (sh) n.fxk = sh;
    if (/Dialog/.test(o.cls) && n.c && n.c.length) {
      if (n.c[0].n === 'Bar') { n.c[0].bc = 'sapGroup_ContentBorderColor'; n.c[0].bw = [0, 0, 1, 0]; n.c[0].r = 0; }
      (function tb(x) { if (/Toolbar$/.test(x.n || '') && x.bc) x.bw = [1, 0, 0, 0]; (x.c || []).forEach(tb); })(n);   // the footer toolbar draws only its top line
    }
    n.w = R(o.box[2]); n.h = R(o.box[3]); wrPass(n, null); hfPass(n, null); pinPass(n, true);
    return { name: n.n, box: o.box.slice(), tree: JSON.parse(JSON.stringify(n, clean)) };
  });
  const tree = JSON.parse(JSON.stringify(rootNode, (k, v) => (k[0] === '_' || v === undefined) ? undefined : v));
  // ── self-check: every text and icon the app shows must be in the Figma tree (a new app may use controls this converter has never seen) ──
  const AUDIT = { lostTexts: [], lostIcons: [], unknown: {} };
  {
    const blob = JSON.stringify([tree].concat(extra.map(x => x.tree))).replace(/\\u[0-9a-f]{4}/gi, ' ');
    const norm = t => String(t).replace(/\s+/g, ' ').trim(), has = t => blob.includes(JSON.stringify(norm(t)).slice(1, -1));
    const TXTP = ['text', 'title', 'description', 'subtitle', 'info', 'number', 'intro', 'label', 'placeholder', 'value', 'unit', 'scale', 'infoState'];
    const seenT = new Set(), seenI = new Set();
    D.controls.forEach(c => {
      if (c.hid && !extra.length) { /* hidden overlays are only built when open */ }
      if (!c.box || c.box[2] < 1 || c.box[3] < 1 || c.box[0] < -500 || c.box[1] < -500) return;   // off-screen (screen-reader only) texts are not on the screen
      if (!/^sap\.(m\.(Dialog|Popover|ResponsivePopover)|ui\.core\.Icon)$/.test(c.cls) && /Dialog|Popover/.test(c.cls)) return;
      for (const k of TXTP) { const v = c.props[k]; if (typeof v !== 'string' || !v.trim() || v.length > 200 || /^\d{4}-\d\d-\d\d$/.test(v) || (k === 'value' && !/Text|Title|Label|Link|Object|Numeric|Status|Input|Select|Picker|Combo/.test(c.cls))) continue; const t = norm(v); if (!seenT.has(t) && !has(t)) { seenT.add(t); AUDIT.lostTexts.push(t + '  [' + c.cls.split('.').pop() + '.' + k + ']'); } }
      for (const k of ['icon', 'src', 'activeIcon']) { const v = c.props[k]; if (typeof v === 'string' && v.startsWith('sap-icon://') && !seenI.has(v)) { seenI.add(v); const n = v.slice(11), a2 = MAP.icon_alias[n] || n; if (!ICONS.has(a2) && !blob.includes('"ic":"') ) AUDIT.lostIcons.push(n); } }
    });
    AUDIT.lostTexts.slice(0, 12).forEach(t => WARN.push('text from Make NOT in the Figma frame: "' + t + '"'));
    if (AUDIT.lostTexts.length > 12) WARN.push('… and ' + (AUDIT.lostTexts.length - 12) + ' more texts missing');
  }
  return { tree, extra, images: IMAGES, post: { nav: NAV, shell: SHELL }, warn: [...new Set(WARN)], controls: D.controls.length, trace: TRACE, audit: AUDIT };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { convert, domToUi5 };
