import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createSearchOverlay,
  pickSuggestions,
  pickNewArrivals,
  pickResults,
  noResultsCopy,
  buildSearchHref,
  MAX_RESULTS,
} from './search-overlay.mjs';

const data = JSON.parse(readFileSync(new URL('./assets/demo-data.json', import.meta.url), 'utf8'));

const urls = {
  search: (query) => `/search.html?q=${encodeURIComponent(query)}&concept=atelier&palette=mono`,
  product: (id) => `/product.html?id=${id}&concept=atelier&palette=mono`,
  collection: (slug) => `/collection.html?category=${slug}&concept=atelier&palette=mono`,
  shop: '/collection.html?category=all&concept=atelier&palette=mono',
};

const deps = () => ({
  getProducts: () => data.products,
  getNavigation: () => data.navigation,
  urls,
});

// ---------- factory API (frozen contract) ----------

test('factory validates injected dependencies up front', async () => {
  await assert.rejects(() => createSearchOverlay({}), TypeError);
  await assert.rejects(() => createSearchOverlay({ getProducts: () => [] }), TypeError);
  await assert.rejects(() => createSearchOverlay({
    getProducts: () => [], getNavigation: () => [],
  }), TypeError);
});

test('factory returns open/close/isOpen and starts closed', async () => {
  const overlay = await createSearchOverlay(deps());
  assert.equal(typeof overlay.open, 'function');
  assert.equal(typeof overlay.close, 'function');
  assert.equal(overlay.isOpen, false);
  assert.deepEqual(Object.keys(overlay).sort(), ['close', 'isOpen', 'open']);
});

test('close on a closed overlay is a safe no-op', async () => {
  const overlay = await createSearchOverlay(deps());
  overlay.close();
  assert.equal(overlay.isOpen, false);
});

// ---------- default state: real navigation suggestions ----------

test('suggestions come from real navigation in Dresses/Tops/PJs/Sale order', () => {
  const picked = pickSuggestions(data.navigation);
  assert.deepEqual(picked.map((s) => s.slug), ['dresses', 'tops', 'pjs', 'sale']);
  assert.deepEqual(picked.map((s) => s.label), ['Dresses', 'Tops', "PJ's", 'Sale']);
  assert.ok(picked.every((s) => s.label.length > 0), 'every suggestion carries a real label');
  assert.ok(!picked.some((s) => /trending/i.test(s.label)), 'no fake trending entries');
});

test('suggestions tolerate missing slugs and non-array input', () => {
  assert.deepEqual(pickSuggestions(null), []);
  assert.deepEqual(pickSuggestions([{ slug: 'sale', name: 'Sale' }]).map((s) => s.slug), ['sale']);
  assert.deepEqual(pickSuggestions([{ slug: 'bags', name: 'Bags' }]), []);
});

// ---------- default state: new arrivals ----------

test('new arrivals are the 6 highest real ids with prices and thumbnails', () => {
  const list = pickNewArrivals(data.products);
  const expectedIds = data.products.map((p) => p.id).sort((a, b) => b - a).slice(0, 6);
  assert.equal(list.length, 6);
  assert.deepEqual(list.map((p) => p.id), expectedIds);
  for (const p of list) {
    assert.equal(typeof p.id, 'number');
    assert.equal(typeof p.price, 'number');
    assert.equal(typeof p.name, 'string');
    assert.ok(p.image?.src, 'thumbnail present');
  }
});

test('new arrivals never mutate the catalog and guard non-array input', () => {
  const before = data.products.map((p) => p.id).join(',');
  pickNewArrivals(data.products);
  assert.equal(data.products.map((p) => p.id).join(','), before, 'catalog order untouched');
  assert.deepEqual(pickNewArrivals(null), []);
  assert.equal(pickNewArrivals(data.products, 3).length, 3);
});

// ---------- live results ----------

test('empty query counts the full 116-product catalog', () => {
  const { total, shown } = pickResults(data.products, '   ');
  assert.equal(data.products.length, 116);
  assert.equal(total, 116);
  assert.equal(shown.length, MAX_RESULTS);
});

test('typing matches name and category across the full catalog, capped at MAX_RESULTS', () => {
  const { total, shown } = pickResults(data.products, 'set');
  const viaStore = data.products.filter((p) =>
    p.name.toLowerCase().includes('set')
    || (p.categories ?? []).some((c) => c.toLowerCase().includes('set')));
  assert.equal(total, viaStore.length);
  assert.ok(total > MAX_RESULTS, 'query is broad enough to prove the cap');
  assert.equal(shown.length, MAX_RESULTS);
  assert.ok(shown.every((p) => p.name.toLowerCase().includes('set')
    || (p.categories ?? []).some((c) => c.toLowerCase().includes('set'))));
});

test('narrow query returns every match under the cap in catalog order', () => {
  const { total, shown } = pickResults(data.products, 'Love Notes');
  assert.ok(total > 0 && total <= MAX_RESULTS);
  assert.equal(shown.length, total);
  const ids = data.products.filter((p) => p.name.includes('Love Notes')).map((p) => p.id);
  assert.deepEqual(shown.map((p) => p.id), ids);
});

test('zero matches report total 0 with an empty shown list', () => {
  const { total, shown } = pickResults(data.products, 'zzz-no-such-style-zzz');
  assert.equal(total, 0);
  assert.deepEqual(shown, []);
});

test('pickResults guards non-array catalog', () => {
  assert.deepEqual(pickResults(null, 'x'), { total: 0, shown: [] });
});

// ---------- no-results copy ----------

test('no-results copy is helpful, quotes the query and offers browsing', () => {
  const copy = noResultsCopy('  velvet robe ');
  assert.match(copy.headline, /velvet robe/);
  assert.ok(copy.hint.length > 20, 'hint explains what to try next');
  assert.ok(copy.browseLabel.length > 0);
});

// ---------- full search page navigation ----------

test('buildSearchHref forwards the trimmed query to urls.search', () => {
  assert.equal(buildSearchHref(urls, '  silk dress '), urls.search('silk dress'));
  assert.equal(buildSearchHref(urls, ''), urls.search(''));
  assert.equal(buildSearchHref(urls, undefined), urls.search(''));
});
