#!/usr/bin/env bash
# =============================================================================
# Claude to Figma SAP Application — setup check
# Checks the tools you need. It does not change any setting on your computer.
# =============================================================================
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}[SAP Designer]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
log "Checking the tools you need..."

command -v node >/dev/null 2>&1 || fail "Node.js not found. Install v20 or newer from https://nodejs.org"
NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VER" -ge 20 ] || fail "Node.js 20 or newer is required. Found: $(node --version)"
ok "Node.js $(node --version)"

command -v claude >/dev/null 2>&1 || fail "Claude Code CLI not found. Install it from https://claude.ai/code"
ok "Claude Code CLI"

if command -v python3 >/dev/null 2>&1; then ok "Python 3 $(python3 --version | cut -d' ' -f2)"; else warn "Python 3 not found — it is only needed for reference images."; fi
if command -v jq >/dev/null 2>&1; then ok "jq"; else warn "jq not found — the safety hooks use it. Install: brew install jq (Mac) or apt install jq (Linux)"; fi

echo ""
log "Next steps:"
echo "  1. In Figma: Assets → Libraries → switch the SAP Web UI Kit on."
echo "  2. In Figma desktop: Plugins → Development → Import plugin from manifest…"
echo "     and choose: $DIR/plugin/sap-bridge/manifest.json"
echo "  3. Start the local bridge (in this folder):  node build/mailbox.js restart"
echo "  4. Open Plugins → Development → SAP Bridge in your Figma file."
echo ""
ok "Done. Details: README.md"
