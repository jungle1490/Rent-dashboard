# ADR-0002: 社群房源（Facebook 社團）— 登入瀏覽器內抽取，不進雲端排程

- **Status:** accepted
- **Date:** 2026-09-08
- **Decided by:** Claude，依使用者明確要求（提供兩個社團網址；「找不出來的就放連結我自己看，主要是房源」）

## Context

使用者要把 FB 社團的房源併進看板。VERIFIED：Meta 於 2024-04 停用 Groups API；未登入 curl 取社團頁回 HTTP 400 錯誤頁。
唯一能讀到貼文的是**使用者本人登入的瀏覽器**：VERIFIED 在 Chrome 登入狀態下，DOM 可取得永久連結、本文、圖片；
作者／時間區塊有字元打散反爬（U+034F 等），本文本身完整；動態懶載入且慢，需捲動與展開「顯示更多」。
貼文是自由文字，沒有結構化欄位；同一社團混有「求租」與「出租」。

## Decision

- **不**把 FB 放進 GitHub Actions；FB 抓取只在使用者登入的瀏覽器裡執行（書籤小工具，或由 agent 透過 Claude in Chrome 代跑）。
- 抽取分兩層：`tools/fb-extract.js`（頁面內跑，只做 DOM → 原始貼文 JSON）與 `core/text-extract.mjs`（純函式：本文 → 價格／管理費／行政區／捷運站／房型／坪數，對不到就留空）。
- 匯入看板兩種途徑並存：(a) 貼上 JSON 到看板「匯入」→ localStorage；(b) 存成 `site/fb.json` 提交 → 隨 Pages 發布，跨裝置。
- 只收「出租」貼文（關鍵字白名單／黑名單），台北市以外標記 `outsideTaipei` 但仍保留（使用者可篩）。
- 抽不出的欄位一律留空並顯示原文連結；UI 對未標欄位的篩選預設「不排除」。

## Rationale

- 沒有合規的雲端途徑；登入爬取放到 Actions 會被封且危及帳號。瀏覽器內執行等同使用者自己捲頁面，不用交出憑證。
- 純函式抽取獨立成 `core/` 模組後可用 `node --test` 測——這是專案第一個有真正單元測試的模組，也為 T-004 立範例。
- 「留空＋連結」符合使用者要求，避免為了填欄位而猜錯價格。

## Alternatives rejected

- **Threads 官方 API** — 可行且合規，但使用者這次指定 FB；保留為後續選項（見 QUESTIONS.md）。
- **Actions 內用 cookie 登入爬 FB** — 需把 session 放進 Secrets，機房 IP 必封，違反條款。
- **LLM 抽取欄位** — 準確度高但引入外部 API 與金鑰、每篇成本；先用規則式，抽不到留空即可。

## Consequences

- FB 資料的新鮮度取決於使用者何時跑抽取；看板顯示各來源的「最後匯入時間」。
- FB DOM 改版會讓 `tools/fb-extract.js` 失效（抽到 0 篇即提示）。Revisit trigger：連續兩次抽到 0 篇。
- 跨來源去重（同一間房 591 + FB）只能靠價格＋行政區＋站名模糊比對，第一版不做，只標來源。
