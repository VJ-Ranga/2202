/**
 * search-overlay.mjs — standalone premium search overlay for the 2202 Love Colombo demo.
 *
 * Owns exactly one stylesheet, ./search-overlay.css, awaited before the factory
 * resolves so the first open never flashes unstyled (no FOUC). Pure logic comes
 * from store.mjs only — never core.js/app.js/pages.js — so integration can wire
 * this module later without import cycles. All data is local: the injected
 * getProducts/getNavigation getters read the current central-state arrays, and
 * every destination comes from the injected urls map. User-entered text is only
 * ever assigned through textContent; no innerHTML anywhere.
 *
 * Frozen API:
 *   const overlay = await createSearchOverlay({ getProducts, getNavigation, urls });
 *   overlay.open(invoker, initialQuery = '');  // showModal, autofocus input
 *   overlay.close();                           // immediate, idempotent
 *   overlay.isOpen;                            // boolean getter
 */

import { searchProducts, formatPrice } from './store.mjs';

/* ---------- tunables ---------- */

export const MAX_RESULTS = 8;
export const DEBOUNCE_MS = 180; /* inside the required 150–200ms window */
export const NEW_ARRIVALS = 6;
export const SUGGESTION_SLUGS = ['dresses', 'tops', 'pjs', 'sale'];

/* ---------- pure helpers (node-testable, no DOM) ---------- */

/**
 * Top-category suggestions straight from real navigation — never a fake
 * "trending" list. Order follows SUGGESTION_SLUGS; unknown slugs drop out.
 * @returns {{slug: string, label: string}[]}
 */
export function pickSuggestions(navigation, slugs = SUGGESTION_SLUGS) {
  const nav = Array.isArray(navigation) ? navigation.filter((n) => n && typeof n.slug === 'string') : [];
  const bySlug = new Map(nav.map((n) => [n.slug, n]));
  const out = [];
  for (const slug of slugs) {
    const entry = bySlug.get(slug);
    if (entry) out.push({ slug: entry.slug, label: String(entry.name ?? entry.slug) });
  }
  return out;
}

/**
 * Newest products by real id descending (source import order — no fake dates).
 * Returns a new array; the catalog is never mutated.
 * @returns {object[]}
 */
export function pickNewArrivals(products, count = NEW_ARRIVALS) {
  if (!Array.isArray(products)) return [];
  return products
    .filter((p) => p && typeof p.id === 'number')
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, count);
}

/**
 * Curated "You may like" rail: six real source-id picks, in this order.
 * Missing ids fall back to the newest real products (pickNewArrivals order);
 * entries are always references into the catalog — never invented.
 */
export const RECOMMENDED_IDS = [31662, 31597, 30895, 31845, 31787, 31030];

export function pickRecommendations(products, ids = RECOMMENDED_IDS, count = NEW_ARRIVALS) {
  if (!Array.isArray(products)) return [];
  const byId = new Map(products.filter((p) => p && typeof p.id === 'number').map((p) => [p.id, p]));
  const picked = [];
  const seen = new Set();
  for (const id of ids) {
    const hit = byId.get(id);
    if (hit && !seen.has(hit.id)) { picked.push(hit); seen.add(hit.id); }
  }
  if (picked.length < count) {
    for (const hit of pickNewArrivals(products)) {
      if (picked.length >= count) break;
      if (!seen.has(hit.id)) { picked.push(hit); seen.add(hit.id); }
    }
  }
  return picked.slice(0, count);
}

/**
 * Live matches over the full catalog via store's searchProducts (name +
 * category), capped so a broad query never dumps all 116 products into the
 * overlay. total keeps the real count for "View all N results".
 * @returns {{total: number, shown: object[]}}
 */
export function pickResults(products, query, max = MAX_RESULTS) {
  const matches = searchProducts(Array.isArray(products) ? products : [], query);
  const cap = Number.isFinite(max) && max > 0 ? Math.floor(max) : MAX_RESULTS;
  return { total: matches.length, shown: matches.slice(0, cap) };
}

/**
 * Italic material line for a card — only when the source text carries a real
 * Fabric line: `Fabric: value`, a `Fabric` section header with its next line,
 * or a standalone material bullet ending in "fabric". Mid-sentence prose never
 * qualifies; the value is returned verbatim (never invented).
 * @returns {string|null}
 */
export function materialLine(product) {
  if (!product || typeof product !== 'object') return null;
  const text = `${typeof product.fullDescription === 'string' ? product.fullDescription : ''}\n${typeof product.description === 'string' ? product.description : ''}`;
  const colon = text.match(/^\s*Fabric\s*[:\-–—]\s*([^\n]+)$/mi);
  if (colon) return colon[1].trim();
  const header = text.match(/^\s*Fabric[ \t]*\n+([^\n]+)/mi);
  if (header) {
    const value = header[1].trim();
    if (value) return value;
  }
  const bullet = text.match(/^\s*([A-Za-z0-9%][^.\n]{0,60}?\s+fabric)\s*$/mi);
  if (bullet) return bullet[1].trim();
  return null;
}

/** Honest zero-state copy: names the query, says what to try, offers browsing. */
export function noResultsCopy(query) {
  const q = typeof query === 'string' ? query.trim() : '';
  return {
    headline: q ? `No matches for “${q}”.` : 'No matches.',
    hint: 'Check the spelling or try a broader word — every style lives in the full catalog.',
    browseLabel: 'Browse all styles',
  };
}

/** Full search page URL for a query (blank = whole catalog), concept/palette preserved by urls.search. */
export function buildSearchHref(urls, value) {
  return urls.search(typeof value === 'string' ? value.trim() : '');
}

/* ---------- stylesheet (awaited before first open) ---------- */

const STYLE_ID = 'search-overlay-style';
let stylePromise = null;

function ensureStyles() {
  if (typeof document === 'undefined') return Promise.resolve();
  if (stylePromise) return stylePromise;
  const href = new URL('./search-overlay.css', import.meta.url).href;
  stylePromise = new Promise((resolve, reject) => {
    /* An unstyled overlay breaks the professional UI, and the integration
       (core.openSearchOverlay) already catches a factory rejection, falls
       back to the full search page, and clears its memo. So a failed load
       rejects with a meaningful error, removes the dead link, and clears
       this memo so the next attempt loads a fresh one. */
    const fail = (link) => {
      stylePromise = null;
      link.remove();
      reject(new Error(`search-overlay: failed to load search-overlay.css (${href}) — overlay styles unavailable`));
    };
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      if (existing.sheet) { resolve(); return; }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => fail(existing), { once: true });
      return;
    }
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = href;
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => fail(link), { once: true });
    (document.head || document.documentElement).append(link);
  });
  return stylePromise;
}

/* ---------- DOM helpers (textContent only, no innerHTML) ---------- */

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgIcon(paths) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.className = v;
    else if (k === 'hidden') node.hidden = Boolean(v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  }
  for (const kid of kids.flat()) {
    if (kid != null) node.append(kid);
  }
  return node;
}

const ICON_CLOSE = ['M6 6l12 12', 'M18 6L6 18'];
const ICON_SEARCH = ['M21 21l-4.35-4.35', 'M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z'];

/* ---------- factory ---------- */

let activeOverlay = null; /* one modal at a time, even across instances */

export async function createSearchOverlay({ getProducts, getNavigation, urls } = {}) {
  if (typeof getProducts !== 'function') {
    throw new TypeError('createSearchOverlay: getProducts function required');
  }
  if (typeof getNavigation !== 'function') {
    throw new TypeError('createSearchOverlay: getNavigation function required');
  }
  if (!urls || typeof urls.search !== 'function' || typeof urls.product !== 'function'
    || typeof urls.collection !== 'function' || typeof urls.shop !== 'string') {
    throw new TypeError('createSearchOverlay: urls { search, product, collection, shop } required');
  }

  await ensureStyles(); /* styles applied before any open — no FOUC */

  let dialog = null;
  let input = null;
  let clearBtn = null;
  let countEl = null;
  let sideEl = null;
  let mainTitle = null;
  let resultsEl = null;
  let form = null;
  let invoker = null;
  let bodyLock = null;
  let debounceId = 0;

  const clearDebounce = () => {
    if (debounceId) {
      clearTimeout(debounceId);
      debounceId = 0;
    }
  };

  /* ----- rendering ----- */

  function card(p) {
    const priceWrap = el('span', { class: 'spo-card-price' });
    if (p.regularPrice != null) priceWrap.append(el('s', { text: formatPrice(p.regularPrice) }));
    priceWrap.append(document.createTextNode(formatPrice(p.price)));
    const media = el('img', {
      src: p.image?.src ?? '',
      alt: String(p.image?.alt ?? p.name),
      loading: 'lazy',
    });
    const material = materialLine(p);
    return el('a', {
      class: 'spo-card',
      href: urls.product(p.id),
      'aria-label': `${p.name} — ${formatPrice(p.price)}. Open product page`,
    },
    media,
    el('span', { class: 'spo-card-name', text: String(p.name) }),
    material ? el('span', { class: 'spo-card-mat', text: material }) : null, /* name -> fabric -> price */
    priceWrap,
    );
  }

  function renderSide() {
    sideEl.replaceChildren();
    const nav = pickSuggestions(getNavigation());
    if (!nav.length) return;
    /* Suggestions run as live searches (real label text, never the slug):
       unmodified primary click applies the query in the overlay; Ctrl/Meta/
       Shift/Alt or a middle click keep the native full search-page href. */
    const links = nav.map((s) => {
      const a = el('a', {
        class: s.slug === 'sale' ? 'spo-side-link spo-side-link--sale' : 'spo-side-link',
        href: urls.search(s.label),
        text: s.label,
      });
      a.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey
          || e.shiftKey || e.altKey) return;
        e.preventDefault();
        applyQuery(s.label);
        input.focus();
      });
      return a;
    });
    sideEl.append(
      el('h3', { class: 'spo-side-title', text: 'Suggested searches' }),
      el('nav', { class: 'spo-side-links', 'aria-label': 'Suggested searches' }, links),
    );
  }

  function renderDefault() {
    renderSide();
    mainTitle.textContent = 'You may like';
    countEl.textContent = '';
    const picks = pickRecommendations(getProducts());
    resultsEl.replaceChildren(...(picks.length ? [el('div', { class: 'spo-grid' }, picks.map(card))] : []));
  }

  function renderResults(shown, total) {
    renderSide();
    mainTitle.textContent = 'Search results';
    countEl.textContent = `${total} result${total === 1 ? '' : 's'}`;
    resultsEl.replaceChildren(
      el('div', { class: 'spo-grid' }, shown.map(card)),
      el('a', {
        class: 'spo-viewall',
        href: buildSearchHref(urls, input.value),
        text: `View all ${total} result${total === 1 ? '' : 's'}`,
      }),
    );
  }

  function renderNoResults(query) {
    renderSide();
    mainTitle.textContent = 'Search results';
    countEl.textContent = 'No results';
    const copy = noResultsCopy(query);
    resultsEl.replaceChildren(el('div', { class: 'spo-empty' },
      el('h3', { text: copy.headline }),
      el('p', { text: copy.hint }),
      el('a', { class: 'spo-viewall', href: buildSearchHref(urls, ''), text: copy.browseLabel }),
    ));
  }

  function render() {
    const raw = input.value;
    const query = raw.trim();
    clearBtn.hidden = raw.length === 0;
    if (!query) {
      renderDefault();
      return;
    }
    const { total, shown } = pickResults(getProducts(), query);
    if (!total) renderNoResults(query);
    else renderResults(shown, total);
  }

  /** Apply a query immediately (open / clear) — skips the typing debounce. */
  function applyQuery(value) {
    clearDebounce();
    input.value = typeof value === 'string' ? value : '';
    render();
  }

  /* ----- lifecycle -----
     The native 'close' event is dispatched in a QUEUED task, so close() must
     release the body lock and timers itself — synchronously — or a fast
     close/open cycle races the pending cleanup. Both paths are idempotent. */

  function unlockPage() {
    clearDebounce();
    if (bodyLock) {
      document.body.style.overflow = bodyLock.overflow;
      window.scrollTo(0, bodyLock.scrollY);
      bodyLock = null;
    }
    if (activeOverlay === api) activeOverlay = null;
  }

  function restoreFocus() {
    const target = invoker;
    invoker = null;
    if (target && document.contains(target) && typeof target.focus === 'function') target.focus();
  }

  function cleanup() {
    unlockPage();
    restoreFocus();
  }

  function close() {
    unlockPage(); /* immediate: timers cleared, scroll unlocked, no late updates */
    if (dialog?.open) dialog.close(); /* native top-layer exit + focus fixup */
    restoreFocus(); /* immediate best effort; re-asserted by the queued 'close' event */
  }

  function trapTab(e) {
    const focusables = [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
    )].filter((n) => !n.hidden && (n.offsetParent !== null || n === document.activeElement));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const outside = !dialog.contains(active);
    if (e.shiftKey && (active === first || outside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || outside)) { e.preventDefault(); first.focus(); }
  }

  function open(nextInvoker = null, initialQuery = '') {
    if (typeof document === 'undefined') {
      throw new Error('search overlay: open() requires a document');
    }
    if (!dialog) buildDom();
    if (dialog.open) {
      applyQuery(initialQuery);
      input.focus();
      return;
    }
    /* one modal at a time: close any other open dialog before showing ours */
    document.querySelectorAll('dialog[open]').forEach((d) => {
      if (d !== dialog && typeof d.close === 'function') d.close();
    });
    if (activeOverlay && activeOverlay !== api) activeOverlay.close();
    activeOverlay = api;
    invoker = nextInvoker && typeof nextInvoker.focus === 'function' ? nextInvoker : null;
    bodyLock = { overflow: document.body.style.overflow, scrollY: window.scrollY };
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    applyQuery(typeof initialQuery === 'string' ? initialQuery : '');
    input.focus(); /* autofocus on open */
    if (input.value) input.select();
  }

  /* ----- DOM construction (first open, or eagerly in a document) ----- */

  function buildDom() {
    dialog = el('dialog', { class: 'spo-overlay', id: 'spo-search-overlay', 'aria-labelledby': 'spo-search-title' });

    /* hidden dialog title — no big question heading on screen */
    dialog.append(el('h2', { class: 'spo-sr', id: 'spo-search-title', text: 'Search' }));

    const closeBtn = el('button', {
      class: 'spo-icon spo-close', type: 'button', 'aria-label': 'Close search', onclick: () => close(),
    });
    closeBtn.append(svgIcon(ICON_CLOSE));

    const fieldIcon = el('span', { class: 'spo-field-icon' });
    fieldIcon.append(svgIcon(ICON_SEARCH));

    input = el('input', {
      class: 'spo-input', id: 'spo-search-input', type: 'text', name: 'q',
      placeholder: 'Search', autocomplete: 'off', autocapitalize: 'off',
      enterkeyhint: 'search', spellcheck: 'false', 'aria-describedby': 'spo-search-count',
    });
    clearBtn = el('button', {
      class: 'spo-icon spo-clear', type: 'button', 'aria-label': 'Clear search', hidden: true,
      onclick: () => { applyQuery(''); input.focus(); },
    });
    clearBtn.append(svgIcon(ICON_CLOSE));

    /* field is the bordered search bar; close X sits outside it to the right */
    form = el('form', { class: 'spo-form', role: 'search', 'aria-label': 'Product search' },
      el('label', { class: 'spo-sr', for: 'spo-search-input', text: 'Search products' }),
      el('div', { class: 'spo-field' }, fieldIcon, input, clearBtn),
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const href = buildSearchHref(urls, input.value);
      clearDebounce();
      window.location.assign(href); /* full search page, concept/palette kept by urls.search */
    });

    countEl = el('p', { class: 'spo-count', id: 'spo-search-count', role: 'status', 'aria-live': 'polite' });
    sideEl = el('aside', { class: 'spo-side' });
    mainTitle = el('h3', { class: 'spo-main-title', text: 'You may like' });
    resultsEl = el('div', { class: 'spo-results', id: 'spo-search-body' });

    dialog.append(el('div', { class: 'spo-panel' },
      el('header', { class: 'spo-head' }, form, closeBtn),
      el('div', { class: 'spo-body' }, sideEl,
        el('section', { class: 'spo-main' },
          el('div', { class: 'spo-main-head' }, mainTitle, countEl),
          resultsEl)),
    ));

    input.addEventListener('input', () => {
      clearDebounce();
      clearBtn.hidden = input.value.length === 0;
      debounceId = setTimeout(() => { debounceId = 0; render(); }, DEBOUNCE_MS);
    });

    /* Escape must win over <input type="search">'s native Esc-clear: capture phase. */
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'Tab') trapTab(e);
    }, true);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });

    let downOutside = false;
    dialog.addEventListener('mousedown', (e) => { downOutside = e.target === dialog; });
    dialog.addEventListener('click', (e) => {
      if (downOutside && e.target === dialog) close();
      downOutside = false;
    });

    dialog.addEventListener('close', cleanup); /* safety net: native close paths */
    document.body.append(dialog);
  }

  const api = {
    open,
    close,
    get isOpen() { return Boolean(dialog && dialog.open); },
  };

  if (typeof document !== 'undefined') buildDom(); /* ready before first open */
  return api;
}
