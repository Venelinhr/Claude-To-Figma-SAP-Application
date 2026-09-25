#!/usr/bin/env node
// Verify a saved kit-cache part against the djb2 hash the extract script returned.
// Usage: node build/verify-kit-part.js <file.json> <hash>
const fs = require('fs');
function djb2(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(16);}
const [file, want] = process.argv.slice(2);
const got = djb2(JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8'))));
console.log(got === want ? `OK ${file} ${got}` : `MISMATCH ${file} got ${got} want ${want}`);
process.exit(got === want ? 0 : 1);
