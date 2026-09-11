#!/usr/bin/env bash
# 把 site/data.json 與 site/fb.json 推到孤兒分支 data（單一 commit、force push），歷史不成長。
# 用 git 底層指令，不碰工作樹、不需要 checkout。
set -euo pipefail
cd "$(dirname "$0")/.."
[ -s site/data.json ] || { echo "site/data.json 不存在或是空的，不推送"; exit 1; }
b1=$(git hash-object -w site/data.json)
entries=$(printf '100644 blob %s\tdata.json\n' "$b1")
if [ -s site/fb.json ]; then b2=$(git hash-object -w site/fb.json); entries="$entries"$'\n'"$(printf '100644 blob %s\tfb.json' "$b2")"; fi
tree=$(printf '%s\n' "$entries" | git mktree)
commit=$(echo "data $(date -u +%FT%TZ)" | git -c user.name=rent-bot -c user.email=rent-bot@local commit-tree "$tree")
# 大檔案走 HTTPS 推送會撞到 git 預設緩衝區（HTTP 400 / RPC failed），把緩衝區調大
git -c http.postBuffer=524288000 push --force --quiet origin "$commit:refs/heads/data"
echo "已推送 data 分支：$commit（data.json $(du -h site/data.json | cut -f1)$( [ -s site/fb.json ] && echo ", fb.json $(du -h site/fb.json | cut -f1)" ))"
# 孤兒分支裡沒有 workflow 檔，GitHub 不會因為推 data 而跑發布 → 這裡直接觸發 main 上的發布 workflow
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh workflow run scrape.yml --ref main >/dev/null && echo "已觸發發布 workflow（約 1 分鐘後上線）"
else
  echo "警告：gh 未登入，無法觸發發布；請到 GitHub Actions 手動 Run workflow，或 gh auth login"
fi
