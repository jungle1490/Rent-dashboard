#!/usr/bin/env node
// 從 591 抓台北市租屋物件，輸出 site/data.json 供前端 UI 使用。
//
// 591 把清單資料以壓縮過的 JS（window.__NUXT__）內嵌在 HTML 裡，必須用 JS 引擎求值。
// 遠端內容一律當成不可信：在空 context 的 vm 沙箱裡跑，並設逾時，避免碰到 fs / net / process。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'site', 'data.json');

const cfg = JSON.parse(await readFile(path.join(ROOT, 'config.json'), 'utf8'));
const MRT = JSON.parse(await readFile(path.join(ROOT, 'mrt-lines.json'), 'utf8'));

// 站名 -> 所屬路線（同一站可能屬於多條線，如中山、東門）
const STATION_LINES = {};
for (const [line, stations] of Object.entries(MRT)) {
  for (const st of stations) (STATION_LINES[st] ??= []).push(line);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 591 的站名寫法很雜：「臺北小巨蛋」「捷運景安站」「松山機場捷運站2號出口」
// 「捷運台北101/世貿站(信義)」都要能對回同一個站。逐步剝掉前後綴再比對。
function resolveStation(desc) {
  const raw = String(desc || '').replace(/^距/, '').trim();
  if (!raw) return { station: '', lines: [] };
  const norm = raw.replace(/臺/g, '台');
  const cands = [norm];
  let t = norm.replace(/^捷運/, '')
              .replace(/（[^）]*）|\([^)]*\)/g, '')
              .replace(/\d+號出口$/, '')
              .replace(/捷運站$/, '')
              .trim();
  cands.push(t);
  if (t.endsWith('站')) cands.push(t.slice(0, -1));   // 「台北車站」本身在表裡，會先命中
  for (const c of cands) if (STATION_LINES[c]) return { station: c, lines: STATION_LINES[c] };
  return { station: t || norm, lines: [] };           // 對不到的多半是公車站，保留名字
}

// 租金已包含哪些費用，從「(租金含管理費/水費/網路等)」這種字串拆出來
const CONTAIN_ITEMS = ['管理費', '水費', '電費', '網路', '第四臺', '瓦斯費', '清潔費', '車位租金'];
const parseContains = (text) => {
  const t = String(text || '').replace(/第四台/g, '第四臺');
  return CONTAIN_ITEMS.filter((k) => t.includes(k));
};

/** 從清單頁 HTML 取出 __NUXT__ payload，於沙箱中求值 */
function extractPayload(html) {
  const i = html.indexOf('window.__NUXT__=');
  if (i === -1) throw new Error('找不到 __NUXT__ payload（591 版型可能改了）');
  const j = html.indexOf('</script>', i);
  const src = html.slice(i + 'window.__NUXT__='.length, j).trim().replace(/;$/, '');
  // 空 sandbox：沒有 require / process / fetch，逾時 5 秒
  return vm.runInNewContext(`(${src})`, Object.create(null), { timeout: 5000 });
}

/** 在 payload 裡找出帶 items + total 的清單節點 */
function findListNode(obj) {
  let found = null;
  const seen = new Set();
  (function walk(o) {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o.items) && o.total !== undefined) found = o;
    for (const k in o) walk(o[k]);
  })(obj);
  return found;
}

async function fetchPage(query, page) {
  const url = `https://rent.591.com.tw/list?${query}&page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-TW,zh;q=0.9' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  const node = findListNode(extractPayload(await res.text()));
  if (!node) throw new Error(`頁面無清單資料 @ ${url}`);
  return { items: node.items, total: Number(node.total) || 0 };
}

const toNum = (v) => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** 把 591 的原始物件正規化成 UI 需要的形狀 */
function normalize(raw) {
  const address = raw.address || '';
  const district = (address.match(/^([^-]+區)/) || [])[1] || '';

  // surrounding: { desc: "距松江南京", distance: "597公尺", type: "metro" }
  const sur = raw.surrounding || {};
  const isMetro = sur.type === 'metro';
  const { station, lines } = isMetro ? resolveStation(sur.desc) : { station: '', lines: [] };
  const stationDist = isMetro ? toNum(String(sur.distance || '').replace(/公尺|m/gi, '')) : null;

  const tags = (raw.tags || []).map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean);

  return {
    id: raw.id,
    title: raw.title || '',
    url: raw.url || `https://rent.591.com.tw/${raw.id}`,
    price: toNum(raw.price),
    // 額外費用（管理費／水電等）：591 只在 extra_fee 給數字，文字敘述在 extra_fee_text
    extraFee: toNum(raw.extra_fee),
    extraFeeText: raw.extra_fee_text || '',
    priceContainText: raw.price_contain_text || '',
    // 租金已包含的費用項目（管理費／水費／網路…），供 UI 篩選
    contains: parseContains(raw.price_contain_text),
    area: toNum(raw.area),
    layout: raw.layoutStr || raw.room || '',
    floor: raw.floor_name || '',
    kind: raw.kind_name || raw.ding_kind_name || '',
    address,
    district,
    sectionId: raw.sectionid ?? null,
    community: raw.community_name || '',
    role: raw.role_name || '',
    fitment: raw.fitment_name === '--' ? '' : raw.fitment_name || '',
    station,
    stationDist,
    lines,
    tags,
    cover: raw.cover || (raw.photoList || [])[0] || '',
    // 詳細面板的相簿用。591 一筆最多給 8~15 張，取前 8 張夠看又不會讓檔案太肥。
    photos: (raw.photoList || []).slice(0, 8),
    refreshTime: raw.refresh_time || '',
    browseCount: raw.browse_count ?? null,
    socialHouse: !!raw.social_house,
  };
}

async function scrapeQuery(q) {
  const listings = new Map();
  const first = await fetchPage(q.query, 1);
  const pages = Math.min(Math.ceil(first.total / 30), cfg.maxPagesPerQuery ?? 40);
  for (const it of first.items) listings.set(it.id, it);
  console.log(`  [${q.name}] 共 ${first.total} 筆 → 抓 ${pages} 頁`);

  for (let p = 2; p <= pages; p++) {
    await sleep(cfg.delayMs ?? 800);
    let items = null;
    for (let attempt = 1; attempt <= 3 && !items; attempt++) {   // 零星 fetch failed 是暫時性的，重試而不是略過
      try { items = (await fetchPage(q.query, p)).items; }
      catch (e) { if (attempt === 3) console.warn(`    ! 第 ${p} 頁三次都失敗，略過：${e.message}`); else await sleep(2000 * attempt); }
    }
    if (!items) continue;
    if (!items.length) break;
    for (const it of items) listings.set(it.id, it);
    if (p % 10 === 0) console.log(`    ...第 ${p}/${pages} 頁（累計 ${listings.size} 筆）`);
  }
  return listings;
}

// ---- 主流程 ----
const now = new Date().toISOString();

// 讀舊資料，用來判斷「新上架」與保留首次出現時間
let previous = { listings: [] };
if (existsSync(OUT)) {
  try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* 壞檔就重來 */ }
}
const prevList = Array.isArray(previous?.listings) ? previous.listings : [];
const prevById = new Map(prevList.map((l) => [l.id, l]));
console.log(`舊資料 ${prevById.size} 筆`);

const collected = new Map();
for (const q of cfg.queries) {
  console.log(`抓取：${q.name}`);
  for (const [id, raw] of await scrapeQuery(q)) collected.set(id, raw);
}
console.log(`本次抓到 ${collected.size} 筆（去重後）`);

// 抓到的量異常偏少，通常代表被擋或 591 改版，而不是物件真的消失了。
// 這時若照常寫檔，會把大量還在的物件誤標成「已下架」，所以直接中止保留舊資料。
if (collected.size === 0) {
  console.error('抓到 0 筆，中止以保留既有資料');
  process.exit(1);
}
if (prevById.size > 200 && collected.size < prevById.size * 0.5) {
  console.error(`抓到 ${collected.size} 筆，不到上次（${prevById.size} 筆）的一半，中止以保留既有資料`);
  process.exit(1);
}

const listings = [];
for (const [id, raw] of collected) {
  const item = normalize(raw);
  const prev = prevById.get(id);
  item.firstSeen = prev?.firstSeen || now;
  item.lastSeen = now;
  // 降價偵測：跟上次比對
  item.prevPrice = prev && prev.price !== item.price ? prev.price : null;
  listings.push(item);
}

// 已消失的物件：保留 7 天並標記，避免你剛看到就不見了
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;
for (const [id, prev] of prevById) {
  if (collected.has(id)) continue;
  if (Date.now() - new Date(prev.lastSeen || now).getTime() > KEEP_MS) continue;
  listings.push({ ...prev, gone: true });
}

listings.sort((a, b) => new Date(b.firstSeen) - new Date(a.firstSeen));

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({
  updatedAt: now,
  count: listings.filter((l) => !l.gone).length,
  mrtLines: MRT,
  listings,
}, null, 0));

const fresh = listings.filter((l) => l.firstSeen === now && !l.gone).length;
console.log(`寫入 ${OUT}：${listings.length} 筆（新上架 ${fresh}，已下架 ${listings.filter(l=>l.gone).length}）`);
