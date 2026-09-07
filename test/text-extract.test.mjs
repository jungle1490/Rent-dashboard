import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractListing, parseMoney, normalizeText } from '../core/text-extract.mjs';

const MRT = JSON.parse(readFileSync(new URL('../mrt-lines.json', import.meta.url), 'utf8'));
const ex = (t) => extractListing(t, MRT);

// VERIFIED 樣本：群組 459966811445588，2026-09-08
const SAMPLE = `超便宜
這個價格能租補又有陽台
板橋｜3樓公寓｜1房1衛1陽台
 捷運亞東醫院站走路12分鐘
可租補！可報稅！
台水電
獨洗曬｜拎包入住｜變頻冷氣｜雙門冰箱
13000
管理費600（網路+公共電費）`;

test('VERIFIED 樣本：板橋公寓', () => {
  const r = ex(SAMPLE);
  assert.equal(r.price, 13000);
  assert.equal(r.extraFee, 600);
  assert.equal(r.outsideTaipei, true);
  assert.equal(r.district, null);
  assert.equal(r.station, '亞東醫院');
  assert.equal(r.stationDist, 960);
  assert.equal(r.stationDistApprox, true);
  assert.equal(r.layout, '1房1衛');
  assert.equal(r.floor, '3樓');
  assert.equal(r.isSeeking, false);
});

test('價格寫法', () => {
  assert.equal(parseMoney('1萬3'), 13000);
  assert.equal(parseMoney('1.3萬'), 13000);
  assert.equal(parseMoney('2萬'), 20000);
  assert.equal(parseMoney('13,000'), 13000);
  assert.equal(ex('租金 NT$13,000').price, 13000);
  assert.equal(ex('月租1萬3，押二付一').price, 13000);
  assert.equal(ex('13000元/月 含網路').price, 13000);
  assert.equal(ex('大安區套房 25000元').price, 25000);
});
test('價格：不要把管理費、坪數、地址、電話當租金', () => {
  assert.equal(ex('管理費1500\n租金28000').price, 28000);
  assert.equal(ex('忠孝東路四段216巷 12坪 0912345678').price, null);
  assert.equal(ex('押金2萬').price, null);        // 只有押金，沒租金
});
test('管理費', () => {
  assert.equal(ex('管理費600').extraFee, 600);
  assert.equal(ex('管理費：1,000元').extraFee, 1000);
  assert.equal(ex('管理費另計 800').extraFee, 800);
  assert.equal(ex('租金含管理費 20000').feeIncluded, true);
  assert.equal(ex('沒提').extraFee, null);
});
test('行政區：台北市 12 區命中；新北標 outsideTaipei', () => {
  assert.deepEqual([ex('大安區近科技大樓').district, ex('大安區近科技大樓').outsideTaipei], ['大安區', false]);
  assert.equal(ex('信義區 套房').district, '信義區');
  assert.equal(ex('中和 近景安站').outsideTaipei, true);
  assert.equal(ex('新北市新莊區').outsideTaipei, true);
  assert.equal(ex('沒寫地點').outsideTaipei, null);
});
test('捷運站：語境優先，區名不誤判為站名', () => {
  assert.equal(ex('捷運忠孝復興站 5 分鐘').station, '忠孝復興');
  assert.equal(ex('近松江南京').station, '松江南京');
  assert.equal(ex('中山區 林森北路').station, null);         // 「中山」後面是「區」
  assert.equal(ex('大安區近大安森林公園站').station, '大安森林公園');
  assert.equal(ex('台北車站走路8分鐘').station, '台北車站');
  assert.equal(ex('捷運臺北小巨蛋站').station, '台北小巨蛋');  // 臺→台
});
test('離站距離：分鐘估算與公尺實值', () => {
  assert.deepEqual([ex('走路約 5 分鐘').stationDist, ex('走路約 5 分鐘').stationDistApprox], [400, true]);
  assert.deepEqual([ex('距捷運站 350公尺').stationDist, ex('距捷運站 350公尺').stationDistApprox], [350, false]);
  assert.equal(ex('沒寫').stationDist, null);
});
test('房型／類型／坪數／樓層', () => {
  assert.equal(ex('2房1廳1衛 15坪 4樓/5樓').layout, '2房1廳1衛');
  assert.equal(ex('2房1廳1衛 15坪 4樓/5樓').area, 15);
  assert.equal(ex('2房1廳1衛 15坪 4樓/5樓').floor, '4F/5F');
  assert.equal(ex('2房1廳1衛').kind, '整層住家');
  assert.equal(ex('獨立套房 8坪').kind, '套房');
  assert.equal(ex('雅房出租').kind, '雅房');
  assert.equal(ex('我家是三房兩廳一衛，可以整層租').layout, '3房2廳1衛');   // VERIFIED 天母樣本
  assert.equal(ex('三重區 2房').outsideTaipei, true);                    // 中文數字不影響地名
});
test('求租貼文', () => {
  assert.equal(ex('#求租\n【租客】1人，政大女學生').isSeeking, true);
  assert.equal(ex('徵室友 一起分租 房間釋出').isSeeking, false);   // 房東找室友＝出租
  assert.equal(ex('【我要租房】預計入住時間：9/23 入住成員：2人＋2貓 預算 35000').isSeeking, true);
  assert.equal(ex("Hello everyone! My partner and I are looking for an apartment in Taipei, budget 30k").isSeeking, true);
  assert.equal(ex("I'm Nilsen, a French guy who just moved to Taipei looking for a room").isSeeking, true);
  assert.equal(ex('Prime Location Studio in Daan, NO AGENT FEE. Looking for a hassle-free rental? 20000/month').isSeeking, false);
  assert.equal(ex('Home 溫馨雅房釋出 #找女生室友 中山國中捷運站').isSeeking, false);
  assert.equal(ex('案名：民生金碧園 委託價：3500萬 3房2廳').isSale, true);
  assert.equal(ex('出租 套房 租金 15000').isSale, false);
  assert.equal(ex('出租 套房').isSeeking, false);
});
test('normalizeText 清掉反爬字元與全形', () => {
  assert.equal(normalizeText('p͏r͏o͏ １３，０００'), 'pro 13,000');
});

test('T-008：地標與英文 → 行政區；英文價格；英文求租', () => {
  assert.equal(ex('天母共居公寓 12000').district, '士林區');
  assert.equal(ex('東區 套房 25000').district, '大安區');
  assert.equal(ex("Cozy studio in Da'an, near Technology Building MRT, NT$25,000/month").district, '大安區');
  assert.equal(ex("Cozy studio in Da'an, NT$25,000/month").price, 25000);
  assert.equal(ex('Room in Xinyi, 18k per month').price, 18000);
  assert.equal(ex('Room in Xinyi, 18k per month').district, '信義區');
  assert.equal(ex('Apartment in Taipei, rent 30000').outsideTaipei, false);
  assert.equal(ex('Looking for a room in Taipei').isSeeking, true);
  assert.equal(ex('中和 近景安站 15000').outsideTaipei, true);
  assert.equal(ex('沒有任何地點 15000').district, null);
});
