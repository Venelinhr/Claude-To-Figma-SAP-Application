#!/bin/bash
# layout-ab.sh — regression test for the layout engine (2026-10-06). Run it after ANY change to build/spec2tree.js.
#   bash build/layout-ab.sh [git-ref]      compares the working copy with <git-ref> (default HEAD) on the saved screens below
# Per screen: LAYOUT score (build/layout-audit.js) old → new · POSITION = leaves within 6 px of the MEASURED reference
# (spec2tree writes <tree>.measured.json) old → new · OVERFLOW at 85 % and 125 % width (responsiveness, must stay 0).
# A change is good only when LAYOUT goes up and POSITION does not go down on average.
cd "$(dirname "$0")/.." || exit 1
REF=${1:-HEAD}; O=bridge-out/.layout-ab; mkdir -p $O
git show $REF:build/spec2tree.js > build/.s2t-ref.js || exit 1
for d in bridge-out/job-flights-us bridge-out/job-flights-de bridge-out/job-events-design bridge-out/sap-flight-2 bridge-out/a5193e464107a75b bridge-out/39434f98423bead2 bridge-out/abeb04085187aa43; do
  [ -f $d/see-ref/spec.json ] || continue; j=$(basename $d)
  extra=""; [ -f $d/names.json ] && [ -f $d/marks.json ] && extra="--marks $d/marks.json --names $d/names.json"
  node build/.s2t-ref.js $d/see-ref/spec.json $O/$j.old.json $extra >/dev/null 2>&1
  node build/spec2tree.js $d/see-ref/spec.json $O/$j.new.json $extra >/dev/null 2>$O/$j.err || { echo "$j FAILED: $(tail -1 $O/$j.err)"; continue; }
  lo=$(node build/layout-audit.js $O/$j.old.json | sed -E 's/LAYOUT ([0-9]+).*/\1/'); ln=$(node build/layout-audit.js $O/$j.new.json | sed -E 's/LAYOUT ([0-9]+).*/\1/')
  pos() { node build/layout-sim.js $1 --expect $O/$j.new.measured.json --tol 6 2>&1 | grep POSITION | sed -E 's/.*= ([0-9]+) %.*/\1/'; }
  ov=""; for sc in 0.85 1.25; do ov="$ov$(node build/layout-sim.js $O/$j.new.json --scale $sc 2>&1 | grep OVERFLOW | sed -E 's/OVERFLOW +([0-9]+) leaves.*/\1/') "; done
  echo "$j · LAYOUT $lo → $ln · POSITION $(pos $O/$j.old.json)% → $(pos $O/$j.new.json)% · OVERFLOW 85%/125%: $ov"
done
rm -f build/.s2t-ref.js
