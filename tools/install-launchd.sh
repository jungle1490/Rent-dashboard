#!/usr/bin/env bash
# 安裝 macOS launchd 排程：每天 08:00 跑 tools/run-local.sh（錯過會在喚醒後補跑一次）。
# 重跑本腳本會更新設定。移除：launchctl bootout gui/$(id -u)/com.rent-dashboard.daily
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.rent-dashboard.daily.plist"
HOUR="${1:-8}"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.rent-dashboard.daily</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$ROOT/tools/run-local.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$HOUR</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$ROOT/logs/launchd.out</string>
  <key>StandardErrorPath</key><string>$ROOT/logs/launchd.err</string>
</dict></plist>
PL
launchctl bootout "gui/$(id -u)/com.rent-dashboard.daily" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "已安裝：每天 ${HOUR}:00 執行 $ROOT/tools/run-local.sh"
echo "現在手動跑一次：bash $ROOT/tools/run-local.sh"
