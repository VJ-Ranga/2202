import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createSearchOverlay,
  pickSuggestions,
  pickNewArrivals,
  pickRecommendations,
  pickResults,
  materialLine,
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

// ---------- curated recommendations (redesigned default state) ----------

test('pickRecommendations returns the six real curated picks in source order', () => {
  const picked = pickRecommendations(data.products);
  assert.deepEqual(picked.map((p) => p.id), [31662, 31597, 30895, 31845, 31787, 31030]);
  assert.equal(new Set(picked.map((p) => p.id)).size, 6, 'unique ids');
  for (const p of picked) {
    assert.ok(data.products.includes(p), 'returns the real catalog entry, never a copy or invention');
    assert.equal(typeof p.price, 'number');
    assert.equal(typeof p.name, 'string');
    assert.ok(p.image?.src, 'real photo');
  }
});

test('pickRecommendations fills missing picks from newest real products, max 6, no invention', () => {
  const subset = data.products.filter((p) => p.id !== 31030);
  const picked = pickRecommendations(subset);
  assert.equal(picked.length, 6);
  assert.equal(new Set(picked.map((p) => p.id)).size, 6);
  assert.ok(!picked.some((p) => p.id === 31030));
  assert.deepEqual(picked.slice(0, 5).map((p) => p.id), [31662, 31597, 30895, 31845, 31787]);
  for (const p of picked) assert.ok(subset.includes(p), 'fallback picks are real subset entries');
  const newestIds = pickNewArrivals(subset).map((p) => p.id);
  assert.ok(newestIds.includes(picked[5].id), 'fill comes from pickNewArrivals order');
});

test('pickRecommendations guards empty and short catalogs', () => {
  assert.deepEqual(pickRecommendations(null), []);
  assert.deepEqual(pickRecommendations([]), []);
  const two = data.products.slice(0, 2);
  const picked = pickRecommendations(two);
  assert.ok(picked.length <= 6);
  picked.forEach((p) => assert.ok(two.includes(p)));
});

// ---------- live query ----------

test('live query keeps the real three Mocha matches', () => {
  const { total, shown } = pickResults(data.products, 'mocha');
  assert.equal(total, 3);
  assert.equal(shown.length, 3);
  assert.deepEqual(shown.map((p) => p.name),
    ['Mocha Essential Maxi Dress', 'Mocha Essential Maxi Skirt', 'Mocha Wide Leg Pant']);
});

// ---------- material line (only when the source carries a Fabric line) ----------

test('materialLine reads the actual source Fabric line, verbatim', () => {
  const set = data.products.find((p) => p.id === 31662);
  const line = materialLine(set);
  assert.equal(line, 'Soft Silky Satin'); /* colon form wins: verbatim 'Fabric: Soft Silky Satin' */
  const source = `${set.fullDescription ?? ''}\n${set.description ?? ''}`;
  assert.ok(source.includes(line), 'value comes verbatim from source, never invented');
});

test('materialLine matches the colon form too and stays consistent with source', () => {
  const source = (p) => `${p.fullDescription ?? ''}\n${p.description ?? ''}`;
  const colonProduct = data.products.find((p) => /^\s*Fabric\s*:/mi.test(source(p)));
  assert.ok(colonProduct, 'catalog carries at least one Fabric: line');
  const line = materialLine(colonProduct);
  const captured = source(colonProduct).match(/^\s*Fabric\s*:\s*(.+)$/mi)?.[1]?.trim();
  assert.equal(line, captured);
  assert.ok(source(colonProduct).includes(line));
});

test('materialLine omits products without any Fabric line', () => {
  const none = data.products.find((p) => materialLine(p) === null);
  assert.ok(none, 'at least one real product has no Fabric line to show');
  assert.equal(materialLine({}), null);
  assert.equal(materialLine(null), null);
  assert.equal(materialLine({ description: 'Crafted from soft stretch rib fabric, it gently contours.' }), null,
    'mid-sentence prose is not a Fabric line');
});
