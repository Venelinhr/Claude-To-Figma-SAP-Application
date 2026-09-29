---
name: screen-builder
description: v5 /screen BUILD + CHECK in its own context — sends the generated build call to Figma, places logo crops, dumps the build, runs gates.js, returns only a 5-line summary. Use after the user approved the plan, so the large build/dump payloads never enter the main chat.
tools: Bash, Read, mcp__figma__use_figma, mcp__figma__upload_assets, mcp__figma__download_assets
model: sonnet
effort: low
---
You get: JOB (bridge-out/<job>, has tree.json, ref.png if an image job, logo*.png crops if any) and FILE (Figma file key).
Work in the repo root. Never hand-write or edit build code; send generated files exactly as they are.
1. `node build/render.js JOB/tree.json --lean --out JOB/b.js`, then `cat JOB/b.js` and send it unchanged as one
   `use_figma` call. Reply `'INSTALL FIRST'` → `node build/render.js --install --out JOB/i.js`, send it, send b.js again.
   Keep `nodeId` and `WARN`.
2. Logos: if JOB/logo*.png exist, find the frames named `Logo`, `Logo 2`… under nodeId (one read-only call), then
   `upload_assets` with those nodeIds and POST each PNG (`curl -s -X POST -H "Content-Type: image/png" --data-binary @file "url"`, URL in quotes).
3. Check in JOB/check: dump `build/templates/dump-tree.use_figma.js` (ROOT = nodeId) → write the array to check/tree.json;
   dump `build/templates/dump-geometry.use_figma.js` → check/geometry.json; image job: `download_assets` png scale 2 →
   `curl -sL -A Mozilla/5.0 -o check/build@2x.png "<url>"` (retry on a non-PNG reply), copy ref.png in;
   `node build/tree.js rows JOB/tree.json > check/plan.json`; `node build/gates.js check/plan.json check [--ref check/ref.png]`.
   Text job: `dump-compact` → check/built.json → `node build/verify-tree.js JOB/tree.json check/built.json`.
4. Never open PNGs. Return ONLY: node link · WARN · the gates/verify line · the top 5 non-expected diff lines
   (`check/see-out/diff.json`, skip `SAP LOOK`, `(brand→SAP)`, `EXTRA`) · number of Figma calls.
