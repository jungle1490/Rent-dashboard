# QUESTIONS — open questions & escalations

- **要不要逐筆抓 591 物件頁？** 清單頁只有 41% 物件標了「租金含什麼」；管理費細項、水電計價只有物件頁才有，但那是每輪 4,000 次額外請求。目前不做；若要，可只對收藏的物件抓。
- **收藏／排除／已看要跨裝置同步嗎？** 目前 localStorage，換裝置不同步。需要再接一層儲存（Gist、Cloudflare KV…），使用者尚未要求。

## 2026-09-08 — 要不要加 Threads／Facebook 社團當房源？（使用者提問，待決定）

- **Threads**：VERIFIED 官方 keyword search 端點可搜公開貼文，需 Meta app + `threads_keyword_search` 權限（使用者本人申請），2,200 次/日、100 篇/次。可放進 Actions。
- **Facebook 社團**：VERIFIED Groups API 已於 2024-04 停用，無正規管道；登入爬取違反條款且與「無人值守」前提衝突。建議改做「手動加入」卡片。
- **共通難點**：自由文字要抽價格／區／站（規則式，估七成，ASSUMPTION）；未標欄位在篩選中的處理；跨來源去重。
- 若做：ADR-0002 資料來源層、卡片 T-006 Threads 抓取＋抽取、T-007 手動加入。使用者尚未點頭。
