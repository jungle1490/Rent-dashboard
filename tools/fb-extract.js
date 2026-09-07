// 在「已登入」的 Facebook 社團頁面執行（DevTools Console 貼上，或做成書籤小工具）。
// 用自動化工具代跑時：window.__fbPost／__fbKnown／__fbMinPosts 的設定要跟這支腳本放在「同一次」執行，
// 每次 javascript 執行是獨立環境，分開設就會遺失。
// 建議網址：
//   搜尋頁  https://www.facebook.com/groups/<id>/search/?q=出租   （腳本會自動打開「最新」開關，依發文時間排序）
//   動態牆  https://www.facebook.com/groups/<id>/?sorting_setting=CHRONOLOGICAL   （新貼文優先）
// 只做 DOM → 原始貼文 JSON；欄位抽取在 core/text-extract.mjs（tools/fb-import.mjs 會呼叫）。
// 不會送出任何請求、不碰你的帳號，等同於你自己捲頁面把看到的文字抄下來。
(async () => {
  const MIN_POSTS = window.__fbMinPosts || 20;   // 至少抓到這麼多篇才停
  // 已抓過的 id（'fb:' 可省略）：在「新貼文優先」的頁面上，連續碰到舊貼文就提早停，不用整頁捲完
  const KNOWN = new Set([...(window.__fbKnown || [])].map((x) => String(x).replace(/^fb:/, '')));
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
  // 搜尋頁：先把左側「最新」開關打開（依發文時間排序），沒開的話結果是「最相關」
  if (isSearch) {
    const sw = [...document.querySelectorAll('[role="switch"], input[type="checkbox"]')]
      .find((el) => /最新|Most recent/.test((el.closest('label, div')?.innerText || el.getAttribute('aria-label') || '')));
    if (sw && sw.getAttribute('aria-checked') !== 'true' && !sw.checked) { sw.click(); await sleep(2500); }
  }
  // 自動捲到夠為止：連續 8 次沒長出新貼文就當作到底了
  const hash = (t) => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
  const idOfBox = (b) => {
    if (!isSearch) { const a = b.querySelector(sel); const m = a && a.href.match(/\/(?:posts|permalink)\/(\d+)/); return m ? m[1] : null; }
    const t = clean([...new Set([...b.querySelectorAll('div[dir="auto"]')].map((x) => clean(x.innerText)).filter((x) => x.length > 1))].join('\n').split(/\n?顯示較少/)[0]);
    return t.length >= 40 ? 'q' + hash(t) : null;
  };
  const newCount = () => { if (!KNOWN.size) return countNow();
    const boxes = [...(document.querySelector('[role="feed"]')?.children || [])];
    return boxes.map(idOfBox).filter((id) => id && !KNOWN.has(id)).length; };
  const tailAllKnown = () => { if (!KNOWN.size) return false;
    const ids = [...(document.querySelector('[role="feed"]')?.children || [])].map(idOfBox).filter(Boolean).slice(-8);
    return ids.length >= 8 && ids.every((id) => KNOWN.has(id)); };
  let stale = 0, last = countNow();
  for (let i = 0; i < MAX_SCROLLS && newCount() < MIN_POSTS; i++) {
    if (tailAllKnown()) { console.log('最後 8 篇都抓過了，提早停'); break; }
    window.scrollBy(0, 1800); await sleep(1400);
    [...(document.querySelector('[role="feed"]') || document).querySelectorAll('div[role="button"]')]
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
  // 動態牆：貼文容器 = [role=feed] 的直接子元素且恰含 1 個永久連結（往上爬 16 層只會爬到標頭，本文在更深層）
  const feedBoxes = isSearch ? [] : [...(document.querySelector('[role="feed"]')?.children || [])].filter((b) => uniq(b) === 1);
  for (const box of feedBoxes) {
    const a = box.querySelector(sel); const link = norm(a.href); if (posts.has(link)) continue;
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
    window.__fbExtract = out;
    // FB 的 CSP 不准頁面 fetch localhost，所以改成「導向接收器的頁面、資料放在 # 後面」，由那頁再存檔。
    // 導向後可按上一頁回到 FB。
    location.href = window.__fbPost.replace(/\/?$/, '/') + '#' + encodeURIComponent(json);
    return out;
  }
  try { await navigator.clipboard.writeText(json); alert(`抽到 ${out.posts.length} 篇，JSON 已複製到剪貼簿。`); }
  catch { console.log(json); alert(`抽到 ${out.posts.length} 篇。剪貼簿不可用，JSON 已印在 Console。`); }
  window.__fbExtract = out;
  return out;
})();
