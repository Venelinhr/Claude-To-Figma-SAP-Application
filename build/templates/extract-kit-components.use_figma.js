// Run with use_figma on the SAP Web UI Kit (fileKey SILcWzK5uFghKun9jx6D7c). Read-only.
// Set PAGE_FILTER to a function over page names. Output = compact component schema.
// Returns {hash,count,data}; save data EXACTLY, then verify with build/verify-kit-part.js.
// Prop encoding: "T:<default text>" text · "B:<true|false>" boolean ·
//   "V:<default>|<opt1,opt2,...>" variant · "I:<defaultKey> <defaultName>" instance swap · "S" slot
// PART = which ~14KB chunk to return (0-based). PART = -1 returns only the chunk count.
const PART = 0;
const PAGE_FILTER = n => n.startsWith('❖') && !/Iconography|Illustrations|Focus|Grid/.test(n);
const pages = figma.root.children.filter(p => PAGE_FILTER(p.name));
const out = [];
const keyCache = {};
async function swapDefault(id) {
  if (keyCache[id]) return keyCache[id];
  const n = await figma.getNodeByIdAsync(id);
  let r = id;
  if (n && (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET')) {
    const nm = n.parent && n.parent.type === 'COMPONENT_SET' ? n.parent.name + '/' + n.name : n.name;
    r = n.key + ' ' + nm;
  }
  return (keyCache[id] = r);
}
for (const page of pages) {
  await page.loadAsync();
  const nodes = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
    .filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') && !/^[._]/.test(n.name));
  for (const n of nodes) {
    const props = {};
    for (const [k, d] of Object.entries(n.componentPropertyDefinitions)) {
      if (d.type === 'TEXT') props[k] = 'T:' + d.defaultValue;
      else if (d.type === 'BOOLEAN') props[k] = 'B:' + d.defaultValue;
      else if (d.type === 'VARIANT') props[k] = 'V:' + d.defaultValue + '|' + d.variantOptions.join(',');
      else if (d.type === 'INSTANCE_SWAP') props[k] = 'I:' + (await swapDefault(d.defaultValue));
      else props[k] = d.type[0];
    }
    const dv = n.type === 'COMPONENT_SET' ? n.defaultVariant : n;
    out.push({ page: page.name.replace(/^❖ /, '').trim(), name: n.name, type: n.type === 'COMPONENT_SET' ? 'SET' : 'COMP',
      key: n.key, w: Math.round(dv.width), h: Math.round(dv.height), props });
  }
}
const chunks = chunkOf(out);
if (PART < 0) return { parts: chunks.length, total: out.length };
const data = chunks[PART];
return { part: PART, parts: chunks.length, hash: djb2(JSON.stringify(data)), count: data.length, data };
function djb2(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(16);}
// Split into chunks of <= 14000 JSON chars (use_figma output is cut at ~20KB).
function chunkOf(entries) {
  const chunks = [[]]; let size = 2;
  for (const e of entries) { const s = JSON.stringify(e).length + 1;
    if (size + s > 14000 && chunks[chunks.length - 1].length) { chunks.push([]); size = 2; }
    chunks[chunks.length - 1].push(e); size += s; }
  return chunks;
}
