# SESSION LOG — newest first

## 2026-09-08 · Claude Fable 5.1 · 從零建到可用 + agent framework + T-001～T-007
- Did: `scrape.mjs`（新，591 抓取）、`mrt-lines.json`（新）、`site/index.html`（新，看板／面板／滑卡／手機版／FB 合併與匯入）、
  `.github/workflows/scrape.yml` + `keepalive.yml`（新）、`config.json`、`README.md`、`CLAUDE.md` 與 docs/ 框架文件（init-project）、
  `core/text-extract.mjs` + `core/fb-listing.mjs` + `test/text-extract.test.mjs`（新）、`tools/fb-extract.js` + `tools/fb-import.mjs`（新）、`site/fb.json`（新，2 筆）、
  ADR-0001／0002、任務卡 T-001／002／003／006／007。舊 Telegram 版本移到 `legacy/`。
- Learned: 591 清單頁內嵌 `__NUXT__` 完整 JSON，不需瀏覽器 [VERIFIED curl+解析]；`metro=` 與 `station=` 是 AND，會砍跨線站 [VERIFIED 163 vs 280 筆]；
  Meta Groups API 2024-04 停用、未登入取社團頁 HTTP 400 [VERIFIED]；登入 Chrome 的 DOM 可取貼文本文／永久連結，作者時間區塊有字元打散 [VERIFIED]；
  中文後的 `\b` 不成立、CJK 單位要用 `(?!\d)` [VERIFIED 測試]；GitHub 60 天無 commit 停用排程 → 需 keepalive [INFERRED 自 GitHub 文件與社群]。
- Blocked: 推送曾卡 GitHub 憑證（使用者 `gh auth login` 後解除）；FB 圖片網址無法經擴充功能取回。
- Next: 使用者設 Pages Source = GitHub Actions 並手動跑第一次，確認 https://jungle1490.github.io/Rent-dashboard/ 可開。

