#!/usr/bin/env node
// changelog.js — a change made DIRECTLY in Figma (use_figma, a hand fix) is logged like a build: one line in the job's trace.md (the log the
// plugin's copy icon opens), one line in changes.md, and a note to the bridge → the plugin chat shows it and the history gets a row (user rule 2026-10-05).
//   node build/changelog.js --job bridge-out/<job> --url <figma node link> "<what changed, one or two sentences>" [--seconds N]
// Silent on a bridge failure (the files are still written). Exit 64 = usage.
const fs = require('fs'), path = require('path');
const note = require('./note.js');
const a = process.argv.slice(2), opt = n => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
const job = opt('--job'), url = opt('--url') || '', secs = Number(opt('--seconds') || 0);
const text = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && a[i - 1].startsWith('--'))).join(' ').replace(/\s+/g, ' ').trim();
if (!job || !text || !/^bridge-out\/[\w.-]+$/.test(job)) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(64); }
const dir = path.join(__dirname, '..', job); fs.mkdirSync(dir, { recursive: true });
const at = new Date().toISOString().replace('T', ' ').slice(0, 16);
fs.appendFileSync(path.join(dir, 'changes.md'), `- ${at} · ${text}${url ? ' · ' + url : ''}\n`);
fs.appendFileSync(path.join(dir, 'trace.md'), `\n${at}  CHANGE  ${text}${url ? '  ' + url : ''}\n`);   // the plugin's log copy reads trace.md for a script job
note.job(job, Date.now() - secs * 1000);
note('RUN change · ' + job + ' · ' + at);
note('EXECUTE ' + text);
note.endChange(text, url);
console.log('LOGGED  ' + job + ' · ' + text);
