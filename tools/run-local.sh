#!/usr/bin/env bash
# 本機每日排程的進入點：抓 591 → 推 data 分支 → GitHub 發布。日誌在 logs/。
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs; LOG="logs/run-$(date +%F).log"
{
  echo "=== $(date '+%F %T') 開始"
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"   # launchd 的 PATH 很短，node／gh 在這
  if node scrape.mjs; then
    bash tools/publish.sh
  else
    echo "抓取失敗，不推送（保留上一次的資料）"
  fi
  echo "=== $(date '+%F %T') 結束"
} >> "$LOG" 2>&1
tail -3 "$LOG"
