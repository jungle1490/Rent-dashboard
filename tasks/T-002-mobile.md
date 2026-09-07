# T-002: 手機版適配

- **Tier:** mid
- **Depends on:** T-001（篩選抽屜 `aside.open` 與滑卡已存在）
- **Scope (files):** `site/index.html`、`tasks/BACKLOG.md`、`docs/memory/*`

## Context

使用者要求「手機瀏覽也要可以適應」；架構上 UI 放 GitHub Pages 就是為了手機能開（ADR-0001）。
目前 ≤900px 只是把側欄堆到清單上方，要滑很久才看到物件，且沒有滑卡入口。

## Goal

手機上打開就是物件清單；篩選與滑卡從底部工具列進入；滑卡卡片在小螢幕不裁切；不出現橫向捲動。

## Non-goals

- PWA／加到主畫面圖示
- 手勢關閉抽屜（用「完成」鈕與上一頁即可）
- 桌面版面調整

## Acceptance criteria

- [ ] ≤900px：`aside` 預設不顯示；底部固定工具列有「篩選」「滑卡」；「篩選」開全螢幕抽屜且有「完成」鈕；桌面的「⚡ 滑卡」鈕隱藏
- [ ] ≤600px：卡片單欄
- [ ] 375×667：`document.documentElement.scrollWidth <= innerWidth`（無橫向捲動）
- [ ] 375×667 滑卡：`.sc.front` 的 rect 完全在 `.stage` 的 rect 內（不裁切）
- [ ] 清單最後一張卡片不被底部工具列遮住（`.wrap` padding-bottom ≥ 工具列高）
- [ ] >900px：`aside` 顯示、工具列隱藏（桌面版面不變）
- [ ] iOS safe-area：viewport 帶 `viewport-fit=cover`，工具列與滑卡按鈕列有 `env(safe-area-inset-bottom)`
- [ ] New behavior covered by tests — 無（純 CSS／版面）；以 375×667 與桌面兩組瀏覽器斷言取代

## Verification

```bash
node --check scrape.mjs
# 瀏覽器：resize 375×667 → 上述斷言全 true；resize desktop → aside 可見、.mbar 隱藏
```

## Hints

- `aside.open` 的固定定位樣式已在 T-001 放在 media query 外；手機只需 `aside{display:none} aside.open{display:block}`
- 滑卡卡片高度用 `min(76vh, 680px)` 再加 `max-height` 保險，stage 有 `overflow:hidden`
