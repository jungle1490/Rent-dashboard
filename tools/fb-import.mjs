#!/usr/bin/env node
// 把 tools/fb-extract.js 的輸出（一個或多個 JSON 檔）轉成看板欄位，合併進 site/fb.json。
// 用法：node tools/fb-import.mjs raw1.json [raw2.json ...]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractListing } from '../core/text-extract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'site', 'fb.json');
const MRT = JSON.parse(await readFile(path.join(ROOT, 'mrt-lines.json'), 'utf8'));

const files = process.argv.slice(2);
if (!files.length) { console.error('用法：node tools/fb-import.mjs <extract.json>...'); process.exit(1); }

let store = { importedAt: null, groups: {}, listings: [] };
if (existsSync(OUT)) { try { store = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* 壞檔就重來 */ } }
const byId = new Map(store.listings.map((l) => [l.id, l]));

let added = 0, updated = 0;
for (const f of files) {
  const raw = JSON.parse(await readFile(f, 'utf8'));
  store.groups[raw.group.id] = raw.group;
  for (const p of raw.posts) {
    const x = extractListing(p.text, MRT);
    const id = 'fb:' + p.id;
    const prev = byId.get(id);
    if (prev && prev.capturedAt >= raw.capturedAt) continue;   // 同 id 以較新為準
    // 由 agent 透過瀏覽器擴充功能代跑時拿不到圖片網址（帶簽章 query string 會被擋），
    // 只有 imageCount；使用者自己跑書籤小工具走剪貼簿才有 images。
    const images = Array.isArray(p.images) ? p.images : [];
    const item = {
      id, source: 'fb', group: raw.group.name, groupId: raw.group.id,
      url: p.link, title: p.text.split('\n')[0].slice(0, 60), raw: p.text,
      cover: images[0] || (prev?.cover || ''), photos: images.length ? images : (prev?.photos || []),
      imageCount: images.length || p.imageCount || 0,
      price: x.price, extraFee: x.extraFee, feeIncluded: x.feeIncluded,
      district: x.district, outsideTaipei: x.outsideTaipei,
      station: x.station, stationDist: x.stationDist, stationDistApprox: x.stationDistApprox,
      lines: x.station ? Object.entries(MRT).filter(([, ss]) => ss.includes(x.station)).map(([l]) => l) : [],
      layout: x.layout, kind: x.kind, area: x.area, floor: x.floor,
      isSeeking: x.isSeeking, tags: [],
      capturedAt: raw.capturedAt,
      firstSeen: prev?.firstSeen || raw.capturedAt, lastSeen: raw.capturedAt,
    };
    byId.set(id, item); prev ? updated++ : added++;
  }
}
store.listings = [...byId.values()].sort((a, b) => (b.capturedAt > a.capturedAt ? 1 : -1));
store.importedAt = new Date().toISOString();
await writeFile(OUT, JSON.stringify(store));
const n = store.listings.length, seeking = store.listings.filter((l) => l.isSeeking).length;
const priced = store.listings.filter((l) => l.price != null).length;
console.log(`site/fb.json：共 ${n} 筆（新增 ${added}、更新 ${updated}）；求租 ${seeking}；抽到價格 ${priced}/${n}`);
