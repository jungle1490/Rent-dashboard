# ADR-0003: 抓取改在使用者的 Mac 排程執行，GitHub 只發布（取代 ADR-0001 的雲端抓取）

- **Status:** accepted（部分取代 ADR-0001：抓取位置；其餘不變）
- **Date:** 2026-09-08
- **Decided by:** Claude，依證據與使用者同意「電腦一天跑一次來更新是可以」

## Context

VERIFIED：GitHub Actions（Azure centralus）打 `rent.591.com.tw` 一律 HTTP 403，回應來自 CloudFront 邊緣
（`server: CloudFront`、`x-cache: Error from cloudfront`、「Request blocked」），帶完整瀏覽器 header 亦同 → IP／地區層級封鎖。
兩次排程與診斷 workflow（run 34149350301、34149592949）皆如此。FB 本來就只能在使用者登入的瀏覽器抓（ADR-0002）。
使用者要求「其他裝置也能開」，並接受每天在自己電腦跑一次。

## Decision

- 抓取（591 與 FB）全部在使用者的 Mac 上由 launchd 排程執行（`tools/run-local.sh`，預設每天 08:00，錯過時喚醒後補跑）。
- 結果以 **孤兒分支 `data` force push**（`tools/publish.sh`，用 git 底層指令做單一 commit，不碰工作樹）：repo 歷史不成長。
- GitHub Actions 只做發布：push 到 `main` 或 `data` → 取 `data` 分支的 `data.json`／`fb.json` 疊到 `site/` → 部署 Pages。不再有 cron、不再抓 591、不再需要 cache 與 keepalive。
- 跨輪連續性（新上架／降價／已下架）由 Mac 本機的 `site/data.json` 保存。

## Rationale

- 唯一能打到 591 的是台灣住宅 IP；Mac 就是。代理／台灣 VPS 可行但要錢且多一層風險。
- 孤兒分支：每天一次 5MB 若進 main 歷史，一年約百 MB；force push 單一 commit 則恆定。
- Pages 讓任何裝置隨時能開；資料新鮮度＝Mac 最後一次執行，可接受。

## Alternatives rejected

- **Actions 走代理／台灣 VPS** — 月費、代理品質不穩、多一組憑證。
- **Cloudflare Workers cron** — CF 出口 IP 同樣非台灣，極可能一樣被擋（未實測）。
- **資料進 main 每日 commit** — 歷史成長；且提交會觸發 keepalive 之類的無意義循環。
- **Gist／Release asset 當資料源** — 多一個系統，CORS 與大小限制未驗證。

## Consequences

- Mac 關機或睡眠超過一天 → 資料停在最後一次；看板頂部顯示「資料更新於」可察覺。
- 使用者需執行一次 `tools/install-launchd.sh` 並保持 `gh` 登入（推送用）。
- Revisit trigger：591 開始擋住宅 IP、或使用者需要多台機器輪流跑。
