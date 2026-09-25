// Run with use_figma on the SAP Web UI Kit. Read-only. Icon name -> component key.
// IPART = which ~14KB chunk (use_figma output is cut at 20KB). -1 = count only.
const IPART = 0;
const page = figma.root.children.find(p => /Iconography/.test(p.name));
await page.loadAsync();
const all = [];
for (const n of page.findAllWithCriteria({ types: ['COMPONENT'] })) {
  if (/^[._]/.test(n.name)) continue;
  const nm = n.parent && n.parent.type === 'COMPONENT_SET' ? n.parent.name + '/' + n.name : n.name;
  all.push([nm, n.key]);
}
all.sort((a, b) => a[0] < b[0] ? -1 : 1);
const chunks = chunkOf(all);
if (IPART < 0) return { parts: chunks.length, total: all.length };
const data = Object.fromEntries(chunks[IPART]);
return { part: IPART, parts: chunks.length, hash: djb2(JSON.stringify(data)), count: chunks[IPART].length, data };
function djb2(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(16);}
// Split into chunks of <= 14000 JSON chars (use_figma output is cut at ~20KB).
function chunkOf(entries) {
  const chunks = [[]]; let size = 2;
  for (const e of entries) { const s = JSON.stringify(e).length + 1;
    if (size + s > 14000 && chunks[chunks.length - 1].length) { chunks.push([]); size = 2; }
    chunks[chunks.length - 1].push(e); size += s; }
  return chunks;
}
