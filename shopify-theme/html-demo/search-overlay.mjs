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
  let bodyEl = null;
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
    return el('a', {
      class: 'spo-card',
      href: urls.product(p.id),
      'aria-label': `${p.name} — ${formatPrice(p.price)}. Open product page`,
    },
    media,
    el('span', { class: 'spo-card-name', text: String(p.name) }),
    priceWrap,
    );
  }

  function categoryLinks() {
    const nav = pickSuggestions(getNavigation());
    if (!nav.length) return null;
    return el('div', { class: 'spo-cats' },
      nav.map((s) => el('a', { class: 'spo-cat', href: urls.collection(s.slug), text: s.label })));
  }

  function renderDefault() {
    const cats = categoryLinks();
    if (cats) bodyEl.append(el('h3', { class: 'spo-section-title', text: 'Shop categories' }), cats);
    const arrivals = pickNewArrivals(getProducts());
    if (arrivals.length) {
      bodyEl.append(
        el('h3', { class: 'spo-section-title', text: 'New arrivals' }),
        el('div', { class: 'spo-grid' }, arrivals.map(card)),
      );
    }
  }

  function renderResults(shown, total) {
    bodyEl.append(
      el('div', { class: 'spo-grid' }, shown.map(card)),
      el('a', {
        class: 'spo-viewall',
        href: buildSearchHref(urls, input.value),
        text: `View all ${total} result${total === 1 ? '' : 's'}`,
      }),
    );
  }

  function renderNoResults(query) {
    const copy = noResultsCopy(query);
    bodyEl.append(el('div', { class: 'spo-empty' },
      el('h3', { text: copy.headline }),
      el('p', { text: copy.hint }),
      el('a', { class: 'spo-viewall', href: buildSearchHref(urls, ''), text: copy.browseLabel }),
    ));
    const cats = categoryLinks();
    if (cats) bodyEl.append(cats);
  }

  function render() {
    const raw = input.value;
    const query = raw.trim();
    clearBtn.hidden = raw.length === 0;
    bodyEl.replaceChildren();
    if (!query) {
      countEl.textContent = '';
      renderDefault();
      return;
    }
    const { total, shown } = pickResults(getProducts(), query);
    countEl.textContent = total ? `${total} result${total === 1 ? '' : 's'}` : 'No results';
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

    const closeBtn = el('button', {
      class: 'spo-icon', type: 'button', 'aria-label': 'Close search', onclick: () => close(),
    });
    closeBtn.append(svgIcon(ICON_CLOSE));

    input = el('input', {
      class: 'spo-input', id: 'spo-search-input', type: 'search', name: 'q',
      placeholder: 'Search products', autocomplete: 'off', autocapitalize: 'off',
      enterkeyhint: 'search', spellcheck: 'false', 'aria-describedby': 'spo-search-count',
    });
    clearBtn = el('button', {
      class: 'spo-icon spo-clear', type: 'button', 'aria-label': 'Clear search', hidden: true,
      onclick: () => { applyQuery(''); input.focus(); },
    });
    clearBtn.append(svgIcon(ICON_CLOSE));

    form = el('form', { class: 'spo-form', role: 'search', 'aria-label': 'Product search' },
      el('label', { class: 'spo-label', for: 'spo-search-input', text: 'Search products' }),
      el('div', { class: 'spo-field' }, input, clearBtn),
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const href = buildSearchHref(urls, input.value);
      clearDebounce();
      window.location.assign(href); /* full search page, concept/palette kept by urls.search */
    });

    countEl = el('p', { class: 'spo-count', id: 'spo-search-count', role: 'status', 'aria-live': 'polite' });
    bodyEl = el('div', { class: 'spo-body', id: 'spo-search-body' });

    dialog.append(el('div', { class: 'spo-panel' },
      el('header', { class: 'spo-head' },
        el('h2', { class: 'spo-title', id: 'spo-search-title', text: 'What are you looking for?' }),
        closeBtn),
      form,
      countEl,
      bodyEl,
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
