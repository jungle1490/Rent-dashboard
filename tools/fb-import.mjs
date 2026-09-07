#!/usr/bin/env node
// 把 tools/fb-extract.js 的輸出（一個或多個 JSON 檔）合併進 site/fb.json。
// 用法：node tools/fb-import.mjs raw1.json [raw2.json ...]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeFb } from '../core/fb-listing.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'site', 'fb.json');
const MRT = JSON.parse(await readFile(path.join(ROOT, 'mrt-lines.json'), 'utf8'));

const files = process.argv.slice(2);
if (!files.length) { console.error('用法：node tools/fb-import.mjs <extract.json>...'); process.exit(1); }

let store = null;
if (existsSync(OUT)) { try { store = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* 壞檔就重來 */ } }
let added = 0, updated = 0;
for (const f of files) {
  const r = mergeFb(store, JSON.parse(await readFile(f, 'utf8')), MRT);
  store = r.store; added += r.added; updated += r.updated;
}
await writeFile(OUT, JSON.stringify(store));
const n = store.listings.length;
console.log(`site/fb.json：共 ${n} 筆（新增 ${added}、更新 ${updated}）；求租 ${store.listings.filter((l) => l.isSeeking).length}；抽到價格 ${store.listings.filter((l) => l.price != null).length}/${n}`);
