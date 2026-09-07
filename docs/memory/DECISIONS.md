# DECISIONS — dated, with rationale

## 2026-09-08

- **用 Node 零依賴而非 Python + Playwright**：資料在 HTML 內嵌 JS 裡，Node 的 `vm` 直接求值；Actions 內建 Node，省掉裝 Chromium 的 2 分鐘。
- **不帶 `metro=` 參數，整批抓、前端篩**：`metro=` 會把跨線站 AND 掉；前端篩 4,000 筆無壓力，且條件改了不用等下一輪。
- **抓取結果不進 git，用 Actions artifact 部署 Pages，cache 帶上一輪**：每 30 分鐘 commit 會把 repo 撐爆。代價：需要 keepalive 防排程停用。
- **UI 放 GitHub Pages 而非 Artifact／本機**：使用者要求電腦關機也能更新；Artifact 的 CSP 擋外部 fetch，本機方案關機即停。
- **面板／滑卡走 history API**：使用者明確要「上一頁回到看板」，手機返回手勢同理。
- **「排除」與「已看」分開存**：滑卡跳過的物件在「全部」仍要看得到（使用者明確要求）。
- **網頁資產移到 `site/`**：框架佔用 `docs/`；Pages 用 artifact 部署，不依賴 `docs/` 慣例。
- **FB 社團只在使用者登入的瀏覽器內抽取，不進 Actions**（ADR-0002）：無 API、雲端必封且危及帳號；抽不到的欄位留 null 不猜。
- **`site/fb.json` 進 git、`site/data.json` 不進**：前者是人工匯入產物沒有排程會重生；後者每 30 分鐘一份。
- **未標欄位篩選預設放行，另給「隱藏未標」開關**：使用者要「找不出來的就放連結自己看」；排除會讓 FB 房源幾乎全消失。
- **網頁動態 import core 模組（複製到 site/）而非重複實作**：抽取規則只維護一份；代價是本機開發多一步 cp。
- **引進 agent framework 時網頁資產 docs/ → site/**：框架佔用 docs/，Pages 用 artifact 部署不依賴 docs/ 慣例。
- **抓取移到 Mac、GitHub 只發布**（ADR-0003）：591 擋 Actions IP；孤兒分支 force push 讓 repo 不成長；資料新鮮度＝Mac 最後一次執行，使用者接受每日一次。
