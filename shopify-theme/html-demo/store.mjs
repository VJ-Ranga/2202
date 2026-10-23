/**
 * store.mjs — pure commerce logic for the 2202 Love Colombo HTML demo.
 * No DOM, no network. Every function returns new data; inputs are never mutated.
 * Error contract (message codes used by app.js):
 *   UNKNOWN_SIZE      selected size/option label not offered by the product
 *   SIZE_UNAVAILABLE  listed option not buyable (source stock)
 *   PRICE_MISSING     source variant ships without a price — unsellable
 *   INVALID_QTY       quantity not a positive integer
 * Extended cart lines carry variantId, per-unit personalisation fee and a
 * persona record; legacy {id,name,size,qty,price} lines stay valid.
 */

/* ---------- money ---------- */

/**
 * Format a price as the brand displays it: "Rs 3,990.00".
 * @param {number} value non-negative finite number
 */
export function formatPrice(value) {
  if (typeof value !== 'number') throw new TypeError('formatPrice: expected a number');
  if (Number.isNaN(value)) throw new TypeError('formatPrice: expected a finite number');
  if (!Number.isFinite(value)) throw new TypeError('formatPrice: expected a finite number');
  if (value < 0) throw new RangeError('formatPrice: expected a non-negative number');
  const [whole, frac = ''] = value.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs ${grouped}.${frac}`;
}

/* ---------- product lookup ---------- */

/** Find a product by numeric id. */
export function findProduct(data, id) {
  if (!data || !Array.isArray(data.products)) return undefined;
  return data.products.find((p) => p && p.id === id);
}

/** Size record for a label, or undefined when the label is not offered. */
export function sizeInfo(product, label) {
  if (!product || !Array.isArray(product.sizes) || typeof label !== 'string') return undefined;
  return product.sizes.find((s) => s && s.label === label);
}

/* ---------- cart ---------- */

function requireValidQty(qty) {
  if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
    throw new Error(`INVALID_QTY: quantity must be an integer from 1 to ${MAX_QUANTITY}`);
  }
}

/* ---------- personalisation ---------- */

/** Rs 1,000 per unit, source store setting; only charged when opted in. */
export const PERSONALISATION_FEE = 1000;
export const MAX_QUANTITY = 99;
export const AUDITED_PERSONALISATION_IDS = Object.freeze([31597, 31630, 31638, 31646, 31654, 31662]);

function safePlacements(pers) {
  if (!Array.isArray(pers?.placements)) return undefined;
  const placements = pers.placements.filter((item) => item && typeof item === 'object'
    && typeof item.id === 'string' && typeof item.label === 'string'
    && typeof item.text === 'string' && typeof item.fontId === 'string'
    && typeof item.fontLabel === 'string' && typeof item.colorId === 'string'
    && typeof item.colorLabel === 'string' && typeof item.colorValue === 'string')
    .slice(0, 2)
    .map((item) => ({
      id: item.id, label: item.label, text: item.text,
      fontId: item.fontId, fontLabel: item.fontLabel,
      colorId: item.colorId, colorLabel: item.colorLabel, colorValue: item.colorValue,
    }));
  return placements.length ? placements : undefined;
}

function copyPersona(pers) {
  if (!pers || typeof pers !== 'object') return undefined;
  const placements = safePlacements(pers);
  if (!placements && !(pers.name || pers.font || pers.color)) return undefined;
  return {
    name: String(pers.name ?? ''), font: String(pers.font ?? ''), color: String(pers.color ?? ''),
    ...(placements ? { placements } : {}),
  };
}

/** Canonical identity includes every audited placement; legacy fields stay compatible. */
export function persKey(pers) {
  const copy = copyPersona(pers);
  return copy ? JSON.stringify([copy.name, copy.font, copy.color, copy.placements ?? []]) : '';
}

/* ---------- variants ---------- */

/** Variation for a size/option label (source value from either Size or color). */
export function findVariantBySize(product, label) {
  if (!product || !Array.isArray(product.variants) || typeof label !== 'string') return undefined;
  return product.variants.find(
    (v) => v && v.options && Object.values(v.options).includes(label),
  );
}

/** Variation by its source variation id. */
export function findVariantById(product, variantId) {
  if (!product || !Array.isArray(product.variants)) return undefined;
  return product.variants.find((v) => v && v.id === variantId);
}

/** Buyable = source in stock AND a valid numeric price. */
export function variantAvailable(v) {
  return Boolean(v && v.available && typeof v.price === 'number' && Number.isFinite(v.price) && v.price >= 0);
}

/* ---------- cart ---------- */

/**
 * Add a product (with one selected option label — a size like "UK10/M" for
 * sized products, a colour like "Blush Pink" for colour products, or null for
 * one-size items) to the cart. Optionally attach personalisation; that adds
 * PERSONALISATION_FEE per unit.
 * Lines merge only on identical (product id + option label + persona) identity.
 * @returns {Array} a new cart array
 */
export function addToCart(cart, product, sizeLabel, qty = 1, pers = null) {
  requireValidQty(qty);
  if (!product || typeof product !== 'object') {
    throw new TypeError('addToCart: product required');
  }
  let variant = null;
  if (sizeLabel != null) {
    // sized/option products need a real surface: variants, or a real sizes list
    const hasSizes = Array.isArray(product.sizes) && product.sizes.some((s) => s && s.label);
    if (!Array.isArray(product.variants) || !product.variants.length) {
      if (!hasSizes || !sizeInfo(product, sizeLabel)) {
        throw new Error('UNKNOWN_SIZE: selected size is not offered for this product');
      }
      if (!sizeInfo(product, sizeLabel).available) {
        throw new Error('SIZE_UNAVAILABLE: selected size is not in stock');
      }
    } else if (!findVariantBySize(product, sizeLabel)) {
      throw new Error('UNKNOWN_SIZE: selected size is not offered for this product');
    }
  }
  if (Array.isArray(product.variants) && product.variants.length) {
    variant = sizeLabel != null ? findVariantBySize(product, sizeLabel) : undefined;
    if (!variant) {
      throw new Error('UNKNOWN_SIZE: selected size is not offered for this product');
    }
    if (!variantAvailable(variant)) {
      if (typeof variant.price !== 'number' || variant.price == null) {
        throw new Error('PRICE_MISSING: selected variation has no price in the source data');
      }
      throw new Error('SIZE_UNAVAILABLE: selected size is not in stock');
    }
  }
  const hasPers = Boolean(pers && typeof pers === 'object' && (pers.name || pers.font || pers.color || pers.placements?.length));
  if (hasPers && Array.isArray(pers.placements) && pers.placements.length && !AUDITED_PERSONALISATION_IDS.includes(product.id)) {
    throw new Error('INVALID_PERSONALISATION: product is not eligible for audited personalisation');
  }
  const fee = hasPers ? PERSONALISATION_FEE : 0;
  const pk = persKey(pers);
  const next = (Array.isArray(cart) ? cart : []).map((l) => ({ ...l, ...(l.pers ? { pers: { ...l.pers } } : {}) }));
  const existing = next.find((l) => l.id === product.id && l.size === (sizeLabel ?? '') && persKey(l.pers) === pk);
  if (existing) {
    if (existing.qty + qty > MAX_QUANTITY) {
      throw new Error(`INVALID_QTY: cart quantity cannot exceed ${MAX_QUANTITY}`);
    }
    existing.qty += qty;
  } else {
    next.push({
      id: product.id,
      name: product.name,
      size: sizeLabel ?? '',
      qty,
      price: variant ? variant.price : product.price,
      ...(variant ? { variantId: variant.id } : {}),
      ...(hasPers ? { fee, pers: copyPersona(pers) } : {}),
    });
  }
  return next;
}

/** Ex-fee unit price: the variation's own source price. */
export function unitPrice(line) {
  const p = Number(line?.price);
  return Number.isFinite(p) && p >= 0 ? p : 0;
}

/** Full line total: (unit price + per-unit personalisation fee) × qty. */
export function lineTotal(line) {
  const q = Number(line?.qty);
  if (!Number.isFinite(q) || q <= 0) return 0;
  const fee = Number(line?.fee ?? 0);
  return (unitPrice(line) + (Number.isFinite(fee) && fee > 0 ? fee : 0)) * q;
}

/** Set a line's quantity. 0 (or less) removes the line; invalid values throw. */
export function updateQty(cart, index, qty) {
  if (!Array.isArray(cart)) return cart;
  if (index < 0 || index >= cart.length) return cart;
  if (qty > 0) {
    requireValidQty(qty);
    const next = cart.map((l) => ({ ...l, ...(l.pers ? { pers: { ...l.pers } } : {}) }));
    next[index].qty = qty;
    return next;
  }
  return removeItem(cart, index);
}

/** Return the cart without the line at index (new array). */
export function removeItem(cart, index) {
  if (!Array.isArray(cart)) return [];
  const next = cart.map((l) => ({ ...l }));
  next.splice(index, 1);
  return next;
}

/** Total unit count across lines. */
export function cartCount(cart) {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((n, l) => n + (Number.isFinite(l?.qty) ? l.qty : 0), 0);
}

/** Exact subtotal: sum of price × qty. Empty cards yield 0. */
export function subtotal(cart) {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, l) => sum + lineTotal(l), 0);
}

/**
 * Repair a cart loaded from storage: throw away corrupt lines, clamp
 * fractional quantities down to 1, and drop empty/negative quantities.
 * @returns {Array} always an array of well-formed lines
 */
export function normalizeCart(dirty) {
  if (!Array.isArray(dirty)) return [];
  const clean = [];
  for (const entry of dirty) {
    if (!entry || typeof entry !== 'object') continue;
    const { id, name, size, qty: rawQty, price, variantId, fee, pers } = entry;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) continue;
    if (typeof name !== 'string' || !name) continue;
    if (typeof size !== 'string') continue;
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) continue;
    const q = Number(rawQty);
    if (!Number.isFinite(q)) continue;
    if (q < 1) continue;
    const f = fee == null ? 0 : Number(fee);
    const cleanPers = pers && typeof pers === 'object' && typeof pers.name === 'string' && pers.name
      ? copyPersona(pers)
      : undefined;
    clean.push({
      id, name, size,
      qty: q > MAX_QUANTITY ? MAX_QUANTITY : (Number.isInteger(q) ? q : 1),
      price: p,
      ...(typeof variantId === 'number' && Number.isInteger(variantId) && variantId > 0 ? { variantId } : {}),
      ...(Number.isFinite(f) && f > 0 ? { fee: f } : {}),
      ...(cleanPers ? { pers: cleanPers } : {}),
    });
  }
  return clean;
}

/** Badge text for the cart button: '' hides the badge. */
export function cartBadge(cart) {
  const n = cartCount(cart);
  return n > 0 ? String(n) : '';
}

/* ---------- wishlist ---------- */

/**
 * Toggle a numeric product id in the wishlist.
 * @returns {{ids:number[], added:boolean}}
 */
export function toggleWishlist(ids, id) {
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new TypeError('toggleWishlist: id must be an integer');
  }
  const base = Array.isArray(ids) ? ids : [];
  if (base.includes(id)) {
    return { ids: base.filter((x) => x !== id), added: false };
  }
  return { ids: [...base, id], added: true };
}

/* ---------- search & collections ---------- */

/**
 * Client-side product search over name + real category terms.
 * Blank/whitespace query returns everything.
 */
export function searchProducts(products, query) {
  if (!Array.isArray(products)) return [];
  const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
  if (!q) return products.slice();
  return products.filter((p) => {
    if (!p || typeof p !== 'object') return false;
    const name = typeof p.name === 'string' ? p.name.toLowerCase() : '';
    if (name.includes(q)) return true;
    const cats = Array.isArray(p.categories) ? p.categories : [];
    return cats.some((c) => typeof c === 'string' && c.toLowerCase().includes(q));
  });
}

/**
 * Resolve a category by slug (via the contract's categories list) or by
 * real taxonomy name, then return matching products in catalog order.
 * Unknown/unstocked categories (e.g. Tops) return [] — never fake data.
 */
/**
 * Real taxonomy children of a category slug, derived from the navigation
 * contract (categories carry source-only parentId ids with no own id).
 * @returns {{parent: object, children: object[]}}
 */
export function categoryDescendants(data, slugOrName) {
  const cats = Array.isArray(data?.categories) ? data.categories : [];
  const nav = Array.isArray(data?.navigation) ? data.navigation : [];
  const arg = typeof slugOrName === 'string' ? slugOrName.trim().toLowerCase() : '';
  const parent = cats.find((c) => c && (c.slug === arg || String(c.name).toLowerCase() === arg));
  if (!parent) return { parent: null, children: [] };
  const entry = nav.find((n) => n && (n.slug === parent.slug || String(n.name).toLowerCase() === String(parent.name).toLowerCase()));
  const children = (entry?.children ?? [])
    .map((ch) => cats.find((c) => c.slug === ch.slug || String(c.name).toLowerCase() === String(ch.name).toLowerCase()))
    .filter(Boolean);
  return { parent, children };
}

/** Root → target chain of real taxonomy terms. */
export function categoryChain(data, slugOrName) {
  const { parent } = categoryDescendants(data, slugOrName);
  if (!parent) return [];
  const nav = Array.isArray(data?.navigation) ? data.navigation : [];
  const chain = [parent];
  let node = parent;
  let guard = 0;
  while (guard++ < 8) {
    const up = nav.find((n) => (n.children ?? []).some(
      (ch) => ch.slug === node.slug || String(ch.name).toLowerCase() === String(node.name).toLowerCase(),
    ));
    if (!up) break;
    const p = data.categories.find((c) => c.slug === up.slug);
    if (!p) break;
    chain.unshift(p);
    node = p;
  }
  return chain;
}

/**
 * Resolve a category by slug (or real taxonomy name) and return the matching
 * products including all real descendant terms, in catalog order.
 * Unknown/unstocked categories (e.g. Bags) return [] — never fake data.
 */
export function productsByCategory(data, slugOrName) {
  if (!data || !Array.isArray(data.products)) return [];
  if (!slugOrName) return data.products.slice();
  const arg = String(slugOrName).trim().toLowerCase();
  if (arg === 'all') return data.products.slice();
  // Sale is an explicit store term; taxonomy count governs, never a price check
  const { parent, children } = categoryDescendants(data, slugOrName);
  if (!parent) return [];
  const terms = new Set();
  terms.add(String(parent.name).toLowerCase());
  for (const c of children) terms.add(String(c.name).toLowerCase());
  return data.products.filter((p) => (p.categories ?? []).some(
    (c) => terms.has(String(c).toLowerCase()),
  ));
}

/* ---------- filters + sorts (collection/search pages) ---------- */

/** Buyable state derived from the catalog: any own variant/sizes availability. */
export function isBuyable(product) {
  if (!product) return false;
  if (Array.isArray(product.variants) && product.variants.length) {
    return product.variants.some(variantAvailable);
  }
  if (Array.isArray(product.sizes) && product.sizes.length) {
    return product.sizes.some((s) => s && s.available);
  }
  return product.stockStatus !== 'outofstock';
}

/**
 * Pure filter step.
 * filters: { sizes?: string[], availability?: 'in'|'out', priceMin?, priceMax?, query? }
 */
export function applyFilters(products, filters = {}) {
  if (!Array.isArray(products)) return [];
  const { sizes, availability, priceMin, priceMax, query } = filters;
  let out = products.slice();
  if (Array.isArray(sizes) && sizes.length) {
    const want = new Set(sizes.map(String));
    out = out.filter((p) => {
      const offered = new Set((p.sizes ?? []).map((s) => s.label).filter(Boolean));
      for (const v of p.variants ?? []) if (v.options?.Size) offered.add(v.options.Size);
      return [...offered].some((s) => want.has(s));
    });
  }
  if (availability === 'in' || availability === 'out') {
    const wantIn = availability === 'in';
    out = out.filter((p) => isBuyable(p) === wantIn);
  }
  const lo = Number(priceMin);
  const hi = Number(priceMax);
  if (Number.isFinite(lo)) out = out.filter((p) => typeof p.price === 'number' && p.price >= lo);
  if (Number.isFinite(hi) && priceMax != null) out = out.filter((p) => typeof p.price === 'number' && p.price <= hi);
  if (query != null) out = (searchProducts(out, query) ?? out);
  return out;
}

/**
 * Pure sort step. Catalog order is the source order (data.products).
 * 'newest' = reverse catalog order (source import order), not a fake date.
 */
export function sortProducts(products, sort) {
  if (!Array.isArray(products)) return [];
  const pool = products.slice();
  const price = (p) => (typeof p?.price === 'number' && Number.isFinite(p.price) ? p.price : Infinity);
  switch (sort) {
    case 'price-asc': pool.sort((a, b) => price(a) - price(b) || a.name.localeCompare(b.name)); break;
    case 'price-desc': pool.sort((a, b) => price(b) - price(a) || a.name.localeCompare(b.name)); break;
    case 'newest': pool.reverse(); break;
    case 'name': pool.sort((a, b) => String(a?.name ?? '').localeCompare(String(b?.name ?? ''))); break;
    default: break; /* catalog order */
  }
  return pool;
}

/* ---------- storage guards ---------- */

/**
 * Read JSON from a Storage-style backend under key. Corrupted payloads,
 * disabled storage (SecurityError), and missing keys all yield null.
 * @returns {*} parsed value or null
 */
export function loadJSON(key, storage = globalThis.localStorage) {
  if (!key || typeof key !== 'string') return null;
  try {
    if (!storage || typeof storage.getItem !== 'function') return null;
    const raw = storage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Serialize and write a value. Storage failures (quota, security) are
 * swallowed: the demo degrades to memory-only state rather than crashing.
 */
export function saveJSON(key, value, storage = globalThis.localStorage) {
  if (!key || typeof key !== 'string') return;
  try {
    if (!storage || typeof storage.setItem !== 'function') return;
    if (value === undefined) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — state stays in-memory this session */
  }
}
