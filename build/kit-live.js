// kit-live.js — the kit every v4 tool reads: knowledge/live/kit.json (checksummed export of the
// SAP Web UI Kit) + real variables the export lacks, read live from approved gold builds
// (knowledge/live/vars-extra.json). Require this instead of kit.json so the plan checker, the
// BUILD KIT and the audit all accept the same tokens.
const kit = require('../knowledge/live/kit.json');
const extra = require('../knowledge/live/vars-extra.json').vars;
for (const [n, v] of Object.entries(extra))
  if (!Object.keys(kit.vars).some(k => k.split('/').pop() === n)) kit.vars['extra/' + n] = `${v.key}|C|${v.hex}`;
module.exports = kit;
