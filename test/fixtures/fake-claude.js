#!/usr/bin/env node
// Stand-in for `claude -p --output-format stream-json` in test/bridge.test.js.
// Reads the one stream-json user turn, prints the markers the real pipeline would print.
'use strict';
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  const prompt = JSON.parse(input.split('\n')[0]).message.content;
  const dirM = prompt.match(/Job folder \(write every file of this job here, nowhere else\): (\S+)/) || prompt.match(/Job folder: `([^`]+)`/);
  const jobDir = dirM ? path.resolve(process.cwd(), dirM[1]) : null;
  if (jobDir) {
    const n = fs.readdirSync(jobDir).filter((f) => f.startsWith('prompt-')).length;
    fs.writeFileSync(path.join(jobDir, `prompt-${n + 1}.txt`), prompt);
  }
  const out = [];
  const say = (t) => out.push(t);
  const req = (prompt.match(/<<<\n([\s\S]*?)\n>>>/) || [])[1] || '';

  if (/Answer from the user/.test(prompt)) {
    say('STAGE done answered');
    say('AGENT_RESULT {"nodeId":"9:9","mode":"THINK","match":95,"eye":null,"WARN":[],"pass":true,"blocks":[]}');
  } else if (/BRIDGE CHECK|gate round/.test(prompt)) {
    const round = Number((prompt.match(/round (\d+) of/) || [])[1] || 1);
    const agent = /· built by figma-agent\]/.test(prompt);
    const reqText = (() => { try { return JSON.parse(fs.readFileSync(path.join(jobDir, 'request.json'), 'utf8')).text; } catch (_) { return ''; } })();
    if (/GATED/.test(reqText)) {                 // write the files the bridge measures; claim a number the scripts will correct
      const tree = JSON.parse(fs.readFileSync(path.join(__dirname, 'tree-gold-270-6722.json'), 'utf8'));
      if (/GATEDGOOD/.test(reqText)) for (const r of tree) if (r.fill === 'RAW') r.fill = r.type === 'TEXT' ? 'sapCriticalTextColor' : 'sapGroup_ContentBorderColor';
      fs.writeFileSync(path.join(jobDir, 'tree.json'), JSON.stringify(tree));
      say('STAGE check MATCH 99% · EYE null · hygiene 0');
      say('AGENT_RESULT {"nodeId":"5:1","mode":"THINK","match":99,"eye":null,"WARN":[],"pass":true,"blocks":[]}');
    } else if (agent && round === 1) {
      fs.writeFileSync(path.join(jobDir, 'fix.md'), '- 5:5 · Title · H4/Bold\n- 5:6 · Card · 1px border\n');
      say('STAGE check MATCH 80% · EYE null · hygiene 1');
      say(`AGENT_FIX {"fixFile":"${path.relative(process.cwd(), path.join(jobDir, 'fix.md'))}"}`);
    } else {
      const node = (prompt.match(/node `([^`]+)`/) || [])[1];
      say('STAGE check MATCH 97% · EYE 96% · hygiene 0');
      say('STAGE done MATCH 97% · EYE 96%');
      say(`AGENT_RESULT {"nodeId":"${node}","mode":"THINK","match":97,"eye":96,"WARN":[],"pass":true,"blocks":[]}`);
    }
  } else if (/ASKME/.test(req)) {
    say('STAGE route THINK · ? · ?');
    say('AGENT_ASK Which floorplan: List Report or Object Page?');
  } else if (/primary/i.test(req)) {
    say('STAGE route ACT · — · Button');
    say('STAGE execute 7:7 · WARN 0');
    say('STAGE done Save button → Primary');
    say('AGENT_RESULT {"nodeId":"7:7","mode":"ACT","match":null,"eye":null,"WARN":[],"pass":true,"blocks":[]}');
  } else {
    say('Reading the request.');
    say('STAGE route THINK · List Report · Table');
    say('STAGE plan 3 sections · 12 rows');
    const plan = { frame: { w: 1440, h: 900, floorplan: 'List Report' },
      sections: [{ id: 'A', name: 'Header' }, { id: 'B', name: 'Table' }],
      rows: [{ section: 'A', element: 'Title', kind: 'text' }, { section: 'B', element: 'Wizz logo', kind: 'logo', crop: [0, 0, 10, 10] },
        { section: 'B', element: 'Row 1', kind: 'container' }] };
    const gold = path.join(process.cwd(), 'knowledge/gold/plans/flight-search-results.plan.json');
    fs.writeFileSync(path.join(jobDir, 'plan.json'), /GATED/.test(req) ? fs.readFileSync(gold, 'utf8') : JSON.stringify(plan));
    if (/ref\.(png|jpg|webp) \(Figma node/.test(prompt)) {
      fs.mkdirSync(path.join(jobDir, 'logos'), { recursive: true });
      fs.writeFileSync(path.join(jobDir, 'logos', '01-b-wizz-logo.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      fs.writeFileSync(path.join(jobDir, 'logos', 'index.json'), JSON.stringify([{ file: '01-b-wizz-logo.png', element: 'Wizz logo', group: 'B' }]));
    }
    say('STAGE analyse ok · 3 rows · List Report');
    if (/builder: figma-agent/.test(prompt)) {
      say(`AGENT_PLAN_READY {"plan":"${path.relative(process.cwd(), path.join(jobDir, 'plan.json'))}"}`);
    } else {
      say('STAGE execute 5:1 · WARN 0');
      say('AGENT_BUILT {"nodeId":"5:1"}');
    }
  }
  const delay = /SLOW/.test(req) ? 600 : 20;
  setTimeout(() => {
    const text = out.join('\n');
    process.stdout.write(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) + '\n');
    process.stdout.write(JSON.stringify({ type: 'result', result: out[out.length - 1] }) + '\n');
  }, delay);
});
