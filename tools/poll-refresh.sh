#!/usr/bin/env bash
# 每 5 分鐘由 launchd 執行：refresh 分支有新 commit 就跑一次抓取＋發布。極輕：只有一次 git ls-remote。
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
SEEN=logs/.refresh-seen
cur=$(git ls-remote --quiet origin refs/heads/refresh 2>/dev/null | cut -f1)
[ -z "$cur" ] && exit 0                       # 還沒有人按過
[ "$cur" = "$(cat "$SEEN" 2>/dev/null)" ] && exit 0
echo "$cur" > "$SEEN"
echo "=== $(date '+%F %T') 收到抓取請求 $cur" >> "logs/run-$(date +%F).log"
exec bash tools/run-local.sh
