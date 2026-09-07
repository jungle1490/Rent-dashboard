# BACKLOG — ordered; check off when the Definition of Done passed

Tier legend: **low** = any model · **mid** = capable coding model · **TOP** = top-tier only

## M1 (MVP)

- [x] **T-000** 抓取、看板、Actions 部署、詳細面板（init 前已完成，見 STATE.md）
- [x] **T-001** 滑卡模式 + 已看追蹤 — mid（2026-09-08 完成，卡片 tasks/T-001-swipe-mode.md）
      只限新上架＋未看過（可切換）、套用目前篩選、右滑收藏、左滑跳過（仍在「全部」可見）、返回上一張、
      點卡片切照片、「詳細」開面板；鍵盤 ←／→／Backspace；`rent591.seen`；看板加「未看過」分頁與「已看」徽章
- [x] **T-002** 手機版適配 — mid（2026-09-08 完成，卡片 tasks/T-002-mobile.md）
      篩選收成全螢幕抽屜（有「完成」鈕）、底部工具列（篩選／滑卡）、卡片單欄、safe-area
- [x] **T-003** 推上 GitHub — low（2026-09-08 完成：Pages Source 以 gh api 設為 workflow，網址 200）
      合併遠端 initial commit（README 以本地為準）、push、Settings → Pages → Source = GitHub Actions、手動跑第一次、確認網址
- [ ] **T-004** 抽出 `core/` + 測試 — **TOP**
      把 `normalize`、`resolveStation`、`parseContains` 移到 `core/`，`node --test` 覆蓋：站名 8 種寫法、費用拆解、價格逗號、gone 保留 7 天、<50% 中止。
      同時把前端純邏輯（`matches`、`swQueue`、undo 語意）抽成可 import 的模組補測試——T-001 目前只有瀏覽器內斷言
- [ ] **T-005** ADR-0001 補完 alternatives 與 revisit trigger — low

- [x] **T-006** FB 社團貼文抽取：頁面內腳本 + `core/text-extract.mjs` + 測試 — mid/TOP（ADR-0002；2026-09-08 完成，`node --test` 10/10）
- [x] **T-007** FB 房源進看板：合併 fb.json、貼上匯入、來源標示、未標欄位處理 — mid（2026-09-08 完成，22 項桌面斷言 + 手機斷言）

- [ ] **T-008** 文字抽取補強：地標→行政區（天母→士林區、東區→大安區…）、插字的步行距離、多房價（「12000／14000／16000」取區間） — mid

- [x] **T-009** 抓取改到 Mac 排程 + 孤兒分支 data 發布（591 擋 Actions IP，ADR-0003）— mid（2026-09-08 完成：data 分支、發布 workflow 成功、launchd 每天 08:00）
- [ ] **T-010** FB 每日自動抽取：AppleScript 驅動已登入的 Chrome 執行 fb-extract.js → fb-import → 併入 run-local.sh — mid

- [x] **T-011** 遠端叫 Mac 抓新資料：`refresh.yml`（workflow_dispatch → refresh 分支時間戳）+ Mac 每 5 分鐘 `poll-refresh.sh` — mid（2026-09-08 完成，端到端實測觸發成功）

- [ ] **T-012** scrape.mjs 改打 591 BFF API（`bff-house.591.com.tw/v3/web/rent/list`）— mid
      VERIFIED 不用登入／deviceid；欄位與 __NUXT__ 相同（56 欄）；分頁不是 `page=`（page=2 回同一頁），回應有 `firstRow`，應改 `firstRow=30,60…` 實測。
      好處：不用 vm 沙箱、不受 HTML 改版影響。仍只能從台灣 IP 打（Actions 一樣被 CloudFront 403）。core 為 FROZEN，需卡片。

- [x] **T-013** 滑卡左滑＝排除（可在「已排除」找回；返回可還原）— low（2026-09-08 完成，6 項斷言）

## Later

- [ ] 收藏／排除／已看跨裝置同步（見 QUESTIONS.md）
- [ ] 只對收藏物件抓 591 詳細頁補管理費細項（見 QUESTIONS.md）
- [ ] 每坪單價、離站距離的分布直方圖，輔助設區間
