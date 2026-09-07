# STATE — current project truth

_Last rewritten: 2026-09-08 by Claude Fable 5.1（session-end）._

## What exists and works（VERIFIED，除非另註）

- **591 抓取** `scrape.mjs`：解析清單頁 `window.__NUXT__`（vm 沙箱）、零依賴。2 個 query 約 135 頁／5 分鐘，約 3,900 筆。
  **只能在台灣 IP 跑**：GitHub Actions 打 591 回 CloudFront 403（ADR-0003）→ 改由 Mac launchd 每日執行 `tools/run-local.sh`，`tools/publish.sh` force push 孤兒分支 `data`，Actions 只發布。
  正規化行政區／站名／站→線／租金包含項目；跨輪比對新上架、降價、已下架（保留 7 天）；0 筆或 <50% 中止不覆蓋。
- **看板** `site/index.html`：多線＋站複選、多區、租金區間（可比總額）、租金已含、坪數／房型／類型／出租方／標籤、離站距離、排序；
  收藏／排除／已看（localStorage `rent591.*`）；分批渲染；詳細面板（相簿、pushState）；滑卡模式（T-001）；手機版（T-002）。
- **FB 社團房源**（ADR-0002）：`tools/fb-extract.js` 在使用者登入的社團頁跑 → `tools/fb-import.mjs` 或看板「匯入 FB 貼文」→ `site/fb.json`／localStorage。
  `core/text-extract.mjs` 抽價格／管理費／區／站／距離／房型／坪數／樓層，`node --test` 10/10。看板對未標欄位預設放行。
  實際從群組 459966811445588 抽 2 篇並匯入（fb.json 已提交）。
- **部署**：`scrape.yml`（名稱「發布看板」）push 到 main／data 就把 data 分支檔案疊上 site/ 部署 Pages。keepalive／cron／cache 已移除。網址 https://jungle1490.github.io/Rent-dashboard/

## In progress

- **看板已上線**：https://jungle1490.github.io/Rent-dashboard/ HTTP 200，data.json 3,869 筆、fb.json 2 筆（VERIFIED curl，2026-09-08）。
  使用者同意後以 gh api 把 Actions 權限改回 `all`、Pages Source 設為 workflow；發布 run 34150554393 success。
- launchd `com.rent-dashboard.daily` 已安裝（每天 08:00 跑 `tools/run-local.sh`）。首次完整本機執行 VERIFIED：3,911 筆 → data 分支 → `publish.sh` 以 `gh workflow run` 觸發發布 → 線上更新（推孤兒分支本身不會觸發 workflow）。
- 看板有「↻ 更新資料」鈕：重新讀已發布的 data.json／fb.json，有變才重畫；切回分頁超過 5 分鐘自動檢查。它**不能**直接抓 591（VERIFIED 591 無 CORS header）。
- 房源卡片／面板／滑卡顯示時間：591 用 `refreshTime`（X 小時內更新）＋首次出現；FB 用 `postedAt`（永久連結 aria-label 的完整日期，VERIFIED）＋首次出現。FB 匯入只留最近 30 天（`core/fb-listing.mjs` KEEP_DAYS）。
- **遠端叫 Mac 抓**（T-011，VERIFIED）：看板「⚡ 請 Mac 抓新資料」→ GitHub Run workflow `refresh.yml` → refresh 分支時間戳 → Mac launchd `com.rent-dashboard.poll` 每 5 分鐘 `poll-refresh.sh` → run-local.sh。任何能按 workflow 的東西（手機 GitHub App、gh、cloud routine）都能觸發。
- `fb-extract.js` 支援社團搜尋結果頁（全文＋圖較齊、可先篩「最新／發佈日期」，但無永久連結與日期）。
- 滑卡左滑＝排除＋已看（T-013）。
- Claude 雲端 routine：建立被拒（HTTP 401「Connect your GitHub account」），需使用者到 claude.ai 連 GitHub 後再建；routine 的作用只是每天 12:00 往 refresh 分支寫時間戳。
- Claude routine `trig_011eqoixaAeJio9HndESiaBM` 每天 12:00（台北）推 refresh 分支 → Mac 抓；VERIFIED 端到端（需 Claude GitHub App 裝在 repo）。
- FB：4 個社團（459966811445588、305665579858865、221614965050605、313385739282042）由 subagent 用 Chrome 抽 95 篇 → 匯入 87 筆（有圖 82、有價 77、有區 52）已發布。
  學到（VERIFIED）：FB CSP 擋頁面 fetch localhost → fb-extract 改導向接收器 relay 頁（hash 帶資料）；動態牆容器＝feed 直接子元素含 1 個永久連結；按鈕只點 feed 內；305665579858865 是商品型社團，動態牆幾乎沒貼文，用搜尋頁。
- T-010（FB 每日自動抽取）未開始。

## Next (ordered)

1. T-010 FB 每日自動（AppleScript 驅動 Chrome 跑 fb-extract）；T-012 改用 591 BFF API。
2. 使用者在登入 Chrome 對兩個社團跑 `tools/fb-extract.js`（459966811445588、305665579858865），貼進看板或交 agent 匯入。
3. T-008 抽取補強：地標→行政區（天母→士林區）、插字步行距離、多房價取區間。
4. T-004 抽出 `scrape.mjs` 的 core 純函式到 `core/` 並補測試（text-extract／fb-listing 已在 core/）。
5. 視需求：收藏／排除／已看跨裝置同步；Threads 官方 API 來源（QUESTIONS.md）。

## Active warnings

- **覆蓋層驗收要檢查元素在視窗內**（`getBoundingClientRect()`），不能只看 `display`；2026-09-08 篩選抽屜因此漏掉「完成鈕在畫面外」的 bug（docs/playbooks/ui.md）。
- 前端驗收腳本在 `test/browser/*.js`（貼到 Console 跑）；前端沒有單元測試，抽離是 T-004。

- **本機開發要先 `cp core/*.mjs site/`**（網頁動態 import；這兩個複本已 gitignore，workflow 會複製）。
- agent 透過 Chrome 擴充功能代跑 FB 抽取**拿不到圖片網址**（簽章 query string 被擋）；使用者自己跑書籤小工具才有圖。
- FB 動態載入極慢，8 次捲動只出 3 篇；第二個社團頁面曾讓 JS 執行逾時 45 秒。
- **所有 `uses:` 都 startup_failure 且 API 不給原因時，先查 `gh api repos/…/actions/permissions`**（playbooks/ci.md）。
- 591 BFF API（`bff-house…/v3/web/rent/list`）不用登入即可用，但：網頁跨網域被擋（CORS 只允許 591 網域）、GitHub Actions 一樣 CloudFront 403。可當 Mac 端更乾淨的資料源（T-012）。
- `run-local.sh` 用 nvm 的 node（launchd PATH 很短，腳本自己找）。
- 「新上架」徽章要等資料累積 36 小時才有意義（首輪全是新的，UI 自動關閉）。
- `scrape.mjs` 的 core 區段與 `mrt-lines.json` 是 FROZEN（CLAUDE.md）。
