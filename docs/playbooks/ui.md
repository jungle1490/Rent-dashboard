# Playbook — 前端／覆蓋層

| 症狀 | 根因 | 修法 | 證據 |
|---|---|---|---|
| 手機上篩選抽屜關不掉；按返回直接離開網站 | (1) `aside.open` 用 `max-height:none`，fixed 元素長到內容高（1241px > 844px 視窗）且不捲動，「完成」鈕永遠在畫面外；(2) 抽屜沒走 history，違反 CONVENTIONS 第 8 條 | `height:100%;max-height:100%;overflow-y:auto`；開抽屜 `pushState({filt:1})`、關一律 `history.back()`；加頂部 ✕ | 2026-09-08 在 390×844 重現：`doneRect [1173,1222] vs vh 844`、`scrollHeight==clientHeight`；`test/browser/drawer.js` |
| 驗收通過但實際不能用 | 斷言只查 `display!=none`，沒查元素是否在視窗內 | 覆蓋層的驗收一律檢查 `getBoundingClientRect()` 落在 `[0, innerHeight]` | 同上 |
