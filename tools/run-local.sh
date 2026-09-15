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
# 同一時間只跑一個（每日排程與 5 分鐘輪詢可能撞在一起）；超過 2 小時的鎖視為殘留
LOCK=logs/.run.lock
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -n "$(find "$LOCK" -mmin +120 2>/dev/null)" ]; then rmdir "$LOCK"; mkdir "$LOCK"; else echo "$(date '+%F %T') 另一個抓取還在跑，略過" >> "$LOG"; exit 0; fi
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
{
  echo "=== $(date '+%F %T') 開始"
  # launchd 的 PATH 很短：node 可能在 nvm 底下、gh 在 Homebrew，這裡自己找
  NVM_NODE=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
  export PATH="${NVM_NODE:+$NVM_NODE:}/opt/homebrew/bin:/usr/local/bin:$PATH"
  # caffeinate -i：抓取這幾分鐘不讓 Mac 進入閒置睡眠，否則抓到一半中斷，沒抓到的物件會被誤標下架
  if caffeinate -i node scrape.mjs; then
    bash tools/publish.sh
  else
    echo "抓取失敗，不推送（保留上一次的資料）"
  fi
  echo "=== $(date '+%F %T') 結束"
} >> "$LOG" 2>&1
tail -3 "$LOG"
