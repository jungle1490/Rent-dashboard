# SESSION LOG — newest first

## 2026-09-08 — 從零建到可用，引進 agent framework

- 確認 591 清單頁 HTML 內嵌 `window.__NUXT__` 結構化資料，不需 Playwright。
- 發現 `metro=` 參數會 AND 掉跨線站點；改為整批抓、前端篩。
- 建 scraper、UI、Actions 工作流程、keepalive；三輪抓取驗證新上架／已下架比對正確。
- 加詳細面板（pushState／上一頁關閉）、租金總額計價。
- 執行 init-project：`docs/` 改為框架文件目錄，網頁資產移到 `site/`。
- T-001 滑卡模式完成並驗收（實作細節見卡片）；已知限制：前端邏輯無單元測試，記入 T-004。
- T-002 手機版完成並驗收。
- T-003：合併遠端 initial commit、推送。
