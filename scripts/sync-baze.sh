#!/usr/bin/env bash
# Sync historical stats JSON from paraindicator.top into ./baze/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${BAZE_SOURCE:-https://paraindicator.top/baze}"
DEST="$ROOT/baze"
mkdir -p "$DEST/history"

ROOT_FILES=(
  exchangers_history blocks_history block_times_history transactions_history
  old_wallets_history par_history mainWallets top100 top100All
)
HISTORY_FILES=(
  lessThan1 from1to100 from100to1K lessThan1K from1Kto10K from10Kto50K
  from50Kto100K from10Kto100K from100Kto500K from500Kto1M from100Kto1M
  from1Mto10M from10Mto100M from100Mto1B moreThan1B
)

echo "Source: $BASE"
for f in "${ROOT_FILES[@]}"; do
  echo "  $f"
  curl -fsSL --max-time 300 "$BASE/$f" -o "$DEST/$f"
done
for f in "${HISTORY_FILES[@]}"; do
  echo "  history/$f"
  curl -fsSL --max-time 120 "$BASE/history/$f" -o "$DEST/history/$f"
done
echo "Done. $(du -sh "$DEST" | cut -f1) in baze/"
