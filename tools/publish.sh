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
git push --force --quiet origin "$commit:refs/heads/data"
echo "已推送 data 分支：$commit（data.json $(du -h site/data.json | cut -f1)$( [ -s site/fb.json ] && echo ", fb.json $(du -h site/fb.json | cut -f1)" ))"
