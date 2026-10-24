/**
 * core.js — shared runtime for the 2202 Love Colombo multipage HTML demo.
 * Commerce controls navigate between documents; header cart/search open the
 * frozen cart-drawer.mjs / search-overlay.mjs modals (both import store.mjs
 * only, so importing them here creates no cycle). Other modals stay limited
 * to the mobile menu drawer and the comparison switcher.
 * Data: read-only local assets/demo-data.json. Logic: store.mjs.
 */

import {
  formatPrice,
  findProduct,
  updateQty,
  removeItem,
  cartCount,
  subtotal,
  normalizeCart,
  cartBadge,
  toggleWishlist,
  productsByCategory,
  loadJSON,
  saveJSON,
  MAX_QUANTITY,
} from './store.mjs';

import { createCartDrawer } from './cart-drawer.mjs';
import { createSearchOverlay } from './search-overlay.mjs';

/* ---------------- location / url ---------------- */

export const QS = new URLSearchParams(window.location.search);
export const concept = ['atelier', 'studio', 'maison'].includes(QS.get('concept')) ? QS.get('concept') : 'atelier';
export const palette = ['mono', 'brown'].includes(QS.get('palette')) ? QS.get('palette') : 'mono';

/**
 * Internal path that always preserves ?concept=..&palette=..
 */
export function pageUrl(path, params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') p.set(k, String(v));
  p.set('concept', concept);
  p.set('palette', palette);
  return `${path}?${p.toString()}`;
}

export const homeUrl = () => pageUrl('preview.html');
export const collectionUrl = (category) => pageUrl('collection.html', { category });
export const productUrl = (id) => pageUrl('product.html', { id });
export const searchUrl = (q) => pageUrl('search.html', { q });
export const infoUrl = (slug) => pageUrl('page.html', { slug });
export const accountUrl = () => pageUrl('account.html');
export const trackingUrl = () => pageUrl('order-tracking.html');

/* ---------------- icons ---------------- */

const svgOpen = (vb, d) =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
export const ICON = {
  search: svgOpen('0 0 24 24', 'M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z'),
  bag: svgOpen('0 0 24 24', 'M6 8h12l-1 13H7L6 8zM9 8V6a3 3 0 016 0v2'),
  heart: svgOpen('0 0 24 24', 'M12 21s-7.5-4.6-10-9.5C.7 8.6 2.6 5 6.2 5c2.2 0 3.8 1.2 4.8 2.7C12 6.2 13.6 5 15.8 5c3.6 0 5.5 3.6 4.2 6.5C19.5 16.4 12 21 12 21z'),
  close: svgOpen('0 0 24 24', 'M6 6l12 12M18 6L6 18'),
  arrLeft: svgOpen('0 0 24 24', 'M15 5l-7 7 7 7'),
  arrRight: svgOpen('0 0 24 24', 'M9 5l7 7-7 7'),
  arrow: svgOpen('0 0 24 24', 'M5 12h14M13 6l6 6-6 6'),
  burger: svgOpen('0 0 24 24', 'M4 7h16M4 12h16M4 17h16'),
  user: svgOpen('0 0 24 24', 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0'),
  compare: svgOpen('0 0 24 24', 'M9 3L5 7l4 4M5 7h14M15 13l4 4-4 4M19 17H5'),
};

/* ---------------- state ---------------- */

export const state = {
  data: null,
  concept,
  palette,
  cart: normalizeCart(loadJSON('lc-cart')),
  wishlist: Array.isArray(loadJSON('lc-wishlist')) ? loadJSON('lc-wishlist') : [],
  lastInvoker: null,
};

export const persistCart = () => saveJSON('lc-cart', state.cart);
export const persistWishlist = () => saveJSON('lc-wishlist', state.wishlist);

export const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'danger') node.innerHTML = v; /* caller-owned markup only */
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    node.append(kid);
  }
  return node;
};

/* ---------------- data load + error fallback ---------------- */

export async function loadData(path = 'assets/demo-data.json') {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`${path} returned HTTP ${res.status}`);
      const json = await res.json();
      if (!json || !Array.isArray(json.products)) throw new Error(`${path} is not the expected contract shape`);
      return json;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw lastErr;
}

export function renderLoadError(message, retry) {
  document.getElementById('app')?.replaceChildren(
    el('main', { class: 'load-error' },
      el('div', { class: 'card' },
        el('span', { class: 'eyebrow' }, '2202 Love Colombo — HTML preview'),
        el('h1', { tabindex: '-1' }, 'Preview data could not be loaded'),
        el('p', {}, `This demo reads its catalog from the local assets/demo-data.json file. ${message}`),
        el('button', { class: 'btn', type: 'button', id: 'load-retry', onclick: () => retry?.() }, 'Retry loading'),
      ),
    ),
  );
  document.getElementById('load-retry')?.focus();
}

/* ---------------- taxonomy helpers ---------------- */

export const catData = (slug) => state.data?.categories?.find((c) => c.slug === slug) ?? null;
export const catLabel = (slug) =>
  slug === 'all' ? 'All styles' : slug === 'new' ? 'New arrivals' : catData(slug)?.name ?? 'Shop';
export function nameOfId(id) { return String(findProduct(state.data, id)?.name ?? id); }

/* ---------------- dialog manager (only allowed modals) ---------------- */

const dialogs = {};
let menuScrollLock = null;
export function buildDialog(id, className, labelledBy) {
  const dlg = el('dialog', { id, class: className, 'aria-labelledby': labelledBy });
  dlg.addEventListener('close', () => {
    if (dlg.id === 'mobile-menu' && menuScrollLock) {
      const lock = menuScrollLock;
      menuScrollLock = null;
      document.body.style.overflow = lock.overflow;
      window.scrollTo(0, lock.scrollY);
    }
    if (state.lastInvoker && document.contains(state.lastInvoker)) state.lastInvoker.focus();
    else if (dlg.id === 'mobile-menu') document.querySelector('.burger')?.focus();
    state.lastInvoker = null;
  });
  let downOutside = false;
  dlg.addEventListener('mousedown', (e) => { downOutside = e.target === dlg; });
  dlg.addEventListener('click', (e) => { if (downOutside && e.target === dlg) dlg.close(); });
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    dlg.close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      dlg.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = [...dlg.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
    )].filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });
  document.body.appendChild(dlg);
  dialogs[id] = dlg;
  return dlg;
}

export function openDialog(id, invoker) {
  const dlg = dialogs[id];
  if (!dlg || dlg.open) return;
  if (invoker) state.lastInvoker = invoker;
  dlg.showModal();
  if (id === 'mobile-menu') {
    menuScrollLock = { overflow: document.body.style.overflow, scrollY: window.scrollY };
    document.body.style.overflow = 'hidden';
  }
}

export function closeDialog(id) { dialogs[id]?.close(); }

export function dlgCloseBtn(id) {
  const c = el('button', { class: 'icon-btn dlg-close', type: 'button', 'aria-label': `Close ${id}`, onclick: () => closeDialog(id) });
  c.innerHTML = ICON.close;
  return c;
}

/* ---------------- header ---------------- */

/**
 * Four primary links stay visible. Hamburger exposes full catalog and child links.
 * No dead links: every term is a real collection document.
 */
export function primaryNav(activeSlug) {
  const nav = el('nav', { class: 'head-nav', 'aria-label': 'Primary' });
  const visibleSlugs = new Set(['dresses', 'tops', 'pjs', 'sale']);
  for (const entry of state.data.navigation.filter((item) => visibleSlugs.has(item.slug))) {
    const li = el('li', { class: 'nav-item' });
    const a = el('a', {
      class: `head-link${entry.slug === 'sale' ? ' sale-link' : ''}`, href: collectionUrl(entry.slug),
      ...(activeSlug === entry.slug ? { 'aria-current': 'page' } : {}),
      text: entry.name,
    });
    li.append(a);
    if (entry.children?.length) {
      const sub = el('ul', { class: 'head-sub' });
      for (const child of entry.children) {
        sub.append(el('li', {}, el('a', {
          class: 'head-sublink', href: collectionUrl(child.slug),
          ...(activeSlug === child.slug ? { 'aria-current': 'page' } : {}),
          text: child.name,
        })));
      }
      li.classList.add('has-sub');
      li.append(sub);
    }
    nav.append(li);
  }
  return nav;
}

export function utilButtons(compact = false) {
  const utils = el('div', { class: 'head-utils' });
  /* Real <a href> stays: Ctrl/Meta/Shift/Alt/middle clicks open the native
     full page in a new tab; only an unmodified primary click intercepts. */
  const search = el('a', {
    class: 'icon-btn head-util-search',
    href: searchUrl(QS.get('q') ?? ''),
    'aria-label': 'Open search',
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    onclick: (event) => {
      if (!isUnmodifiedPrimaryClick(event)) return;
      event.preventDefault();
      void openSearchOverlay(event.currentTarget, QS.get('q') ?? '');
    },
  });
  search.innerHTML = ICON.search;
  const wish = el('a', { class: 'icon-btn head-util-wish', href: pageUrl('wishlist.html'), 'aria-label': 'Open wishlist' });
  wish.innerHTML = ICON.heart;
  wish.append(el('span', { class: 'badge', 'aria-hidden': 'true' }));
  const cart = el('a', {
    class: 'icon-btn head-util-cart',
    href: pageUrl('cart.html'),
    'aria-label': 'Open cart',
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    onclick: (event) => {
      if (!isUnmodifiedPrimaryClick(event)) return;
      event.preventDefault();
      void openCartDrawer(event.currentTarget);
    },
  });
  cart.innerHTML = ICON.bag;
  cart.append(el('span', { class: 'badge', 'aria-hidden': 'true' }));
  const acc = el('a', { class: 'icon-btn head-util-acc', href: accountUrl(), 'aria-label': 'My account' });
  acc.innerHTML = ICON.user;
  utils.append(search, wish, cart, acc);
  return utils;
}

function burgerButton() {
  const b = el('button', { class: 'icon-btn burger', type: 'button', 'aria-label': 'Open menu', 'aria-haspopup': 'dialog', onclick: (e) => { syncMobileMenu(); openDialog('mobile-menu', e.currentTarget); } });
  b.innerHTML = ICON.burger;
  b.append(el('span', { class: 'header-menu-label visually-hidden', text: 'Menu' }));
  return b;
}

function brandLink(fill, alt, homeUrlOverride) {
  const brand = el('a', { class: 'brand', href: homeUrlOverride ?? homeUrl(), 'aria-label': '2202 Love Colombo — home' });
  brand.append(el('img', { src: fill, alt, width: '861', height: '771' }));
  return brand;
}

export function buildHeader({ activeSlug } = {}) {
  if (state.concept === 'atelier' && !document.getElementById('atelier-design-styles')) {
    document.head.append(el('link', { id: 'atelier-design-styles', rel: 'stylesheet', href: 'atelier.css' }));
  }
  const logoFill = state.palette === 'brown' ? state.data.logos.brown : state.data.logos.black;
  const head = el('header', { class: 'site-head', id: 'site-head' });

  /* Single desktop row: hamburger keeps full catalog; four primary links stay visible. */
  const rowMain = el('div', { class: 'head-row head-row-main' });
  const headStart = el('div', { class: 'head-start' }, burgerButton(), primaryNav(activeSlug));
  rowMain.append(headStart, brandLink(logoFill, '2202 Love Colombo logo'), utilButtons());

  head.classList.add(`head-${state.concept}`);
  head.append(rowMain);
  const announcement = el('div', { class: 'announcement-bar', role: 'region', 'aria-label': 'Delivery offer' },
    el('a', { href: infoUrl('delivery-policy'), text: 'Free Shipping for orders above Rs 5000' }));
  return el('div', { class: 'site-chrome' }, announcement, head);
}

/* ---------------- footer ---------------- */

export function buildFooter({ onExplore } = {}) {
  const logos = state.data.logos;
  const brownFoot = state.palette === 'brown';
  const markFill = brownFoot ? logos.white : logos.black;
  const foot = el('footer', { class: 'site-foot' });

  const brandCol = el('div', { class: 'foot-brand-col' });
  brandCol.append(
    el('h3', { class: 'foot-title' }, document.createTextNode('About 2202')),
    el('img', { class: 'foot-mark', src: markFill, alt: '2202 Love Colombo logo', width: '861', height: '771', loading: 'lazy' }),
    el('p', { class: 'foot-blurb' }, document.createTextNode('Sleep & lounge sets, personalised satin pyjamas and ribbed essentials — designed and made in Sri Lanka, priced in LKR.')),
    el('a', { class: 'text-link', href: infoUrl('about-us') }, document.createTextNode('About us')),
    el('a', { class: 'text-link', href: infoUrl('contact-us') }, document.createTextNode('Contact us')),
  );

  const shopCol = el('nav', { class: 'foot-col', 'aria-label': 'Shop' });
  shopCol.append(el('h3', { class: 'foot-title' }, document.createTextNode('Shop')));
  const shopList = el('ul');
  for (const entry of state.data.navigation) {
    shopList.append(el('li', {}, el('a', { class: `foot-link${entry.slug === 'sale' ? ' sale-link' : ''}`, href: collectionUrl(entry.slug) }, document.createTextNode(entry.name))));
  }
  shopCol.append(shopList);

  const helpCol = el('nav', { class: 'foot-col', 'aria-label': 'Help' });
  helpCol.append(el('h3', { class: 'foot-title' }, document.createTextNode('Customer care')));
  const helpList = el('ul');
  const helpLinks = [
    ['Cart', pageUrl('cart.html')],
    ['Wishlist', pageUrl('wishlist.html')],
    ['Order tracking', trackingUrl()],
    ['My account', accountUrl()],
    ['Privacy policy', infoUrl('privacy-policy')],
    ['Delivery policy', infoUrl('delivery-policy')],
    ['Return & refund', infoUrl('refund-policy')],
    ['Terms & conditions', infoUrl('terms-conditions')],
  ];
  for (const [label, href] of helpLinks) {
    helpList.append(el('li', {}, el('a', { class: 'foot-link', href }, document.createTextNode(label))));
  }
  helpCol.append(helpList);

  const contactCol = el('div', { class: 'foot-col' });
  contactCol.append(el('h3', { class: 'foot-title' }, document.createTextNode('Contact')));
  contactCol.append(el('div', { class: 'foot-contact' },
    el('p', {}, document.createTextNode('435/20A, St. Joseph Estate, Dalugama, Kelaniya')),
    el('p', {}, el('a', { href: 'tel:+94773672202' }, document.createTextNode('+94 77 367 2202'))),
    el('p', {}, el('a', { href: 'mailto:Info@2202lovecolombo.com' }, document.createTextNode('Info@2202lovecolombo.com'))),
  ));

  foot.append(el('div', { class: 'foot-panel' }, brandCol, shopCol, helpCol, contactCol));
  foot.append(el('div', { class: 'foot-oversize' },
    el('img', { src: markFill, alt: '', width: '861', height: '771', loading: 'lazy' }),
  ));
  foot.append(el('div', { class: 'foot-legal' },
    el('p', {}, document.createTextNode('© 2026 – 2202lovecolombo.com · Powered by Nihal Apparel')),
    el('p', { class: 'foot-note' }, document.createTextNode('HTML preview — commerce inactive')),
  ));
  return foot;
}

/* ---------------- badges ---------------- */

export function syncBadges() {
  const cartBtn = document.querySelector('.head-util-cart');
  if (cartBtn) {
    const badge = cartBtn.querySelector('.badge');
    if (badge) badge.textContent = cartBadge(state.cart);
  }
  const wishBtn = document.querySelector('.head-util-wish');
  if (wishBtn) {
    let wb = wishBtn.querySelector('.badge');
    if (!wb) { wb = el('span', { class: 'badge' }); wishBtn.appendChild(wb); }
    wb.textContent = String(state.wishlist.length || '');
  }
  /* Outside mutations (PDP add, storage event, cart page edits) keep an open
     drawer live. The drawer's own commit path skips this: its setCart changes
     state, then the module re-renders itself — refreshing here would race the
     module's focus state transitions. Failures never throw. */
  if (cartDrawerCommitting || !cartDrawerPromise) return;
  cartDrawerPromise
    .then((drawer) => { if (drawer.isOpen) drawer.refresh(); })
    .catch(() => {});
}

/* ---------------- cart drawer + search overlay integration ---------------- */

/* Frozen module APIs:
 *   createCartDrawer({ getCart, getProducts, setCart, urls, onChange })
 *     -> { open(invoker), close(), refresh(), isOpen }
 *   createSearchOverlay({ getProducts, getNavigation, urls })
 *     -> { open(invoker, initialQuery), close(), isOpen }
 * Factories are lazy single promises: created on the first header click, CSS
 * awaited before resolve, and a rejection clears the memo so the next click
 * retries while this click falls back to the full page (no dead header).
 */

const CART_DRAWER_ID = 'cart-drawer';
const SEARCH_OVERLAY_ID = 'spo-search-overlay';

let cartDrawerPromise = null;
let searchOverlayPromise = null;
let cartDrawerCommitting = false;

export function onCartDocument() {
  try {
    return new URL(window.location.href).pathname.endsWith('/cart.html');
  } catch {
    return false;
  }
}

/**
 * Central commit for drawer mutations: normalize -> state -> persist ->
 * badges. Marking the commit window keeps syncBadges from re-rendering the
 * drawer while the module itself is about to render.
 */
async function commitDrawerCart(next) {
  cartDrawerCommitting = true;
  try {
    state.cart = normalizeCart(next);
    persistCart();
    syncBadges();
  } finally {
    cartDrawerCommitting = false;
  }
}

export function ensureCartDrawer() {
  cartDrawerPromise ??= createCartDrawer({
    getCart: () => state.cart,
    getProducts: () => state.data?.products ?? [],
    setCart: commitDrawerCart,
    urls: {
      cart: pageUrl('cart.html'),
      shop: collectionUrl('all'),
      /* Checkout hands off to the existing full cart document in preview mode:
         cart.html?checkout=preview shows the established unavailable notice. */
      checkout: pageUrl('cart.html', { checkout: 'preview' }),
      product: (id) => productUrl(Number(id)),
    },
    onChange: () => {
      /* Ships on the established wishlist rerender pattern: a full cart
         document rebuild, not stale inline copies. */
      if (onCartDocument() && typeof window.__rerenderCart === 'function') {
        window.__rerenderCart();
      }
    },
  }).catch((error) => {
    cartDrawerPromise = null;
    throw error;
  });
  return cartDrawerPromise;
}

export function ensureSearchOverlay() {
  searchOverlayPromise ??= createSearchOverlay({
    getProducts: () => state.data?.products ?? [],
    getNavigation: () => state.data?.navigation ?? [],
    urls: {
      search: (q) => searchUrl(q),
      product: (id) => productUrl(Number(id)),
      collection: (slug) => collectionUrl(slug),
      shop: collectionUrl('all'),
    },
  }).catch((error) => {
    searchOverlayPromise = null;
    throw error;
  });
  return searchOverlayPromise;
}

/** Middle click, or Ctrl/Meta/Shift/Alt click: native <a href> behaviour wins. */
export function isUnmodifiedPrimaryClick(event) {
  return event.button === 0 && !event.ctrlKey && !event.metaKey
    && !event.shiftKey && !event.altKey;
}

/**
 * Header is inert while any modal is up (showModal top layer), but focus can
 * land on a header icon between modals or via keyboard. Never silently close
 * someone else's dialog — dirty customisation choices would be lost. See
 * the customisation guard: its success view commits the line and the next
 * header cart click shows the fee; we do not stack a second modal.
 */
export function foreignModalOpen(ownDialogId) {
  /* Our own cart/search pair may hand over to each other (the frozen open()
     path closes the previous one first). Any other open modal — the
     customisation drawer (no id on purpose), size guide, compare, mobile
     menu — is foreign: wait instead of silently discarding user choices. */
  const own = new Set([CART_DRAWER_ID, SEARCH_OVERLAY_ID, ownDialogId]);
  return [...document.querySelectorAll('dialog[open]')]
    .some((node) => node.id === '' || !own.has(node.id));
}

function armHeaderButton(marker, dialogId) {
  const btn = document.querySelector(marker);
  if (!btn) return;
  const dlg = document.getElementById(dialogId);
  if (!dlg) return;
  if (!btn.dataset.ariaLinked) {
    btn.dataset.ariaLinked = '1';
    btn.setAttribute('aria-controls', dlg.id);
    dlg.addEventListener('close', () => btn.setAttribute('aria-expanded', 'false'), { once: false });
  }
}

export async function openCartDrawer(invoker = null) {
  const btn = invoker instanceof Element && invoker.closest('.head-util-cart')
    ? invoker : document.querySelector('.head-util-cart');
  if (foreignModalOpen(CART_DRAWER_ID)) return;
  try {
    const drawer = await ensureCartDrawer();
    armHeaderButton('.head-util-cart', CART_DRAWER_ID);
    if (foreignModalOpen(CART_DRAWER_ID)) return; /* another modal raced in */
    drawer.open(invoker ?? btn);
    if (btn) btn.setAttribute('aria-expanded', 'true');
  } catch (error) {
    console.warn('core.js: cart drawer unavailable, navigating to the cart page', error);
    /* Never a blank app: fall back to the existing full cart page. */
    if (!onCartDocument()) window.location.assign(pageUrl('cart.html'));
  }
}

export async function openSearchOverlay(invoker = null, initialQuery = '') {
  const btn = invoker instanceof Element && invoker.closest('.head-util-search')
    ? invoker : document.querySelector('.head-util-search');
  if (foreignModalOpen(SEARCH_OVERLAY_ID)) return;
  try {
    const overlay = await ensureSearchOverlay();
    armHeaderButton('.head-util-search', SEARCH_OVERLAY_ID);
    if (foreignModalOpen(SEARCH_OVERLAY_ID)) return;
    overlay.open(invoker ?? btn, typeof initialQuery === 'string' ? initialQuery : '');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  } catch (error) {
    console.warn('core.js: search overlay unavailable, navigating to the search page', error);
    window.location.assign(searchUrl(typeof initialQuery === 'string' ? initialQuery : ''));
  }
}


/* ---------------- toast ---------------- */

export function toast(msg) {
  document.querySelectorAll('.toast-live').forEach((t) => t.remove());
  document.body.append(el('div', { class: 'toast-live', role: 'status', 'aria-live': 'polite', text: msg }));
  setTimeout(() => document.querySelector('.toast-live')?.remove(), 3200);
}

/* ---------------- product cards (LEAVE PAGE, link to document) ---------------- */

export function buildWishButton(p) {
  const on = state.wishlist.includes(p.id);
  const btn = el('button', {
    class: `wish-btn${on ? ' is-on' : ''}`, type: 'button',
    dataset: { productId: String(p.id) },
    'aria-pressed': String(on),
    'aria-label': `${on ? 'Remove' : 'Add'} ${p.name} ${on ? 'from' : 'to'} wishlist`,
    onclick: () => toggleWish(p.id),
  });
  btn.innerHTML = ICON.heart;
  return btn;
}

export function cardMedia(p) {
  const media = el('div', { class: 'card-media' });
  const img1 = el('img', {
    src: p.image.src, alt: p.image.alt, width: String(p.image.width), height: String(p.image.height),
    loading: 'lazy', class: 'card-img-main',
  });
  img1.setAttribute('srcset', p.image.srcset);
  img1.setAttribute('sizes', '(max-width: 760px) 50vw, 25vw');
  img1.style.objectPosition = p.image.position || '50% 50%';
  media.append(img1);
  if (p.alternate) {
    const img2 = el('img', {
      src: p.alternate.src, alt: '', width: String(p.alternate.width), height: String(p.alternate.height),
      loading: 'lazy', class: 'card-img-alt', 'aria-hidden': 'true',
    });
    img2.setAttribute('srcset', p.alternate.srcset);
    img2.setAttribute('sizes', '(max-width: 760px) 50vw, 25vw');
    img2.style.objectPosition = p.alternate.position || '50% 50%';
    media.append(img2);
  }
  const everySizeOut = (p.sizes ?? []).length > 0 && (p.sizes ?? []).every((s) => !s.available)
    && !(p.variants ?? []).some((v) => v.available);
  if (p.categories?.includes('Sale')) media.append(el('span', { class: 'sale-tag', text: 'Sale' }));
  if (everySizeOut || p.stockStatus === 'outofstock') media.append(el('span', { class: 'sold-out-tag', text: 'Sold out' }));
  if (state.concept === 'atelier') {
    const sizes = (p.sizes ?? []).filter((size) => size.available).map((size) => size.label.split('/').pop());
    media.append(el('span', { class: 'atelier-card-options', 'aria-hidden': 'true' },
      el('span', { text: everySizeOut || p.stockStatus === 'outofstock' ? 'View product' : 'Choose options' }),
      sizes.length ? el('span', { class: 'atelier-card-sizes', text: sizes.join('  ·  ') }) : null));
  }
  return media;
}

export function cardInfo(p) {
  const cats = (p.categories ?? []).filter((c) => !['Sets', 'Sale'].includes(c));
  return el('div', { class: 'card-info' },
    el('p', { class: 'card-cat', text: cats.slice(0, 2).join(' · ') }),
    el('p', { class: 'card-name' }, document.createTextNode(p.name)),
    el('p', { class: 'card-price' },
      p.regularPrice != null ? el('s', { text: formatPrice(p.regularPrice) }) : null,
      document.createTextNode(formatPrice(p.price)),
    ),
  );
}

export function buildProductCard(p) {
  const card = el('article', { class: 'prod-card', dataset: { productId: String(p.id) } });
  const open = el('a', {
    class: 'prod-open', href: productUrl(p.id),
    'aria-label': `${p.name} — ${formatPrice(p.price)}. Open product page`,
  });
  open.append(cardMedia(p), cardInfo(p));
  card.append(open, buildWishButton(p));
  return card;
}

/* ---------------- wishlist (stays on current document) ---------------- */

export function toggleWish(id) {
  const res = toggleWishlist(state.wishlist, id);
  state.wishlist = res.ids;
  persistWishlist();
  const name = nameOfId(id);
  const on = state.wishlist.includes(id);
  document.querySelectorAll('.wish-btn').forEach((b) => {
    if (b.dataset.productId !== String(id)) return;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${name} ${on ? 'from' : 'to'} wishlist`);
  });
  /* wishlist page removes its card live */
  if (new URL(location.href).pathname.endsWith('/wishlist.html') && !on && window.__rerenderWishlist) window.__rerenderWishlist();
  syncBadges();
}

/* ---------------- mobile menu drawer (allowed modal) ---------------- */

export function buildMobileMenuDialog() {
  buildDialog('mobile-menu', 'drawer drawer--left', 'mm-title');
}

export function syncMobileMenu() {
  const dlg = dialogs['mobile-menu'];
  if (!dlg) return;
  const visibleSlug = (slug) => slug === 'sale' ? ' sale-link' : '';
  const menu = el('div', { class: 'site-menu' });
  const categorySection = el('section', { class: 'site-menu-section', 'aria-labelledby': 'site-menu-categories' });
  categorySection.append(el('h3', { class: 'site-menu-heading', id: 'site-menu-categories' }, document.createTextNode('Shop categories')));
  for (const entry of state.data.navigation) {
    if (entry.children?.length) {
      const details = el('details', { class: 'site-menu-accordion' });
      details.append(el('summary', { class: `site-menu-row site-menu-summary${visibleSlug(entry.slug)}`, text: entry.name }));
      details.append(el('div', { class: 'site-menu-sub' },
        el('a', { class: `site-menu-sub-link${visibleSlug(entry.slug)}`, href: collectionUrl(entry.slug) }, document.createTextNode(`All ${entry.name}`)),
        entry.children.map((child) => el('a', { class: 'site-menu-sub-link', href: collectionUrl(child.slug) }, document.createTextNode(child.name))),
      ));
      categorySection.append(details);
    } else {
      categorySection.append(el('a', { class: `site-menu-row${visibleSlug(entry.slug)}`, href: collectionUrl(entry.slug) }, document.createTextNode(entry.name)));
    }
  }
  const supportSection = el('section', { class: 'site-menu-section site-menu-section--support', 'aria-labelledby': 'site-menu-support' });
  supportSection.append(
    el('h3', { class: 'site-menu-heading', id: 'site-menu-support' }, document.createTextNode('Account')),
    el('a', { class: 'site-menu-row', href: accountUrl() }, document.createTextNode('My account')),
    el('a', { class: 'site-menu-row', href: trackingUrl() }, document.createTextNode('Order tracking')),
    el('h3', { class: 'site-menu-heading site-menu-heading--info', id: 'site-menu-info' }, document.createTextNode('Info')),
    el('a', { class: 'site-menu-row', href: infoUrl('about-us') }, document.createTextNode('About us')),
    el('a', { class: 'site-menu-row', href: infoUrl('contact-us') }, document.createTextNode('Contact us')),
    el('a', { class: 'site-menu-row', href: infoUrl('privacy-policy') }, document.createTextNode('Privacy policy')),
    el('a', { class: 'site-menu-row', href: infoUrl('delivery-policy') }, document.createTextNode('Delivery policy')),
    el('a', { class: 'site-menu-row', href: infoUrl('refund-policy') }, document.createTextNode('Return & refund')),
    el('a', { class: 'site-menu-row', href: infoUrl('terms-conditions') }, document.createTextNode('Terms & conditions')),
  );
  menu.append(categorySection, supportSection);
  const logoFill = state.palette === 'brown' ? state.data.logos.brown : state.data.logos.black;
  dlg.replaceChildren(
    el('div', { class: 'drawer-head' },
      el('div', { class: 'drawer-brand' },
        el('img', { class: 'drawer-mark', src: logoFill, alt: '', width: '861', height: '771' }),
        el('h2', { id: 'mm-title' }, document.createTextNode('Menu')),
      ),
      dlgCloseBtn('mobile-menu'),
    ),
    el('div', { class: 'drawer-body' },
      el('a', { class: 'site-menu-row site-menu-home', href: homeUrl() }, document.createTextNode('Home')),
      menu,
    ),
  );
}

/* ---------------- cart steps ---------------- */

export function cartAdjust(index, delta) {
  const line = state.cart[index];
  if (!line) return;
  const nextQty = Math.min(MAX_QUANTITY, Math.max(0, line.qty + delta));
  state.cart = updateQty(state.cart, index, nextQty);
  state.cart = normalizeCart(state.cart);
  persistCart();
  syncBadges();
}

export function cartRemove(index) {
  state.cart = removeItem(state.cart, index);
  state.cart = normalizeCart(state.cart);
  persistCart();
  syncBadges();
}

export function cartTotals() {
  return { count: cartCount(state.cart), subtotal: subtotal(state.cart) };
}

/* ---------------- compare switcher (allowed modal, home only) ---------------- */

const CONCEPTS = { atelier: 'Atelier · Editorial', studio: 'Studio · Modern', maison: 'Maison · Statement' };
const PALETTES = { mono: 'Pure Mono', brown: 'Mono + Brown' };
export function compareUrl(c, p) {
  const u = new URL('preview.html', window.location.href);
  u.searchParams.set('concept', c);
  u.searchParams.set('palette', p);
  return u.pathname + u.search;
}

export function buildCompareDialog() {
  buildDialog('compare', 'cmp-dialog', 'cmp-title');
}

export function openCompare(invoker) {
  const dlg = dialogs.compare;
  const list = el('div', { class: 'cmp-list' });
  Object.entries(CONCEPTS).forEach(([c, cName]) => {
    Object.entries(PALETTES).forEach(([p, pName]) => {
      const current = c === state.concept && p === state.palette;
      const item = el('a', {
        class: 'cmp-item', href: compareUrl(c, p),
        ...(current ? { 'aria-current': 'true' } : {}),
      });
      item.append(
        el('span', { class: 'cmp-name' }, document.createTextNode(`${cName} `),
          el('span', { text: `· ${pName}` })),
        el('span', { class: `cmp-tag${p === 'brown' ? ' cmp-tag--brown' : ''}` },
          document.createTextNode(p === 'brown' ? 'Brown accents' : 'Pure mono')),
      );
      if (current) item.append(el('span', { class: 'cmp-tag' }, document.createTextNode('Viewing now')));
      list.append(item);
    });
  });
  dlg.replaceChildren(
    dlgCloseBtn('compare'),
    el('h2', { id: 'cmp-title' }, document.createTextNode('Compare homepage previews')),
    el('p', { class: 'cmp-sub' }, document.createTextNode('Three approved concepts × two palettes. Same content models in all six.')),
    list,
    el('a', { class: 'cmp-index-link', href: 'index.html' }, document.createTextNode('Open comparison index — all six side by side')),
  );
  openDialog('compare', invoker);
}

export function compareFab() {
  const fab = el('button', {
    class: 'compare-fab', type: 'button', id: 'compare-fab',
    'aria-label': 'Compare homepage previews — open switcher', 'aria-haspopup': 'dialog',
    onclick: (e) => openCompare(e.currentTarget),
  });
  fab.innerHTML = `<span aria-hidden="true">${ICON.compare}</span><span>Compare previews</span>`;
  return fab;
}

/* ---------------- cross-tab storage sync ---------------- */

/* Another tab changed localStorage: normalize the new value centrally, fix
   badges, keep an open drawer live, and rebuild the cart document if visible.
   The wishlist keeps its existing behaviour untouched — only badges update
   here so nothing breaks the established wishlist flows. */
window.addEventListener('storage', (event) => {
  if (event.key === 'lc-cart') {
    try {
      state.cart = normalizeCart(event.newValue ? JSON.parse(event.newValue) : []);
    } catch (error) {
      console.warn('core.js: cross-tab cart value was not readable', error);
      state.cart = normalizeCart([]);
    }
    syncBadges();
    if (onCartDocument() && typeof window.__rerenderCart === 'function') {
      window.__rerenderCart();
    }
  }
  if (event.key === 'lc-wishlist') {
    try {
      const parsed = event.newValue ? JSON.parse(event.newValue) : [];
      state.wishlist = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('core.js: cross-tab wishlist value was not readable', error);
      state.wishlist = [];
    }
    syncBadges();
  }
});

/* ---------------- scroll stickiness ---------------- */

export function bindScroll() {
  const bar = document.getElementById('site-head');
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('is-stuck', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
