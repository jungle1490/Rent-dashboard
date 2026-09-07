#!/usr/bin/env bash
# 本機每日排程的進入點：抓 591 → 推 data 分支 → GitHub 發布。日誌在 logs/。
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs; LOG="logs/run-$(date +%F).log"
if [ "${1:-}" = "--check" ]; then
  NVM_NODE=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
  export PATH="${NVM_NODE:+$NVM_NODE:}/opt/homebrew/bin:/usr/local/bin:$PATH"
  echo "node=$(command -v node || echo 找不到) ($(node -v 2>/dev/null))  gh=$(command -v gh || echo 找不到)"; exit 0
fi
{
  echo "=== $(date '+%F %T') 開始"
  # launchd 的 PATH 很短：node 可能在 nvm 底下、gh 在 Homebrew，這裡自己找
  NVM_NODE=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
  export PATH="${NVM_NODE:+$NVM_NODE:}/opt/homebrew/bin:/usr/local/bin:$PATH"
  if node scrape.mjs; then
    bash tools/publish.sh
  else
    echo "抓取失敗，不推送（保留上一次的資料）"
  fi
  echo "=== $(date '+%F %T') 結束"
} >> "$LOG" 2>&1
tail -3 "$LOG"
