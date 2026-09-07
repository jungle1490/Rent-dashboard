# T-007: FB 房源進看板（合併 fb.json + 貼上匯入 + 來源標示）

- **Tier:** mid
- **Depends on:** T-006
- **Scope (files):** `site/index.html`、`.github/workflows/scrape.yml`（加 push 觸發）、`tasks/`、`docs/memory/*`

## Goal
看板同時顯示 591 與 FB 房源；FB 卡片標「FB」來源與社團名、抽不到的欄位顯示「未標」、一律有原文連結；
可在看板貼上 `tools/fb-extract.js` 的輸出直接匯入（localStorage）；`site/fb.json` 提交後隨 Pages 發布。

## Non-goals
- 去重；FB 貼文的相簿（用抽到的圖）

## Acceptance criteria
- [ ] 啟動時並行載入 `data.json` 與 `fb.json`（缺檔不報錯），合併後 `source` 欄位區分；來源篩選晶片「591／FB」
- [ ] 「匯入」按鈕：貼上 JSON → 驗證格式 → 存 `rent591.fbImport` → 與 fb.json 合併（同 id 以較新 `capturedAt` 為準）
- [ ] 未標欄位：租金區間、坪數、行政區、捷運篩選對 `null` 欄位**預設不排除**；側欄有「隱藏未標價」開關
- [ ] `isSeeking` 貼文預設不顯示；「顯示求租貼文」開關
- [ ] FB 卡片：來源徽章、社團名、原文前 120 字、「在 Facebook 開啟」；滑卡與面板同樣支援
- [ ] `scrape.yml` 加 `on: push: paths: ['site/**']`，提交 fb.json 即重新部署
- [ ] 桌面與 375×667 斷言全 true

## Verification
瀏覽器內斷言（貼輸出）；`python3 -c "import yaml;yaml.safe_load(open('.github/workflows/scrape.yml'))"`
