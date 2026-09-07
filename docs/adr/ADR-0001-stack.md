# ADR-0001: 技術棧 — Node 零依賴抓取 + 靜態頁 + GitHub Actions/Pages

- **Status:** accepted
- **Date:** 2026-09-08
- **Decided by:** Claude（與專案擁有者確認需求後）

## Context

要定期從 591 抓台北市租屋物件、放進自製介面，且**電腦關機也要照常更新**、可在手機上看。
591 沒有公開 API；清單頁 HTML 內嵌 `window.__NUXT__`（壓縮過的 JS IIFE），含完整結構化資料。
資料量約 4,000 筆／輪，每 30 分鐘一輪。不想付伺服器費用；可接受公開 repo。
專案擁有者先前有一版 Python + Playwright + Telegram 推播（`legacy/`），方向不同已棄用。

## Decision

- 抓取：**Node.js 20，零依賴**，`fetch` 清單頁 → `vm.runInNewContext` 空 context 求值 `__NUXT__` → 正規化 → `site/data.json`。
- 介面：**單檔純 HTML/CSS/JS**（`site/index.html`），只讀 `data.json`，所有篩選在前端。
- 排程與部署：**GitHub Actions cron（每 30 分）→ Actions cache 帶上一輪 → `deploy-pages` artifact**。資料不 commit。
- 另有 `keepalive.yml` 每週 commit 時間戳，避免 60 天無活動排程被停用。

## Rationale

- 資料在 HTML 內嵌 JS 裡，用 JS 引擎求值最直接；Node `vm` 現成、Actions 內建 Node，省掉 Playwright 裝 Chromium 的時間與脆弱性。
- 4,000 筆前端篩選毫無壓力，而且把篩選搬到前端就徹底繞過 591「一次只能一條線」的參數限制。
- 靜態頁＋Pages 免費、免維護、手機可開；Actions 公開 repo 分鐘數無限。
- 資料不進 git：每 30 分鐘一個 5MB commit 一年會把 repo 撐到數 GB。artifact 部署 + cache 解決連續性。

## Alternatives rejected

- **Python + Playwright（原 legacy 版）** — 不需要瀏覽器就拿得到資料；Playwright 在 Actions 每輪多 2 分鐘且較易壞。
- **Claude Artifact 當介面** — CSP 擋所有外部 fetch，且重新發布需要人在電腦前，違反「關機也更新」。
- **本機排程 + 本機網頁** — 關機即停，使用者明確不要。
- **Cloudflare Workers + KV** — 可行且資料可私有，但設定較繁；使用者接受公開 repo，GitHub 路徑更簡單。
- **抓取結果 commit 進 repo（Pages from branch）** — 最直觀，但 repo 體積問題無解。
- **用 591 的 `metro=`/`station=` 參數做多線** — `station=` 可跨線但 `metro=` 會 AND 掉；能用但脆弱，不如整批抓。

## Consequences

- 抓取完全依賴 591 的 `__NUXT__` 結構；**改版即壞**（會中止不覆蓋，Actions 寄信）。Revisit trigger：連續 2 輪失敗。
- 使用者狀態（收藏／排除／已看）只在瀏覽器本機；跨裝置同步需另加儲存層。Revisit trigger：使用者要求在第二台裝置看到收藏。
- 排程精準度是 GitHub best-effort（尖峰延後 5–20 分）；租屋情境可接受。
- Actions cache 7 天無存取會被清；我們每 30 分存取一次，實務上不會發生，但若排程停用超過 7 天，下一輪 `firstSeen` 會全部重設（UI 會自動關掉新上架徽章一輪）。
