# T-003: 推上 GitHub 並開始自動更新

- **Tier:** low
- **Depends on:** T-001, T-002
- **Scope (files):** git 遠端；`tasks/BACKLOG.md`、`docs/memory/*`。不改程式。

## Goal
`https://github.com/jungle1490/Rent-dashboard` 的 main 包含本地全部 commit；之後每 30 分鐘 Actions 自動抓取並發布到 Pages。

## Non-goals
Pages 來源設定與第一次手動觸發需要 repo 擁有者在 GitHub 網頁操作，agent 做不到（沒有 gh CLI、也不該碰帳號設定）。

## Acceptance criteria
- [ ] 遠端只有 `Initial commit`（README）；以 `--allow-unrelated-histories -X ours` 合併，README 以本地版本為準
- [ ] `git push -u origin main` 成功；`git ls-remote origin main` 的 SHA 等於本地 `HEAD`
- [ ] 由使用者完成：Settings → Pages → Source = GitHub Actions；Actions → 抓取 591 租屋資料 → Run workflow；網址 `https://jungle1490.github.io/Rent-dashboard/` 可開

## Verification
```bash
git log --oneline -1 && git ls-remote origin main
```
