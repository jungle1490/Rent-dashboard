// 原始貼文（tools/fb-extract.js 的輸出）→ 看板物件。純函式；只 import 同層的 core。
import { extractListing } from './text-extract.mjs';

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
    isSeeking: x.isSeeking, tags: [], contains: [], address: '', role: '',
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
  s.listings = [...byId.values()].sort((a, b) => (b.capturedAt > a.capturedAt ? 1 : -1));
  s.importedAt = new Date().toISOString();
  return { store: s, added, updated };
}
