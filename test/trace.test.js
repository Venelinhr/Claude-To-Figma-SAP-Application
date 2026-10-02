'use strict';
const test = require('node:test'), assert = require('node:assert'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { build } = require('../bridge/trace.js');
test('trace.md: request, result, steps with seconds, gate lines and errors', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-'));
  fs.writeFileSync(path.join(d, 'request.json'), JSON.stringify({ text: 'Create an invoice list' }));
  fs.writeFileSync(path.join(d, 'result.json'), JSON.stringify({ nodeId: '1:2', match: 100, eye: null, pass: true, stages: [{ name: 'done', text: 'MATCH 100%' }] }));
  const L = [{ _at: 1000, type: 'assistant', message: { content: [{ type: 'tool_use', id: 'a', name: 'Bash', input: { command: 'node build/run.js "x"' } }] } },
    { _at: 4000, type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'a', content: 'Exit code 1\nCONTENT ✗ 2 problem(s)\nnoise' }] } }];
  fs.writeFileSync(path.join(d, 'transcript.jsonl'), L.map(x => JSON.stringify(x)).join('\n'));
  const t = build(d);
  assert.match(t, /Request:\*\* Create an invoice list/); assert.match(t, /node 1:2 · MATCH 100/);
  assert.match(t, /#1 \*\*Bash\*\* node build\/run.js/); assert.match(t, /CONTENT ✗ 2 problem/); assert.ok(!/noise/.test(t)); assert.match(t, /Total:\*\* 3 s/);
});
