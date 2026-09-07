# 台北租屋看板

定期從 591 抓台北市租屋物件，放進一個可以**多重複選**的自製介面。

做這個的原因：591 的篩選一次只能選一條捷運線、行政區也不好複選，而且沒有「這個我看過了，別再出現」的功能。

## 它解決了什麼

| | 591 | 這個 |
|---|---|---|
| 捷運線 | 一次一條 | **多條線一起選**，還能再細選到站 |
| 行政區 | 不好複選 | 多區複選，每區顯示筆數 |
| 看過的物件 | 每次重看一遍 | 標記排除，永久不再出現 |
| 新物件 | 只有 591 自己的「新上架」標籤 | 比對歷次抓取，真的第一次出現才標記 |
| 額外費用 | 要點進去才知道 | 卡片上直接顯示，可只看無額外費用 |
| 降價 | 看不出來 | 跟上次比對，降價直接標在卡片上 |

其他：離捷運站距離、坪數、房型、屋主直租／仲介、可養寵物／可開伙／可報稅等條件都能複選。收藏和排除記錄存在瀏覽器本機。

## 架構

```
你的 Mac（launchd 每天 08:00；睡眠錯過會在喚醒後補跑）
   └─ tools/run-local.sh：node scrape.mjs 抓 591 → tools/publish.sh
                                                     ↓ force push 孤兒分支 data（歷史不成長）
GitHub Actions（push 到 main／data 就跑）
   └─ 把 data 分支的 data.json／fb.json 疊到 site/ → 發布 GitHub Pages

任何裝置 → https://<帳號>.github.io/<repo>/
```

為什麼不在 GitHub 上抓：591 對 GitHub Actions 的機房 IP 回 403（CloudFront 封鎖），只有台灣的 IP 打得到。
所以資料的新鮮度＝你的 Mac 最後一次執行；網址本身隨時都開得到。

FB 社團房源：在你登入的瀏覽器裡跑 `tools/fb-extract.js`（會自動捲到至少 20 篇；社團的關鍵字搜尋頁也能跑，效率更好），
貼進看板「匯入」或 `node tools/fb-import.mjs`。要連圖片一起帶回：先 `python3 tools/fb-receiver.py`，在 Console 先執行
`window.__fbPost='http://localhost:8898/'` 再貼腳本，結果會落在 `logs/fb-inbox/`（見 docs/adr/ADR-0002）。
追蹤的社團：459966811445588、305665579858865、221614965050605、313385739282042。

## 安裝

1. 建一個**公開** repo，把這些檔案推上去。
2. Repo → **Settings → Pages → Source** 選 **GitHub Actions**（必要，不是預設）。
3. 在 Mac 上：`brew install gh && gh auth login`，然後

```bash
bash tools/install-launchd.sh 8      # 每天 08:00；改數字換時間
bash tools/run-local.sh              # 現在先跑一次（約 5 分鐘）
```

跑完約一分鐘後網址就有資料。之後每天自動。

想在排程以外「現在就抓」：看板頂端「⚡ 請 Mac 抓新資料」→ GitHub 的 Run workflow 按一下（手機 GitHub App 也行），
或 `gh workflow run refresh.yml`。Mac 每 5 分鐘檢查一次，抓完約 5 分鐘上線。Mac 睡著就等它醒。

## 調整抓取範圍

改 `config.json`：

```json
{
  "queries": [
    { "name": "台北市 整層住家 1.5-4.5萬", "query": "region=1&kind=1&price=15000_45000" }
  ]
}
```

`query` 就是 591 網址 `?` 後面那串。`region=1` 是台北市，
`kind` 是 1=整層住家 2=獨立套房 3=分租套房 4=雅房。

**建議抓寬一點**（價格帶放大、房型多放幾種），因為細部篩選都在網頁上做，
抓得寬你在介面上調整的空間才大。抓太窄的話，想放寬條件就得等下一輪。

## 本機測試

```bash
cp core/*.mjs site/ && node scrape.mjs && python3 -m http.server 8899 --directory site
```

## 注意事項

- **抓取頻率**：預設每天一次、每頁間隔 0.7 秒，對 591 是很輕的負擔。
- **591 改版**：`scrape.mjs` 依賴 591 頁面內嵌的 `window.__NUXT__` 資料。如果 591 改版，
  抓取會直接報錯中止（不會用空資料覆蓋掉舊的），Actions 會寄失敗通知給你。
- **Mac 沒開就不更新**：資料停在最後一次；看板頂部「資料更新於」看得出來。手動補跑：`bash tools/run-local.sh`。
- **收藏／排除存在瀏覽器本機**，換裝置或清快取不會同步。要跨裝置同步得另外接儲存。

`legacy/` 是先前 Telegram 推播版本的檔案，沒有在用，留著參考。
