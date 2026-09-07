# STATE — current project truth

_Last rewritten: 2026-09-08 by init-project skill（專案已有可運作的程式碼，內容依實際狀態填寫）._

## What exists and works（本 session 全部 VERIFIED）

- `scrape.mjs`：解析 591 清單頁內嵌的 `window.__NUXT__`，vm 沙箱求值，零依賴。
  兩個 query（整層住家、獨立套房，1.5–4.5 萬）約 135 頁、5 分鐘，抓到約 3,900 筆。
- 正規化：行政區、捷運站名（含臺／台、前後綴）、站→路線（轉乘站對多線）、
  租金包含項目（管理費／水費／網路…）、額外費用。
- 跨輪比對：`firstSeen`（新上架）、`prevPrice`（降價）、`gone`（已下架保留 7 天）。
  防護：0 筆或 <上次 50% 就中止不覆蓋。
- `site/index.html`：多捷運線＋站複選、多行政區、租金區間（可切「比總額」）、
  租金已包含、坪數／房型／類型／出租方／標籤、離捷運距離、排序；收藏／排除（localStorage）；
  分批渲染 60 筆＋懶載入；詳細面板（相簿 8 張、pushState、上一頁關閉、`#p<id>` 深連結）。
- `.github/workflows/scrape.yml`：每 30 分鐘抓取 → Actions cache 帶上一輪 → 部署 Pages（artifact，不 commit 資料）。
  `keepalive.yml` 每週 commit 時間戳，避免 60 天無活動排程被停用。
- 本機 git 已有 7 個 commit；遠端 `https://github.com/jungle1490/Rent-dashboard` 只有 initial commit（README），尚未合併推送。

## In progress

- 引進 agent framework（本次）：網頁資產由 `docs/` 移到 `site/`，`docs/` 讓給框架文件。
- 使用者提出三項需求，尚未實作：(1) 流程以看照片為主 (2) 手機版適配 (3) Tinder 式滑卡（只限新上架＋未看過、可設篩選、右滑收藏、可返回、跳過的在「全部」仍可見）。

## Next (ordered)

1. T-001 滑卡模式 + `rent591.seen` 已看追蹤（tasks/BACKLOG.md）。
2. T-002 手機版：篩選收成抽屜、底部工具列、卡片單欄。
3. T-003 合併遠端 README、推送、設定 Pages Source = GitHub Actions、手動跑第一次。
4. T-004 把 core 純函式抽成 `core/` 並用 `node --test` 補測試（站名解析、費用拆解、normalize）。
5. 視需求：收藏／排除跨裝置同步（目前只在瀏覽器本機）。
