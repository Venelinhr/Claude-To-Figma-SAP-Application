#!/bin/bash
# guard-build-v3.sh — PreToolUse(use_figma). The ONE build check in v3. Blocks (exit 2) only when a
# call that CREATES nodes skips the SAP kit runtime or paints raw colours / raw fonts.
# Read-only calls (no create*/clone/appendChild) always pass. No markers, no approvals.
CODE=$(jq -r '.tool_input.code // empty')
[ -z "$CODE" ] && exit 0
echo "$CODE" | grep -qE 'figma\.create(Frame|AutoLayout|Text|Rectangle)|\.clone\(|createInstance\(' || exit 0
ERR=""
echo "$CODE" | grep -q 'SAP KIT RUNTIME' || ERR+="- Paste build/templates/sap-kit.prelude.js at the top (plus 'const KIT = …' from: node build/kit.js pack <names>).\n"
# raw colour literals outside the runtime (the runtime's own placeholder paint is allowed)
BODY=$(echo "$CODE" | sed '/SAP KIT RUNTIME v3/,/end SAP KIT RUNTIME/d')
echo "$BODY" | grep -qE "color: *\{ *r:|type: *'SOLID'|\"SOLID\"" && ERR+="- Raw colour paint found. Use fill(node,'sapToken') / stroke(node,'sapToken') — find the token with: node build/kit.js hex '#rrggbb'.\n"
echo "$BODY" | grep -qE "fontName *=|loadFontAsync\(\{ *family" && ERR+="- Raw font found. Use T(text, '<SAP text style>', '<colour token>') — list styles with: node build/kit.js t.\n"
echo "$BODY" | grep -qE "detachInstance\(" && ERR+="- detachInstance() is not allowed: set the component property instead (node build/kit.js c <Component>).\n"
[ -z "$ERR" ] && exit 0
printf "SAP v3 build check — fix and resend:\n$ERR" >&2
exit 2
