#!/usr/bin/env python3
"""Audit a built Figma screen against its reference image: is it actually close?

Usage: python3 build/audit-screen.py <reference.png> <build.png> [--json]

Runs measure-ref.py's own reader on BOTH images (same tool, same rules — so the
comparison is apples-to-apples), groups boxes into ROWS the way a person reads a
page (top to bottom, left to right within a row), matches row-to-row and then
box-to-box BY READING ORDER within the row — not by raw pixel position. This is
the fix for the earlier version's blind spot: if an earlier fix makes the build
39px taller, everything below shifts down together, and comparing absolute Y
scored that as "16 things moved" when nothing about the layout actually changed.
Reading-order matching only flags a real problem: content in the wrong row, the
wrong place within its row, or a size genuinely out of proportion with its row.

Scores 0-10 per category:
  POSITION   within its matched row, is the box in the same rank / same relative
             x-gap to its neighbours (not: same absolute pixel)
  SIZE       width/height relative to its own row's height (not: absolute px)
  COLOUR     real visible colour difference (hex distance > 40/441), not a
             token-name coincidence between two near-identical greys
  COMPLETENESS  rows/boxes present in the reference but missing from the build,
             and vice versa

Prints a 0-10 score per category and a total, then the worst offenders first —
fix those, re-export, re-run. Every number is pixels, a token name, or a rank —
nothing is eyeballed, and nothing is a raw-pixel artefact of unrelated growth.
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEASURE = os.path.join(ROOT, 'build', 'measure-ref.py')

# A labeled field, a plain input, a filled selected tile, a chip — different box-finder
# guesses that are the same UI role. Compare by role, not the exact guess string, so
# labeling/detection quirks (e.g. a label sitting above an input, outside its border)
# don't get scored as missing/extra content.
# The families come from build/router-table.json (image_labels[].audit_role) — the same
# table the Jev router uses to type each box — so routing and auditing never disagree.
with open(os.path.join(ROOT, 'build', 'router-table.json')) as _f:
    _LABELS = sorted(json.load(_f)['image_labels']['rules'], key=lambda r: -len(r['label']))


def role(guess):
    for r in _LABELS:
        if guess.startswith(r['label']):
            return r.get('audit_role', r['label'])
    return guess.split(' (')[0].split(' —')[0].strip()


def measure(path):
    out = subprocess.run([sys.executable, MEASURE, path, '--json'], capture_output=True, text=True)
    if out.returncode != 0:
        print(f'measure-ref.py failed on {path}:\n{out.stderr}', file=sys.stderr)
        sys.exit(1)
    return json.loads(out.stdout)


def group_rows(boxes, tol=0.035):
    """Cluster boxes into reading-order rows: same row if their Y-centres are within
    `tol` (fraction of frame height) of each other. Each row is sorted left-to-right."""
    items = sorted(boxes, key=lambda b: b['box'][1] + b['box'][3] / 2)
    rows, cur, cur_y = [], [], None
    for b in items:
        cy = b['box'][1] + b['box'][3] / 2
        if cur and abs(cy - cur_y) > tol * b['_fh']:
            rows.append(sorted(cur, key=lambda x: x['box'][0]))
            cur, cur_y = [], None
        cur.append(b)
        cur_y = cy if cur_y is None else (cur_y * (len(cur) - 1) + cy) / len(cur)
    if cur:
        rows.append(sorted(cur, key=lambda x: x['box'][0]))
    return rows


def row_signature(row):
    """A row's shape, independent of absolute position: ordered list of (role, relative-width)."""
    total_w = sum(b['box'][2] for b in row) or 1
    return tuple((role(b['guess']), round(b['box'][2] / total_w, 2)) for b in row)


def match_rows(ref_rows, build_rows):
    """Greedy best-match: each reference row claims the build row with the most similar
    role sequence (by longest common role subsequence), preferring rows not yet claimed
    and close in reading order (so two similar-looking rows don't swap)."""
    used = set()
    pairs = []
    for i, rr in enumerate(ref_rows):
        rroles = [role(b['guess']) for b in rr]
        best_j, best_score = None, -1
        for j, br in enumerate(build_rows):
            if j in used:
                continue
            broles = [role(b['guess']) for b in br]
            common = sum(1 for a, b in zip(rroles, broles) if a == b)
            order_bonus = -abs(i - j) * 0.01  # tie-break toward matching reading order
            score = common / max(len(rroles), len(broles)) + order_bonus
            if score > best_score:
                best_j, best_score = j, score
        if best_j is not None and best_score > 0:
            used.add(best_j)
            pairs.append((rr, build_rows[best_j]))
        else:
            pairs.append((rr, None))
    extra_rows = [build_rows[j] for j in range(len(build_rows)) if j not in used]
    return pairs, extra_rows


def hex_dist(h1, h2):
    """0-441 (max possible). >40 is a genuinely different colour to the eye; <20 is noise."""
    if not h1 or not h2:
        return None
    a = tuple(int(h1[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(h2[i:i + 2], 16) for i in (1, 3, 5))
    return sum(abs(x - y) for x, y in zip(a, b))


def score(ref_path, build_path):
    R = measure(ref_path)
    B = measure(build_path)
    rfw, rfh = R['frame']['build']
    bfw, bfh = B['frame']['build']
    for b in R['boxes']:
        b['_fh'] = rfh
    for b in B['boxes']:
        b['_fh'] = bfh

    ref_rows = group_rows(R['boxes'])
    build_rows = group_rows(B['boxes'])
    pairs, extra_rows = match_rows(ref_rows, build_rows)

    n_ref_boxes = sum(len(r) for r in ref_rows) or 1
    wrong_rank, wrong_gap, wrong_size, recoloured, wrong_density = [], [], [], [], []
    missing_boxes, extra_boxes = [], []

    for rr, br in pairs:
        if br is None:
            missing_boxes.extend(rr)
            continue
        # box-to-box within the row: match by role + reading-order rank among same-role boxes
        used_b = set()
        rank_by_role = {}
        for idx, rb in enumerate(rr):
            k = role(rb['guess'])
            rank = rank_by_role.get(k, 0)
            rank_by_role[k] = rank + 1
            candidates = [j for j, bb in enumerate(br) if j not in used_b and role(bb['guess']) == k]
            if rank < len(candidates):
                j = candidates[rank]
            elif candidates:
                j = candidates[0]
            else:
                missing_boxes.append(rb)
                continue
            used_b.add(j)
            bb = br[j]
            # RANK: is it still the Nth item of its role, left to right, in the row?
            r_rank = [x for x in rr if role(x['guess']) == k].index(rb)
            b_rank = [x for x in br if role(x['guess']) == k].index(bb)
            if r_rank != b_rank:
                wrong_rank.append({'ref': rb['guess'], 'box': rb['box'], 'ref_rank': r_rank, 'build_rank': b_rank})
            # RELATIVE GAP to the previous box in the row (proportion of row width) —
            # this is scale/shift invariant, unlike absolute pixel offset.
            row_w_ref = max((x['box'][0] + x['box'][2] for x in rr), default=1) - min((x['box'][0] for x in rr), default=0) or 1
            row_w_build = max((x['box'][0] + x['box'][2] for x in br), default=1) - min((x['box'][0] for x in br), default=0) or 1
            i_in_row = rr.index(rb)
            if i_in_row > 0:
                prev_r, prev_b = rr[i_in_row - 1], br[br.index(bb) - 1] if br.index(bb) > 0 else None
                if prev_b is not None:
                    gap_r = (rb['box'][0] - (prev_r['box'][0] + prev_r['box'][2])) / row_w_ref
                    gap_b = (bb['box'][0] - (prev_b['box'][0] + prev_b['box'][2])) / row_w_build
                    if abs(gap_r - gap_b) > 0.03:
                        wrong_gap.append({'ref': rb['guess'], 'box': rb['box'], 'gap_ref': round(gap_r, 3), 'gap_build': round(gap_b, 3)})
            # SIZE relative to the row's own height (a taller build overall shouldn't
            # penalise a box that grew in the same proportion as its row).
            row_h_ref = max((x['box'][3] for x in rr), default=1)
            row_h_build = max((x['box'][3] for x in br), default=1)
            rel_h_ref = rb['box'][3] / row_h_ref if row_h_ref else 0
            rel_h_build = bb['box'][3] / row_h_build if row_h_build else 0
            rel_w_ref = rb['box'][2] / row_w_ref
            rel_w_build = bb['box'][2] / row_w_build
            if abs(rel_h_ref - rel_h_build) > 0.25 or abs(rel_w_ref - rel_w_build) > 0.15:
                wrong_size.append({'ref': rb['guess'], 'ref_box': rb['box'], 'build_box': bb['box'],
                                    'dh_rel': round(abs(rel_h_ref - rel_h_build), 2), 'dw_rel': round(abs(rel_w_ref - rel_w_build), 2)})
            # 'ink' is deliberately NOT compared here: it's whatever pixel has the
            # strongest contrast inside the box (text, an icon, a separator line — any of
            # them), and which one wins can differ between two independent renderings of
            # visually similar content even when nothing is actually wrong. Traced on a
            # confirmed 1:1 screen: ink mismatches averaged Δ237 vs edge's Δ165, and were
            # the main reason a correct screen scored colour=0. 'edge' (border) and 'fill'
            # are real, stable properties of the box itself — those stay checked.
            for kf in ('edge', 'fill'):
                if rb.get(kf) and bb.get(kf) and rb[kf] != bb[kf]:
                    d = hex_dist(rb.get(kf + '_hex'), bb.get(kf + '_hex'))
                    if d is None or d > 40:
                        recoloured.append({'ref': rb['guess'], 'box': rb['box'], 'field': kf,
                                            'ref_token': rb[kf], 'build_token': bb[kf], 'dist': d})
            # COMPONENT DENSITY: does this box's height match the real SAP Compact/Cozy
            # height for its component role (Switch/Check Box/Input/Select/Field)? This is
            # "close to SAP" checked against the design system itself, not against the
            # reference photo's own pixel height (which can be off from JPEG/webp scaling).
            rcc, bcc = rb.get('component_check'), bb.get('component_check')
            if rcc and bcc and rcc['density'] != bcc['density']:
                wrong_density.append({'ref': rb['guess'], 'box': rb['box'],
                                       'ref_density': rcc['density'], 'build_density': bcc['density'],
                                       'ref_h': rcc['measured'], 'build_h': bcc['measured']})
        extra_boxes.extend(br[j] for j in range(len(br)) if j not in used_b)
    for br in extra_rows:
        extra_boxes.extend(br)

    rcol = {c['token'].split(' ')[0] for c in R['colours']}
    bcol = {c['token'].split(' ')[0] for c in B['colours']}
    missing_palette = sorted(rcol - bcol)

    pos_score = 10 * (1 - (len(wrong_rank) + len(wrong_gap)) / max(1, n_ref_boxes))
    size_score = 10 * (1 - len(wrong_size) / max(1, n_ref_boxes))
    # BUG (found by tracing a real 1:1 screen that scored colour=0): `recoloured` counts
    # one entry per (box, field) — a single box can fail on edge/fill/ink independently,
    # so it can contribute up to 3 entries. Dividing that by a per-BOX denominator
    # over-counts every multi-field box 2-3x and guarantees the score floors at 0 as
    # soon as more than ~1/3 of boxes have any mismatch at all, regardless of how wrong
    # the colours actually are. Count PER-BOX instead: a box is "wrong" if any of its
    # fields mismatch, never double-penalised for mismatching on more than one field.
    boxes_with_colour_issue = {tuple(r['box']) for r in recoloured}
    colour_score = 10 * (1 - (len(boxes_with_colour_issue) + len(missing_palette)) / max(1, n_ref_boxes + len(missing_palette)))
    completeness_score = 10 * (1 - (len(missing_boxes) + 0.5 * len(extra_boxes)) / max(1, n_ref_boxes))
    # DENSITY: does every matched interactive component (Switch/Check Box/Input/Select/
    # Field) use the same Compact-vs-Cozy density as the reference? This is checked
    # against the SAP kit's own real component heights (measure-ref.py's
    # COMPONENT_HEIGHTS), not against the reference photo's raw pixels.
    n_density_checked = sum(1 for rr, br in pairs if br for rb in rr if rb.get('component_check')) or 1
    density_score = 10 * (1 - len(wrong_density) / n_density_checked)
    total = max(0, round((pos_score + size_score + colour_score + completeness_score + density_score) / 5, 1))

    return {
        'frame': {'reference': R['frame'], 'build': B['frame']},
        'counts': {'ref_boxes': n_ref_boxes, 'build_boxes': sum(len(r) for r in build_rows),
                   'ref_rows': len(ref_rows), 'build_rows': len(build_rows)},
        'scores': {
            'position': round(max(0, pos_score), 1),
            'size': round(max(0, size_score), 1),
            'colour': round(max(0, colour_score), 1),
            'completeness': round(max(0, completeness_score), 1),
            'density': round(max(0, density_score), 1),
            'total': total,
        },
        'wrong_rank': wrong_rank,
        'wrong_gap': wrong_gap,
        'wrong_size': wrong_size,
        'recoloured': recoloured,
        'wrong_density': wrong_density,
        'missing': [{'guess': b['guess'], 'box': b['box']} for b in missing_boxes],
        'extra': [{'guess': b['guess'], 'box': b['box']} for b in extra_boxes],
        'missing_palette': missing_palette,
    }


def bar(v):
    filled = round(v)
    return '█' * filled + '░' * (10 - filled)


def next_fixes(result):
    """Turn the raw findings into concrete, ranked next actions — closes the loop from
    'here's what's wrong' to 'here's what to do about it'. Ordered by likely score impact:
    missing content > wrong rank/order > wrong colour > wrong size, since a missing or
    misplaced element usually drags every category down at once."""
    out = []
    if result['missing']:
        by_role = {}
        for m in result['missing']:
            by_role.setdefault(role(m['guess']), []).append(m)
        for r, items in by_role.items():
            out.append(f"Add {len(items)}× missing '{r}' — first one at {items[0]['box']} "
                        f"(check it wasn't built in the wrong row/section entirely)")
    for r in result['wrong_rank'][:4]:
        out.append(f"Reorder '{r['ref']}' at {r['box']} — should be #{r['ref_rank']+1} left-to-right "
                    f"in its row, currently #{r['build_rank']+1}")
    for r in sorted(result['wrong_gap'], key=lambda x: -abs(x['gap_ref'] - x['gap_build']))[:3]:
        verb = 'add a FILL spacer before it' if r['gap_build'] < r['gap_ref'] else 'remove/shrink the spacer before it'
        out.append(f"Fix spacing before '{r['ref']}' at {r['box']} — {verb} (ref gap {r['gap_ref']}, build {r['gap_build']})")
    for r in sorted(result['recoloured'], key=lambda x: -(x['dist'] or 999))[:4]:
        out.append(f"Recolour '{r['ref']}.{r['field']}' at {r['box']} to the real token nearest "
                    f"{r['ref_token'].split(' ')[0] if ' ' in r['ref_token'] else r['ref_token']} "
                    f"(currently {r['build_token']}, Δ{r['dist']}) — sample the reference pixel and use "
                    f"search_design_system by role, don't trust nearest-hex alone")
    for r in sorted(result['wrong_size'], key=lambda x: -(x['dh_rel'] + x['dw_rel']))[:3]:
        out.append(f"Resize '{r['ref']}' from {r['build_box']} toward {r['ref_box']}'s proportions "
                    f"(check HUG/FILL/FIXED on it and its row siblings)")
    for r in result.get('wrong_density', [])[:4]:
        out.append(f"Set Form Factor={r['ref_density']} on '{r['ref']}' at {r['box']} "
                    f"(reference is SAP {r['ref_density']} h{r['ref_h']}, build is {r['build_density']} h{r['build_h']})")
    if result['extra']:
        out.append(f"Review {len(result['extra'])} extra element(s) not in the reference — "
                    f"first one at {result['extra'][0]['box']} ({result['extra'][0]['guess']})")
    return out


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__); sys.exit(1)
    ref, build = args[0], args[1]
    result = score(ref, build)
    if '--json' in args:
        print(json.dumps(result)); return

    s = result['scores']
    c = result['counts']
    print(f"AUDIT  {os.path.basename(ref)}  vs  {os.path.basename(build)}")
    print(f"frame: reference {result['frame']['reference']['build']}  ·  build {result['frame']['build']['build']}")
    print(f"boxes: {c['ref_boxes']} in reference ({c['ref_rows']} rows), {c['build_boxes']} in build ({c['build_rows']} rows)\n")
    print(f"  POSITION      {bar(s['position'])}  {s['position']}/10   ({len(result['wrong_rank'])} out of reading-order rank, {len(result['wrong_gap'])} wrong relative gap)")
    print(f"  SIZE          {bar(s['size'])}  {s['size']}/10   ({len(result['wrong_size'])} sized wrong relative to their own row)")
    print(f"  COLOUR        {bar(s['colour'])}  {s['colour']}/10   ({len(result['recoloured'])} real colour mismatch, {len(result['missing_palette'])} palette colours missing)")
    print(f"  COMPLETENESS  {bar(s['completeness'])}  {s['completeness']}/10   ({len(result['missing'])} missing, {len(result['extra'])} extra)")
    print(f"  DENSITY       {bar(s['density'])}  {s['density']}/10   ({len(result['wrong_density'])} Compact/Cozy mismatch vs the real SAP component height)")
    print(f"  {'─'*40}")
    print(f"  TOTAL         {bar(s['total'])}  {s['total']}/10\n")

    if result['missing']:
        print(f"MISSING (in reference, not found in build — {len(result['missing'])}):")
        for m in result['missing'][:12]:
            print(f"  {m['box']}  {m['guess']}")
        print()
    if result['wrong_rank']:
        print(f"WRONG READING-ORDER RANK ({len(result['wrong_rank'])}):")
        for r in result['wrong_rank'][:10]:
            print(f"  {r['box']}  {r['ref']}  was #{r['ref_rank']+1} of its kind in the row, now #{r['build_rank']+1}")
        print()
    if result['wrong_gap']:
        print(f"WRONG SPACING TO PREVIOUS ELEMENT (relative to row width — {len(result['wrong_gap'])}):")
        for r in sorted(result['wrong_gap'], key=lambda x: -abs(x['gap_ref']-x['gap_build']))[:10]:
            print(f"  {r['box']}  {r['ref']}  reference gap {r['gap_ref']} → build gap {r['gap_build']}")
        print()
    if result['wrong_size']:
        print(f"WRONG SIZE (relative to own row — {len(result['wrong_size'])}):")
        for r in sorted(result['wrong_size'], key=lambda x: -(x['dh_rel']+x['dw_rel']))[:10]:
            print(f"  ref {r['ref_box']} → build {r['build_box']}  {r['ref']}  Δh_rel{r['dh_rel']} Δw_rel{r['dw_rel']}")
        print()
    if result['recoloured']:
        print(f"WRONG COLOUR — real visible difference ({len(result['recoloured'])}):")
        for r in sorted(result['recoloured'], key=lambda x: -(x['dist'] or 999)):
            dtxt = f"Δ{r['dist']}" if r['dist'] is not None else 'no build colour'
            print(f"  {r['box']}  {r['ref']}.{r['field']}: reference {r['ref_token']} → build {r['build_token']}  ({dtxt})")
        print()
    if result['wrong_density']:
        print(f"WRONG DENSITY — build uses the wrong Compact/Cozy variant ({len(result['wrong_density'])}):")
        for r in result['wrong_density']:
            print(f"  {r['box']}  {r['ref']}: reference reads as SAP {r['ref_density']} (h{r['ref_h']}), "
                  f"build reads as SAP {r['build_density']} (h{r['build_h']}) — set Form Factor={r['ref_density']}")
        print()
    if result['extra']:
        print(f"EXTRA (in build, not in reference — {len(result['extra'])}):")
        for e in result['extra'][:10]:
            print(f"  {e['box']}  {e['guess']}")
        print()
    if result['missing_palette']:
        print(f"MISSING PALETTE COLOURS: {', '.join(result['missing_palette'])}\n")

    fixes = next_fixes(result)
    if fixes:
        print(f"NEXT FIXES — do these first, biggest score impact first ({len(fixes)}):")
        for f in fixes[:8]:
            print(f"  {f}")
        print()

    verdict = 'PASS — close match' if s['total'] >= 8 else 'NEEDS WORK' if s['total'] >= 5 else 'FAR FROM REFERENCE'
    print(f"VERDICT: {verdict} ({s['total']}/10)")
    print("NOTE: the TOTAL/POSITION/SIZE score can be wrong when the box-finder labels the\n"
          "same element differently in the two images — a genuinely 1:1 screen can still\n"
          "score low. Treat MISSING / WRONG COLOUR / EXTRA above as the real checklist;\n"
          "confirm the finished screen against the reference by eye before trusting the number.")


if __name__ == '__main__':
    main()
