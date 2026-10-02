// trace.js — turn a job's transcript.jsonl (+ result.json) into ONE readable file: trace.md. Pure, 0 tokens.
//   what was asked · what the job did, step by step with seconds since the start · every gate line · the result
'use strict';
const fs = require('node:fs'), path = require('node:path');
const clip = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const KEEP = /exit code|✗|NEED|STATUS|MATCH|HYGIENE|STRUCTURE|EYE|GOLD|BUILD|DRAFT|ROUTE|NAMES|LAYOUT|error|refus|build \d/i;

function build(jobDir) {
  const read = f => { try { return fs.readFileSync(path.join(jobDir, f), 'utf8'); } catch (_) { return ''; } };
  let req = {}, res = {}; try { req = JSON.parse(read('request.json')); } catch (_) {} try { res = JSON.parse(read('result.json')); } catch (_) {}
  const L = read('transcript.jsonl').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  const t0 = L.length && L[0]._at ? L[0]._at : 0, sec = m => m._at && t0 ? ((m._at - t0) / 1000).toFixed(0).padStart(3) + ' s' : '    ';
  const out = [`# Job ${path.basename(jobDir)}`, '', `**Request:** ${clip(req.text || res.text || '', 600)}`, ''];
  out.push(`**Result:** ${res.nodeId ? `node ${res.nodeId} · MATCH ${res.match} · EYE ${res.eye == null ? '—' : res.eye} · ${res.pass ? 'PASS' : 'DRAFT/FAIL'}` : '(no result yet)'}${res.url ? ' · ' + res.url : ''}`, '');
  if (L.length && L[L.length - 1]._at) out.push(`**Total:** ${((L[L.length - 1]._at - t0) / 1000).toFixed(0)} s (first to last event)`, '');
  if ((res.stages || []).length) out.push('## Stages', ...res.stages.map(s => `- ${s.name}: ${s.text}`), '');
  out.push('## Steps (seconds since the first event)', '');
  const calls = new Map(), names = new Map(); let n = 0;
  for (const m of L) {
    const c = m.message && m.message.content; if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (b.type === 'text' && m.type === 'assistant' && /STAGE|AGENT_/.test(b.text || '')) out.push(`${sec(m)}  · ${clip((b.text.match(/(STAGE|AGENT_)[^\n]*/) || [''])[0], 200)}`);
      if (b.type === 'tool_use') { n++; calls.set(b.id, n); names.set(b.id, b.name); const i = b.input || {}; out.push(`${sec(m)}  #${n} **${b.name.replace('mcp__figma__', 'figma:')}** ${clip(i.command || i.file_path || i.description || JSON.stringify(i), 230)}`); }
      if (b.type === 'tool_result') {
        const t = Array.isArray(b.content) ? b.content.map(x => x.text || '').join('\n') : String(b.content || '');
        const keep = !/^(Bash|mcp__figma)/.test(names.get(b.tool_use_id) || '') ? [] : t.split('\n').filter(l => KEEP.test(l)).slice(0, 8).map(l => '       > ' + clip(l, 220));
        out.push(`${sec(m)}     ↳ #${calls.get(b.tool_use_id) || '?'} ${b.is_error ? 'ERROR ' : ''}${keep.length ? '' : clip(t, 120)}`, ...keep);
      }
    }
  }
  return out.join('\n') + '\n';
}
function write(jobDir) { const f = path.join(jobDir, 'trace.md'); fs.writeFileSync(f, build(jobDir)); return f; }
module.exports = { build, write };
