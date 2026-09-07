// 篩選抽屜驗收（390×844）。全部布林為 true 才算過。
(async () => {
  const R = {}; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const a = document.querySelector('aside');
  document.querySelector('#mFilt').click(); await wait(300);
  const d = document.querySelector('#filtDone').getBoundingClientRect();
  R.open = a.classList.contains('open');
  R.doneOnScreen = d.height > 0 && d.top >= 0 && d.bottom <= innerHeight;
  R.asideScrolls = a.scrollHeight > a.clientHeight && a.clientHeight <= innerHeight;
  R.bodyLocked = document.body.style.overflow === 'hidden';
  R.stateFilt = history.state?.filt === 1;
  history.back(); await wait(400);
  R.backClosed = !a.classList.contains('open') && location.href.startsWith(location.origin) && !!document.querySelector('#count');
  R.bodyUnlocked = document.body.style.overflow === '';
  // ✕ 與 Esc
  document.querySelector('#mFilt').click(); await wait(200); document.querySelector('#filtX').click(); await wait(350);
  R.xClosed = !a.classList.contains('open');
  document.querySelector('#mFilt').click(); await wait(200);
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(350);
  R.escClosed = !a.classList.contains('open');
  // 滑卡 → 篩選 → 上一頁 → 回到滑卡而不是看板
  document.querySelector('#mSwipe').click(); await wait(400);
  document.querySelector('[data-swfilt]').click(); await wait(200);
  R.drawerOverSwipe = a.classList.contains('open') && !!document.querySelector('.sw');
  history.back(); await wait(400);
  R.backToSwipe = !a.classList.contains('open') && !!document.querySelector('.sw') && history.state?.swipe === 1;
  history.back(); await wait(400);
  R.swipeClosed = !document.querySelector('.sw');
  R.allTrue = Object.values(R).filter((v) => typeof v === 'boolean').every(Boolean);
  return R;
})();
