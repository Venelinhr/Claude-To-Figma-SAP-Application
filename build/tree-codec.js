// tree-codec.js — the compact wire format for a v5 layout tree, shared by render.js (encode) and the runtime (decode).
// A tree the model types into Figma is big mostly because the same SAP names repeat (a text style, a colour variable,
// a component, an icon appear dozens of times). encode() pulls every string value of the repeated keys into ONE
// dictionary and leaves an index in its place, and drops keys that equal their default; decode() puts them back.
// Round-trip: decode(encode(tree)) deep-equals the original tree (the trees we build carry no default-valued keys).
//
// The decode half also runs inside Figma, where it cannot require() this file, so its source lives here as RUNTIME_SRC
// and is injected verbatim into templates/render-tree.js. The gates test guards that render-tree.js still contains it.

const DICT_KEYS = ['cp', 'st', 'bg', 'bc', 'ic'];       // repeated SAP names → dictionary; n/t stay inline (mostly unique)

// 32-bit FNV-1a over a string → 8 hex chars. Same maths on both sides catches a typo by the typing model.
function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// encode: plain tree → { $c:1, d:[strings], t:<compact tree>, k:<checksum of the plain tree> }
function encode(tree) {
  const seen = new Map(), count = new Map();
  (function scan(o) { for (const k of DICT_KEYS) if (typeof o[k] === 'string') count.set(o[k], (count.get(o[k]) || 0) + 1); (o.c || []).forEach(scan); })(tree);
  const dict = [], idx = new Map();
  const ref = v => { if (idx.has(v)) return idx.get(v); const i = dict.length; dict.push(v); idx.set(v, i); return i; };
  const enc = o => {
    const r = {};
    for (const [k, v] of Object.entries(o)) {
      if (k === 'c') continue;
      if (k === 'g' && v === 0) continue;                                   // default gap
      if (k === 'a' && v === 'MM') continue;                                // default alignment
      if (k === 'p' && Array.isArray(v) && v.every(x => x === 0)) continue; // default padding
      if (DICT_KEYS.includes(k) && typeof v === 'string' && count.get(v) >= 2) { r[k] = ref(v); continue; }
      r[k] = v;
    }
    if (o.c) r.c = o.c.map(enc);
    return r;
  };
  const t = enc(tree);
  const env = { $c: 1, d: dict, t };
  env.k = fnv(JSON.stringify(_sandbox._decode(env)));   // checksum the tree the runtime reconstructs, not the input (key order + dropped defaults differ)
  return env;
}

// the decode half, as source injected into the runtime AND eval'd by the test — one definition, no drift.
const RUNTIME_SRC = `
const _DKEYS = ${JSON.stringify(DICT_KEYS)};
function _fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0;}return h.toString(16).padStart(8,'0');}
function _decode(env){
  const D=env.d;
  const dec=o=>{const r={};for(const k in o){const v=o[k];if(k==='c')continue;r[k]=(_DKEYS.indexOf(k)>=0&&typeof v==='number')?D[v]:v;}if(o.c)r.c=o.c.map(dec);return r;};
  return dec(env.t);
}`;

// the same decode, for Node (tests, render.js): eval RUNTIME_SRC once so there is a single implementation.
const _sandbox = {};
new Function('exports', RUNTIME_SRC + '\nexports._fnv=_fnv;exports._decode=_decode;')(_sandbox);
const decode = env => (env && env.$c) ? _sandbox._decode(env) : env;

module.exports = { DICT_KEYS, fnv, encode, decode, RUNTIME_SRC };
