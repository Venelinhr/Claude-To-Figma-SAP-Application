// route-core.js — the Jev router's text rules, shared by BOTH sides.
//   Claude side: build/route.js requires it.
//   Figma side:  the same rules are written out as the Gate tables in
//                .claude/skills/sap-figma-agent/SKILL.md by build/gen-router.js.
// So the two can never disagree. Rules: no require, no Node/Figma API, pure functions,
// every table passed in as T (build/router-table.json). Node-only since the Figma ACT
// call became the short A-block (typing 10K chars cost ~1 min in Figma).
const RC = (() => {
  const norm = s => ' ' + String(s || '').toLowerCase().replace(/[’']/g, "'")
    .replace(/[^a-z0-9'/\-. ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // whole word / phrase; a single word also matches its plural ("buttons", "gaps")
  const re = w => new RegExp(`(^|[^a-z0-9])${esc(w)}${/\s/.test(w) ? '' : 's?'}(?=[^a-z0-9]|$)`, 'g');
  const hit = (t, w) => re(w).test(t);
  const any = (t, words) => words.find(w => hit(t, w));
  const cut = (t, w) => t.replace(re(w), '$1 ');
  const clauses = text => String(text || '').split(/[,;]|\band then\b|\bthen\b/i).map(norm).filter(c => c.trim());

  // state words → ordered state keys (a word is used once: "unselect" never also counts as "select")
  function stateKeys(t, T) {
    const out = [];
    for (const [k, s] of Object.entries(T.gate4_state.keys)) {
      const w = any(t, s.words); if (!w) continue;
      out.push(k); t = cut(t, w);
    }
    return out;
  }
  // pick the FIRST prop the component really has, and the FIRST value it really offers.
  // defs = { propName: [option, ...] }  (from kit.json or from the live node)
  function resolveState(defs, key, T) {
    const s = T.gate4_state.keys[key]; if (!s) return null;
    for (const p of s.props) {
      const opts = defs[p]; if (!opts) continue;
      const v = s.values.find(v => opts.includes(v));
      if (v) return { prop: p, value: v };
    }
    return null;
  }
  // numbers → SAP scale; "padding 12" = all 4 sides, "side padding 16" = left+right, "gap 8" = itemSpacing
  const snap = (n, T) => T.act_route.sap_scale.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
  function numberOps(t, T) {
    const NT = T.act_route.number_targets, keys = Object.keys(NT).sort((a, b) => b.length - a.length);
    const alt = keys.map(esc).join('|'), ops = [], seen = new Set();
    const push = (k, n) => { const target = NT[k]; if (seen.has(target)) return; seen.add(target);
      const v = snap(+n, T); ops.push(v === +n ? { op: target, value: v } : { op: target, value: v, asked: +n }); };
    for (const m of t.matchAll(new RegExp(`(${alt})s?\\s*(?:of|to|=|:)?\\s*(\\d+)`, 'g'))) push(m[1], m[2]);
    for (const m of t.matchAll(new RegExp(`(\\d+)\\s*(?:px)?\\s*(${alt})`, 'g'))) push(m[2], m[1]);
    return ops;
  }
  // GATE 1 for one clause: THINK words first, then property words (they beat "add"), then structure
  function clauseMode(t, T) {
    const G = T.gate1_mode, ns = G.think_new_screen;
    if (any(t, ns.new_words) && any(t, ns.screen_nouns)) return 'THINK';
    if (any(t, G.think_words)) return 'THINK';
    if (any(t, G.property_words) || numberOps(t, T).length) return 'ACT';
    if (any(t, G.structure_words)) return 'QUICK';
    return null;
  }
  const isFrameWord = t => /(^|[^a-z])(border|stroke|outline|card|frame|tile|container)s?([^a-z]|$)/.test(t);
  return { norm, hit, any, cut, clauses, stateKeys, resolveState, snap, numberOps, clauseMode, isFrameWord };
})();
if (typeof module !== 'undefined') module.exports = RC;
