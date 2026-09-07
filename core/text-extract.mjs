// 社群貼文（自由文字）→ 看板欄位。純函式、零 import；抽不到一律回 null，不猜。
// 規則以 VERIFIED 的 FB 樣本為準（見 tasks/T-006-fb-extract.md），測試在 test/text-extract.test.mjs。

export const TAIPEI_DISTRICTS = ['中正區','大同區','中山區','松山區','大安區','萬華區','信義區',
  '士林區','北投區','內湖區','南港區','文山區'];
// 新北常見地名：只用來判斷「不在台北市」，不做細分
const NEW_TAIPEI = ['板橋','中和','永和','新店','三重','新莊','土城','蘆洲','汐止','淡水','樹林','泰山',
  '五股','林口','深坑','鶯歌','三峽','八里','石碇','瑞芳','新北'];
// 地標／英文 → 行政區（T-008）。英文比對不分大小寫；地標只在沒寫「X區」時才用。
export const DISTRICT_ALIASES = {
  '中正區': ['zhongzheng', 'jhongjheng', '台大醫院', '公館', '古亭', '中正紀念堂', '台北車站', '善導寺'],
  '大同區': ['datong', 'tatung', '迪化街', '大稻埕', '寧夏夜市', '圓山'],
  '中山區': ['zhongshan', 'jhongshan', '行天宮', '中山國小', '民生社區(?!.*松山)', '大直', '林森北', '雙連', '松江南京'],
  '松山區': ['songshan', 'sungshan', '小巨蛋', '民生社區', '南京三民', '饒河'],
  '大安區': ["da'an", 'daan', "ta'an", '東區', '忠孝復興', '忠孝敦化', '師大', '永康街', '信義安和', '六張犁', '科技大樓'],
  '萬華區': ['wanhua', 'wanhwa', '西門町', '龍山寺', '艋舺'],
  '信義區': ['xinyi', 'hsinyi', '101', '市政府', '象山', '永春', '國父紀念館'],
  '士林區': ['shilin', 'shihlin', '天母', '劍潭', '芝山', '士林夜市'],
  '北投區': ['beitou', 'peitou', '石牌', '唭哩岸', '關渡', '奇岩', '明德'],
  '內湖區': ['neihu', '西湖', '港墘', '文德', '大湖公園', '東湖', '葫洲'],
  '南港區': ['nangang', '南軟', '昆陽', '後山埤', '南港展覽館'],
  '文山區': ['wenshan', '木柵', '景美', '萬芳', '政大', '萬隆', '動物園'],
};
const EN_TAIPEI = /\btaipei\b/i;

const FULLWIDTH = { '０':'0','１':'1','２':'2','３':'3','４':'4','５':'5','６':'6','７':'7','８':'8','９':'9',
  '，':',', '：':':', '／':'/', '｜':'|' };

/** 清掉反爬用的組合字元與零寬字元，全形數字轉半形，臺→台 */
export function normalizeText(text) {
  return String(text ?? '')
    .replace(/[͏​-‏⁠﻿]/g, '')
    .replace(/[０-９，：／｜]/g, (c) => FULLWIDTH[c] ?? c)
    .replace(/臺/g, '台')
    .replace(/[ \t]+/g, ' ');
}

const toInt = (s) => parseInt(String(s).replace(/,/g, ''), 10);

/** 「1萬3」「1.3萬」「13,000」「NT$13000」「13000元」→ 13000；回 null 表示沒把握 */
export function parseMoney(s) {
  if (!s) return null;
  const k = String(s).match(/(\d+(?:\.\d+)?)\s*[kK]\b/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const m = String(s).match(/(\d+(?:\.\d+)?)\s*萬\s*(\d)?(?!\d)/);
  if (m) return Math.round(parseFloat(m[1]) * 10000 + (m[2] ? parseInt(m[2], 10) * 1000 : 0));
  const n = String(s).match(/\d[\d,]*/);
  return n ? toInt(n[0]) : null;
}

const MONEY = String.raw`(?:NT\$|NTD|TWD|\$)?\s*(\d+(?:\.\d+)?\s*萬\s*\d?|\d{1,3}(?:\.\d)?\s*[kK](?![a-z])|\d{1,3}(?:,\d{3})+|\d{4,6})`;

function findPrice(t) {
  // 1) 有租金語境的優先：租金 13000、13000元/月、月租 1萬3
  const ctx = [
    new RegExp(String.raw`(?:租金|月租|每月|月付|rent|price|monthly)\s*[:：]?\s*(?:is\s*)?${MONEY}`, 'i'),
    new RegExp(String.raw`${MONEY}\s*(?:/|per)\s*(?:month|mo)`, 'i'),
    new RegExp(String.raw`${MONEY}\s*(?:元|塊)?\s*[/／]\s*月`),
    new RegExp(String.raw`${MONEY}\s*(?:元|塊)(?!\d)`),
  ];
  for (const re of ctx) { const m = t.match(re); if (m) { const v = parseMoney(m[1]); if (v && v >= 3000 && v <= 300000) return v; } }
  // 2) 沒語境：第一個 4~6 位數或 X萬，排除管理費／押金／車位／坪／地址／電話
  const stripped = t.replace(/(?:管理費|押金|車位|清潔費|水電|網路費)[^\n]{0,12}/g, ' ')
                    .replace(/\d+\s*(?:坪|號|巷|弄|樓|F|年|人|分鐘|公尺|m)(?!\d)/gi, ' ')
                    .replace(/09\d{8}|\d{2,4}-\d{6,8}/g, ' ');
  const m = stripped.match(new RegExp(MONEY));
  if (m) { const v = parseMoney(m[1]); if (v && v >= 3000 && v <= 300000) return v; }
  return null;
}

function findExtraFee(t) {
  // 管理費常是兩三位數（600、800），不能用租金那套「至少四位數」的規則
  const m = t.match(/管理費\s*[:：]?\s*(?:約|另計)?\s*(?:NT\$|\$)?\s*(\d+(?:\.\d+)?\s*萬\s*\d?|\d{1,3}(?:,\d{3})+|\d{2,6})(?!\d)/);
  return m ? parseMoney(m[1]) : null;
}

function findDistrict(t) {
  const d = TAIPEI_DISTRICTS.find((x) => t.includes(x));
  if (d) return { district: d, outsideTaipei: false };
  const nt = NEW_TAIPEI.find((x) => new RegExp(x + '(?:區|市)?').test(t));
  if (nt && !/台北市|Taipei City/i.test(t)) return { district: null, outsideTaipei: true };
  for (const [dist, aliases] of Object.entries(DISTRICT_ALIASES)) {
    if (aliases.some((a) => new RegExp(/^[a-z' ]+$/i.test(a) ? `\\b${a}\\b` : a, 'i').test(t))) return { district: dist, outsideTaipei: false };
  }
  if (EN_TAIPEI.test(t) || /台北/.test(t)) return { district: null, outsideTaipei: false };
  return { district: null, outsideTaipei: null };
}

const NOT_STATION_AFTER = '(?!區|路|街|國小|國中|高中|大學|市場|公園|醫院(?!站))';

function findStation(t, mrtLines) {
  const names = [...new Set(Object.values(mrtLines || {}).flat())].sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  // 先找有「捷運」「站」「近」語境的，再退而求其次找裸站名（三字以上，且後面不是區／路）
  for (const n of names) {
    const re = new RegExp(String.raw`(?:捷運\s*${esc(n)}\s*站?|${esc(n)}\s*站|近\s*${esc(n)})`);
    if (re.test(t)) return n;
  }
  for (const n of names) {
    if (n.length < 3) continue;
    if (new RegExp(esc(n) + NOT_STATION_AFTER).test(t)) return n;
  }
  return null;
}

function findStationDist(t) {
  const m = t.match(/(?:走路|步行|徒步|走)\s*(?:約|大約)?\s*(\d+)\s*分/);
  if (m) return { stationDist: parseInt(m[1], 10) * 80, approx: true };   // 一般步速約 80 公尺／分
  const d = t.match(/(?:站|捷運)[^\n]{0,8}?(\d{2,4})\s*(?:公尺|m)(?!\d)/i) || t.match(/(\d{2,4})\s*(?:公尺|m)(?!\d)[^\n]{0,6}?(?:站|捷運)/i);
  if (d) return { stationDist: parseInt(d[1], 10), approx: false };
  return { stationDist: null, approx: null };
}

const CN_NUM = { '一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 };
const num = (c) => (c in CN_NUM ? CN_NUM[c] : parseInt(c, 10));
function findLayout(t) {
  // 「三房兩廳一衛」「2房1廳」「1房1衛」；中文數字只在房廳衛前面才轉，避免動到「三重」「五股」
  const m = t.match(/([\d一二兩三四五六七八九])\s*房(?:\s*([\d一二兩三四五六七八九])\s*廳)?(?:\s*([\d一二兩三四五六七八九])\s*衛)?/);
  if (m) return `${num(m[1])}房` + (m[2] ? `${num(m[2])}廳` : '') + (m[3] ? `${num(m[3])}衛` : '');
  return null;
}
function findKind(t) {
  if (/整層|整棟|公寓.*(?:房|廳)|(?:[\d一二兩三四五]房[\d一二兩三四五]廳)/.test(t)) return '整層住家';
  if (/獨立套房|套房/.test(t)) return '套房';
  if (/雅房/.test(t)) return '雅房';
  return null;
}
function findArea(t) {
  const m = t.match(/(\d+(?:\.\d+)?)\s*坪/);
  return m ? parseFloat(m[1]) : null;
}
function findFloor(t) {
  const m = t.match(/(\d+)\s*(?:樓|F)(?!\d)(?:\s*[/／]\s*(\d+)\s*(?:樓|F)?)?/i);
  return m ? (m[2] ? `${m[1]}F/${m[2]}F` : `${m[1]}樓`) : null;
}

/** 主入口：貼文本文 → 欄位。`mrtLines` 是 mrt-lines.json 的物件。 */
export function extractListing(text, mrtLines) {
  const t = normalizeText(text);
  // 求租（房客找房）vs 出租：中文有強訊號就算；英文要「找房訊號」且沒有出租訊號，
  // 因為房東文常寫 "Looking for a hassle-free…"。「找室友／徵室友」是房東在找人，不算求租。
  const seekZh = /#\s*求租|求租|我要租房|想租(?!金|屋補|補)|預算|入住成員|預計入住|徵求?.{0,4}(?:房|住處)/.test(t);
  const seekEn = /looking for (?:an? |a long.?term |long.?term )?(?:apartment|studio|room|flat|place|accommodation|rental)|will be staying in|just moved to taipei|exchange student|seeking (?:an? )?(?:apartment|room|flat)/i.test(t);
  const offer = /出租|釋出|for rent|room available|available (?:from|now)|move-?in from|no agent fee|月租|租金[:：]|【案名|studio (?:suite|in|near)|immediate move/i.test(t);
  const isSeeking = seekZh || (seekEn && !offer);
  const isSale = /委託價|出售|售價|總價.{0,6}萬/.test(t) && !/出租/.test(t);
  const { district, outsideTaipei } = findDistrict(t);
  const { stationDist, approx } = findStationDist(t);
  return {
    isSeeking, isSale,
    price: findPrice(t),
    extraFee: findExtraFee(t),
    feeIncluded: /含管理費|管理費(?:已)?含|包含管理費|免管理費/.test(t),
    district, outsideTaipei,
    station: findStation(t, mrtLines),
    stationDist, stationDistApprox: approx,
    layout: findLayout(t),
    kind: findKind(t),
    area: findArea(t),
    floor: findFloor(t),
  };
}
