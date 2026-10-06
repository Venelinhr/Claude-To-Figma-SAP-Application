#!/usr/bin/env node
// spec2tree.js — FROM ZERO: the measured reference (see.py spec) → a v5 layout tree. No gold, no earlier build.
//   node build/spec2tree.js <spec.json> <out tree.json> [--icons "7x12=media-forward,53x8=text:Багаж:H5/Bold,…"]
// row/column → auto-layout (equal gaps → gap; 2 children far apart → space-between; else children keep their measured
// x/y), box → frame with the measured fill/border/radius/padding, text → SAP style + variable, component → the kit
// component with the measured state (radio text = its own label), icon → SAP icon (meaning, or --icons by size),
// divider/separator → 1-2 px rectangle, image → a logo frame (crop uploaded after the build). Brand colours with no
// SAP token take a role: text/icon → sapErrorColor (highlight), divider → sapContent_Selected_ForegroundColor (selection).
const fs = require('fs'), path = require('path');
const [specF, outF, ...rest] = process.argv.slice(2);
if (!outF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
var KITICONS = 0, KITTEXTS = [], CROPS = [];   // declared first: the photo / kit-map passes below count what they absorb
// TEXT REPAIR (2026-10-04): the OCR merges a time with the small airport code under it ("11:50am+" 43 px tall over "(MSY)"), so the two came out H1 + H2 and overlapped.
// A time takes the style of the other times on the screen (the most common H4/Bold…), a short code under it its own small style.
(function textRepair() {
  const T = []; (function w(n) { if (n.type === 'text') T.push(n); (n.children || []).forEach(w); (n.sections || []).forEach(w); })({ children: spec.sections });
  const isTime = t => /^\d{1,2}:\d{2}\s*(am|pm)/i.test(t.text), times = T.filter(isTime), cnt = {};
  times.forEach(t => { if (!/^H[12]\//.test(t.style)) cnt[t.style] = (cnt[t.style] || 0) + 1; });
  const std = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  times.forEach(t => { if (std && /^H[123]\//.test(t.style) && t.style !== std[0]) { t.style = std[0]; t.box = [t.box[0], t.box[1], t.box[2], Math.min(t.box[3], 23)]; } });
  T.forEach(a => T.forEach(b => {
    if (a === b || !/^\(?[A-Z]{3}\)?$/.test(String(b.text).trim())) return;
    const ix = Math.min(a.box[0] + a.box[2], b.box[0] + b.box[2]) - Math.max(a.box[0], b.box[0]), iy = Math.min(a.box[1] + a.box[3], b.box[1] + b.box[3]) - Math.max(a.box[1], b.box[1]);
    if (ix > 2 && iy > 2 && b.box[1] >= a.box[1]) { b.style = 'MediumText/LHAuto/Bold'; b.box = [b.box[0], Math.max(b.box[1], a.box[1] + Math.min(a.box[3], 23)), b.box[2], 16]; }
  }));
})();
// KIT MAP (2026-10-04): recognisable shapes become REAL kit parts — without it a from-zero screen is plain frames (no gold, no model).
// pill = a rounded box (radius ≥ 10, no border, 20–44 px tall) holding ONE short text → kit Tag (Value State None).
let KITMAPPED = 0;
// KIT MAP 2 (2026-10-04): a form field = Label + kit Input; a coloured badge with its text = kit Tag. Both removed plain frames the user flagged.
const flatT = (n, out = []) => { if (n.type === 'text') out.push(n); (n.children || []).forEach(c => flatT(c, out)); return out; };
const flatI = (n, out = []) => { if (n.type === 'icon') out.push(n); (n.children || []).forEach(c => flatI(c, out)); return out; };
const hueState = hex => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || ''); if (!m) return null; const [r, g, b] = m.slice(1).map(x => parseInt(x, 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 0.25) return null; let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360;
  return h < 12 || h > 340 ? 'Negative' : h < 65 ? 'Critical' : h < 170 ? 'Positive' : 'Information'; };
function kitmap2(o) {
  const kids = o.children || o.sections || [];
  [...kids].forEach(c => {   // a copy: splice (the chevron icon next to a Button) must not make forEach skip the last sibling
    const i = kids.indexOf(c); if (i < 0) return;
    const b = c.box || [0, 0, 0, 0];
    // FIELD: bordered box, 44–64 px tall, holding exactly a small label and a value text (+ optional icons)
    if (c.type === 'box' && c.border && c.border !== 'none' && (c.radius || 0) >= 4 && b[3] >= 44 && b[3] <= 64 && b[2] >= 180 && b[2] <= 330) {
      const T = flatT(c).sort((p, q) => p.box[1] - q.box[1]), I = flatI(c).sort((p, q) => p.box[0] - q.box[0]);
      if (T.length === 2 && I.length <= 3 && T[1].box[1] > T[0].box[1] + 6 && !flatT(c).some(t => /^\d{2}:\d{2}|^\$/.test(t.text))) {
        const lead = I.length && I[0].box[0] < T[0].box[0] ? I[0] : null, trail = I.length && I[I.length - 1].box[0] > T[1].box[0] ? I[I.length - 1] : null;
        const cx = Math.min(T[0].box[0], T[1].box[0]), cw = (trail ? trail.box[0] - 6 : b[0] + b[2] - 8) - cx, ly = T[0].box[1], lh = Math.max(T[0].box[3], 14);
        const label = { type: 'text', text: T[0].text, style: 'MediumText/LHAuto/Regular', token: 'sapContent_LabelColor', color: T[0].color, box: [cx, ly, T[0].box[2], 16] };
        const input = { type: 'component', component: 'Input', props: { Content: 'Typed Text', '✏️ Typed Text': T[1].text, 'Form Factor': 'Compact', ...(trail ? { 'Trailing Action': true } : {}) }, width: Math.max(80, cw), box: [cx, ly + lh + 4, Math.max(80, cw), 32] };
        kids[i] = { type: 'row', box: b, children: [...(lead ? [lead] : []), { type: 'column', box: [cx, ly, Math.max(80, cw), lh + 36], children: [label, input] }] }; KITMAPPED++; return;
      }
    }
    // ONE-LINE FIELD: bordered box, icon + texts on ONE line (the traveller field: "1Traveler(s)  Economy") → icon + kit Input holding the joined text
    if (c.type === 'box' && c.border && c.border !== 'none' && (c.radius || 0) >= 4 && b[3] >= 30 && b[3] <= 64 && b[2] >= 90 && b[2] <= 330 && !hueState(c.fill_hex)) {
      const T = flatT(c).sort((p, q) => p.box[0] - q.box[0]), I = flatI(c);
      if (T.length >= 1 && T.length <= 3 && I.length <= 1 && T.every(t => Math.abs(t.box[1] - T[0].box[1]) <= 8) && (!I.length || I[0].box[0] < T[0].box[0])) {
        const x0 = T[0].box[0], w0 = Math.max(80, b[0] + b[2] - 8 - x0);
        kids[i] = { type: 'row', box: b, children: [...I, { type: 'component', component: 'Input', props: { Content: 'Typed Text', '✏️ Typed Text': T.map(t => t.text).join('  '), 'Form Factor': 'Compact' }, width: w0, box: [x0, b[1] + Math.round((b[3] - 32) / 2), w0, 32] }] }; KITMAPPED++; return;
      }
    }
    // BADGE: a saturated icon-sized shape with its own text inside → kit Tag (colour state from the hue); the duplicate text is absorbed
    if (c.type === 'icon' && b[2] >= 24 && b[3] >= 14 && b[3] <= 40 && hueState(c.color)) {
      const all = []; (function w(n, par) { if (n.type === 'text' && n.box[0] >= b[0] - 4 && n.box[1] >= b[1] - 4 && n.box[0] + n.box[2] <= b[0] + b[2] + 6 && n.box[1] + n.box[3] <= b[1] + b[3] + 6) all.push([n, par]); (n.children || n.sections || []).forEach(k => w(k, n)); })(spec, null);
      if (all.length === 1) { const [t, par] = all[0]; if (par.children) par.children = par.children.filter(x => x !== t); else if (par.sections) par.sections = par.sections.filter(x => x !== t);
        kids[i] = { type: 'component', component: 'Tag', text: t.text, props: { '✏️ Text': t.text, 'Value State': hueState(c.color) }, box: b }; KITMAPPED++; return; }
    }
    // COLOURED BUTTON: a saturated rounded box with ONE text (+ at most one icon) → kit Button; the colour picks the kit type
    if (c.type === 'box' && (c.radius || 0) >= 3 && b[3] >= 28 && b[3] <= 64 && b[2] >= 70 && b[2] <= 260 && hueState(c.fill_hex)) {   // a border on a coloured fill is only its edge
      const T = flatT(c), I = flatI(c), m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c.fill_hex || ''), [r, g, bl] = m.slice(1).map(x => parseInt(x, 16));
      const lumB = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
      if (T.length === 1 && I.length <= 1 && b[3] < 38 && lumB >= 0.4) {   // a short coloured chip ("You save USD 165.55") is a Tag
        kids[i] = { type: 'component', component: 'Tag', text: T[0].text, props: { '✏️ Text': T[0].text, 'Value State': 'Critical', 'Left Icon': false }, box: b }; KITICONS += I.length; KITMAPPED++; return;
      }
      if (T.length === 1 && I.length <= 1 && lumB < 0.85) {
        const st = hueState(c.fill_hex), neg = /delete|remove|reject|cancel|decline/i.test(T[0].text);
        const type = st === 'Positive' ? 'Accept' : st === 'Negative' && neg ? 'Reject' : 'Primary';   // SAP has no orange / red call to action: the main action is Primary
        kids[i] = { type: 'component', component: 'Button', text: T[0].text, props: { Type: type, 'Form Factor': b[3] >= 32 ? 'Cozy' : 'Compact' }, width: b[2], box: b }; KITICONS += I.length; KITMAPPED++; return;   // SAP buttons have no chevron: the arrow is dropped
      }
    }
    // OUTLINED BUTTON: a light box with a border and ONE coloured text ("Modify Search") → kit Button Secondary
    if (c.type === 'box' && c.border && c.border !== 'none' && (c.radius || 0) >= 2 && b[3] >= 28 && b[3] <= 64 && b[2] >= 70 && b[2] <= 260 && !hueState(c.fill_hex)) {
      const T = flatT(c), I = flatI(c);
      if (T.length === 1 && I.length === 0 && hueState(T[0].color)) { kids[i] = { type: 'component', component: 'Button', text: T[0].text, props: { Type: 'Secondary', 'Form Factor': b[3] >= 32 ? 'Cozy' : 'Compact' }, width: b[2], box: b }; KITMAPPED++; return; }
    }
    // GREY BUTTON: a borderless light-grey rounded box with ONE text (and at most one icon) → kit Button Secondary
    if (c.type === 'box' && (!c.border || c.border === 'none') && (c.radius || 0) >= 8 && b[3] >= 30 && b[3] <= 46 && b[2] >= 100 && b[2] <= 220 && !hueState(c.fill_hex)) {
      const T = flatT(c), I = flatI(c), lum = (() => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c.fill_hex || ''); return m ? (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255 : 1; })();
      if (T.length === 1 && I.length <= 1 && lum < 0.96 && lum > 0.7) { kids[i] = { type: 'component', component: 'Button', text: T[0].text, props: { Type: 'Secondary', 'Form Factor': b[3] >= 32 ? 'Cozy' : 'Compact' }, box: b }; if (I.length) kids.splice(i + 1, 0, I[0]); KITMAPPED++; return; }   // the kit has no AI icon: the sparkle stays as its own picture beside the label
    }
    kitmap2(c);
  });
}
(function kitmap(o) {
  (o.children || o.sections || []).forEach((c, i, arr) => {
    const k = c.children || [], b = c.box || [0, 0, 0, 0];
    if (c.type === 'box' && (c.radius || 0) >= 10 && (!c.border || c.border === 'none') && b[3] >= 20 && b[3] <= 44 && b[2] <= 260
        && k.length === 1 && k[0].type === 'text' && String(k[0].text).length <= 28) {
      arr[i] = { type: 'component', component: 'Tag', text: k[0].text, props: { '✏️ Text': k[0].text, 'Value State': 'None', Color: 'None' }, box: b };   // neutral tag: Value State None exists only with Color None KITMAPPED++;
    } else kitmap(c);
  });
})(spec);
// BANNER (2026-10-04): a wide box filled with a saturated colour is brand art (logos, arcs, a split background) → ONE picture cut 1:1, plus the parts
// that sit in the same band next to it ("Learn more"). Its texts are in the picture. It was split in pieces and its text landed on other text.
(function banner(o) {
  const ks = o.children || o.sections || [];
  const B = ks.filter(c => c.type === 'box' && c.box && hueState(c.fill_hex) && c.box[3] >= 40 && c.box[3] <= 160 && c.box[2] >= 250);
  if (B.reduce((a, c) => a + c.box[2], 0) >= 500) {
    let u = B.map(c => c.box).reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0] + a[2], b[0] + b[2]) - Math.min(a[0], b[0]), Math.max(a[1] + a[3], b[1] + b[3]) - Math.min(a[1], b[1])]);
    for (let grow = true; grow;) { grow = false;
      for (const c of ks) { const q = c.box; if (!q) continue;
        if (q[1] >= u[1] - 4 && q[1] + q[3] <= u[1] + u[3] + 4 && q[0] <= u[0] + u[2] + 100 && q[0] + q[2] >= u[0] - 100 && (q[0] + q[2] > u[0] + u[2] || q[0] < u[0]) && q[2] < 400 && q[0] >= u[0] - 10) {
          const nx = Math.min(u[0], q[0]), nr = Math.max(u[0] + u[2], q[0] + q[2]); u = [nx, u[1], nr - nx, u[3]]; grow = true; } } }
    const inU = q => q && q[0] >= u[0] - 4 && q[1] >= u[1] - 4 && q[0] + q[2] <= u[0] + u[2] + 4 && q[1] + q[3] <= u[1] + u[3] + 4;
    for (let i = ks.length - 1; i >= 0; i--) if (inU(ks[i].box)) { (function t(x) { if (x.type === 'text') KITTEXTS.push(x.text); (x.children || []).forEach(t); })(ks[i]); ks.splice(i, 1); }
    ks.push({ type: 'image', box: u, crop: u }); (global.__BANNERS = global.__BANNERS || []).push(u.join(',')); KITICONS++;
  }
  ks.forEach(c => banner(c));
})({ children: spec.sections });
// SAP CONTROLS (2026-10-04, "use the SAP kit, make it feel SAP"):
//  · a mark named comp:Check Box / comp:Radio Button + the text right of it on the same line → ONE kit control WITH its label
//  · a row of ≥ 3 small bordered boxes with one short text each (1★ … 5★) → kit Buttons (Secondary)
//  · a short blue text that is no button → kit Link · a small coloured chip the measure called a Button (< 34 px) → kit Tag
function controls(o) {
  const ks = o.children || o.sections; if (!ks) return;
  for (let i = 0; i < ks.length; i++) {
    const c = ks[i], nm = c.type === 'icon' && c.box && BYBOX[c.box.join(',')];
    if (nm && /^comp:(Check Box|Radio Button)$/.test(nm)) {
      const cy = c.box[1] + c.box[3] / 2; let best = -1, bd = 1e9;
      ks.forEach((t, j) => { if (t.type !== 'text') return; const dx = t.box[0] - (c.box[0] + c.box[2]); if (dx >= -2 && dx <= 40 && Math.abs(t.box[1] + t.box[3] / 2 - cy) <= 9 && dx < bd) { bd = dx; best = j; } });
      if (best >= 0) { const t = ks[best], cp = nm.slice(5);
        ks[i] = { type: 'component', component: cp, text: t.text, props: cp === 'Check Box' ? { Check: 'Unchecked' } : { Selected: 'False' }, box: [c.box[0], Math.min(c.box[1], t.box[1]), t.box[0] + t.box[2] - c.box[0], Math.max(c.box[3], t.box[3])] };
        ks.splice(best, 1); if (best < i) i--; KITMAPPED++; continue; }
    }
    if (c.type === 'component' && c.component === 'Button' && c.box && c.box[3] < 34 && (c.text || '').length <= 28) { ks[i] = { type: 'component', component: 'Tag', text: c.text, props: { '✏️ Text': c.text, 'Value State': 'Critical', 'Left Icon': false }, box: c.box }; KITMAPPED++; continue; }
    if (c.type === 'text' && c.box && (c.text || '').length <= 40 && /^#?[0-9a-f]{6}$/i.test(c.color || '')) {
      const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c.color), [r, g, bl] = m.slice(1).map(x => parseInt(x, 16));
      const near = (q, cx) => q && q.box && q.box[2] >= 24 && q.box[2] <= 44 && Math.abs(q.box[2] - q.box[3]) <= 4 && cx - (q.box[0] + q.box[2]) >= 0 && cx - (q.box[0] + q.box[2]) <= 24;
      const flatAll = (n, out = []) => { (n.children || n.sections || []).forEach(k => { out.push(k); flatAll(k, out); }); return out; };
      const step = flatAll({ children: spec.sections }).some(q => q !== c && (q.type === 'image' || q.type === 'icon') && near(q, c.box[0]) && Math.abs(q.box[1] + q.box[3] / 2 - (c.box[1] + c.box[3] / 2)) <= 12) || ks.some(q => q !== c && q.box && (q.type === 'image' || q.type === 'icon') && q.box[2] >= 24 && Math.abs(q.box[2] - q.box[3]) <= 4 && c.box[0] - (q.box[0] + q.box[2]) >= 0 && c.box[0] - (q.box[0] + q.box[2]) <= 24) || (o.box && o.box[3] <= 40 && (o.children || []).some(q => q !== c && q.type === 'stack'));
      if (bl > 150 && bl - r > 70 && bl - g > 20 && !/^\$|USD|\d{2,}/.test(c.text) && !step) { ks[i] = { type: 'component', component: 'Link', text: c.text, props: { '✏️ Text': c.text, Type: 'Regular', 'Icon Position': 'N/A' }, box: c.box }; KITMAPPED++; continue; }
    }
    if (c.type === 'row' && c.box && c.box[3] >= 20 && c.box[3] <= 34) { const T = flatT(c);
      if (T.length === 1 && /^#?(2|3)[0-9a-f]{5}$/i.test(T[0].color || '') && /save|off|deal|%/i.test(T[0].text)) { ks[i] = { type: 'component', component: 'Tag', text: T[0].text, props: { '✏️ Text': T[0].text, 'Value State': 'Critical', 'Left Icon': false }, box: c.box }; KITICONS += flatI(c).length; KITMAPPED++; continue; } }
    controls(c);
  }
  // range slider: two equal handles (28–44 px) on one row, far apart → kit Range Slider over the whole span (the track line goes with it)
  const H = ks.filter(c => (c.type === 'icon' || (c.type === 'image' && !(global.__CUT || []).includes((c.crop || []).join(',')))) && c.box && c.box[2] >= 22 && c.box[2] <= 44 && Math.abs(c.box[2] - c.box[3]) <= 4);
  for (let a = 0; a < H.length; a++) for (let b2 = a + 1; b2 < H.length; b2++) {
    const p1 = H[a], p2 = H[b2]; if (!ks.includes(p1) || !ks.includes(p2) || Math.abs(p1.box[1] - p2.box[1]) > 6 || Math.abs(p2.box[0] - p1.box[0]) < 120) continue;
    const L = Math.min(p1.box[0], p2.box[0]), R = Math.max(p1.box[0] + p1.box[2], p2.box[0] + p2.box[2]), cy = p1.box[1] + p1.box[3] / 2;
    for (let k = ks.length - 1; k >= 0; k--) { const q = ks[k]; if ((q.type === 'divider' || q.type === 'separator') && q.box && q.box[0] >= L - 6 && q.box[0] + q.box[2] <= R + 6 && Math.abs(q.box[1] + q.box[3] / 2 - cy) <= 8) ks.splice(k, 1); }
    ks.splice(ks.indexOf(p2), 1); ks[ks.indexOf(p1)] = { type: 'component', component: 'Range Slider', props: { 'Left Value': '0%', 'Right Value': '100%', 'Form Factor': 'Cozy' }, width: R - L, box: [L, Math.round(cy - 10), R - L, 20] }; KITICONS++; KITMAPPED++;
  }
  // star / segment row: ≥ 3 bordered boxes, same row, similar size, one short text each — gathered over the WHOLE screen (5★ sat alone in another column)
  const seg = (global.__SEG || []).concat(ks.filter(c => c.type === 'box' && c.box && c.border && c.border !== 'none' && c.box[2] >= 28 && c.box[2] <= 90 && c.box[3] >= 26 && c.box[3] <= 52 && flatT(c).length === 1 && flatT(c)[0].text.length <= 4).map(c => (c.__ks = ks, c)));
  if (o.__top) { global.__SEG = []; } else { global.__SEG = seg; return; }
  const rows = {}; seg.forEach(c => { const k = Math.round(c.box[1] / 6); (rows[k] = rows[k] || []).push(c); });
  Object.values(rows).filter(r => r.length >= 3).forEach(r => r.forEach(c => { const ks = c.__ks; delete c.__ks; const t0 = flatT(c)[0].text, t = t0.replace(/\*$/, '★'); KITTEXTS.push(t0); ks[ks.indexOf(c)] = { type: 'component', component: 'Button', text: t, props: { Type: 'Secondary', 'Form Factor': 'Compact' }, width: c.box[2], box: c.box }; KITMAPPED++; }));
}
kitmap2(spec);
// PHOTOS (2026-10-04): regions photos.py found are cut 1:1 from the reference. Everything measured INSIDE one (fragments, icons, texts baked into the picture) is
// replaced by ONE image; its texts count as placed (they are in the picture). Without this the photos were blank holes.
(function photos() {
  const pf = path.join(path.dirname(path.resolve(specF)), '..', 'photos.json'); if (!fs.existsSync(pf)) return;
  const PJ = JSON.parse(fs.readFileSync(pf, 'utf8')), P = Array.isArray(PJ) ? PJ : (PJ.photos || []).concat(PJ.orphans || []); global.__PANELS = Array.isArray(PJ) ? [] : (PJ.panels || []); global.__CUT = (Array.isArray(PJ) ? PJ : (PJ.photos || [])).map(q => q.join(','));   // only PHOTOS go to the top layer; a cut-out logo keeps its place in the row (it gives the row its height)
  const inside = (b, q) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2; return cx >= q[0] && cx <= q[0] + q[2] && cy >= q[1] && cy <= q[1] + q[3]; };
  const pick = o => { for (const q of P) if (o.box && inside(o.box, q)) return q; return null; };
  (function strip(o) {
    const ks = o.children || o.sections; if (!ks) return;
    for (let i = ks.length - 1; i >= 0; i--) {
      const c = ks[i], q = pick(c);
      if (q && ['icon', 'image', 'text', 'divider', 'separator'].includes(c.type)) { if (c.type === 'text') KITTEXTS.push(c.text); ks.splice(i, 1); if ((global.__CUT || []).includes(q.join(','))) o._lost = 1; }
      else if (q && c.type !== 'component' && c.box && c.box[2] <= q[2] + 8 && c.box[3] <= q[3] + 8) { (function t(x) { if (x.type === 'text') KITTEXTS.push(x.text); (x.children || []).forEach(t); })(c); ks.splice(i, 1); if ((global.__CUT || []).includes(q.join(','))) o._lost = 1; }
      else { strip(c); if (c._lost) o._lost = 1; }
    }
  })(spec);
  // a group whose parts went into a photo keeps a stale box: it still "overlaps" the photo and gets pinned. Shrink every group (not a real
  // box — that one is a visible card) to the parts it still holds; an emptied group goes (2026-10-04)
  (function shrink(o) {
    const ks = o.children || o.sections; if (!ks) return;
    for (let i = ks.length - 1; i >= 0; i--) {
      const c = ks[i]; shrink(c);
      if (!['row', 'column', 'stack'].includes(c.type) || !c._lost) continue;   // only a group that lost parts to a photo
      const kb = (c.children || []).filter(k => k.box).map(k => k.box);
      if (!(c.children || []).length) { ks.splice(i, 1); continue; }
      if (kb.length) { const x0 = Math.min(...kb.map(b => b[0])), y0 = Math.min(...kb.map(b => b[1])); c.box = [x0, y0, Math.max(...kb.map(b => b[0] + b[2])) - x0, Math.max(...kb.map(b => b[1] + b[3])) - y0]; }
    }
  })(spec);
  const host = (o, q) => { const ks = o.children || o.sections || []; for (const c of ks) if (c.box && c.box[0] <= q[0] + 2 && c.box[1] <= q[1] + 2 && c.box[0] + c.box[2] >= q[0] + q[2] - 2 && c.box[1] + c.box[3] >= q[1] + q[3] - 2 && ['row', 'column', 'box', 'stack'].includes(c.type)) return host(c, q) || c; return null; };
  // RANGE SLIDER: a long thin line with two round blobs (20–44 px) at its ends → kit Range Slider in the line's place; the blobs are not cut
  (function slider() {
    const used = new Set();
    (function w(o) { const ks = o.children || o.sections || [];
      ks.forEach((c, i) => { if ((c.type === 'divider' || c.type === 'separator') && c.box && c.box[2] >= 150 && c.box[3] <= 6) {
        const cy = c.box[1] + c.box[3] / 2, L = c.box[0], R = c.box[0] + c.box[2];
        const hs = P.filter(q => !used.has(q) && q[2] >= 20 && q[2] <= 44 && Math.abs(q[2] - q[3]) <= 6 && Math.abs(q[1] + q[3] / 2 - cy) <= 10 && (Math.abs(q[0] + q[2] / 2 - L) <= 40 || Math.abs(q[0] + q[2] / 2 - R) <= 40));
        if (hs.length >= 2) { hs.forEach(q => used.add(q)); const x0 = Math.min(...hs.map(q => q[0])), x1 = Math.max(...hs.map(q => q[0] + q[2]));
          ks[i] = { type: 'component', component: 'Range Slider', props: { 'Left Value': '0%', 'Right Value': '100%', 'Form Factor': 'Cozy' }, width: x1 - x0, box: [x0, Math.round(cy - 10), x1 - x0, 20] }; KITICONS += 2; KITMAPPED++; } }
        else w(c); }); })({ children: spec.sections });
    for (let k = P.length - 1; k >= 0; k--) if (used.has(P[k])) P.splice(k, 1);
  })();
  const inBanner = q => (global.__BANNERS || []).some(u => { const [x, y, w, h] = u.split(',').map(Number); return q[0] >= x - 4 && q[1] >= y - 4 && q[0] + q[2] <= x + w + 4 && q[1] + q[3] <= y + h + 4; });
  for (const q of P) { if (inBanner(q)) continue; const h = host({ children: spec.sections }, q); const img = { type: 'image', box: q, crop: q }; if (h) (h.children = h.children || []).push(img); else spec.sections.push(img); KITICONS++; }
})();   // after the pill pass: pills are Tags first; only what is left can be a Button / Input / badge
const ii = rest.indexOf('--icons'), MAP = Object.fromEntries((ii >= 0 ? rest[ii + 1] : '').split(',').filter(Boolean).map(p => p.split('=')));
// --marks marks.json --names names.json: Claude looked ONCE at the marked reference (build/mark.py) and named every numbered icon / lettered zone;
// the script keeps the exact positions. icon value: a kit icon word · text:<string>:<style> · skip (it was a piece of text, not an icon). zone value: what the zone is (Shell Bar …).
const mki = rest.indexOf('--marks'), nmi = rest.indexOf('--names');
const BYBOX = {}, ZONE = {}, TXT = {}, CMP = {};
if (mki >= 0 && nmi >= 0) {
  const MK = JSON.parse(fs.readFileSync(rest[mki + 1], 'utf8')), NM = JSON.parse(fs.readFileSync(rest[nmi + 1], 'utf8'));
  for (const ic of MK.icons || []) { const v = (NM.icons || {})[ic.id]; if (v) BYBOX[ic.box.join(',')] = String(v); }
  for (const z of MK.zones || []) { const v = (NM.zones || {})[z.id]; if (v) ZONE[z.box.join(',')] = String(v).slice(0, 40); }
  for (const t of MK.texts || []) { const v = (NM.texts || {})[t.id]; if (v != null) TXT[t.box.join(',')] = v; }
  for (const c of MK.components || []) { const v = (NM.components || {})[c.id]; if (v != null) CMP[c.box.join(',')] = Array.isArray(v) ? v : String(v); }
}
controls({ children: spec.sections, __top: true });   // runs here: it needs the names of the marked shapes (BYBOX)
const ci = rest.indexOf('--colors'), COL = Object.fromEntries((ci >= 0 ? rest[ci + 1] : '').split(',').filter(Boolean).map(p => p.split('=').map(x => x.toLowerCase().startsWith('#') ? x.toLowerCase() : x)));
const ROLES = require('./router-table.json').colour_roles;
const KIT_TEXT = require('../knowledge/live/kit.json').text || {};
const KIT_COMP = require('../knowledge/live/kit.json').components || {};   // kit component intrinsic w/h (a slider is 20 tall, not the 4-px measured track)
const R = v => Math.round(v * 10) / 10, used = {}, unknown = [], WARNS = [];
                // reference icons / texts that Claude marked skip or that a real kit part (Shell Bar) draws itself — the door must not ask for them
const EXPECT = {};                                     // layer name → measured box [x, y, w, h] — build/layout-sim.js compares the layout against it
const name = (b, fb) => { const n = String(b || fb).replace(/\s+/g, ' ').trim().slice(0, 40); used[n] = (used[n] || 0) + 1; return used[n] > 1 ? `${n} ${used[n]}` : n; };
// colour by ROLE, never by photo: the measured token is only kept when it fits the role
const tok = (t, role, hex) => {
  if (hex && COL[hex.toLowerCase()]) return COL[hex.toLowerCase()];
  if (!t || t === '?' || /RequiredColor/.test(t)) {                 // brand colour: only a saturated one is an accent
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''), c = m ? m.slice(1).map(x => parseInt(x, 16)) : null;
    const sat = c ? Math.max(...c) - Math.min(...c) > 60 : false;
    if (role === 'fill') return 'sapBaseColor';
    if (!sat) return role === 'icon' ? 'sapContent_IconColor' : role === 'line' ? 'sapList_BorderColor' : 'sapTextColor';
    return 'sapContent_Selected_ForegroundColor';                    // brand accent → SAP selection blue
  }
  const lum = (() => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || ''); return m ? (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255 : 0.5; })();
  if ((role === 'icon' || role === 'ink') && lum > 0.85 && (role === 'icon' || /Background|Contrast/.test(t))) return 'sapContent_ContrastTextColor';   // white on a dark bar   // white text / icons on a dark bar (1:1), the kit's contrast colour
  if (role === 'icon' && /Border|Separator|Background/.test(t)) return 'sapContent_NonInteractiveIconColor';
  if (role === 'line' && !ROLES.divider.includes(t)) return ROLES.divider[0];                      // divider role list, not pixel distance
  if (role === 'border' && !ROLES.card_border.includes(t) && !ROLES.selected_border.includes(t)) return ROLES.card_border[0];
  if (role === 'ink' && /Border|Separator|Background/.test(t)) return 'sapTextColor';
  return t;
};
const label = o => { const t = []; (function w(x) { if (x.type === 'text') t.push(x.text); (x.children || []).forEach(w); })(o); return t[0]; };
function leaf(o) {
  const [x, y, w, h] = o.box;
  if (o.type === 'text') {
    // a Figma text box is as tall as its line height (auto ≈ floor(size × 1.17)), not the glyph height, and Figma TOP-aligns
    // the box to the glyph top (real dump: text.y == glyph.y). Use the line-height box top-aligned on the measured glyph so
    // the tree predicts real Figma; the extra height extends downward (a stacked text below then sits a line-height gap lower).
    const sz = Number(((KIT_TEXT[o.style] || '').split('|')[2])), H = sz ? Math.floor(sz * 1.17) : h;
    // Keep the MEASURED width for a plain text: it is left-anchored (or edge-anchored via ta), so its box being a few px
    // wider than SAP renders does not move it — whereas shrinking every text in an H leg accumulated a ~60 px drift on the
    // right side (baked gaps were measured on the un-shrunk boxes). SAP's ~0.89 narrowing is applied only to labelled
    // controls (Radio/Check Box), which sit in V columns where width does not cascade sideways.
    return { n: name(o.text.length > 24 ? o.text.slice(0, 24) + '…' : o.text), k: 't', t: o.text, st: o.style, bg: tok(o.token, 'ink', o.color), w, h: H, s: 'HH', box: [x, y] };
  }
  if (o.type === 'icon') {
    let ic = o.icon; const key = `${w}x${h}`; let pick = BYBOX[o.box.join(',')] || MAP[key];   // a name given by POSITION wins over one given by SIZE
    if (pick === 'skip' && Math.max(w, h) >= 8 && !(Math.min(w, h) <= 5 && Math.max(w, h) <= 20)) pick = 'image';   // a ≤5×20 sliver stays skipped (glyph piece, "Select Hotel ¦")   // nothing visible is dropped: a 'skipped' shape of 8 px or more is cut from the reference (2026-10-04: 41 missing elements)
    if (pick === 'skip') { KITICONS++; return null; }
    if (pick === 'image') { KITICONS++; return leaf({ type: 'image', box: o.box, crop: o.box }); }   // a logo / picture: cropped from the reference 1:1
    if (pick && pick.startsWith('comp:')) { const cp = pick.slice(5); return leaf({ type: 'component', component: cp, props: /Check Box/.test(cp) ? { Check: 'Unchecked' } : {}, box: o.box }); }   // a kit control the measure saw as a shape (a check box square)
    if (pick && pick.startsWith('text:')) { const [, t, st] = pick.split(':'); return { n: name(t), k: 't', t, st: st || 'H5/Regular', bg: 'sapTextColor', w, h, s: 'HH' }; }
    if (pick) ic = pick;
    if (!ic || ic === '?') unknown.push(`${key} at ${x},${y} ${o.color || ''}`);
    // an icon occupies exactly its MEASURED footprint (w×h) in the layout. Do NOT square it or inflate it by 1/0.8 — a
    // taller-than-measured icon frame makes its row taller than measured and shifts the cross-aligned text next to it, a
    // systematic vertical drift that accumulates down the tree. The renderer rescales the SAP icon to o.w, keeping shape.
    // the measured box is the GLYPH; a kit icon's glyph fills ~65 % of its frame, so a small glyph drawn at its own size came out tiny
    // (2026-10-03: the shell chevrons). Small glyphs get the frame that draws them at the measured glyph size, centred on it.
    // 2026-10-04: a kit icon is SQUARE. A non-square frame (27×16, 15×10) made the icon look squashed / stretched — the frame is always max(w,h) × max(w,h), centred on the measured glyph.
    // a kit icon is SQUARE: a 27×16 frame squashed the glyph (2026-10-04). The frame is max(w,h) × max(w,h), centred on the measured glyph.
    const M = Math.max(w, h), S = M < 14 ? Math.min(20, Math.round(M / 0.65)) : M;
    if (S !== w || S !== h) return { n: name(ic && ic !== '?' ? ic : 'icon ' + key), k: 'ic', ic: ic || '?', bg: tok(o.token, 'icon', o.color), w: S, h: S, s: 'XX', box: [R(x - (S - w) / 2), R(y - (S - h) / 2)] };
    return { n: name(ic && ic !== '?' ? ic : 'icon ' + key), k: 'ic', ic: ic || '?', bg: tok(o.token, 'icon', o.color), w, h, s: 'XX', box: [x, y] };
  }
  if (o.type === 'component') {
    const pr = { ...(o.props || {}) };
    if (/Radio|Check Box/.test(o.component) && o.text) { pr.Label = true; pr['✏️ Text'] = o.text; }
    if (/^Button/.test(o.component) && o.text) pr['✏️ Text'] = o.text;
    if (/Range Slider/.test(o.component) && !pr['Right Value']) pr['Right Value'] = '100%';   // a filter shows its full range
    // a kit component renders at its INTRINSIC height (Range Slider 20, Radio 16…), not the thin measured strip the OCR
    // saw (a slider track measured 4 px but Figma draws it 20 px tall). Use the kit height so the tree predicts real Figma.
    // A few controls render taller than the kit's default-variant height in this density — override from the real dump
    // (a Button with a label lays out 36 px tall in Figma, not the kit's 26). Radio/Check Box/Range Slider match the kit.
    const REAL_H = { Button: 36 };
    const kh = o.keepH ? 0 : REAL_H[o.component] || (KIT_COMP[o.component] && KIT_COMP[o.component].h), H = kh && Math.abs(kh - h) > 3 ? kh : h;
    const box = H !== h ? [x, R(y + h / 2 - H / 2)] : undefined;   // grow around the measured centre (the track sat mid-component)
    // a labelled control (Radio/Check Box with a label) is as wide as its SAP-rendered label, ~0.89× the OCR width — the
    // same font-narrowing as plain text. Verified on the real dump (Директни 99→88≈85, До 1 спирка 115→102≈101). Without
    // this its option column runs ~15 px too wide. Sliders/Inputs/Buttons keep their measured/explicit width.
    const labelled = /Radio|Check Box/.test(o.component) && o.text;
    const W = o.width || (labelled ? Math.max(16, Math.round(w * 0.89)) : w);
    let tx; if (o.component === 'Input' && pr['✏️ Typed Text'] != null) { tx = { 'Input Text': pr['✏️ Typed Text'] }; delete pr['✏️ Typed Text']; }   // the kit exposes this text only as an inner layer
    delete pr['Trailing Action'];
    return { n: name(o.text || o.component), k: 'i', cp: o.component, pr, ...(tx ? { tx } : {}), w: W, h: H, s: /Slider|Input|Select|^Button/.test(o.component) ? 'XH' : 'HH', box };
  }
  if (o.type === 'divider' || o.type === 'separator') return { n: name(o.type === 'divider' ? 'Divider' : 'Separator'), k: 'r', w: Math.max(w, 1), h: Math.max(h, 1), bg: tok(o.token, 'line', o.color), s: 'XX' };
  if (o.type === 'image') { CROPS.push(o.crop || o.box); return { n: name('Logo'), w, h, r: 4, crop: o.crop || o.box, s: 'XX' }; }
}
function conv(o, px, py) {
  const [x, y, w, h] = o.box, kids = (o.children || []).slice();
  // a zone Claude named "Shell Bar" is the REAL kit Shell Bar (the shape the proven gold trees use: no props, only its title) — a dark bar cannot be drawn
  // from kit variables (the kit has no dark background variable), and its search / bell / help icons are the component's own defaults.
  const lightFill = q => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(q.fill_hex || ''); return !m || (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255 > 0.5; };
  // (a DARK shell bar is drawn 1:1 from the measured parts instead — the kit Shell Bar is light and has no dark mode here)
  if (['row', 'column', 'box', 'stack'].includes(o.type) && /^shell bar$/i.test(ZONE[o.box.join(',')] || '') && lightFill(o)) {
    const t = (label(o) || 'Shell Bar').replace(/^SAP (?=SAP\b)/, ''), l = { n: name('Shell Bar'), k: 'i', cp: 'Shell Bar', pr: { Size: w < 600 ? 'S' : w < 1024 ? 'M' : w < 1440 ? 'L' : w < 1920 ? 'XL' : 'XXL' }, tx: { Text: t }, w, h: 52, s: 'XH', xy: [R(x - px), R(y - py)] };
    (function w(q) { if (q.type === 'icon') KITICONS++; else if (q.type === 'text') KITTEXTS.push(q.text); (q.children || []).forEach(w); })(o);
    EXPECT[l.n] = [R(x), R(y), w, 52]; return l;
  }
  if (!['row', 'column', 'box', 'stack'].includes(o.type)) { const l = leaf(o); if (!l) return null; const at = l.box || [x, y]; delete l.box; l.xy = [R(at[0] - px), R(at[1] - py)]; EXPECT[l.n] = [R(at[0]), R(at[1]), l.w, l.h]; return l; }   // icons stay centred on the measured drawing
  const n = { n: name(o.region ? ({ side: 'Side panel', main: 'Main area', list: 'Results', rail: 'Right column' }[o.region] || 'Region') : ZONE[o.box.join(',')] || (o.type === 'box' ? 'Card ' + (label(o) || '') : (label(o) || o.type) + ' ' + o.type)), xy: [R(x - px), R(y - py)], w, h, s: 'XX' };
  if (o.type === 'box' && !o.region) {   // Make's reading: a side panel / main area is a plain layout frame (no colour, no clip)
    n.bg = tok(o.fill, 'fill'); n.r = o.radius || 0;
    { const m2 = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(o.fill || ''); const lm = m2 ? (0.299 * parseInt(m2[1], 16) + 0.587 * parseInt(m2[2], 16) + 0.114 * parseInt(m2[3], 16)) / 255 : 1;
      if (lm < 0.3) n.dark = 1;                        // a dark card (navy tile): its fill is the measured dark colour, the door allows it — never turn it white (white text on it would vanish)
      else if (/Title|Text|Active|Foreground|Marker/.test(String(n.bg))) n.bg = 'sapBaseColor'; }   // a light fill can never be a text colour
    const m = /(\d+)px (\S+)/.exec(o.border || ''); if (m) { n.bw = +m[1]; n.bc = tok(m[2], 'border'); }
    n.clip = 1;                                        // a card clips its content — dense content stays inside when the screen narrows
  }
  // Every container just free-places its children (xy in parent coords); the recursive XY-cut in flow() does ALL layout
  // inference exactly (baked gaps + cross offsets), so there is one layout path and no median-gap drift.
  n.c = kids.map(k => conv(k, x, y)).filter(Boolean);
  // edge-match ta on the MEASURED width (a text's _ow), not the SAP-shrunk width, or the right edge no longer lines up
  const E = n.c.map(c => { const ew = c.k === 't' && c._ow ? c._ow : c.w; return [c.xy[0], c.xy[0] + ew / 2, c.xy[0] + ew]; });
  n.c.forEach((c, i) => {                            // a text keeps the edge it shares with a sibling (SAP text is narrower)
    if (c.k !== 't') return;
    const near = j => E.some((e, k) => k !== i && Math.abs(e[j] - E[i][j]) <= 3);
    const rightOfComp = E.some((e, k) => k !== i && n.c[k].k === 'i' && Math.abs(e[2] - E[i][2]) <= 3);   // e.g. a price above its button
    const ta = rightOfComp ? 'R' : near(0) ? null : near(2) ? 'R' : near(1) ? 'C' : null;
    // an edge-aligned text keeps its measured box and HUG width — a FILL-width text in Figma auto-switches to
    // textAutoResize HEIGHT and WRAPS at the fill width (real Figma turned "07:15"/"01:00+1" into 4-line 92-px blocks).
    // HUG never wraps; textAlignHorizontal still keeps it on its edge, and its measured box places it exactly.
    if (ta) { c.ta = ta; c.s = 'HH'; }
  });
  return n;
}
// RESPONSIVE: no free placement, and no clutter frames. A frame with placed children becomes auto-layout by a
// recursive, hairline-aware XY-cut on the measured boxes — the way a designer nests rows and columns:
//   • a vertical hairline (w ≤ 2) that spans ≥ 80 % of the region height is a SEPARATOR item in an H flow; the boxes
//     left of it and right of it are the two groups it divides. A horizontal hairline (h ≤ 2) spanning ≥ 80 % of the
//     width is a DIVIDER item in a V flow. (A full-height separator / full-width divider used to force every sibling
//     into one band and collapse a whole card — this handles it as a real item, not a grouping key.)
//   • otherwise cut at the widest clean gap: the biggest x-gap with no box straddling it → an H split, the biggest such
//     y-gap → a V split; the axis with the wider real gap wins. Recurse on each side.
//   • equal child gaps → the frame's gap (g); the single widest gap (> 40) between two clusters → a[0]='S'
//     (SPACE_BETWEEN) so the two sides flex apart. Cross-axis alignment M / C / X from the measured edges.
//   • no clean cut (items truly overlap) → one V frame in y-order + a WARN line. Never negative padding, never a
//     free-placed child, never a "Spacer"/"offset" wrapper — every frame is named after its first real label.
// Then size() gives FILL width to containers in columns, one FILL child to every row, HUG height to containers.
const G = (nm, d, kids, extra) => ({ n: nm, d, g: 0, p: [0, 0, 0, 0], a: 'MM', s: 'HH', c: kids, ...extra });
const bandName = ks => (ks.map(c => c.t || (c.tx && Object.values(c.tx)[0]) || c.n).find(Boolean) || 'Row').toString().replace(/\s+/g, ' ').slice(0, 28);
const B = c => c._b || (c._b = [c.xy[0], c.xy[1], c.xy[0] + c.w, c.xy[1] + c.h]);     // absolute-in-parent box [x0,y0,x1,y1]
const isHair = (c, i, full) => (c.k === 'r') && (i === 0 ? c.w <= (full ? 4 : 2) : c.h <= (full ? 4 : 2));   // a divider/separator rectangle, thin on axis i; a 3–4 px line only when it spans the whole region (the page's bottom line)
// crossAlign: measured edge shared by every item on the cross axis → M (start) / X (end) / C (centre)
function crossAlign(items, ci, lo, hi) {
  if (items.length < 2) return 'M';
  const st = Math.min(...items.map(c => B(c)[ci])), en = Math.max(...items.map(c => B(c)[ci + 2]));
  if (items.every(c => Math.abs(B(c)[ci] - lo) <= 3)) return 'M';
  if (items.every(c => Math.abs(hi - B(c)[ci + 2]) <= 3)) return 'X';
  const mids = items.map(c => (B(c)[ci] + B(c)[ci + 2]) / 2), mc = (lo + hi) / 2;   // Figma centres in the FRAME, not in the parts' span: a row 'centred' in its parts moved 10 px in a wider frame
  const narrow = items.filter(c => B(c)[ci + 2] - B(c)[ci] < 0.9 * (hi - lo)).length;   // in a COLUMN one narrow row among full-width cards: its hug width changes with SAP text and centring moves it ~10 px — keep its offset (heights in a row do not change: rows keep centring)
  if ((ci === 1 || narrow >= 2) && items.every((c, i) => Math.abs(mids[i] - mc) <= 2)) return 'C';   // 4 px called a 10-px offset 'centred' and moved a price column 10 px (2026-10-05); else MIN + each item's exact offset
  return 'M';
}
// cut a set of placed items inside the box [x0,y0,x1,y1] into ONE auto-layout node (recursively). Returns a node with
// d/g/p/a/c and its children stripped of xy — OR, when there is a single item flush to the box, that item itself.
function cut(items, x0, y0, x1, y1, warns) {
  if (items.length === 1) {                                    // a lone item: it becomes the node, padded to its offset
    const c = items[0], bx = B(c);
    const p = [R(bx[1] - y0), R(x1 - bx[2]), R(y1 - bx[3]), R(bx[0] - x0)].map(v => Math.max(0, v));
    delete c.xy; delete c._b;
    if (p.every(v => v <= 0.5)) return c;                      // flush: no wrapper needed
    const boxed = c.bg != null || c.bc != null || c.r;
    if ((c.d || !c.k) && !boxed) { c.p = mergePad(c.p, p); c.w = R((c.w || 0) + p[1] + p[3]); c.h = R((c.h || 0) + p[0] + p[2]);
      (c.c || []).forEach(g => { if (g.abs && g.xy) g.xy = [R(g.xy[0] + p[3]), R(g.xy[1] + p[0])]; }); return c; }
    return G((c.t || c.n) + ' box', 'V', [c], { p, w: R(x1 - x0), h: R(y1 - y0) });   // a leaf/card wrapper holds the offset
  }
  // 1. a hairline that spans (nearly) the whole region is a real separator/divider. It is pulled out first — even when
  //    it sits at an edge (nothing on one side) — because a full-height separator / full-width divider straddling the
  //    other items would otherwise block every clean gap-cut and force them into one band (the card-collapse bug).
  for (const axis of [0, 1]) {                                 // axis 0 = vertical hairline → H flow · axis 1 = horizontal → V flow
    const region = axis === 0 ? y1 - y0 : x1 - x0;
    const hair = items.filter(c => { const len = axis === 0 ? B(c)[3] - B(c)[1] : B(c)[2] - B(c)[0]; return isHair(c, axis, len >= region * 0.95) && len >= region * 0.8; });
    if (!hair.length) continue;
    const h = hair.sort((a, c) => B(a)[axis] - B(c)[axis])[0], hp = (B(h)[axis] + B(h)[axis + 2]) / 2;
    const before = items.filter(c => c !== h && (B(c)[axis] + B(c)[axis + 2]) / 2 < hp);
    const after = items.filter(c => c !== h && (B(c)[axis] + B(c)[axis + 2]) / 2 >= hp);
    const parts = [before, [h], after].filter(g => g.length);
    if (parts.length >= 2) return flowAxis(axis, parts, x0, y0, x1, y1, warns);
  }
  // 2. cut at the widest clean gap; pick the axis whose widest gap is larger
  const best = [gapCut(items, 0), gapCut(items, 1)].filter(Boolean).sort((a, c) => c.gap - a.gap)[0];
  if (best) return flowAxis(best.axis, best.groups, x0, y0, x1, y1, warns);
  // 3. items overlap (a price sub-label over the bottom of its component, stacked icons whose frames touch). Lay them
  //    along the axis their CENTRES spread on, in centre order. Overlap on the main axis (a negative gap) is pinned with
  //    ABSOLUTE positioning on that one child so the flow keeps the exact measured offset (auto-layout has no negative gap).
  const spread = i => { const cs = items.map(c => (B(c)[i] + B(c)[i + 2]) / 2); return Math.max(...cs) - Math.min(...cs); };
  const axis = spread(0) >= spread(1) ? 0 : 1;
  const ordered = items.slice().sort((a, c) => (B(a)[axis] + B(a)[axis + 2]) - (B(c)[axis] + B(c)[axis + 2]));
  return flowAxis(axis, ordered.map(c => [c]), x0, y0, x1, y1, warns);
}
// gapCut: the widest gap on axis i with no item straddling it → the ordered groups on each side of every such gap.
function gapCut(items, i) {
  const sorted = items.slice().sort((a, c) => B(a)[i] - B(c)[i]);
  let far = -Infinity, groups = [[sorted[0]]], gaps = [];
  for (let j = 1; j < sorted.length; j++) {
    far = Math.max(far, ...groups[groups.length - 1].map(c => B(c)[i + 2]));
    const gap = B(sorted[j])[i] - far;
    if (gap > 3) { gaps.push(gap); groups.push([sorted[j]]); } else groups[groups.length - 1].push(sorted[j]);
  }
  if (groups.length < 2) return null;
  return { axis: i, groups, gap: Math.max(...gaps) };
}
// give an item its measured padding [T,R,B,L] relative to the flow's content edges. A container merges it; a leaf
// gets a named one-child wrapper (never "Spacer"/"offset"), so HUG reconstructs the exact measured box — no alignment
// guesswork, no drift. The wrapper is H so it hugs its single child's height and holds left/right/top padding.
function padItem(it, pad, acr, main) {
  if (pad.every(v => Math.abs(v) <= 0.5)) return it;
  const p = pad.map(v => Math.max(0, v));
  // a plain layout frame absorbs the padding directly; a leaf, or a bordered box/card whose own visible size must not
  // change, gets a transparent one-child wrapper (named after its content, never "Spacer"/"offset") to hold the offset.
  const boxed = it.bg != null || it.bc != null || it.r;
  if ((it.d || !it.k) && !boxed) {
    it.p = mergePad(it.p, p); it.w = R((it.w || 0) + p[1] + p[3]); it.h = R((it.h || 0) + p[0] + p[2]);
    (it.c || []).forEach(c => { if (c.abs && c.xy) c.xy = [R(c.xy[0] + p[3]), R(c.xy[1] + p[0])]; });   // added padding moves the frame top-left; keep abs children in place
    return it;
  }
  return { n: (it.t || it.n) + ' cell', d: 'H', g: 0, p, a: 'MM', s: (main === 0 ? 'H' : 'F') + 'H', w: R((it.w || 0) + p[1] + p[3]), h: R((it.h || 0) + p[0] + p[2]), c: [it] };
}
// flowAxis: lay out the ordered groups along axis (0 H, 1 V) inside the box; recurse into any group of > 1.
// Positions are exact: the frame carries lead/trail padding, each item carries the measured gap-before it as leading
// padding and its cross-axis offset as cross padding, g stays 0 and alignment MIN — so the simulator (and Figma) put
// every leaf back where it was measured, and the layout still resizes (widths are FILL/HUG per size()).
function flowAxis(axis, groups, x0, y0, x1, y1, warns) {
  const H = axis === 0, ci = H ? 1 : 0, mi = H ? 0 : 1;
  const flat = groups.flat();
  // measure geometry BEFORE cutting sub-groups (cut() deletes each child's xy/_b as it consumes it)
  const mStart = groups.map(g => Math.min(...g.map(c => B(c)[mi]))), mEnd = groups.map(g => Math.max(...g.map(c => B(c)[mi + 2])));
  const cStart = groups.map(g => Math.min(...g.map(c => B(c)[ci])));      // each group's leading cross edge
  const gaps = []; for (let j = 1; j < groups.length; j++) gaps.push(R(mStart[j] - mEnd[j - 1]));
  const lead = Math.max(0, R(mStart[0] - (H ? x0 : y0))), trail = Math.max(0, R((H ? x1 : y1) - mEnd[mEnd.length - 1]));
  const crossLo = H ? y0 : x0;
  const acr = crossAlign(flat, ci, H ? y0 : x0, H ? y1 : x1);
  const spans = groups.map(g => span(g, x0, y0, x1, y1)), nm = bandName(flat) + (H ? ' row' : ' column');
  const gStart = groups.map(g => [Math.min(...g.map(c => B(c)[0])), Math.min(...g.map(c => B(c)[1]))]);   // group origin, before cut
  const raw = groups.map((g, j) => cut(g, ...spans[j], warns));          // consume children into sub-nodes
  // frame padding: main lead/trail; cross lead is folded per-item so a uniform MIN alignment holds
  const p = H ? [0, trail, 0, lead] : [lead, 0, trail, 0];
  // FAST PATH: gaps are uniform and every item shares the leading cross edge (no per-item offset) and none overlaps →
  // one frame gap `g` and no wrapper cells at all. Keeps the tree small (fewer layers/chars) for a regular row/column.
  const crossOff = j => acr === 'M' ? R(cStart[j] - crossLo) : 0;
  const uniform = gaps.length > 0 && Math.max(...gaps) - Math.min(...gaps) <= 1 && gaps.every(g => g >= -1)
    && groups.every((g, j) => Math.abs(crossOff(j)) <= 1);
  if (uniform) return { n: nm, d: H ? 'H' : 'V', g: Math.max(0, R(gaps[0])), p, a: 'M' + acr, s: 'FH', w: R(x1 - x0), h: R(y1 - y0), c: raw };
  // else g=0; each item padded by its measured gap-before (main axis) and its cross offset (when MIN aligned). Positions
  // are exact and drift-free. An item that OVERLAPS the previous one (a price sub-label over its component) cannot sit
  // before it in a flow, so it is pinned ABSOLUTE at its measured offset (door-exempt, exact).
  const items = raw.map((it, j) => {
    if (j > 0 && gaps[j - 1] < -1) { it.abs = 1; it.xy = [R(gStart[j][0] - x0), R(gStart[j][1] - y0)]; return it; }
    const gapBefore = j === 0 ? 0 : Math.max(0, gaps[j - 1]);
    const crossPad = Math.max(0, crossOff(j));               // MIN alignment → fold the cross offset in
    const pad = H ? [crossPad, 0, 0, gapBefore] : [gapBefore, 0, 0, crossPad];
    return padItem(it, pad, acr, mi);
  });
  return { n: nm, d: H ? 'H' : 'V', g: 0, p, a: 'M' + acr, s: 'FH', w: R(x1 - x0), h: R(y1 - y0), c: items };
}
// a child that becomes FILL width in a COLUMN loses the offset its alignment gave it (Figma stretches it edge to edge; the
// 2026-10-03 build put the toolbar and the table at x=0 instead of 32). Keep the measured offset as the child's own side padding.
function keepOffset(c, par) {
  if (!par || par.d !== 'V' || !c.w || !par.w) return;
  const pp = Array.isArray(par.p) ? par.p : [par.p || 0, par.p || 0, par.p || 0, par.p || 0], inner = par.w - pp[1] - pp[3], extra = R(inner - c.w);
  if (extra <= 1) return;
  const ca = (par.a || 'MM')[1], left = ca === 'X' ? extra : ca === 'C' ? extra / 2 : 0;
  c.p = mergePad(c.p, [0, R(extra - left), 0, R(left)]); c.w = R(inner);
}
// the LAST item of a full-width row sits on the right edge (Actions, the last toolbar icon): its baked gap becomes free space,
// so the few px of extra SAP text width before it is absorbed instead of pushing it past the edge (2026-10-03: "Acti" clipped)
function anchorLast(row) {
  // the cell after the BIGGEST measured gap becomes the flexible space (the gap before "Actions"; between "Explore" and the shell icons)
  const ks = (row.c || []).filter(k => !k.abs), padL = q => (Array.isArray(q.p) ? q.p[3] : q.p || 0) || 0;
  const cand = ks.slice(1).filter(q => !q.k && q.d === 'H' && (q.c || []).length === 1 && padL(q) >= 40).sort((a, b) => padL(b) - padL(a));
  const k = cand[0]; if (!k) return;
  const p = Array.isArray(k.p) ? k.p.slice() : [k.p || 0, k.p || 0, k.p || 0, k.p || 0];
  p[3] = 8; k.p = p; k.s = 'F' + (k.s || 'HH')[1]; k.a = 'X' + ((k.a || 'MM')[1] || 'M');
}
const sideGap = (gaps, lo, hi) => { const g = gaps.slice(lo, hi - 1).filter(v => v > 3); return g.length ? Math.max(0, R(g.slice().sort((a, c) => a - c)[g.length >> 1])) : 0; };
const span = (g, x0, y0, x1, y1) => [Math.min(...g.map(c => B(c)[0])), Math.min(...g.map(c => B(c)[1])), Math.max(...g.map(c => B(c)[2])), Math.max(...g.map(c => B(c)[3]))];
const mergePad = (a, add) => { const base = Array.isArray(a) ? a.slice() : [0, 0, 0, 0]; return base.map((v, i) => Math.max(0, R(v + add[i]))); };
function flow(n) {
  const kids = n.c || []; if (n.d || !kids.length || !kids.some(c => c.xy)) return;
  const warns = [];
  const x0 = Math.min(...kids.map(c => B(c)[0])), y0 = Math.min(...kids.map(c => B(c)[1]));
  const x1 = Math.max(...kids.map(c => B(c)[2])), y1 = Math.max(...kids.map(c => B(c)[3]));
  const kidSet = new Set(kids);
  const node = cut(kids.slice(), x0, y0, x1, y1, warns);
  // the container adopts the top-level cut, plus the padding from its own box edges to the content bounds. But when cut
  // returned one of n's OWN existing children (a single card/element that flush-fills n), adopting its children would drop
  // that child's own frame (its border/fill) — so keep it as n's single child instead.
  const pad = [Math.max(0, R(y0)), Math.max(0, R(n.w - x1)), Math.max(0, R(n.h - y1)), Math.max(0, R(x0))];
  const isOwnChild = kidSet.has(node);
  if (isOwnChild) { n.d = 'V'; n.g = 0; n.p = mergePad(pad, [0, 0, 0, 0]); n.a = 'MM'; n.c = [node]; }
  else if (node.d) { n.d = node.d; n.g = node.g; n.p = mergePad(pad, Array.isArray(node.p) ? node.p : [0, 0, 0, 0]); n.a = node.a; n.c = node.c; }
  else { n.d = 'V'; n.g = 0; n.p = mergePad(pad, Array.isArray(node.p) ? node.p : [0, 0, 0, 0]); n.a = 'MM'; n.c = node.k ? [node] : node.c; }
  if (!isOwnChild) (n.c || []).forEach(c => { if (c.abs && c.xy) c.xy = [R(c.xy[0] + pad[3]), R(c.xy[1] + pad[0])]; });   // n's added padding moves abs children
  kids.forEach(c => { delete c._b; });
  (function clean(o) { (o.c || []).forEach(c => { delete c._b; clean(c); }); })(n);
  warns.forEach(w => WARNS.push(`${n.n}: ${w}`));
}
// does this container's content span (nearly) its parent's inner width? then it can be FILL width; otherwise HUG so its
// children keep their measured x. The root's direct section columns are the exception — they are the responsive columns.
function spansWidth(o, par) {
  if (!par) return false;
  const p = Array.isArray(par.p) ? par.p : [0, 0, 0, 0];
  const free = par.w - p[1] - p[3];
  return Math.abs(o.w - free) <= 4;
}
function size(o, root, par) {
  (o.c || []).forEach(c => size(c, false, o));
  const kids = (o.c || []).filter(c => !c.abs);
  if (root || o.k) return;
  // WIDTH of a container: FILL when it spans its parent's inner width (a column, a full-width band), else HUG so a row's
  // children keep their measured x. HEIGHT: always HUG (gaps are baked, so HUG reconstructs the measured height exactly).
  // FIXED width to the measured extent unless the container spans its parent (then FILL). HUG would inflate a container
  // holding a wide divider / connector line (a 160-px route line under a 46-px duration made its column 160 wide and shoved
  // the next column ~120 px right). FIXED at scale 1.0 reproduces the measured x; the FILL added below keeps it responsive.
  // Only a COLUMN (or full-width band) that spans its parent FILLs its width — the screen resizes through the columns.
  // A ROW is always FIXED to its measured width: a FILL row plus its one FILL child lets that child absorb the row-vs-
  // content slack and shove everything after it (a 160-px route line pushed the next column ~90 px right).
  // WIDTH: FILL when the container spans its parent's inner width (the screen resizes through these), else HUG so it
  // hugs its content (its explicit w already equals the measured span, wide inner divider included — no inflation).
  // HEIGHT: HUG (baked gaps reconstruct it) EXCEPT a frame holding an absolutely-pinned child (an overlapping price):
  // an abs child does not add to HUG, so keep the measured height FIXED instead.
  // FILL only for a WIDE container/text (> 120 px) that spans its parent — the screen resizes through these. A small
  // wrapper, a thin divider/separator, an icon or a kit instance keeps its width; giving a 2-px separator or a 40-px
  // wrapper FILL would let it eat a row's slack and shove the measured content sideways.
  // a real container or a WIDE horizontal divider rectangle can FILL its width; a TEXT never fills (FILL width makes
  // Figma wrap it), nor does an icon, a kit instance, or a thin vertical separator.
  const fillable = c => (!c.k && c.d) || (c.k === 'r' && c.w > c.h && c.w > 120) || c.k == null;
  const wFill = o.d && o.w > 120 && fillable(o) && spansWidth(o, par);
  const hAbs = (o.c || []).some(c => c.abs);
  // HEIGHT: HUG, EXCEPT a bordered box/card — it keeps its MEASURED reference height, FIXED (it already has clip:1), so SAP
  // line-height and any taller kit component clip inside instead of growing the card past the reference and overflowing the
  // frame. That is what keeps STRUCTURE matching the reference box sizes and the filter column inside 616. A frame pinning an
  // abs child also stays FIXED height (an abs child does not add to HUG).
  const boxed = o.bg != null || o.bc != null || o.r;
  o.s = (wFill ? 'F' : 'H') + (hAbs || boxed ? 'X' : 'H');
  if (wFill) keepOffset(o, par);
  // Propagate FILL down the responsive path: a COLUMN's spanning child FILLs (so the column's width reaches its content),
  // but a ROW's child only FILLs when the ROW itself is FILL-width — otherwise a FILL child in a HUG row just eats the
  // row's slack and nudges the measured content sideways.
  const allowChildFill = o.d === 'V' || wFill;
  // a container holding a flight-leg route (a wide horizontal rule deep inside) must FILL its width so the route can spread
  // to the block width and the arrival column + baggage move to the far right (matching the reference), even if the child's
  // own hugged width falls a bit short of spanning.
  const hasRule = c => (function seek(x) { return (x.k === 'r' && x.w > x.h && x.w > 80) || (x.c || []).some(seek); })(c);
  kids.forEach(c => {
    if ((c.s || 'XX')[0] === 'F' || !allowChildFill) return;
    // a ROW that nearly spans its column (a table header, a toolbar) FILLs too: hugged, it grows by the few px Figma's text is wider than
    // the OCR box and, centred, spills past BOTH edges (2026-10-03: "vent Details" … "Action:" clipped). Filled + its measured offset kept,
    // the items stay left-anchored and the growth lands in the free room on the right.
    const nearSpan = o.d === 'V' && c.d === 'H' && o.w && c.w >= 0.9 * (o.w - (Array.isArray(o.p) ? o.p[1] + o.p[3] : 2 * (o.p || 0)));
    if (fillable(c) && c.w > 120 && (spansWidth(c, o) || nearSpan || (o.d === 'V' && hasRule(c)))) { c.s = 'F' + (c.s || 'XX')[1]; keepOffset(c, o); if (nearSpan) anchorLast(c); }
  });
  if (o.d === 'H' && wFill && !kids.some(c => (c.s || '')[0] === 'F')) {
    // a FILL-width row needs one FILL child so it grows with the screen. Prefer the ROUTE column — the group that holds a
    // wide horizontal divider (a flight leg's duration/arrow line), so the extra width lands on the route and the arrival
    // column + baggage after it move to the far right, matching the reference. Otherwise the LAST wide flexible child flexes
    // (expanding rightward never shifts the earlier items).
    const hasRule = c => (function seek(x) { return (x.k === 'r' && x.w > x.h && x.w > 80) || (x.c || []).some(seek); })(c);
    const cand = kids.find(c => fillable(c) && c.w > 40 && hasRule(c)) || [...kids].reverse().find(c => fillable(c) && c.w > 40);
    if (cand) cand.s = 'F' + (cand.s || 'XX')[1];
  }
}
// Claude's corrections of the OCR (names.json texts / components), applied by BOX so every position stays measured:
//   text  "T8": "new text" · ["Weekly Reservation", "Group"] (split the box by length) · "skip" · "icon:<kit icon>" (an icon the OCR read as letters)
//   comp  "C1": "<kit component>" · "text:<string>:<style>" (not a component, a plain text) · "skip"
// one OCR box → several parts, left to right: "text" · "icon:<kit icon>" · "image" (cropped from the reference) · a number = that fraction of the box is empty
function splitBox(k, parts, out) {
  const [x, y, w, h] = k.box, gap = 8, fixed = p => typeof p === 'number' ? p * w : /^image:[\d.]+$/.test(p) ? Number(p.slice(6)) * w : /^(icon:|image$)/.test(p) ? h : null;   // image:0.3 = a picture 30 % of the box wide
  const texts = parts.filter(p => fixed(p) == null), used = parts.reduce((a, p) => a + (fixed(p) || 0), 0) + gap * (parts.length - 1);
  const L = p => String(p).split('@')[0].length, tot = texts.reduce((a, p) => a + Math.max(1, L(p)), 0), room = Math.max(texts.length * 4, w - used);
  let cx = x;
  for (const p of parts) {
    const pw = fixed(p) != null ? fixed(p) : Math.max(4, Math.round(room * Math.max(1, L(p)) / tot));
    if (typeof p === 'string' && p.startsWith('icon:')) out.push({ type: 'icon', icon: p.slice(5), box: [R(cx), y, h, h], token: 'sapContent_IconColor', color: k.color });
    else if (p === 'image' || /^image:[\d.]+$/.test(p)) out.push({ type: 'image', box: [R(cx), y, R(pw), h], crop: [R(cx), y, R(pw), h] });
    else if (typeof p === 'string' && p) { const [t, st] = p.split('@'); out.push({ type: 'text', text: t, style: st || k.style || 'MediumText/LHAuto/Regular', token: k.token, color: k.color, box: [R(cx), y, R(pw), h] }); }
    cx += pw + gap;
  }
}
(function patch(o) {
  if (!o.children) return;
  const out = [];
  for (const k of o.children) {
    const key = (k.box || []).join(','), tv = k.type === 'text' ? TXT[key] : undefined, cv = k.type === 'component' ? CMP[key] : undefined;
    if (tv !== undefined) {
      KITTEXTS.push(k.text);                              // the OCR's original wording is answered by the correction
      if (tv === 'skip') continue;
      if (Array.isArray(tv)) { splitBox(k, tv, out); continue; }
      if (String(tv).startsWith('icon:') || tv === 'image') { splitBox(k, [String(tv)], out); continue; }
      { const [t, st] = String(tv).split('@'); out.push({ ...k, text: t, style: st || k.style }); } continue;
    }
    if (cv !== undefined) {
      if (k.text) KITTEXTS.push(k.text);
      if (cv === 'skip') continue;
      if (Array.isArray(cv)) { splitBox({ ...k, style: 'MediumText/LHAuto/Bold', token: 'sapContent_Selected_ForegroundColor' }, cv, out); continue; }
      if (String(cv).startsWith('text:')) { const [, t, st, tk] = String(cv).split(':'); out.push({ type: 'text', text: t || k.text || '', style: st || 'MediumText/LHAuto/Regular', token: tk || 'sapTextColor', box: k.box }); continue; }
      out.push({ ...k, component: String(cv), props: cv === k.component ? k.props : {} }); continue;
    }
    patch(k); out.push(k);
  }
  o.children = out;
})({ children: spec.sections });
const f = spec.frame, root = { n: 'Flight results', sz: 'x', w: f.w, h: f.h, bg: f.fill || 'sapBaseColor', clip: 1,
  c: spec.sections.map(s => conv(s, 0, 0)).filter(Boolean) };
if (KITICONS || KITTEXTS.length) root.kit = { icons: KITICONS, texts: KITTEXTS, src: 'spec2tree' };
(function fl(o) { (o.c || []).forEach(fl); flow(o); })(root);
size(root, true);
// the root is the responsive frame: its widest direct child (the main content column) FILLs so the screen flexes; a
// narrower side column (filters) keeps its measured width. So the FILL column receives EXACTLY its measured width at
// scale 1.0, move any inter-column slack (the FILL column's own leading padding, and the root's trailing padding beyond
// the measured content) into the root's gap — otherwise FILL would over-receive and shift the column's content.
if (root.d === 'H') {
  const cols = (root.c || []).filter(c => !c.abs);
  const main = cols.filter(c => !c.k).sort((a, c) => c.w - a.w)[0];
  if (main && cols.length >= 2) {
    main.s = 'F' + (main.s || 'XX')[1];
    const idx = cols.indexOf(main), pm = Array.isArray(main.p) ? main.p : [0, 0, 0, 0];
    if (idx > 0 && pm[3] > 0) { root.g = (root.g || 0) + pm[3]; pm[3] = 0; main.p = pm; }   // fold left padding into the row gap
  } else if (main) main.s = 'F' + (main.s || 'XX')[1];
}
// no section column may run past the frame: SAP line-height can push a HUG column a few px taller than its reference, and
// the frame clips it. Cap each top-level section column to FIXED height that fits inside the frame (clip:1) so nothing
// leaves the frame at any scale — the last row clips instead of the filter column spilling below 616.
{
  // A tall section column (a V column near the top level, taller than a card) must not run past the frame: SAP line-height
  // can push a HUG column a few px over its reference height (605 vs a 599 fit) and spill past 616. FIX such a column to a
  // height that fits (clip:1) so its last row clips instead of leaving the frame. Cards (bg/bc/r) are already FIXED.
  const rp = Array.isArray(root.p) ? root.p : [0, 0, 0, 0], avail = root.h - rp[0] - rp[2];
  (function cap(o, depth) {
    for (const c of (o.c || []).filter(x => !x.abs)) {
      if (depth <= 2 && c.d === 'V' && !c.k && !c.bg && !c.bc && !c.r && c.h > avail - 40) {
        c.h = Math.min(c.h, avail); c.s = (c.s || 'XX')[0] + 'X'; c.clip = 1;
      } else cap(c, depth + 1);
    }
  })(root, 0);
}
// clean tree, like the gold trees: drop keys that equal their default (the renderer defaults them anyway) so the
// build call the model types stays small. Kept: s (the door needs a sizing decision on every laid-out child).
(function strip(o) {
  if (o.g === 0) delete o.g;
  if (Array.isArray(o.p) && o.p.every(v => v === 0)) delete o.p;
  if (o.a === 'MM') delete o.a;
  delete o._ow;                                        // internal: the pre-shrink text width, only used for ta edge-matching
  (o.c || []).forEach(strip);
})(root);
// SIZING RULES (2026-10-04) — one pass for the whole tree, so parts never squash, crop or collapse:
//  1 leaves keep theirs (text HUG, icon FIXED square, kit part kit size) · 2 in a column a container wider than 120 px FILLs the width
//  3 in a row exactly ONE container FILLs (the widest) · 4 a parent of a FILL child never HUGs on that axis (FILL when its parent gives
//  space, else FIXED) · 5 only the screen frame clips (a clipping card cut "05:48pm").
const LEAF = o => ['t', 'ic', 'i', 'r'].includes(o.k);
const setS = (o, ax, v) => { const s = (o.s || 'XX').split(''); s[ax] = v; o.s = s.join(''); };
(function down(o) {
  const cs = (o.c || []).filter(c => !LEAF(c) && !c.abs);
  const padX = Array.isArray(o.p) ? (o.p[1] || 0) + (o.p[3] || 0) : 2 * (o.p || 0), inner = (o.w || 0) - padX;
  if (o.d === 'V') cs.forEach(c => { if ((c.w || 0) > 120) setS(c, 0, (c.w || 0) >= inner - 24 ? 'F' : 'H'); });   // spans the column → FILL, else HUG (never stretch a 485-px row to 965)
  if (o.d === 'H' && (o.s || 'X')[0] !== 'H' && (o.c || []).some(c => !c.abs && c.k !== 'i' && (c.s || '')[0] === 'X' && (c.w || 0) > 120) && cs.length && !(o.c || []).some(c => !c.abs && (c.s || '')[0] === 'F')) {
    const flow = (o.c || []).filter(c => !c.abs), pad = Array.isArray(o.p) ? (o.p[1] || 0) + (o.p[3] || 0) : 2 * (o.p || 0);
    const slack = (o.w || 0) - pad - flow.reduce((a, c) => a + (c.w || 0), 0) - (o.g || 0) * Math.max(0, flow.length - 1);
    if (slack > 16) o.c.push({ n: name('Spacer'), w: Math.round(slack), h: 1, s: 'FX' });      // the row does not span: a FILL spacer flexes, the cards keep their size
    else setS(cs.reduce((a, c) => ((c.w || 0) > (a.w || 0) ? c : a)), 0, 'F');                  // the children span the row: the widest one flexes
  }
  if (o !== root) delete o.clip;
  (o.c || []).forEach(down);
})(root);
(function up(o, par) {
  (o.c || []).forEach(c => up(c, o));
  if (LEAF(o) || !o.s) return;
  for (const ax of [0, 1]) if (o.s[ax] === 'H' && (o.c || []).some(c => (c.s || '')[ax] === 'F')) {
    const pIn = par ? (ax === 0 ? (par.w || 0) - (Array.isArray(par.p) ? (par.p[1] || 0) + (par.p[3] || 0) : 2 * (par.p || 0))
                                : (par.h || 0) - (Array.isArray(par.p) ? (par.p[0] || 0) + (par.p[2] || 0) : 2 * (par.p || 0))) : 0;
    const spans = (ax === 0 ? o.w : o.h) >= pIn - 24, cross = par && ((ax === 0 && par.d === 'V') || (ax === 1 && par.d === 'H'));
    if (cross && spans && par.s && par.s[ax] !== 'H') setS(o, ax, 'F');                           // it spans its parent: it may follow it
    else if (cross) (o.c || []).forEach(c => { if ((c.s || '')[ax] === 'F') setS(c, ax, LEAF(c) ? 'H' : 'X'); });   // in a column: the children keep their measured size, text hugs
    else setS(o, ax, 'X');                                                                        // along a row: the frame keeps its measured size, its FILL child fills it
  }
})(root, null);
// 6 HUG only when the content really fills the measured size: a card that hugs its text came out 126 px where the reference has 284.
(function hugTrue(o, par) {
  (o.c || []).forEach(c => hugTrue(c, o));
  if (LEAF(o) || !o.s || !(o.c || []).length) return;
  const P = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0], fl = o.c.filter(c => !c.abs), g = o.g || 0;
  const cw = o.d === 'H' ? fl.reduce((a, c) => a + (c.w || 0), 0) + g * Math.max(0, fl.length - 1) : Math.max(0, ...fl.map(c => c.w || 0));
  const ch = o.d === 'V' ? fl.reduce((a, c) => a + (c.h || 0), 0) + g * Math.max(0, fl.length - 1) : Math.max(0, ...fl.map(c => c.h || 0));
  if (o.s[0] === 'H' && o.w && cw + (P[1] || 0) + (P[3] || 0) < o.w - 16) setS(o, 0, par && par.d === 'V' && o.w > 120 ? 'F' : 'X');   // in a column a wide part follows the column (responsive rule)
  if (o.s[1] === 'H' && o.h && ch + (P[0] || 0) + (P[2] || 0) < o.h - 16) setS(o, 1, 'X');
  // 8 text line height (Figma box = 1.17 × font, the measure saw the glyph) makes a hugging row a few px taller than measured; 3 rows drifted the
  //   time cards 12 px down. Up to 10 px over: the row keeps its MEASURED height (the spare line space below the glyph overlaps, nothing clips).
  const over = ch + (P[0] || 0) + (P[2] || 0) - (o.h || 0);
  if (o.s[1] === 'H' && o.h && over > 1 && over <= 10 && (function hasT(x) { return x.k === 't' || (x.c || []).some(hasT); })(o)) setS(o, 1, 'X');
})(root);
// 7 inside a card a headline is at most H3: H1/H2 are page titles; the OCR reads them only where two texts overlap ("11:50am+" over "(MSY)").
(function cap(o, inCard) {
  if (o.k === 't' && inCard && /^H[12]\//.test(o.st || '')) {
    o.st = o.st.replace(/^H[12]\//, 'H3/'); const sz = Number(((KIT_TEXT[o.st] || '').split('|')[2])); if (sz) o.h = Math.floor(sz * 1.17);
  }
  (o.c || []).forEach(c => cap(c, inCard || (o !== root && !!o.bg && /^Card/.test(o.n || ''))));
})(root, false);
// 10 big pictures (photos, maps) are drawn on the TOP layer at their measured place: the white cards around them are later siblings and covered them (blank holes, 2026-10-04).
(function lift() {
  const keep = [];
  const cut = new Set((global.__CUT || []).concat(global.__BANNERS || []));
  // a lifted picture leaves a transparent Spacer in its slot: without it the next card moved 82 px up into the banner's place (2026-10-05)
  // a photo INSIDE its own card stays there (Make's reading: the photo is the card's first column) — the card's fill is drawn under its
  // children, so nothing covers it. Only a photo next to a card (a later sibling would paint over it) goes to the top layer.
  (function f(o, inCard) { (o.c || []).slice().forEach(c => { if (c.crop && cut.has(c.crop.join(',')) && o !== root && !inCard) { o.c.splice(o.c.indexOf(c), 1, ...(c.abs ? [] : [{ n: name('Spacer'), w: c.w, h: c.h, s: c.s || 'XX', xy: c.xy }])); keep.push(c); } else f(c, inCard || (!c.k && c.bg != null && /^Card\b/.test(c.n || ''))); }); })(root, false);
  keep.forEach(c => { c.abs = 1; c.xy = [c.crop[0], c.crop[1]]; c.s = 'XX'; root.c.push(c); });
  // light-grey panels the box finder missed (low contrast) go BEHIND everything: first children of the screen, free-placed
  (global.__PANELS || []).slice().reverse().forEach(([x, y, w, h], i) => root.c.unshift({ n: name('Panel'), k: 'r', w, h, bg: 'sapBackgroundColor', r: 8, abs: 1, xy: [x, y], s: 'XX' }));
})();
// 11 a small coloured box that only holds ONE kit Tag / Button / Link is that part's outline in the reference: the kit part replaces it
//   (the yellow "You save" box became a Card, the flex pass made it FILL → a Tag stretched over the price column, 2026-10-04).
(function unwrap(o) {
  (o.c || []).forEach((c, i) => {
    const k = (c.c || []).length === 1 ? c.c[0] : null;
    if (c.k || c.abs || !k || k.k !== 'i' || !/^(Tag|Button|Link)$/.test(k.cp || '') || (c.h || 0) > (k.h || 0) + 14 || (c.w || 0) > (k.w || 0) + 40) return;
    k.s = 'HH'; o.c[i] = k;
  });
  (o.c || []).forEach(unwrap);
})(root);
// 9 the door's own responsive rule: a container wider than 120 px in a column follows the column (FILL), whatever an earlier pass decided.
(function colFill(o) { (o.c || []).forEach(c => { if (o.d === 'V' && !LEAF(c) && !c.abs && (c.w || 0) > 120 && (c.s || '')[0] === 'X') setS(c, 0, 'F'); colFill(c); }); })(root);
// final check of rule 3 (earlier passes can turn a HUG row into FIXED): every non-hug row has one flexible part.
(function flex(o) {
  if (o.d === 'H' && (o.s || 'X')[0] !== 'H' && (o.c || []).some(c => !c.abs && c.k !== 'i' && (c.s || '')[0] === 'X' && (c.w || 0) > 120) && !(o.c || []).some(c => !c.abs && (c.s || '')[0] === 'F')) {
    const fl = (o.c || []).filter(c => !c.abs), P = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
    const slack = (o.w || 0) - (P[1] || 0) - (P[3] || 0) - fl.reduce((a, c) => a + (c.w || 0), 0) - (o.g || 0) * Math.max(0, fl.length - 1);
    const box = fl.filter(c => !LEAF(c)).sort((a, b) => (b.w || 0) - (a.w || 0))[0];
    if (slack > 16 || !box) o.c.push({ n: name('Spacer'), w: Math.max(1, Math.round(slack)), h: 1, s: 'FX' }); else setS(box, 0, 'F');
  }
  (o.c || []).forEach(flex);
})(root);
fs.writeFileSync(outF, JSON.stringify(root));
// EXPECT = where a leaf will ACTUALLY land in Figma (the simulated auto-layout of this very tree — line-height text boxes,
// kit component heights, baked gaps and all), not the raw measured glyph box. So layout-sim --expect verifies the tree
// round-trips to its predicted Figma layout, and --geometry (sim vs a REAL dump) stays the external truth check. A leaf
// whose predicted spot differs from the measured glyph is the SAP line-height drift, which real Figma has too.
(function writeExpect() {
  const P = o => (Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0]);
  const leaf = o => !o.c || !!o.k, EX = root.sz === 'x';
  const par = new Map(); (function link(o) { for (const k of o.c || []) { par.set(k, o); link(k); } })(root);
  const mode = (o, i) => { if (o === root) return 'FIXED'; const L = (o.s || 'XX')[i]; if (L !== 'F') return L === 'H' ? 'HUG' : 'FIXED'; return EX ? 'FILL' : 'FIXED'; };
  const memo = new Map();
  const nat = (o, i) => { const m = memo.get(o) || memo.set(o, [null, null]).get(o); if (m[i] != null) return m[i]; let r; const L = mode(o, i), fx = i ? o.h : o.w;
    if (L === 'FIXED' && fx != null) r = fx; else if (leaf(o) || !o.d) r = fx || 0;
    else { const p = P(o), kids = o.c.filter(k => !k.abs), H = o.d === 'H', main = (i === 0) === H, ns = kids.map(k => nat(k, i)), pad = i === 0 ? p[1] + p[3] : p[0] + p[2];
      r = main ? ns.reduce((s, n) => s + n, 0) + (o.g || 0) * Math.max(0, kids.length - 1) + pad : Math.max(0, ...ns) + pad; }
    return (m[i] = r); };
  const box = new Map();
  (function place(o, x, y, W, Hh) { box.set(o, [x, y, W, Hh]); if (leaf(o)) return;
    if (!o.d) { for (const k of o.c) { const xy = k.xy || [0, 0]; place(k, x + xy[0], y + xy[1], nat(k, 0), nat(k, 1)); } return; }
    const p = P(o), H = o.d === 'H', fl = o.c.filter(k => !k.abs), inW = W - p[1] - p[3], inH = Hh - p[0] - p[2], mainA = H ? inW : inH, crossA = H ? inH : inW, mi = H ? 0 : 1, ci = H ? 1 : 0, a = o.a || 'MM';
    const z = fl.map(k => ({ k, fill: mode(k, mi) === 'FILL', main: nat(k, mi), cross: mode(k, ci) === 'FILL' ? crossA : nat(k, ci) }));
    const g0 = o.g || 0, gg = g0 * Math.max(0, z.length - 1), fills = z.filter(q => q.fill), fixed = z.reduce((s, q) => s + (q.fill ? 0 : q.main), 0);
    if (fills.length) { const sh = Math.max(0, mainA - fixed - gg) / fills.length; fills.forEach(q => q.main = sh); }
    const total = z.reduce((s, q) => s + q.main, 0); let gap = g0, pos = 0;
    if (a[0] === 'S' && z.length > 1) gap = Math.max(0, (mainA - total) / (z.length - 1)); else { const used = total + gg; pos = a[0] === 'C' ? (mainA - used) / 2 : a[0] === 'X' ? mainA - used : 0; }
    for (const q of z) { const co = a[1] === 'C' ? (crossA - q.cross) / 2 : a[1] === 'X' ? crossA - q.cross : 0; place(q.k, x + p[3] + (H ? pos : co), y + p[0] + (H ? co : pos), H ? q.main : q.cross, H ? q.cross : q.main); pos += q.main + gap; }
    for (const k of o.c.filter(k => k.abs)) { const xy = k.xy || [0, 0]; place(k, x + xy[0], y + xy[1], nat(k, 0), nat(k, 1)); }
  })(root, 0, 0, nat(root, 0), nat(root, 1));
  const seen = {};
  (function names(o) { seen[o.n] = (seen[o.n] || 0) + 1; (o.c || []).forEach(names); })(root);
  for (const [o, b] of box) if (leaf(o) && seen[o.n] === 1) EXPECT[o.n] = [R(b[0]), R(b[1]), R(b[2]), R(b[3])];
})();
fs.writeFileSync(outF.replace(/\.json$/, '') + '.expect.json', JSON.stringify(EXPECT));
fs.writeFileSync(outF.replace(/\.json$/, '') + '.crops.json', JSON.stringify(CROPS));   // Logo, Logo 2 … in tree order → run.js crops logo1.png …
let n = 0; (function c(o) { n++; (o.c || []).forEach(c); })(root);
console.log(`TREE  ${outF} · ${f.w}×${f.h} · ${n} layers from the measured reference (no gold)`);
if (unknown.length) console.log(`ICONS with no SAP name yet (pass --icons "WxH=name"): ${unknown.join(' · ')}`);
if (WARNS.length) console.log(`WARN  layout could not be cleanly split (kept in y-order):\n  ${WARNS.join('\n  ')}`);
