// 在「已登入」的 Facebook 社團頁面執行（DevTools Console 貼上，或做成書籤小工具）。
// 只做 DOM → 原始貼文 JSON；欄位抽取在 core/text-extract.mjs（tools/fb-import.mjs 會呼叫）。
// 不會送出任何請求、不碰你的帳號，等同於你自己捲頁面把看到的文字抄下來。
(async () => {
  const SCROLLS = 12;                       // 捲幾次（每次約 1.5 秒），社團動態很慢
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const gid = (location.pathname.match(/\/groups\/(\d+)/) || [])[1];
  if (!gid) return alert('請在 facebook.com/groups/<數字> 的社團頁執行');
  const groupName = (document.title.replace(/^\(\d+\)\s*/, '').split('|')[0] || '').trim();

  for (let i = 0; i < SCROLLS; i++) {
    window.scrollBy(0, 1600); await sleep(1500);
    [...document.querySelectorAll('div[role="button"]')]
      .filter((b) => /^(?:顯示更多|查看更多|See more)$/.test(b.innerText.trim())).forEach((b) => b.click());
  }
  await sleep(1200);

  const clean = (s) => s.replace(/[͏​-‏⁠﻿]/g, '').replace(/[ \t]+/g, ' ').trim();
  const sel = `a[href*="/groups/${gid}/posts/"], a[href*="/groups/${gid}/permalink/"]`;
  const norm = (h) => h.replace(/[?#].*$/, '');
  const uniq = (el) => new Set([...el.querySelectorAll(sel)].map((a) => norm(a.href))).size;

  const posts = new Map();
  for (const a of document.querySelectorAll(sel)) {
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
    posts.set(link, { id, link, text, images: [...new Set(images)].slice(0, 8) });
  }

  const out = { group: { id: gid, name: groupName, url: `https://www.facebook.com/groups/${gid}/` },
                capturedAt: new Date().toISOString(), posts: [...posts.values()] };
  const json = JSON.stringify(out, null, 0);
  if (!out.posts.length) { alert('抽到 0 篇。可能動態還沒載入（再等幾秒重跑），或 FB 改版了。'); return out; }
  try { await navigator.clipboard.writeText(json); alert(`抽到 ${out.posts.length} 篇，JSON 已複製到剪貼簿。`); }
  catch { console.log(json); alert(`抽到 ${out.posts.length} 篇。剪貼簿不可用，JSON 已印在 Console。`); }
  window.__fbExtract = out;
  return out;
})();
