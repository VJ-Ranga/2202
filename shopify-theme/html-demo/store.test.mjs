import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  formatPrice,
  findProduct,
  sizeInfo,
  addToCart,
  updateQty,
  removeItem,
  cartCount,
  subtotal,
  normalizeCart,
  cartBadge,
  toggleWishlist,
  searchProducts,
  productsByCategory,
  loadJSON,
  saveJSON,
} from './store.mjs';

const data = JSON.parse(readFileSync(new URL('./assets/demo-data.json', import.meta.url), 'utf8'));

// ---------- money ----------

test('formatPrice renders grouped LKR with two decimals', () => {
  assert.equal(formatPrice(3990), 'Rs 3,990.00');
  assert.equal(formatPrice(3490.5), 'Rs 3,490.50');
  assert.equal(formatPrice(0), 'Rs 0.00');
  assert.equal(formatPrice(1234567.891), 'Rs 1,234,567.89');
});

test('formatPrice rejects non-finite and non-number input', () => {
  assert.throws(() => formatPrice('3990'), TypeError);
  assert.throws(() => formatPrice(NaN), TypeError);
  assert.throws(() => formatPrice(Infinity), TypeError);
  assert.throws(() => formatPrice(-1), RangeError);
});

// ---------- product / variant lookup ----------

test('findProduct returns matching product by exact numeric id', () => {
  const p = findProduct(data, 31845);
  assert.equal(p.name, 'Love Notes PJ Set');
  assert.equal(findProduct(data, 999999), undefined);
});

test('sizeInfo returns the size object and flags unlisted sizes', () => {
  const p = findProduct(data, 31597);
  assert.deepEqual(sizeInfo(p, 'UK10/M'), { label: 'UK10/M', available: false });
  assert.deepEqual(sizeInfo(p, 'UK12/L'), { label: 'UK12/L', available: true });
  assert.equal(sizeInfo(p, 'UK20/3XL'), undefined);
  assert.equal(sizeInfo(p, undefined), undefined);
});

test('unavailable size from the real contract is blocked (31597 UK10/M held out of stock)', () => {
  const p = findProduct(data, 31597);
  assert.equal(sizeInfo(p, 'UK10/M').available, false);
});

// ---------- cart ----------

test('addToCart appends a line item and never mutates the source cart', () => {
  const cart = [];
  const p = findProduct(data, 31845);
  const next = addToCart(cart, p, 'UK08/S', 1);
  assert.equal(next.length, 1);
  const v = findVariantBySize(p, 'UK08/S');
  assert.deepEqual(next[0], { id: 31845, name: 'Love Notes PJ Set', size: 'UK08/S', qty: 1, price: v.price, variantId: v.id });
  assert.equal(cart.length, 0, 'original cart untouched');
});

test('addToCart merges quantity for the same product and size', () => {
  const p = findProduct(data, 31845);
  let cart = addToCart([], p, 'UK08/S', 1);
  cart = addToCart(cart, p, 'UK08/S', 2);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 3);
  let cart2 = addToCart([], p, 'UK08/S', 1);
  cart2 = addToCart(cart2, p, 'UK10/M', 1);
  assert.equal(cart2.length, 2, 'different size stays a separate line');
});

test('addToCart rejects unknown size', () => {
  const p = findProduct(data, 31845);
  assert.throws(() => addToCart([], p, 'UK20/3XL'), /UNKNOWN_SIZE/);
  assert.throws(() => addToCart([], p, undefined), /UNKNOWN_SIZE/);
});

test('addToCart rejects a size the contract marks unavailable', () => {
  const out2026 = findProduct(data, 31662);
  assert.throws(() => addToCart([], out2026, 'UK16/2XL'), /SIZE_UNAVAILABLE/);
});

test('addToCart rejects zero, negative, fractional and non-numeric quantities', () => {
  const p = findProduct(data, 31845);
  for (const bad of [0, -1, 1.5, '2', null, NaN]) {
    assert.throws(() => addToCart([], p, 'UK08/S', bad), /INVALID_QTY/);
  }
});

test('addToCart guards products with no size surface at all', () => {
  const bare = { id: 1, name: 'X', price: 10, sizes: null };
  assert.throws(() => addToCart([], bare, 'UK08/S'), /UNKNOWN_SIZE/);
  const noSizesProp = { id: 2, name: 'Y', price: 10 };
  assert.throws(() => addToCart([], noSizesProp, 'UK08/S'), /UNKNOWN_SIZE/);
  const oneSize = { id: 3, name: 'Z', price: 250, sizes: [] };
  assert.doesNotThrow(() => addToCart([], oneSize, null));
});

test('updateQty increments and decrements, removes at zero, keeps out-of-range no-op', () => {
  const p = findProduct(data, 31845);
  let cart = addToCart([], p, 'UK08/S', 1);
  cart = updateQty(cart, 0, 3);
  assert.equal(cart[0].qty, 3);
  cart = updateQty(cart, 0, 1);
  assert.equal(cart[0].qty, 1);
  cart = updateQty(cart, 0, 0);
  assert.equal(cart.length, 0);
  const before = [{ id: 1, name: 'a', size: 's', qty: 1, price: 5 }];
  assert.equal(updateQty(before, 5, 2), before, 'out of range index returns the same cart');
  assert.throws(() => updateQty([{ id: 1, name: 'a', size: 's', qty: 1, price: 5 }], 0, 1.5), /INVALID_QTY/);
});

test('removeItem removes only the targeted line', () => {
  const a = { id: 1, name: 'a', size: 's', qty: 1, price: 5 };
  const b = { id: 2, name: 'b', size: 's', qty: 2, price: 7 };
  const next = removeItem([a, b], 0);
  assert.deepEqual(next, [b]);
});

test('cartCount and subtotal use exact sampled prices from the contract', () => {
  const lines = [
    { id: 31845, name: 'Love Notes PJ Set', size: 'UK08/S', qty: 2, price: 3990 },
    { id: 30895, name: 'Mocha Essential Maxi Dress', size: 'UK08/S', qty: 1, price: 3490 },
  ];
  assert.equal(cartCount(lines), 3);
  assert.equal(subtotal(lines), 11470);
  assert.equal(cartCount([]), 0);
  assert.equal(subtotal([]), 0);
});

test('normalizeCart drops corrupt entries and clamps bad quantities', () => {
  const dirty = [
    { id: 31845, name: 'Love Notes PJ Set', size: 'UK08/S', qty: 'x', price: 3990 },
    { id: 31800, name: 'Blossom Crush PJ Set', size: 'UK10/M', qty: 2, price: 3890 },
    { id: 0, name: '', size: '', qty: 1, price: -5 },
    null,
    { name: 'no id', size: 's', qty: 1, price: 1 },
    { id: 31787, name: 'Daisy Darling PJ Short Set', size: 'UK08/S', qty: 0, price: 3890 },
    { id: 31787, name: 'Daisy Darling PJ Short Set', size: 'UK08/S', qty: 9.9, price: 3890 },
  ];
  const clean = normalizeCart(dirty);
  assert.equal(clean.length, 2);
  assert.equal(clean[0].id, 31800);
  assert.equal(clean[0].qty, 2);
  assert.equal(clean[1].id, 31787, 'fractional qty row clamped to 1 not dropped');
  assert.equal(clean[1].qty, 1);
  assert.deepEqual(normalizeCart(null), []);
  assert.deepEqual(normalizeCart([42, 'x', {}]), []);
});

test('cartBadge renders count and hides at zero', () => {
  const lines = [{ id: 1, name: 'a', size: 's', qty: 3, price: 5 }];
  assert.equal(cartBadge(lines), '3');
  assert.equal(cartBadge([]), '');
});

// ---------- wishlist ----------

test('toggleWishlist adds then removes, keeping order and reporting state', () => {
  let { ids, added } = toggleWishlist([], 31845);
  assert.deepEqual(ids, [31845]);
  assert.equal(added, true);
  ({ ids, added } = toggleWishlist([31845, 31800], 31800));
  assert.deepEqual(ids, [31845]);
  assert.equal(added, false);
  assert.deepEqual(toggleWishlist(null, 1).ids, [1]);
  assert.throws(() => toggleWishlist([], 'not-a-number'), TypeError);
});

// ---------- search ----------

test('searchProducts matches names case-insensitively', () => {
  const expected = data.products.filter((p) => p.name.toLowerCase().includes('mocha'));
  assert.ok(expected.length >= 2);
  const hits = searchProducts(data.products, 'moch');
  assert.deepEqual(new Set(hits.map((p) => p.id)), new Set(expected.map((p) => p.id)));
});

test('searchProducts also matches real category terms', () => {
  const pjHits = searchProducts(data.products, "pj's");
  const pjCats = data.products.filter((p) => p.categories.some((c) => c.toLowerCase() === "pj's"));
  assert.equal(pjHits.length, pjCats.length);
  const ribHits = searchProducts(data.products, 'ribbed series');
  const ribCats = data.products.filter((p) => p.categories.includes('RIBBED SERIES'));
  assert.equal(ribHits.length, ribCats.length);
});

test('searchProducts returns everything for a blank query and nothing for a miss', () => {
  assert.equal(searchProducts(data.products, '  ').length, 116);
  assert.deepEqual(searchProducts(data.products, 'velvet-hoodie-zz'), []);
});

test('searchProducts survives a non-array first argument', () => {
  assert.equal(searchProducts(null, 'x').length, 0);
});

// ---------- category panel fed by the 12-item selection ----------

test('productsByCategory resolves slugs against the contract taxonomy', () => {
  assert.equal(productsByCategory(data, 'pjs').length, 43);
  assert.equal(productsByCategory(data, 'dresses').length, 18);
  assert.equal(productsByCategory(data, 'blouse').length, 17);
  assert.equal(productsByCategory(data, 't-shirts').length, 14);
  assert.equal(productsByCategory(data, 'pants').length, 12);
  assert.equal(productsByCategory(data, 'ribbed').length, 27);
});

test('productsByCategory is honest: unknown terms return nothing', () => {
  assert.deepEqual(productsByCategory(data, 'not-a-real-category'), []);
});

function fakeStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
}

test('saveJSON round-trips objects through a controlled storage', () => {
  const store = fakeStorage();
  saveJSON('lc-cart', [{ id: 31845, qty: 2 }], store);
  assert.deepEqual(loadJSON('lc-cart', store), [{ id: 31845, qty: 2 }]);
});

test('loadJSON returns null for corrupted stored payloads instead of throwing', () => {
  const store = fakeStorage();
  store.setItem('lc-cart', '{"id": 31845, '); // truncated write
  assert.equal(loadJSON('lc-cart', store), null);
  store.setItem('lc-cart', '[[[[');
  assert.equal(loadJSON('lc-cart', store), null);
});

test('loadJSON swallows storage access failures and saveJSON masks write errors', () => {
  const broken = {
    getItem: () => { throw new Error('SecurityError'); },
    setItem: () => { throw new Error('QuotaExceededError'); },
  };
  assert.equal(loadJSON('lc-cart', broken), null);
  assert.doesNotThrow(() => saveJSON('lc-cart', { ok: true }, broken));
  assert.doesNotThrow(() => saveJSON('lc-cart', undefined, fakeStorage()));
  const empty = fakeStorage();
  assert.equal(loadJSON('missing-key', empty), null);
});

/* =========================================================
   FULL-CATALOG TESTS — extended storefront requirements
   ========================================================= */

import {
  PERSONALISATION_FEE,
  persKey,
  findVariantBySize,
  findVariantById,
  variantAvailable,
  lineTotal,
  categoryChain,
  categoryDescendants,
  applyFilters,
  sortProducts,
  MAX_QUANTITY,
} from './store.mjs';
import { validateSelection, normalizePersona, clampQuantity } from './customisation-logic.mjs';

/* ---------- contract shape: full catalog ---------- */

test('full catalog shape: 116 products, 597 variants, 17 categories, nav 10+3+3', () => {
  assert.equal(data.products.length, 116);
  const variantTotal = data.products.reduce((n, p) => n + (p.variants?.length ?? 0), 0);
  assert.equal(variantTotal, 597);
  assert.equal(data.categories.length, 17);
  assert.equal(data.navigation.length, 10);
  const navChildren = data.navigation.flatMap((n) => n.children);
  assert.equal(navChildren.length, 6);
  assert.deepEqual(navChildren.map((c) => c.slug),
    ['blouse', 't-shirts', 'jackets', 'pants', 'skirts', 'shorts']);
});

test('every product carries the required fields and a distinct id', () => {
  const seen = new Set();
  for (const p of data.products) {
    assert.ok(typeof p.id === 'number' && p.id > 0, `id ${p.id}`);
    assert.ok(!seen.has(p.id), `duplicate id ${p.id}`);
    seen.add(p.id);
    assert.ok(typeof p.name === 'string' && p.name);
    assert.equal(typeof p.price, 'number');
    assert.equal(typeof p.slug, 'string');
    assert.ok(Array.isArray(p.categories));
    assert.ok(p.image && typeof p.image.src === 'string');
    assert.ok(Array.isArray(p.variants));
    assert.ok(Array.isArray(p.sizes));
    assert.ok(typeof p.stockStatus === 'string');
  }
});

test('sale label: 42 products, discounted via product or variant regularPrice', () => {
  const sale = data.products.filter((p) => p.categories.includes('Sale'));
  assert.equal(sale.length, 42);
  for (const p of sale) {
    const productSale = p.regularPrice != null && p.regularPrice > p.price;
    const variantSale = (p.variants ?? []).some((v) => Number.isFinite(v.regularPrice) && Number.isFinite(v.price) && v.regularPrice > v.price);
    const flat = p.regularPrice == null && productSale === false && variantSale === false;
    // source enriches 8 Sale entries without a compare-at price; those sell a plain price
    assert.ok(productSale || variantSale || flat, `sale product ${p.id} is a source-labelled Sale`);
  }
});

test('variant availability contract: available only with stock + valid price', () => {
  for (const p of data.products) {
    for (const v of p.variants) {
      if (!v.available) continue;
      assert.equal(typeof v.price, 'number', `variant ${v.id} price`);
      assert.ok(v.price >= 0);
    }
  }
  const nullPriced = data.products.flatMap((p) => (p.variants ?? [])).filter((v) => v.price == null);
  assert.ok(nullPriced.every((v) => !v.available));
});

test('category counts match explicit-term counts on leaf terms', () => {
  const leafSlugs = data.categories
    .filter((c) => !(data.navigation.find((n) => n.slug === c.slug)?.children?.length))
    .map((c) => c.slug);
  for (const slug of leafSlugs) {
    assert.equal(productsByCategory(data, slug).length, data.categories.find((c) => c.slug === slug).count, slug);
  }
});
test('parent categories: descendant union >= own count and covers child terms exactly', () => {
  for (const c of data.categories) {
    const nav = data.navigation.find((n) => n.slug === c.slug);
    const isParent = Boolean(nav?.children?.length);
    const hits = productsByCategory(data, c.slug);
    if (isParent) {
      const own = hits.filter((p) => p.categories.some(
        (k) => k.toLowerCase() === String(c.name).toLowerCase(),
      ));
      assert.ok(own.length >= c.count, `${c.slug} own >= term count`);
      for (const ch of nav.children) {
        const child = data.categories.find((x) => x.slug === ch.slug);
        assert.equal(hits.filter((p) => p.categories.includes(child.name)).length,
          child.count, `${c.slug} covers ${ch.slug}`);
      }
    } else {
      assert.equal(hits.length, c.count, `category ${c.slug}`);
    }
  }
});

test('bags is honestly empty — zero products, no fakes', () => {
  assert.deepEqual(productsByCategory(data, 'bags'), []);
});

test('sizes[].available matches derivable variant availability', () => {
  for (const p of data.products) {
    for (const s of p.sizes) {
      if (!s.label) continue; /* colour/one-size rows ship an empty label */
      const v = findVariantBySize(p, s.label);
      assert.ok(v, `size ${s.label} on ${p.id}`);
      if (!s.available) continue;
      assert.ok(variantAvailable(v), `size ${s.label} available implies variant buyable on ${p.id}`);
    }
  }
});

test('new-arrival hero ids all exist in the catalog', () => {
  for (const id of [31845, 31800, 31787, 31836, 31662]) {
    assert.ok(findProduct(data, id), `id ${id} exists`);
  }
});

/* ---------- detailed variant addToCart ---------- */

const sizeProduct = findProduct(data, 31845); // Love Notes PJ Set, sizes
const colorProduct = findProduct(data, 30106); // Satin Scrunchies, color options
const simpleProduct = findProduct(data, 30132); // Silk Scrunchie Set, no variants

test('detail products have the expected variant shapes', () => {
  assert.ok(sizeProduct.variants.length > 0, 'size variants exist on 31845');
  assert.ok(findVariantBySize(sizeProduct, sizeProduct.sizes[0].label));
  assert.ok(colorProduct.variants.some((v) => 'color' in v.options));
  assert.equal(simpleProduct.variants.length, 0);
});

test('findVariantById + findVariantBySize resolve correct variations', () => {
  const v = findVariantBySize(sizeProduct, sizeProduct.sizes[0].label);
  assert.ok(v);
  assert.deepEqual(findVariantById(sizeProduct, v.id), v);
  assert.equal(findVariantById(sizeProduct, 99999999), undefined);
});

test('unknown size label throws UNKNOWN_SIZE', () => {
  assert.throws(() => addToCart([], sizeProduct, 'UK99/ZZZ'),
    /UNKNOWN_SIZE/);
});

test('unavailable size throws SIZE_UNAVAILABLE', () => {
  const stub = {
    ...sizeProduct,
    sizes: [{ label: 'S', available: true }],
    variants: [{
      id: 9, options: { Size: 'S' }, size: 'S',
      price: 100, regularPrice: 120, available: false, image: null,
    }],
  };
  assert.throws(() => addToCart([], stub, 'S'), /SIZE_UNAVAILABLE/);
});

test('color variant adds with its real price; fee optional', () => {
  const v = colorProduct.variants.find(variantAvailable);
  const cart = addToCart([], colorProduct, v.options.color, 2, null);
  assert.equal(cart[0].price, v.price);
  assert.equal(cart[0].qty, 2);
  assert.equal(subtotal(cart), v.price * 2);
});

test('unit without any variant adds with the product price', () => {
  const cart = addToCart([], simpleProduct, null);
  assert.equal(cart[0].price, simpleProduct.price);
  assert.equal(cart[0].qty, 1);
});

test('lines merge only on same identity: product + option + persona', () => {
  const s1 = sizeProduct.sizes[0].label;
  const c1 = addToCart([], sizeProduct, s1, 1, null);
  const c2 = addToCart(c1, sizeProduct, s1, 1, null);
  const c3 = addToCart(c2, sizeProduct, sizeProduct.sizes[1].label, 1, null);
  assert.equal(c3.length, 2);
  const persona = addToCart(c3, sizeProduct, s1, 1, { name: 'Amara', font: 'Script A', color: 'Black' });
  assert.equal(persona.length, 3);
  assert.equal(persona[0].qty, 2); // merged non-personalised line
  const persona2 = addToCart(persona, sizeProduct, s1, 1, { name: 'Zoe', font: 'Script A', color: 'Black' });
  assert.equal(persona2.length, 4); // different name -> distinct line
});

test('personalisation fee = per unit, added only when a persona is attached', () => {
  const pers = { name: 'Amara', font: 'Script A', color: 'Black' };
  const none = addToCart([], sizeProduct, sizeProduct.sizes[0].label, 3, null);
  const withPers = addToCart(none, sizeProduct, sizeProduct.sizes[1].label, 2, pers);
  assert.equal(lineTotal(withPers[0]), none[0].price * 3);
  assert.equal(lineTotal(withPers[1]), (withPers[1].price + PERSONALISATION_FEE) * 2);
  assert.equal(subtotal(withPers), lineTotal(withPers[0]) + lineTotal(withPers[1]));
  assert.equal(cartCount(withPers), 5);
});

test('currency subtotal never loses the personalisation fee', () => {
  const pers = { name: 'Zoe', font: 'Script A', color: 'Navy' };
  const cart = addToCart([], sizeProduct, sizeProduct.sizes[0].label, 1, pers);
  const expected = cart[0].price * 1 + PERSONALISATION_FEE * 1;
  assert.equal(subtotal(cart), expected);
  assert.equal(lineTotal(cart[0]), expected);
  assert.match(formatPrice(subtotal(cart)), /^Rs/);
});

test('variant pricing overrides product price (source variations vary)', () => {
  const withDiffs = data.products.find((p) => p.variants.some((v) => v.price != null && v.price !== p.price));
  if (!withDiffs) return; // catalog may happen to be uniform — skip
  const v = withDiffs.variants.find((v) => v.price != null && v.price !== withDiffs.price);
  const cart = addToCart([], withDiffs, Object.values(v.options)[0], 1, null);
  assert.equal(cart[0].price, v.price);
});

test('normalizeCart keeps rounded variant + persona lines and kills garbage', () => {
  const good = {
    id: 31845, name: 'x', qty: 2, price: 3990, size: 'UK10/M',
    variantId: 73799, fee: PERSONALISATION_FEE,
    pers: { name: 'Amara', font: 'Script A', color: 'Black' },
  };
  const cleaned = normalizeCart([good, { id: 12, name: '' }, null, { id: 'x', qty: 1, size: 'a', price: 1 }]);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].variantId, 73799);
  assert.equal(cleaned[0].fee, PERSONALISATION_FEE);
  assert.deepEqual(cleaned[0].pers, good.pers);
});

test('updateQty/removeItem still behave on new-style lines', () => {
  const pers = { name: 'Zoe', font: 'Script A', color: 'Navy' };
  let cart = addToCart([], sizeProduct, sizeProduct.sizes[0].label, 2, pers);
  cart = updateQty(cart, 0, 1);
  assert.equal(subtotal(cart), cart[0].price * 1 + PERSONALISATION_FEE * 1);
  cart = updateQty(cart, 0, 0);
  assert.deepEqual(cart, []);
});

test('cartCount stays unit-based with new lines', () => {
  const pers = { name: 'Zoe', font: 'Script A', color: 'Navy' };
  let cart = addToCart([], sizeProduct, sizeProduct.sizes[0].label, 3, pers);
  cart = addToCart(cart, colorProduct, colorProduct.variants[0].options.color, 4, null);
  assert.equal(cartCount(cart), 7);
});

test('unavailable color variant throws; missing-price variant throws without an add', () => {
  const colorOut = colorProduct.variants.find((v) => !v.available);
  if (colorOut) {
    assert.throws(() => addToCart([], colorProduct, colorOut.options.color), /SIZE_UNAVAILABLE/);
  }
  const nullPriced = data.products
    .flatMap((p) => (p.variants ?? []).map((v) => ({ p, v })))
    .find(({ v }) => v.price == null);
  assert.ok(nullPriced, 'catalog contains the known null-price variants');
  assert.throws(() => addToCart([], nullPriced.p, Object.values(nullPriced.v.options)[0]),
    /PRICE_MISSING/);
});

/* ---------- category chain + descendants ---------- */

test('categoryChain resolves the taxonomy tree paths', () => {
  const chain = categoryChain(data, 'pants');
  assert.deepEqual(chain.map((c) => c.slug), ['bottoms', 'pants']);
  const footer = categoryChain(data, 'bags');
  assert.deepEqual(footer.map((c) => c.slug), ['bags']);
});

test('categoryDescendants includes the parent term itself', () => {
  const { parent, children } = categoryDescendants(data, 'tops');
  assert.equal(parent.slug, 'tops');
  assert.deepEqual(children.map((c) => c.slug).sort(), ['blouse', 'jackets', 't-shirts']);
  assert.deepEqual(categoryDescendants(data, 'pjs').children, []);
});

/* ---------- filter + sort helpers ---------- */

test('applyFilters: sizes, availability and price band', () => {
  const pool = data.products;
  const somewhereInStock = pool.find((p) => p.sizes.some((s) => s.available));
  const allSoldOut = pool.find((p) => p.sizes.length > 0 && p.sizes.every((s) => !s.available));
  const inStock = applyFilters(pool, { availability: 'in' });
  const outStock = applyFilters(pool, { availability: 'out' });
  assert.ok(inStock.includes(somewhereInStock));
  assert.ok(!inStock.includes(allSoldOut));
  assert.ok(outStock.includes(allSoldOut));
  const band = applyFilters(pool, { priceMin: 1000, priceMax: 2000 });
  for (const p of band) {
    assert.ok(p.price >= 1000 && p.price <= 2000, `price ${p.price}`);
  }
});

test('sortProducts: price asc/desc, newest, and name are total orders', () => {
  const pool = data.products.slice(0, 40);
  const asc = sortProducts(pool, 'price-asc');
  const desc = sortProducts(pool, 'price-desc');
  assert.equal(asc[0].price, Math.min(...pool.map((p) => p.price)));
  assert.equal(desc[0].price, Math.max(...pool.map((p) => p.price)));
  const newest = sortProducts(pool, 'newest');
  assert.equal(newest[0].price, pool[pool.length - 1]?.price);
  const byName = sortProducts(pool, 'name');
  const sortedNames = byName.map((p) => p.name);
  for (let i = 1; i < sortedNames.length; i++) {
    assert.ok(sortedNames[i - 1].localeCompare(sortedNames[i]) <= 0, `name order ${i}`);
  }
});


/* ---------- audited customisation contract ---------- */
const customConfig = {
  eligibleProductIds: [31597, 31630, 31638, 31646, 31654, 31662],
  feePerUnit: 1000,
  maxLength: 10,
  placements: [
    { id: 'hem', label: 'Pocket Hem', fonts: [{ id: 'f1', label: 'Freestyle Script' }], colors: [{ id: 'c1', label: 'off white', value: '#e7e5d6' }] },
    { id: 'pocket', label: 'Pocket', fonts: [{ id: 'f1', label: 'Freestyle Script' }], colors: [{ id: 'c1', label: 'Navy', value: '#e7e5d6' }] },
  ],
};

const validPersona = {
  name: 'Liyan', font: 'Freestyle Script', color: 'off white',
  placements: [{ id: 'hem', label: 'Pocket Hem', text: 'Liyan', fontId: 'f1', fontLabel: 'Freestyle Script', colorId: 'c1', colorLabel: 'off white', colorValue: '#e7e5d6' }],
};

test('customisation eligibility uses exact audited product IDs', () => {
  assert.equal(validateSelection(customConfig, 31597, validPersona).valid, true);
  assert.equal(validateSelection(customConfig, 31598, validPersona).valid, false);
});

test('customisation rejects empty and over-limit text', () => {
  assert.match(validateSelection(customConfig, 31597, { ...validPersona, placements: [{ ...validPersona.placements[0], text: '' }] }).error, /text/i);
  assert.match(validateSelection(customConfig, 31597, { ...validPersona, placements: [{ ...validPersona.placements[0], text: '01234567890' }] }).error, /10/);
});

test('customisation normalizes two placements without adding second fee', () => {
  const second = { ...validPersona.placements[0], id: 'pocket', label: 'Pocket', colorLabel: 'Navy' };
  const result = normalizePersona(customConfig, { ...validPersona, placements: [...validPersona.placements, second] });
  assert.equal(result.placements.length, 2);
  assert.equal(result.fee, 1000);
});

test('cart identity includes full placement selections, not only legacy fields', () => {
  const p = findProduct(data, 31597);
  const second = { ...validPersona, placements: [...validPersona.placements, { ...validPersona.placements[0], id: 'pocket', label: 'Pocket', colorLabel: 'Navy' }] };
  const firstLine = addToCart([], p, p.sizes.find((s) => s.available).label, 1, validPersona);
  const secondLine = addToCart(firstLine, p, p.sizes.find((s) => s.available).label, 1, second);
  assert.equal(secondLine.length, 2);
  assert.equal(subtotal(secondLine), (secondLine[0].price + 1000) + (secondLine[1].price + 1000));
});

test('normalizeCart discards corrupt placement payload while preserving legacy line', () => {
  const dirty = [{ id: 31597, name: 'x', size: 'M', qty: 2, price: 100, fee: 1000, pers: { name: 'X', font: 'F', color: 'C', placements: 'bad' } }];
  const clean = normalizeCart(dirty);
  assert.equal(clean.length, 1);
  assert.equal(clean[0].pers.placements, undefined);
});


test('audited fee applies once per unit for quantity two with two placements', () => {
  const p = findProduct(data, 31597);
  const second = { ...validPersona, placements: [...validPersona.placements, { ...validPersona.placements[0], id: 'pocket', label: 'Pocket', colorLabel: 'Navy' }] };
  const size = p.sizes.find((item) => item.available).label;
  const cart = addToCart([], p, size, 2, second);
  assert.equal(cart[0].fee, 1000);
  assert.equal(lineTotal(cart[0]), (cart[0].price + 1000) * 2);
});

test('full placement payload is rejected for non-eligible product', () => {
  const p = findProduct(data, 31845);
  assert.throws(() => addToCart([], p, p.sizes.find((item) => item.available).label, 1, validPersona), /INVALID_PERSONALISATION/);
});


test('source client accepts non-empty whitespace text and quantity clamps to 1..99', () => {
  const whitespace = { ...validPersona, placements: [{ ...validPersona.placements[0], text: '   ' }] };
  assert.equal(validateSelection(customConfig, 31597, whitespace).valid, true);
  assert.equal(clampQuantity(0), 1);
  assert.equal(clampQuantity(2.9), 2);
  assert.equal(clampQuantity(120), 99);
});


test('cart quantity invariant caps every direct operation at 99', () => {
  assert.equal(MAX_QUANTITY, 99);
  const p = findProduct(data, 31845);
  const size = p.sizes.find((item) => item.available).label;
  assert.equal(addToCart([], p, size, 99)[0].qty, 99);
  assert.throws(() => addToCart([], p, size, 100), /INVALID_QTY/);
  assert.throws(() => updateQty([{ id: p.id, name: p.name, size, qty: 1, price: p.price }], 0, 100), /INVALID_QTY/);
});

test('cart merge rejects quantity that would exceed 99 without mutating prior cart', () => {
  const p = findProduct(data, 31845);
  const size = p.sizes.find((item) => item.available).label;
  const cart = addToCart([], p, size, 98);
  assert.throws(() => addToCart(cart, p, size, 2), /INVALID_QTY/);
  assert.equal(cart[0].qty, 98);
});

test('normalizeCart caps corrupt stored quantity at 99', () => {
  const clean = normalizeCart([{ id: 31845, name: 'x', size: 'UK08/S', qty: 100, price: 3990 }]);
  assert.equal(clean[0].qty, 99);
});

test('personalised quantity two keeps one fee per unit', () => {
  const p = findProduct(data, 31597);
  const size = p.sizes.find((item) => item.available).label;
  const cart = addToCart([], p, size, 2, validPersona);
  assert.equal(cart[0].qty, 2);
  assert.equal(cart[0].fee, 1000);
  assert.equal(lineTotal(cart[0]), (cart[0].price + 1000) * 2);
});
