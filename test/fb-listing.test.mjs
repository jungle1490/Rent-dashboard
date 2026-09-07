import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFbDate, mergeFb } from '../core/fb-listing.mjs';

test('FB 日期 aria-label 解析', () => {
  assert.equal(parseFbDate('2026年9月7日 星期一上午11:24'), '2026-09-07T11:24:00+08:00');
  assert.equal(parseFbDate('2026年9月7日 星期一下午11:24'), '2026-09-07T23:24:00+08:00');
  assert.equal(parseFbDate('2026年1月2日 上午12:05'), '2026-01-02T00:05:00+08:00');
  assert.equal(parseFbDate('2026年9月7日'), '2026-09-07T00:00:00+08:00');
  assert.equal(parseFbDate('3分鐘'), null);
});
test('mergeFb 只留最近 30 天，並以發文時間排序', () => {
  const group = { id: '1', name: 'g', url: '' };
  const old = new Date(Date.now() - 40 * 86400000), recent = new Date(Date.now() - 2 * 86400000);
  const fmt = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 上午10:00`;
  const raw = { group, capturedAt: new Date().toISOString(), posts: [
    { id: 'a', link: 'l/a', text: '大安區 套房出租 25000元', postedText: fmt(old) },
    { id: 'b', link: 'l/b', text: '信義區 套房出租 28000元', postedText: fmt(recent) },
    { id: 'c', link: 'l/c', text: '中山區 套房出租 20000元' },   // 沒有發文時間 → 用抓取時間，保留
  ]};
  const { store } = mergeFb(null, raw, {});
  assert.deepEqual(store.listings.map((l) => l.id), ['fb:c', 'fb:b']);
  const pad = (n) => String(n).padStart(2, '0');
  assert.equal(store.listings[1].postedAt.slice(0, 10), `${recent.getFullYear()}-${pad(recent.getMonth() + 1)}-${pad(recent.getDate())}`);
  assert.equal(store.listings[0].postedAt, null);
});
