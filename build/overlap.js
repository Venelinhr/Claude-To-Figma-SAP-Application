#!/usr/bin/env node
// overlap.js — FIRST GATE against "smashed" layouts. Reads a geometry file (sim.geometry.json before the build, check/geometry.json after) and prints
// one line per defect, exit 1 when any: text on text · text on a picture · text cut by its own card · a plain frame that is a control (Button / Input / Tag).
//   node build/overlap.js <geometry.json> [--advisory]
// Why (2026-10-04): the checks counted missing boxes but never looked at what lands ON what — cut-out letters over real letters, a badge picture under its text,
// fields and buttons drawn as plain frames all passed. Row = [id,type,name,x,y,w,h,radius,strokeColor,fill,padding,gap,dir,text,parent].
const fs = require('fs');
const f = process.argv[2]; if (!f) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
const rows = JSON.parse(fs.readFileSync(f, 'utf8')).map(r => ({ id: r[0], type: r[1], name: r[2], x: r[3], y: r[4], w: r[5], h: r[6], rad: r[7], stroke: r[8], fill: r[9], text: r[13], par: r[14] }));
const by = new Map(rows.map(r => [r.id, r])), out = [];
const T = rows.filter(r => r.type === 'TEXT' && r.w > 0), IMG = rows.filter(r => r.fill === 'IMAGE');
const inter = (a, b) => { const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return ix > 1 && iy > 1 ? ix * iy : 0; };
for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
  const s = inter(T[i], T[j]) / Math.min(T[i].w * T[i].h, T[j].w * T[j].h);
  if (s > 0.2) out.push(`TEXT/TEXT   "${T[i].text}" and "${T[j].text}" overlap ${Math.round(100 * s)} % at ${Math.round(T[i].x)},${Math.round(T[i].y)}`);
}
for (const t of T) for (const m of IMG) { const s = inter(t, m) / (t.w * t.h); if (s > 0.25) out.push(`TEXT/IMAGE  "${t.text}" sits on picture "${m.name}" (${Math.round(100 * s)} %) at ${Math.round(t.x)},${Math.round(t.y)} — a picture of letters, or a duplicate of the text`); }
const ICO = rows.filter(r => r.type === 'INSTANCE' && /^icon:/.test(r.text || ''));
for (const t of T) for (const ic of ICO) { const s = inter(t, ic) / (ic.w * ic.h); if (s > 0.25) out.push(`TEXT/ICON   "${t.text}" runs into icon "${ic.name}" (${Math.round(100 * s)} %) at ${Math.round(ic.x)},${Math.round(ic.y)}`); }
const card = r => { let p = by.get(r.par); while (p && !((p.fill && p.fill !== 'IMAGE') || p.stroke)) p = by.get(p.par); return p && p.id !== rows[0].id && p.w > 40 && p.h > 20 ? p : null; };   // the visible card around a text
for (const t of T) { const c = card(t); if (!c) continue;
  const r = t.x + t.w - c.x - c.w, bt = t.y + t.h - c.y - c.h;
  if (r > 3 || bt > 3) out.push(`TEXT/CUT    "${t.text}" runs ${Math.round(Math.max(r, bt))} px past its card "${c.name}" — cut off`); }
const kids = id => rows.filter(r => r.par === id);
const all = id => kids(id).flatMap(k => [k, ...all(k.id)]);
for (const fr of rows.filter(r => r.type === 'FRAME' && r.w >= 70 && r.w <= 330 && r.h >= 28 && r.h <= 70)) {
  const d = all(fr.id), tx = d.filter(r => r.type === 'TEXT'), inst = d.filter(r => r.type === 'INSTANCE' && !/^icon:/.test(r.text || ''));
  if (inst.length || !tx.length || tx.length > 2) continue;
  const solid = fr.fill && fr.fill !== 'IMAGE' && /^#/.test(fr.fill) && fr.rad >= 3 && tx.length === 1 && !/^#(fff|ffffff|f5f6f7|f7f7f7)/i.test(fr.fill);
  const field = fr.stroke && fr.rad >= 4 && tx.length === 2;
  if (solid && fr.w >= 70) out.push(`FAKE        "${fr.name}" ${fr.w}×${fr.h} is a filled frame with one text — use the kit Button / Tag`);
  else if (field) out.push(`FAKE        "${fr.name}" ${fr.w}×${fr.h} is a bordered frame with label + value — use Label + kit Input`);
}
const uniq = [...new Set(out)]; uniq.forEach(l => console.log(l)); console.log(uniq.length ? `SMASH ✗ ${uniq.length}` : 'SMASH ✓ 0');
process.exit(uniq.length && !process.argv.includes('--advisory') ? 1 : 0);
