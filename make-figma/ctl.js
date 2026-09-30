#!/usr/bin/env node
// make-figma/ctl.js — start / stop / status of the standalone Make → Figma bridge (port 41779). Does not touch the old SAP Bridge (41778).
//   node make-figma/ctl.js start|stop|restart|status
'use strict';
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const D = __dirname, PID = path.join(D, '.bridge.pid'), LOG = path.join(D, 'bridge.log'), PORT = Number(process.env.MAKE_FIGMA_PORT) || 41779;
const health = async () => { try { const r = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(1500) }); const j = await r.json(); return j && j.app === 'make-figma-bridge' ? j : null; } catch (_) { return null; } };
const pid = () => { try { return Number(fs.readFileSync(PID, 'utf8')); } catch (_) { return 0; } };
async function stop() { const p = pid(); if (p) { try { process.kill(p); } catch (_) {} try { fs.unlinkSync(PID); } catch (_) {} console.log('Bridge stopped.'); } else console.log('Bridge was not started by this tool.'); await new Promise(r => setTimeout(r, 500)); }
async function start() {
  if (await health()) return console.log('Bridge already running on port ' + PORT + '.');
  const out = fs.openSync(LOG, 'a'), c = spawn(process.execPath, [path.join(D, 'bridge', 'server.js')], { detached: true, stdio: ['ignore', out, out] });
  fs.writeFileSync(PID, String(c.pid)); c.unref();
  for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 250)); if (await health()) return console.log('Bridge started on http://localhost:' + PORT); }
  console.error('Bridge did not start. See ' + LOG); process.exit(1);
}
(async () => {
  const cmd = process.argv[2] || 'status';
  if (cmd === 'start') await start();
  else if (cmd === 'stop') await stop();
  else if (cmd === 'restart') { await stop(); await start(); }
  else { const h = await health(); console.log(h ? `running on ${PORT} · plugin paired: ${h.paired} · extension connected: ${h.extension}` : 'not running'); }
})();
