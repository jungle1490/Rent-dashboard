# T-009: 抓取改到 Mac 排程 + 孤兒分支發布（ADR-0003）

- **Tier:** mid
- **Depends on:** ADR-0003
- **Scope (files):** `tools/publish.sh`、`tools/run-local.sh`、`tools/install-launchd.sh`（新）、`.github/workflows/scrape.yml`（改為只發布）、刪 `keepalive.yml`／`diag.yml`、`README.md`、`CLAUDE.md`、`tasks/`、`docs/memory/*`

## Goal
Mac 每天跑 `run-local.sh` → `data` 分支更新 → Actions 部署 → 任何裝置開 Pages 網址看到最新資料。

## Acceptance criteria
- [ ] `tools/publish.sh` 用現有 `site/data.json` 推出 `data` 分支：`git ls-remote origin data` 有 SHA；分支只有 1 個 commit；main 工作樹不變
- [ ] push 觸發「發布看板」workflow，「取 data 分支」步驟印出 data.json 大小；部署步驟成功（需使用者先設 Pages 來源，否則此步失敗且訊息指向設定）
- [ ] `install-launchd.sh` 安裝後 `launchctl print gui/$(id -u)/com.rent-dashboard.daily` 顯示已載入
- [ ] `run-local.sh` 在 launchd 的短 PATH 下找得到 node 與 gh；抓取失敗時不推送

## Verification
```bash
bash tools/publish.sh && git ls-remote origin data && gh run list --workflow=scrape.yml --limit 1
```
