# Playbook — CI／部署

| 症狀 | 根因 | 修法 | 證據 |
|---|---|---|---|
| 任何含 `uses:` 的 workflow 都 `startup_failure`，純 `run:` 的能跑；API 與 log 都不給原因 | repo 的 Actions 權限被設成 `allowed_actions: local_only` | Settings → Actions → General → 改「Allow all actions」；或 `gh api -X PUT repos/O/R/actions/permissions -f enabled=true -f allowed_actions=all` | 2026-09-08 三輪切分 14 個變體；`gh api …/actions/permissions` |
| Actions 抓 591 回 403 | CloudFront 對非台灣／機房 IP 封鎖，改 header 無效 | 抓取搬到台灣的機器（ADR-0003） | diag workflow：`server: CloudFront`「Request blocked」 |
| `gh run view --log-failed` 空白、`check-runs` 為空 | startup_failure 沒有 job，就沒有 log | 用「純 run 最小 workflow」與「加一個 uses」對照，一輪就能分出是設定還是 YAML | 同上 |
| 推了 `data` 分支但沒有發布 run | 孤兒分支沒有 `.github/workflows`，GitHub 只為含 workflow 檔的 ref 觸發 | `publish.sh` 推完 `gh workflow run scrape.yml --ref main` | 2026-09-08 首次 run-local：data 更新但無 data 分支的 run |
