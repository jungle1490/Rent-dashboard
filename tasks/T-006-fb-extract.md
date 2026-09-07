# T-006: FB 社團貼文抽取（頁面內腳本 + 純函式文字抽取 + 測試）

- **Tier:** mid（`core/text-extract.mjs` 的規則與測試需要領域判斷，偏 TOP）
- **Depends on:** ADR-0002
- **Scope (files):** `tools/fb-extract.js`（新）、`core/text-extract.mjs`（新）、`test/text-extract.test.mjs`（新）、`site/fb.json`（產物）、`docs/CONVENTIONS.md`（補來源一節）、`tasks/`、`docs/memory/*`。**不改** `scrape.mjs`、`mrt-lines.json`。

## Context
ADR-0002。VERIFIED 樣本（群組 459966811445588）：本文含「板橋｜3樓公寓｜1房1衛1陽台」「捷運亞東醫院站走路12分鐘」「13000」「管理費600（網路+公共電費）」。
社團：459966811445588（台北租屋、出租專屬平台 2.0）、305665579858865。

## Goal
在登入的 FB 社團頁執行 `tools/fb-extract.js`，得到 `[{link, text, images, group, capturedAt}]`；
`core/text-extract.mjs` 把每篇轉成看板欄位；輸出合併成 `site/fb.json`。

## Non-goals
- 自動排程、雲端執行（ADR-0002）
- 跨來源去重
- 作者／發文時間（被打散反爬，不抽；用 `capturedAt` 代替）

## Acceptance criteria
- [ ] `tools/fb-extract.js` 在社團頁執行：自動捲動 N 次、展開「顯示更多」、以永久連結為錨點收集貼文；回傳 JSON 並複製到剪貼簿；抽到 0 篇時明確提示
- [ ] `core/text-extract.mjs` 匯出 `extractListing(text, mrtLines)`，純函式、零 import；回傳 `{price, extraFee, district, outsideTaipei, station, stationDist, layout, area, isSeeking}`，抽不到為 `null`
- [ ] 價格：支援「13000」「1萬3」「13,000」「NT$13,000」「13000元」「1.3萬」；管理費：「管理費600」「管理費 1,000」
- [ ] 行政區：台北市 12 區命中；「板橋」「中和」等新北地名 → `outsideTaipei: true`
- [ ] 捷運站：用 `mrt-lines.json` 站名比對，含「捷運X站」「近X站」；「走路12分鐘」→ `stationDist` 估 12×80 公尺（標 `approx`）
- [ ] `isSeeking`：含「#求租」「求租」「徵室友」「找室友」→ true（UI 預設不顯示）
- [ ] 新行為有測試：`node --test` 覆蓋上述每一類至少 2 例，含 VERIFIED 樣本原文
- [ ] `site/fb.json` 格式 `{importedAt, groups:[...], listings:[...]}`，listing 含 `source:'fb'`、`id:'fb:'+postId`、`url`、`photos`、`raw`

## Verification
```bash
node --check scrape.mjs && node --test
node -e "import('./core/text-extract.mjs').then(m=>console.log(m.extractListing('板橋｜3樓公寓｜1房1衛1陽台\n捷運亞東醫院站走路12分鐘\n13000\n管理費600', JSON.parse(require('fs').readFileSync('mrt-lines.json','utf8')))))"
```
