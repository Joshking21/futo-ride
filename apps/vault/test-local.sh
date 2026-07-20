#!/usr/bin/env bash
#
# Run the vault test suite against a throwaway LOCAL validator.
#
# Why this script instead of a plain `anchor test`:
#   • Anchor 1.x defaults its local validator to `surfpool` (not installed here),
#     so we start the classic `solana-test-validator` ourselves and pass
#     `--skip-local-validator` so Anchor deploys to it instead.
#   • nvm's Linux node only auto-loads in interactive shells, so we source it.
#
# Usage (from apps/vault, in the Ubuntu/WSL terminal):
#   bash test-local.sh
#
set -euo pipefail

# Load Linux node via nvm if it isn't already on PATH.
if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi

cd "$(dirname "$0")"

[ -d node_modules ] || npm install --no-audit --no-fund

echo "› starting solana-test-validator…"
pkill -f solana-test-validator 2>/dev/null || true
rm -rf /tmp/vault-ledger
solana-test-validator --reset --quiet --ledger /tmp/vault-ledger >/tmp/validator.log 2>&1 &
VPID=$!
trap 'kill "$VPID" 2>/dev/null || true; pkill -f solana-test-validator 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  solana -u http://127.0.0.1:8899 cluster-version >/dev/null 2>&1 && break
  sleep 1
done

echo "› running anchor test…"
anchor test --skip-local-validator
