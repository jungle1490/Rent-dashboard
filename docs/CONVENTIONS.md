# CONVENTIONS — Rent-dashboard

## 程式碼（JavaScript）

- **ESM、零依賴。** `scrape.mjs` 只用 `node:` 內建；`site/index.html` 純瀏覽器 API，不載外部 script。
- **註解用繁體中文，說「為什麼」不說「做什麼」。** 現有程式碼的密度是標準：只在非顯而易見處寫。
- **命名**：camelCase；資料欄位與 591 原始欄位對照時，正規化後的名稱用我們自己的（`extraFee` 不是 `extra_fee`）。
- **數字欄位一律用 `toNum()` 轉**，591 的價格是帶逗號的字串。
- **HTML 內插一律 `escapeHtml()`**，標題、地址、標籤都是使用者輸入。
- **localStorage 讀寫包 try/catch**，key 前綴 `rent591.`。
- **不用 `eval`。** 遠端 `__NUXT__` 只能 `vm.runInNewContext(src, Object.create(null), {timeout})`。

## 抓取（scrape.mjs）

- 每頁間隔 `delayMs`（預設 700ms），**不要調低**。每輪約 135 頁。
- 抓取範圍在 `config.json`，**抓寬**；細篩全在前端。
- **不要帶 `metro=`**：它與 `station=` 是 AND，會砍掉跨線站。
- 站名解析順序：原字串 → 臺→台 → 去「捷運」前綴、括號、「N號出口」、「捷運站」→ 去「站」。**先比原字串**（台北車站）。
- 對不到路線的站名保留原字（多半是公車站），`lines: []`。
- 新上架＝`firstSeen` 由上一輪帶入；沒帶到就是現在。**不是 591 的「新上架」tag。**
- 抓到 0 筆或 <上一輪 50% → `process.exit(1)`，不寫檔。
- 已下架：上一輪有、這輪沒有 → 保留 7 天並標 `gone: true`。
- 輸出 `site/data.json`，**不進 git**。

## 前端（site/index.html）

- 篩選狀態集中在 `F`，變更後呼叫 `render()`；`render(true)` 保留已展開的筆數（收藏／排除／已看時用），`render()` 重設為 60 筆。
- 覆蓋層一律 `history.pushState` 開、`history.back()` 關；`popstate` 是唯一移除 DOM 的地方。
  z-index：滑卡 45 < 詳細面板 50 < 篩選抽屜 55。
- 三種使用者標記各自獨立：`saved`（收藏）、`hidden`（排除，不顯示）、`seen`（已看，仍顯示）。滑卡：左滑＝hidden+seen、右滑＝saved+seen（T-013）。
- 「新上架」徽章只在 `NEW_MEANINGFUL` 為真時顯示（首輪全是新的就整個關掉）。
- 圖片 `loading="lazy"`；一次最多塞 60 張卡片進 DOM。

## 領域名詞

| 名詞 | 意思 |
|---|---|
| 整層住家 / 獨立套房 / 分租套房 / 雅房 | 591 `kind` 1 / 2 / 3 / 4 |
| 額外費用 `extraFee` | 591 `extra_fee`，租金之外每月加收（多為管理費） |
| 租金已含 `contains` | 從 `price_contain_text` 拆出：管理費／水費／電費／網路／第四臺／瓦斯費／清潔費／車位租金 |
| 總額 | `price + extraFee` |
| 已下架 `gone` | 這輪沒抓到但 7 天內抓到過 |

## 待補（domain-specific，請專案擁有者填）

- [ ] 「好物件」的判準（例如每坪租金門檻、必要標籤）——若之後要做評分或排序權重
- [ ] 各捷運線／行政區的優先順序——若之後要做預設篩選

## 社群房源（FB 社團，ADR-0002）

- **FB 只在使用者登入的瀏覽器裡抽**（`tools/fb-extract.js`），永遠不進 Actions、不存 session。
- 抽取分兩層：DOM → 原始貼文 JSON（頁面內）；文字 → 欄位（`core/text-extract.mjs`，純函式、零 import、有 `node --test`）。
- **抽不到就 `null`，不猜。** UI 對 `null` 欄位預設不排除。
- 中文 `\b` 不成立（中文不是 `\w`），單位後面一律用 `(?!\d)`。
- 中文數字只在「房／廳／衛」前面轉成阿拉伯數字，其他地方不轉（三重、五股、一女）。
- 由 agent 透過瀏覽器擴充功能代跑時**拿不到圖片網址**（簽章 query string 被擋）；只有使用者自己跑書籤小工具才有 `images`。`imageCount` 兩種都有。
- `site/fb.json` **要進 git**（跟 `data.json` 相反）：它是人工匯入的產物，沒有排程會重生它。
- 步行「N 分鐘」→ `stationDist = N × 80`，並標 `stationDistApprox: true`。
- 已知缺口（待補）：地標→行政區（天母→士林區）；「走路含等紅綠燈約20分鐘」這種中間插字的距離寫法。
