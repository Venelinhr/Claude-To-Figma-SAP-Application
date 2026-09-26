#!/usr/bin/env node
// audit-plan.js — end gate for a TEXT-prompt build (no reference image): does the build
// hold every component the Jev router planned, with the planned props and density?
//   node build/audit-plan.js <plan.json> <tree.json>
// plan.json = output of `node build/route.js "<request>"` or `--image ref.json`
//             (components+states, or zones), optionally edited in the THINK plan.
// tree.json = the build's instance dump, from ONE read-only use_figma call:
//   const out=[]; for (const i of figma.getNodeById('<id>').findAll(n=>n.type==='INSTANCE')) {
//     const m=await i.getMainComponentAsync(), s=m&&m.parent&&m.parent.type==='COMPONENT_SET'?m.parent:m;
//     const p={}; for (const [k,v] of Object.entries(i.componentProperties)) if (v.type==='VARIANT') p[k]=v.value;
//     out.push({name:i.name, component:s&&s.name, props:p, h:Math.round(i.height)}); } return out;
// Output: MISSING / WRONG PROP / WRONG DENSITY lines — same checklist format as audit-screen.py.
const fs = require('fs');
const [planF, treeF] = process.argv.slice(2);
if (!planF || !treeF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 12).join('\n')); process.exit(2); }
const plan = JSON.parse(fs.readFileSync(planF, 'utf8'));
const tree = JSON.parse(fs.readFileSync(treeF, 'utf8'));

// planned items: { component, props, count }
const want = new Map();
const add = (component, props, density) => {
  if (!component || ['container', 'unmapped', 'ask', 'decoration'].includes(component)) return;
  const p = { ...(props || {}) }; if (density) p['Form Factor'] = density;
  const k = component + JSON.stringify(p);
  const w = want.get(k) || { component, props: p, count: 0 }; w.count++; want.set(k, w);
};
if (plan.zones) for (const z of plan.zones) add(z.component, { ...(z.props || {}), ...(z.state || {}) }, z.density);
else for (const c of plan.components || []) {
  const p = {}; for (const s of (plan.states || []).filter(s => s.component === c.name)) p[s.prop] = s.value;
  add(c.name, p);
}

const used = new Set(), missing = [], wrong = [], density = [];
for (const w of want.values()) {
  const same = tree.filter((n, i) => !used.has(i) && n.component === w.component);
  let got = 0;
  for (const n of same) {
    if (got >= w.count) break;
    const i = tree.indexOf(n); used.add(i); got++;
    for (const [p, v] of Object.entries(w.props)) {
      if (!(p in n.props)) continue;
      if (n.props[p] !== v) (p === 'Form Factor' ? density : wrong).push(`${w.component} "${n.name}": ${p}=${n.props[p]}, plan says ${v}`);
    }
  }
  if (got < w.count) missing.push(`${w.count - got}× ${w.component}${Object.keys(w.props).length ? ' ' + JSON.stringify(w.props) : ''}`);
}
const show = (h, a) => console.log(`${h} (${a.length})${a.length ? '\n  - ' + a.join('\n  - ') : ''}`);
show('MISSING', missing); show('WRONG PROP', wrong); show('WRONG DENSITY', density);
const ok = !missing.length && !wrong.length && !density.length;
console.log(`VERDICT: ${ok ? 'MATCHES PLAN' : 'FIX THE ITEMS ABOVE, THEN RE-AUDIT'}`);
process.exit(ok ? 0 : 1);
