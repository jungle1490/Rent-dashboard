# T-001: 滑卡模式 + 已看追蹤

- **Tier:** mid
- **Depends on:** -
- **Scope (files):** `site/index.html`、`tasks/BACKLOG.md`、`docs/memory/*`。不得修改 `scrape.mjs`、`mrt-lines.json`（FROZEN）。

## Context

使用者要求（2026-09-08）：「想做個像 Tinder 左右滑的功能，但僅限於新上架、未瀏覽過的房源，也要可以設置篩選條件，
右滑的加進收藏，可以返回。就算錯過在全部瀏覽也能看到。」流程以看照片為主，看了有興趣才點進 591。
必讀：`docs/CONVENTIONS.md` 前端一節（history API、三種標記獨立、z-index）、`docs/SPEC.md` M1。

## Goal

看板多一個「滑卡」入口：全螢幕一次一張大圖卡片，左滑跳過、右滑收藏、可返回上一張、可開詳細面板、可改篩選；
滑過的物件標為「已看」，不再進佇列，但在看板「全部」仍看得到。

## Non-goals

- 手機版版面（底部工具列、單欄）— T-002
- 跨裝置同步已看狀態 — Later
- 滑卡的動畫精緻度（只要方向清楚、有回彈）

## Acceptance criteria

- [ ] `rent591.seen` 存在 localStorage；左滑、右滑都會把該 id 加進去；從**看板**開詳細面板也算已看，從**滑卡**開不算
- [ ] 佇列 = 未看 ∩ `matches(F)` ∩ 未排除 ∩ 未下架，依 `firstSeen` 新→舊；「只看新上架」開關預設 = `NEW_MEANINGFUL`
- [ ] 右滑（或 ★／→ 鍵）→ 加入 `rent591.saved` 並標已看；左滑（或 ✕／← 鍵）→ 只標已看，**不**加入 `hidden`
- [ ] 返回（↩／Backspace）→ 上一張回到最前面、已看取消、若是右滑加入的收藏也取消；佇列空時返回仍可用
- [ ] 左滑跳過的物件在看板「全部」分頁仍顯示，並帶「已看」徽章；「未看過」分頁不顯示它
- [ ] 開滑卡 `pushState({swipe:1})`；上一頁／✕／Esc 關閉；從滑卡開面板再按上一頁回到滑卡而非看板
- [ ] 在滑卡內按「篩選」可改條件，改完佇列即時更新
- [ ] 點卡片左／右半邊切上一張／下一張照片；拖曳 >110px 才算滑動，未達回彈
- [ ] New behavior covered by tests — **無法**：前端無測試框架、邏輯內嵌 HTML。以瀏覽器內 JS 斷言取代（貼輸出），並在 BACKLOG 記錄「T-004 抽離後補前端純函式測試」

## Verification

```bash
node --check scrape.mjs      # typecheck（本任務不動 scrape.mjs，仍須通過）
# 瀏覽器內（http://localhost:8899）執行 tasks/T-001 驗證腳本，所有斷言為 true：
#   佇列排除已看／已排除、左滑不進 hidden、右滑進 saved、undo 還原、popstate 關閉、篩選即時更新
```

## Hints

- 開關覆蓋層一律走 history（CONVENTIONS 前端節）；`popstate` 是唯一移除 DOM 的地方
- `render(true)` 保留已展開筆數，收藏／已看變更時用它，否則清單會跳回前 60 筆
- 從滑卡開面板不能標已看：否則 `render()` 重算佇列，面板底下那張卡會消失
- z-index：滑卡 45 < 面板 50 < 篩選抽屜 55
