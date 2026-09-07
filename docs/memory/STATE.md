# STATE — current project truth

_Last rewritten: 2026-09-08 by Claude Fable 5.1（session-end）._

## What exists and works（VERIFIED，除非另註）

- **591 抓取** `scrape.mjs`：解析清單頁 `window.__NUXT__`（vm 沙箱）、零依賴。2 個 query 約 135 頁／5 分鐘，約 3,900 筆。
  正規化行政區／站名／站→線／租金包含項目；跨輪比對新上架、降價、已下架（保留 7 天）；0 筆或 <50% 中止不覆蓋。
- **看板** `site/index.html`：多線＋站複選、多區、租金區間（可比總額）、租金已含、坪數／房型／類型／出租方／標籤、離站距離、排序；
  收藏／排除／已看（localStorage `rent591.*`）；分批渲染；詳細面板（相簿、pushState）；滑卡模式（T-001）；手機版（T-002）。
- **FB 社團房源**（ADR-0002）：`tools/fb-extract.js` 在使用者登入的社團頁跑 → `tools/fb-import.mjs` 或看板「匯入 FB 貼文」→ `site/fb.json`／localStorage。
  `core/text-extract.mjs` 抽價格／管理費／區／站／距離／房型／坪數／樓層，`node --test` 10/10。看板對未標欄位預設放行。
  實際從群組 459966811445588 抽 2 篇並匯入（fb.json 已提交）。
- **部署**：`https://github.com/jungle1490/Rent-dashboard` main = `7d9437e`。`scrape.yml` 每 30 分鐘 + push(site/**, core/**) 觸發，
  Actions cache 帶上一輪，artifact 部署 Pages；`keepalive.yml` 每週 commit 防 60 天停用。網址 https://jungle1490.github.io/Rent-dashboard/

## In progress

- **T-003 剩使用者操作**：Settings → Pages → Source = GitHub Actions；Actions 手動跑第一次。未做前網址打不開。

## Next (ordered)

1. 使用者完成 Pages 設定並跑第一次 workflow；確認網址可開、FB 兩筆有出現。
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
- 「新上架」徽章要等資料累積 36 小時才有意義（首輪全是新的，UI 自動關閉）。
- `scrape.mjs` 的 core 區段與 `mrt-lines.json` 是 FROZEN（CLAUDE.md）。
