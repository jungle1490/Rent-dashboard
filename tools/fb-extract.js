// 在「已登入」的 Facebook 社團頁面執行（DevTools Console 貼上，或做成書籤小工具）。
// 只做 DOM → 原始貼文 JSON；欄位抽取在 core/text-extract.mjs（tools/fb-import.mjs 會呼叫）。
// 不會送出任何請求、不碰你的帳號，等同於你自己捲頁面把看到的文字抄下來。
(async () => {
  const MIN_POSTS = window.__fbMinPosts || 20;   // 至少抓到這麼多篇才停
  const MAX_SCROLLS = 60;                         // 保險上限（約 90 秒）
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const gid = (location.pathname.match(/\/groups\/(\d+)/) || [])[1];
  if (!gid) return alert('請在 facebook.com/groups/<數字> 的社團頁（或其搜尋結果頁）執行');
  const groupName = (document.title.replace(/^\(\d+\)\s*/, '').split('|')[0] || '').trim();

  const clean = (s) => s.replace(/[͏​-‏⁠﻿]/g, '').replace(/[ \t]+/g, ' ').trim();
  const sel = `a[href*="/groups/${gid}/posts/"], a[href*="/groups/${gid}/permalink/"]`;
  const isSearch = /\/search\//.test(location.pathname);
  const countNow = () => isSearch
    ? [...(document.querySelector('[role="feed"]')?.children || [])].filter((b) => b.innerText.trim().length > 40).length
    : new Set([...document.querySelectorAll(sel)].map((a) => a.href.replace(/[?#].*$/, ''))).size;
  // 自動捲到夠為止：連續 8 次沒長出新貼文就當作到底了
  let stale = 0, last = countNow();
  for (let i = 0; i < MAX_SCROLLS && countNow() < MIN_POSTS; i++) {
    window.scrollBy(0, 1800); await sleep(1400);
    [...document.querySelectorAll('div[role="button"]')]
      .filter((b) => /^(?:顯示更多|查看更多|See more)$/.test(b.innerText.trim())).forEach((b) => b.click());
    const n = countNow(); stale = n > last ? 0 : stale + 1; last = n;
    if (stale >= 8) break;
  }
  await sleep(1200);

  const norm = (h) => h.replace(/[?#].*$/, '');
  const uniq = (el) => new Set([...el.querySelectorAll(sel)].map((a) => norm(a.href))).size;

  const posts = new Map();
  // 社團「關鍵字搜尋」結果頁（/groups/<id>/search/?q=…）：貼文全文與圖片都在，但沒有永久連結、沒有日期，
  // 用本文雜湊當 id，連結先指回搜尋頁。好處是可以先用「最新」與「發佈日期」篩選，比動態牆有效率。
  const hash = (t) => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
  if (isSearch) {
    const feed = document.querySelector('[role="feed"]');
    for (const box of feed ? [...feed.children] : []) {
      const paras = [...box.querySelectorAll('div[dir="auto"]')].map((x) => clean(x.innerText)).filter((t) => t.length > 1);
      const text = [...new Set(paras)].join('\n').split(/\n?顯示較少/)[0].trim();
      if (text.length < 40) continue;
      const images = [...box.querySelectorAll('img[src*="scontent"]')].filter((i) => (i.naturalWidth || i.width) > 150).map((i) => i.src);
      const id = 'q' + hash(text);
      posts.set(id, { id, link: location.href.replace(/[#].*$/, ''), text, postedText: '', images: [...new Set(images)].slice(0, 8), fromSearch: true });
    }
  }
  for (const a of isSearch ? [] : document.querySelectorAll(sel)) {
    const link = norm(a.href); if (posts.has(link)) continue;
    // 從永久連結往上爬，爬到「再上去就會包到別篇貼文」為止，那層就是這篇的容器
    let el = a, box = null;
    for (let d = 0; d < 16 && el.parentElement; d++) { el = el.parentElement; if (uniq(el) > 1) break; box = el; }
    if (!box) continue;
    const paras = [...box.querySelectorAll('div[dir="auto"]')].map((x) => clean(x.innerText)).filter((t) => t.length > 1);
    // 展開前後的版本會重複、留言也混在裡面：去重後只保留到「顯示較少」之前
    let text = [...new Set(paras)].join('\n');
    text = text.split(/\n?顯示較少/)[0].trim();
    if (text.length < 40) continue;   // 太短的多半是留言或「查看更多」殘片
    const images = [...box.querySelectorAll('img[src*="scontent"]')]
      .filter((i) => (i.naturalWidth || i.width) > 150).map((i) => i.src);
    const id = (link.match(/\/(?:posts|permalink)\/(\d+)/) || [])[1] || link;
    // 發文時間：時間文字被 FB 打散，但永久連結的 aria-label 是完整日期「2026年9月7日 星期一上午11:24」
    const postedText = [...box.querySelectorAll('a[aria-label]')].map((x) => x.getAttribute('aria-label'))
      .find((t) => /\d{4}年\d{1,2}月\d{1,2}日/.test(t || '')) || '';
    posts.set(link, { id, link, text, postedText, images: [...new Set(images)].slice(0, 8) });
  }

  const out = { group: { id: gid, name: groupName, url: `https://www.facebook.com/groups/${gid}/` },
                capturedAt: new Date().toISOString(), posts: [...posts.values()] };
  const json = JSON.stringify(out, null, 0);
  if (!out.posts.length) { alert('抽到 0 篇。可能動態還沒載入（再等幾秒重跑），或 FB 改版了。'); return out; }
  // 若 Mac 上開著 tools/fb-receiver.py（只聽 localhost），直接送過去，圖片網址不會被剪貼簿或擴充功能弄丟
  if (window.__fbPost) {
    try { const r = await fetch(window.__fbPost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json });
      if (r.ok) { window.__fbExtract = out; console.log(`已送到 ${window.__fbPost}：${out.posts.length} 篇`); return out; } } catch (e) { console.warn('送到本機接收器失敗', e); }
  }
  try { await navigator.clipboard.writeText(json); alert(`抽到 ${out.posts.length} 篇，JSON 已複製到剪貼簿。`); }
  catch { console.log(json); alert(`抽到 ${out.posts.length} 篇。剪貼簿不可用，JSON 已印在 Console。`); }
  window.__fbExtract = out;
  return out;
})();
