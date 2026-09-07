# 瀏覽器驗收腳本

前端邏輯內嵌在 `site/index.html`，沒有單元測試框架（零依賴政策；抽離成模組是 T-004）。
這裡的腳本是**在瀏覽器 Console（或 agent 的 javascript 工具）貼上執行**的斷言，回傳物件裡每個布林都要是 `true`。

執行前：`cp core/*.mjs site/ && python3 -m http.server 8899 --directory site`，開 http://localhost:8899。

| 檔案 | 驗什麼 | 視窗 |
|---|---|---|
| `drawer.js` | 篩選抽屜：完成鈕在畫面內、抽屜可捲動、上一頁關抽屜且不離站、從滑卡開抽屜再上一頁回滑卡 | 390×844 |
| `swipe.js` | 滑卡：已看／收藏／undo／popstate／篩選即時更新（T-001 的 27 項） | 任意 |
| `fb.js` | FB 房源：來源篩選、未標欄位放行、匯入面板（T-007 的 22 項） | 1280×800 |

腳本內不要呼叫 `history.back()` 後直接結束——若抽屜沒接 history，頁面會離站、腳本被中斷（這正是 2026-09-08 抓到的 bug）。
