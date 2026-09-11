# Rent-dashboard — 台北租屋看板

定期從 591 抓台北市租屋物件，放進一個可以多重複選（多條捷運線、多行政區、租金包含項目）、
排除已看、標記新上架與降價的自製介面。給自己找房用。591 的篩選一次只能選一條捷運線、
沒有「看過就別再出現」——這個專案把資料抓下來自己存，所有篩選改在前端做，就不受它限制。

## Session start — read in this order

1. `docs/memory/STATE.md` — where the project actually is right now
2. Your task card in `tasks/` (pick from `tasks/BACKLOG.md` if unassigned)
3. `docs/CONVENTIONS.md` sections relevant to your task
4. The ADR covering your area (`docs/adr/`)

## Commands

```bash
node --check scrape.mjs                                        # typecheck — must pass before "done"
node --test test/*.test.mjs                                    # full test suite（core；test/browser/*.js 是瀏覽器內腳本，不在此跑）
cp core/*.mjs site/ && node scrape.mjs && python3 -m http.server 8899 --directory site   # run locally → http://localhost:8899
```

## Architecture (details: docs/adr/)

```
site/index.html            app：純 HTML/CSS/JS，零依賴。只讀 site/data.json，不碰 591。
        ▲ 讀
site/data.json             抓取產物。不進 git（.gitignore），由 Actions 產生後直接發布。
        ▲ 寫
scrape.mjs
  ├─ core（純函式，無 I/O）  normalize / resolveStation / parseContains / mrt-lines.json
  │                           輸入 591 原始物件 → 輸出 UI 用的正規化物件。
  └─ adapters（I/O）          fetchPage（591 HTTP + vm 沙箱求值）/ 讀寫 data.json / config.json
.github/workflows/         scrape.yml：push 到 main／data 就把 data 分支的檔案疊上 site/ 部署 Pages（不抓取）
tools/run-local.sh         Mac launchd 每日：node scrape.mjs → tools/publish.sh（孤兒分支 data force push）

import 規則：core 不 import 任何東西（連 node: 內建都不行）；adapters 才碰 fetch/fs/vm。
```

- `scrape.mjs` 的 core 區段（`normalize`、`resolveStation`、`parseContains`）與 `mrt-lines.json`
  是 **FROZEN** — call it, never modify it (rule R8). 目前仍與 I/O 同檔，T-004 會抽成 `core/`
  並補測試；抽出前一樣視為凍結。Changes require an approved task card.
- External libraries：目前零依賴，維持。真要加只能進 adapters 層，core 匯入任何東西都算違規。

## Conventions you will otherwise get wrong

Source of truth: `docs/CONVENTIONS.md`. The most-violated ones:

| # | 慣例 | 為什麼 |
|---|---|---|
| 1 | **不要用 591 的 `metro=` 參數** | 它會把站點結果再 AND 一次，跨線站就被砍掉。要多線就不帶 metro，或整批抓下來前端篩 |
| 2 | **篩選一律在前端做；`config.json` 的抓取範圍要抓寬** | 抓窄了想放寬要等下一輪；前端篩 4000 筆毫無壓力 |
| 3 | **站名先比對原字串，對不到才剝前後綴** | 「台北車站」本身以站結尾，先去「站」會變成「台北車」 |
| 4 | **「新上架」= 跨輪 `firstSeen` 比對，不是 591 的 tag** | 591 的 tag 不可靠；首輪 >60% 為新時 UI 會自動關掉標記 |
| 5 | **抓到 0 筆或 <上次 50% → 中止，不寫檔** | 否則幾千筆會被誤標「已下架」；已下架的保留 7 天標 `gone` |
| 6 | **遠端 `__NUXT__` 只能在 `vm.runInNewContext` 空 context 求值** | 那是 591 的程式碼，不可信；禁止 `eval` |
| 7 | **`site/data.json` 不進 main；由 `tools/publish.sh` force push 到孤兒分支 `data`** | 歷史不成長；跨輪連續性靠 Mac 本機留著上一次的 data.json |
| 7b | **591 擋 GitHub Actions 的 IP（CloudFront 403）**，抓取只能在台灣的機器跑 | ADR-0003；別再嘗試把 scrape 放回 Actions |
| 8 | **面板／滑卡要開就 `pushState`，關閉一律走 `history.back()`** | 手機返回手勢＝關面板回看板；直接移 DOM 會讓 history 對不上 |
| 9 | **「排除」≠「已看」；滑卡左滑＝排除＋已看，右滑＝收藏＋已看** | `rent591.hidden` 不再顯示（「已排除」分頁可找回）；`rent591.seen` 只是看過 |
| 10 | **價格是數字（`toNum` 去逗號）；`extraFee` 另計** | 「總額」= `price + extraFee`；區間與排序依 `F.basis` 決定用哪個 |

## Rules

This project runs on the agent framework (`docs/rules`):

- **Evidence over memory** — never claim what you haven't looked at; label VERIFIED /
  INFERRED / ASSUMPTION. Full rules: `docs/rules/AGENT_RULES.md` (R1–R12), recipes:
  `docs/rules/EVIDENCE_PROTOCOL.md`.
- **Done = Definition of Done** in `docs/rules/DEVELOPMENT_ARCHITECTURE.md` — typecheck + tests +
  acceptance criteria + memory updated, with pasted evidence.
- **Two strikes then escalate** — after 2 failed attempts, package the problem per
  `docs/rules/ESCALATION_POLICY.md` into `docs/memory/QUESTIONS.md` and stop.
- **Session end** — update `docs/memory/` per the `session-end` skill before finishing.

## Current focus

M1 收尾：本機排程抓取＋發布（T-009）；使用者設 Pages 來源。與 STATE.md 同步。
