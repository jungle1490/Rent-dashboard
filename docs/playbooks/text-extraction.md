# Playbook — 文字抽取／FB 匯入

| 症狀 | 根因 | 修法 | 證據 |
|---|---|---|---|
| 「管理費600」抽成 null | 租金規則要求 ≥4 位數，管理費常是 2–3 位 | `findExtraFee` 用獨立規則 `\d{2,6}` | test/text-extract.test.mjs「管理費」 |
| 「4樓/5樓」「350公尺」抽不到 | JS `\b` 在中文字後不成立（中文不是 `\w`） | CJK 單位後一律 `(?!\d)` | 同上「離站距離」「樓層」 |
| 重跑同一份原始檔，改善後的規則沒生效 | `fb-import` 對相同 `capturedAt` 跳過 | 只在 `prev.capturedAt > raw.capturedAt` 才跳過 | 天母樣本 layout 由 3房 → 3房2廳1衛 |
| agent 取 FB 抽取結果被擋「Cookie/query string data」 | 圖片網址帶簽章 query string，擴充功能不放行 | 代跑時只回 `imageCount`；使用者自跑走剪貼簿才有圖 | 本 session 實測 |
| 「三房兩廳一衛」抽成 3房 | 只認阿拉伯數字 | 房／廳／衛前的中文數字轉換，其他位置不轉 | 測試「三重區 2房」仍為 outsideTaipei |
