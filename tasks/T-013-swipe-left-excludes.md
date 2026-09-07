# T-013: 滑卡左滑＝排除

- **Tier:** low
- **Depends on:** T-001
- **Scope (files):** `site/index.html`、`test/browser/swipe.js`、`CLAUDE.md`、`docs/CONVENTIONS.md`、`tasks/`、`docs/memory/*`

## Context
使用者 2026-09-08 改需求：「左滑應該要等於排除，可以在已排除內找到」。原 T-001 是左滑只標已看。

## Acceptance criteria
- [ ] 左滑（或 ✕／←）→ 加入 `rent591.hidden` 與 `rent591.seen`；「已排除」分頁看得到；「全部」看不到
- [ ] 返回 → 從 hidden 與 seen 移除
- [ ] 右滑行為不變（收藏＋已看，不排除）
- [ ] `test/browser/swipe.js` 對應更新並全 true
