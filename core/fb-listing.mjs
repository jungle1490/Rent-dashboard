// 原始貼文（tools/fb-extract.js 的輸出）→ 看板物件。純函式；只 import 同層的 core。
import { extractListing } from './text-extract.mjs';

/** 「2026年9月7日 星期一上午11:24」→ ISO（台灣時間）。解析不了回 null。 */
export function parseFbDate(text) {
  const m = String(text || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:[^\d]*?(上午|下午)?\s*(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  let h = m[5] != null ? parseInt(m[5], 10) : 0; const mi = m[6] != null ? parseInt(m[6], 10) : 0;
  if (m[4] === '下午' && h < 12) h += 12;
  if (m[4] === '上午' && h === 12) h = 0;
  const pad = (n) => String(n).padStart(2, '0');
  return `${m[1]}-${pad(m[2])}-${pad(m[3])}T${pad(h)}:${pad(mi)}:00+08:00`;
}
export const KEEP_DAYS = 30;   // FB 只留最近一個月

export function postToListing(post, group, capturedAt, mrtLines, prev) {
  const x = extractListing(post.text, mrtLines);
  // 由 agent 透過瀏覽器擴充功能代跑時拿不到圖片網址（簽章 query string 被擋），只有 imageCount
  const images = Array.isArray(post.images) ? post.images : [];
  return {
    id: 'fb:' + post.id, source: 'fb', group: group.name, groupId: group.id,
    url: post.link, title: post.text.split('\n').map((s) => s.trim()).filter(Boolean)[0]?.slice(0, 60) || '(無標題)',
    raw: post.text,
    cover: images[0] || prev?.cover || '', photos: images.length ? images : (prev?.photos || []),
    imageCount: images.length || post.imageCount || 0,
    price: x.price, extraFee: x.extraFee, feeIncluded: x.feeIncluded,
    district: x.district, outsideTaipei: x.outsideTaipei,
    station: x.station, stationDist: x.stationDist, stationDistApprox: x.stationDistApprox,
    lines: x.station ? Object.entries(mrtLines).filter(([, ss]) => ss.includes(x.station)).map(([l]) => l) : [],
    layout: x.layout, kind: x.kind, area: x.area, floor: x.floor,
    isSeeking: x.isSeeking, isSale: x.isSale, tags: [], contains: [], address: '', role: '',
    postedAt: parseFbDate(post.postedText) || prev?.postedAt || null,
    capturedAt, firstSeen: prev?.firstSeen || capturedAt, lastSeen: capturedAt, gone: false,
  };
}

/** 把一份原始抽取結果合併進 store（{importedAt, groups, listings}）。同 id 只在較舊時跳過，相同時間重抽。 */
export function mergeFb(store, raw, mrtLines) {
  const s = { importedAt: store?.importedAt || null, groups: { ...(store?.groups || {}) },
              listings: [...(store?.listings || [])] };
  const byId = new Map(s.listings.map((l) => [l.id, l]));
  let added = 0, updated = 0;
  s.groups[raw.group.id] = raw.group;
  for (const p of raw.posts || []) {
    const id = 'fb:' + p.id, prev = byId.get(id);
    if (prev && prev.capturedAt > raw.capturedAt) continue;
    byId.set(id, postToListing(p, raw.group, raw.capturedAt, mrtLines, prev));
    prev ? updated++ : added++;
  }
  // 只留最近 KEEP_DAYS 天：有發文時間看發文時間，沒有就看抓到的時間
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  s.listings = [...byId.values()]
    .filter((l) => new Date(l.postedAt || l.capturedAt).getTime() >= cutoff)
    .sort((a, b) => ((b.postedAt || b.capturedAt) > (a.postedAt || a.capturedAt) ? 1 : -1));
  s.importedAt = new Date().toISOString();
  return { store: s, added, updated };
}
