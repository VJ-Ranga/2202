/**
 * cart-drawer.mjs — standalone right-hand cart drawer for the 2202 Love Colombo
 * HTML demo. This module owns exactly one stylesheet, ./cart-drawer.css, which
 * is awaited before createCartDrawer resolves, so the first open is never
 * unstyled (no FOUC).
 *
 * Pure commerce logic comes from store.mjs only. It never imports core.js,
 * app.js or pages.js, so integration can wire it later without a cycle:
 *
 *   const drawer = await createCartDrawer({
 *     getCart,       // () => current cart array
 *     getProducts,   // () => product array
 *     setCart,       // (normalizedArray) => central update + persist + badges
 *     urls,          // { cart, shop, checkout, product(id) }
 *     onChange,      // optional (normalizedArray) => void
 *   });
 *   drawer.open(event.currentTarget);
 *
 * Frozen API: open(invoker), close(), refresh(), get isOpen.
 * All user/catalog text is set with textContent; no innerHTML is ever used.
 */

import {
  formatPrice,
  subtotal,
  lineTotal,
  cartCount,
  normalizeCart,
  updateQty,
  removeItem,
  MAX_QUANTITY,
} from './store.mjs';

/* ---------- constants ---------- */

const STYLE_ID = 'cart-drawer-style';
const TITLE_ID = 'cart-drawer-title';
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), '
  + 'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_CLOSE = ['M6 6l12 12', 'M18 6L6 18'];
const ICON_BAG = ['M5 8h14l-1 13H6L5 8Z', 'M9 8V6a3 3 0 0 1 6 0v2'];

/* One drawer at a time even if the factory is called twice. */
let activeDrawer = null;

/* ---------- stylesheet (awaited by the factory, rejects meaningfully) ---------- */

let stylePromise = null;

function styleError(href) {
  return new Error(`cart-drawer: failed to load ${href}; refusing to open an unstyled drawer`);
}

function ensureStyles() {
  if (typeof document === 'undefined') return Promise.resolve();
  if (stylePromise) return stylePromise;

  stylePromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(STYLE_ID);
    if (existing && existing.sheet) {
      resolve();
      return;
    }

    const href = existing?.href || new URL('./cart-drawer.css', import.meta.url).href;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(styleError(href)), { once: true });
      return;
    }

    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = href;
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => reject(styleError(href)), { once: true });
    (document.head || document.documentElement).append(link);
  });

  return stylePromise;
}

/* ---------- pure helpers (Node-testable, no DOM) ---------- */

/** Product lookup by numeric id without pulling extra store exports. */
export function findProductById(products, id) {
  if (!Array.isArray(products)) return undefined;
  return products.find((product) => product && product.id === id);
}

function optionKeyLabel(key) {
  const cleaned = String(key ?? '').replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'Option';
  const lower = cleaned.toLowerCase();
  if (lower === 'color' || lower === 'colour') return 'Colour';
  if (lower === 'size') return 'Size';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Real option line for a cart row: "Size: UK10/M" or "Colour: Coral Pop".
 * Uses the matching variation's own option keys when available.
 */
export function optionSummary(product, line) {
  const label = typeof line?.size === 'string' ? line.size.trim() : '';
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  let variant;

  if (line?.variantId != null) {
    variant = variants.find((candidate) => candidate && candidate.id === line.variantId);
  }
  if (!variant && label) {
    variant = variants.find((candidate) => candidate && candidate.options
      && Object.values(candidate.options).includes(label));
  }

  const options = variant?.options;
  if (options && typeof options === 'object') {
    const parts = Object.entries(options)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([key, value]) => `${optionKeyLabel(key)}: ${value.trim()}`);
    if (parts.length) return parts.join(' · ');
  }

  return label ? `Option: ${label}` : '';
}

/**
 * Preferred real photo: variation image for the exact line.variantId, then
 * product image, then the first gallery image. Returns null when none exists.
 */
export function pickLineImage(product, line) {
  if (!product || typeof product !== 'object') return null;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = line?.variantId != null
    ? variants.find((candidate) => candidate && candidate.id === line.variantId)
    : undefined;

  if (variant?.image?.src) return variant.image;
  if (product.image?.src) return product.image;
  if (Array.isArray(product.gallery)) {
    const galleryImage = product.gallery.find((candidate) => candidate?.src);
    if (galleryImage) return galleryImage;
  }
  return null;
}

/** Actual per-unit personalisation fee stored on the line (never invented). */
export function personalisationFee(line) {
  const fee = Number(line?.fee);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

/** Placement detail and legacy persona text for a cart line. */
export function personalisationSummary(line) {
  const pers = line?.pers;
  if (!pers || typeof pers !== 'object' || Array.isArray(pers)) {
    return { placements: [], legacy: '' };
  }

  const placements = [];
  if (Array.isArray(pers.placements)) {
    for (const placement of pers.placements) {
      if (!placement || typeof placement !== 'object') continue;
      const label = String(placement.label ?? '').trim();
      const text = String(placement.text ?? '').trim();
      if (!label && !text) continue;
      const meta = [placement.fontLabel, placement.colorLabel]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .join(' · ');
      placements.push({ label, text, meta });
    }
  }

  const legacy = placements.length
    ? ''
    : [pers.name, pers.font, pers.color]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .join(' · ');

  return { placements, legacy };
}

/** Honest checkout target: empty/missing means the HTML preview has none. */
export function checkoutUrl(urls) {
  const value = urls?.checkout;
  return typeof value === 'string' ? value.trim() : '';
}

/* ---------- DOM helpers (textContent only) ---------- */

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
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'text') node.textContent = String(value);
    else if (key === 'class') node.className = String(value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'hidden') node.hidden = Boolean(value);
    else if (key === 'disabled') node.disabled = Boolean(value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, String(value));
  }
  for (const kid of kids.flat()) {
    if (kid != null) node.append(kid);
  }
  return node;
}

function priceText(value) {
  const number = Number(value);
  try {
    return formatPrice(Number.isFinite(number) && number >= 0 ? number : 0);
  } catch {
    return formatPrice(0);
  }
}

/* ---------- factory ---------- */

export async function createCartDrawer({
  getCart,
  getProducts,
  setCart,
  urls,
  onChange = () => {},
} = {}) {
  if (typeof getCart !== 'function') throw new TypeError('createCartDrawer: getCart function required');
  if (typeof getProducts !== 'function') throw new TypeError('createCartDrawer: getProducts function required');
  if (typeof setCart !== 'function') throw new TypeError('createCartDrawer: setCart function required');
  if (!urls || typeof urls.cart !== 'string' || typeof urls.shop !== 'string'
    || typeof urls.checkout !== 'string' || typeof urls.product !== 'function') {
    throw new TypeError('createCartDrawer: urls { cart, shop, checkout, product } required');
  }
  if (typeof onChange !== 'function') throw new TypeError('createCartDrawer: onChange must be a function');

  await ensureStyles(); /* styles applied before any open — no FOUC */

  let dialog = null;
  let titleEl = null;
  let bodyEl = null;
  let footEl = null;
  let statusEl = null;
  let closeBtn = null;
  let lastInvoker = null;
  let bodyLock = null;
  let api = null;

  /* ----- data guards (central store normalizes, but never trust storage) ----- */

  function readCart() {
    try {
      return normalizeCart(getCart());
    } catch (error) {
      console.warn('cart-drawer: could not read the current cart', error);
      return [];
    }
  }

  function readProducts() {
    try {
      const products = getProducts();
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.warn('cart-drawer: could not read the product catalog', error);
      return [];
    }
  }

  /* ----- body scroll lock / invoker focus ----- */

  function lockBody() {
    if (bodyLock) return;
    bodyLock = {
      overflow: document.body.style.overflow,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
    document.body.style.overflow = 'hidden';
  }

  function unlockBody() {
    if (!bodyLock) return;
    const lock = bodyLock;
    bodyLock = null;
    document.body.style.overflow = lock.overflow;
    if (window.scrollX !== lock.scrollX || window.scrollY !== lock.scrollY) {
      window.scrollTo(lock.scrollX, lock.scrollY);
    }
  }

  function restoreFocus() {
    const target = lastInvoker;
    lastInvoker = null;
    if (!target || typeof target.focus !== 'function' || !document.contains(target)) return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  }

  /* ----- focus management ----- */

  function focusById(focusId) {
    if (!focusId || !dialog) return false;
    const target = [...dialog.querySelectorAll('[data-focus-id]')]
      .find((node) => node.dataset.focusId === focusId);
    if (!target || target.disabled || target.hidden || target.getClientRects().length === 0) return false;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
    return document.activeElement === target;
  }

  function applyFocus(focusId) {
    if (!dialog?.open) return;
    if (focusId && focusById(focusId)) return;

    /* Empty bag always lands on the way out; populated bags keep keyboard work
       on the first quantity control. Focus is never dropped onto <body>. */
    if (focusById('continue-shopping')) return;
    const firstQty = dialog.querySelector('[data-focus-id^="qty-dec:"]');
    if (firstQty) {
      try {
        firstQty.focus({ preventScroll: true });
      } catch {
        firstQty.focus();
      }
      return;
    }
    closeBtn?.focus({ preventScroll: true });
  }

  function trapTab(event) {
    const focusables = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
      .filter((node) => !node.hidden && (node.offsetParent !== null || node === document.activeElement));
    if (!focusables.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const outside = !dialog.contains(active);
    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ----- rendering ----- */

  function lineImageNode(product, line) {
    const image = pickLineImage(product, line);
    const fallback = svgIcon(ICON_BAG);
    fallback.classList.add('cart-drawer-thumb-icon');

    if (!image) {
      return el('div', { class: 'cart-drawer-thumb is-empty' }, fallback);
    }

    const thumb = el('div', { class: 'cart-drawer-thumb' });
    const img = el('img', {
      class: 'cart-drawer-thumb-img',
      src: String(image.src),
      alt: String(product?.name || line?.name || ''),
      width: '96',
      height: '120',
      loading: 'lazy',
      decoding: 'async',
    });
    if (image.srcset) img.setAttribute('srcset', String(image.srcset));
    img.addEventListener('error', () => {
      img.remove();
      thumb.classList.add('is-empty');
      thumb.append(fallback);
    }, { once: true });
    thumb.append(img);
    return thumb;
  }

  function persBlock(line) {
    const { placements, legacy } = personalisationSummary(line);
    const fee = personalisationFee(line);
    if (!placements.length && !legacy && fee <= 0) return null;

    const box = el('div', { class: 'cart-drawer-pers' },
      el('p', { class: 'cart-drawer-pers-title', text: 'Personalisation' }));
    if (placements.length) {
      const list = el('ul', { class: 'cart-drawer-pers-list' });
      for (const placement of placements) {
        const item = el('li', { class: 'cart-drawer-pers-item' });
        if (placement.label) {
          item.append(el('span', { class: 'cart-drawer-pers-label', text: `${placement.label}: ` }));
        }
        if (placement.text) {
          item.append(el('span', { class: 'cart-drawer-pers-text', text: `“${placement.text}”` }));
        }
        if (placement.meta) {
          item.append(el('span', { class: 'cart-drawer-pers-meta', text: ` · ${placement.meta}` }));
        }
        list.append(item);
      }
      box.append(list);
    } else if (legacy) {
      box.append(el('p', { class: 'cart-drawer-pers-legacy', text: legacy }));
    }
    if (fee > 0) {
      box.append(el('p', {
        class: 'cart-drawer-pers-fee',
        text: `+ ${priceText(fee)} per unit`,
      }));
    }
    return box;
  }

  function buildLine(product, line, index) {
    const name = String(line?.name || product?.name || 'Item');
    const qty = Number(line?.qty) || 0;
    const nameNode = product
      ? el('a', {
        class: 'cart-drawer-line-name',
        href: urls.product(line.id),
        'data-focus-id': `name:${index}`,
      }, name)
      : el('p', { class: 'cart-drawer-line-name' }, name);

    const head = el('div', { class: 'cart-drawer-line-head' },
      nameNode,
      el('span', {
        class: 'cart-drawer-line-price',
        text: priceText(lineTotal(line)),
      }),
    );

    const info = el('div', { class: 'cart-drawer-line-info' });
    info.append(head);

    const option = optionSummary(product, line);
    if (option) info.append(el('p', { class: 'cart-drawer-line-option', text: option }));

    const pers = persBlock(line);
    if (pers) info.append(pers);

    const minus = el('button', {
      class: 'cart-drawer-qty-btn',
      type: 'button',
      'aria-label': `Decrease quantity of ${name}`,
      'data-focus-id': `qty-dec:${index}`,
      onclick: () => { void changeQty(index, -1); },
    }, '−');

    const plus = el('button', {
      class: 'cart-drawer-qty-btn',
      type: 'button',
      disabled: qty >= MAX_QUANTITY,
      'aria-label': qty >= MAX_QUANTITY
        ? `Increase quantity of ${name} (maximum ${MAX_QUANTITY} reached)`
        : `Increase quantity of ${name} (maximum ${MAX_QUANTITY})`,
      'data-focus-id': `qty-inc:${index}`,
      onclick: () => { void changeQty(index, 1); },
    }, '+');

    const qtyGroup = el('div', {
      class: 'cart-drawer-qty',
      role: 'group',
      'aria-label': `Quantity for ${name}`,
    }, minus, el('span', { class: 'cart-drawer-qty-value', text: String(qty) }), plus);

    const removeBtn = el('button', {
      class: 'cart-drawer-remove',
      type: 'button',
      text: 'Remove',
      'aria-label': `Remove ${name} from your bag`,
      'data-focus-id': `remove:${index}`,
      onclick: () => { void removeLine(index); },
    });

    info.append(el('div', { class: 'cart-drawer-line-controls' }, qtyGroup, removeBtn));

    return el('article', { class: 'cart-drawer-line' },
      lineImageNode(product, line),
      info,
    );
  }

  function buildEmpty() {
    return el('div', { class: 'cart-drawer-empty' },
      el('div', { class: 'cart-drawer-empty-icon' }, svgIcon(ICON_BAG)),
      el('h3', { class: 'cart-drawer-empty-title', text: 'Your bag is empty' }),
      el('p', { class: 'cart-drawer-empty-copy', text: 'Discover your next favourite.' }),
      el('a', {
        class: 'cart-drawer-empty-link',
        href: urls.shop,
        text: 'Continue shopping',
        'data-focus-id': 'continue-shopping',
      }),
    );
  }

  function buildFooter(cart) {
    const total = subtotal(cart);
    const target = checkoutUrl(urls);
    const summary = el('div', { class: 'cart-drawer-summary' },
      el('div', { class: 'cart-drawer-total-row' },
        el('span', { class: 'cart-drawer-total-label', text: 'Subtotal' }),
        el('strong', { class: 'cart-drawer-total-value', text: priceText(total) }),
      ),
      el('p', {
        class: 'cart-drawer-shipping',
        text: 'Shipping calculated at checkout.',
      }),
    );

    if (target) {
      summary.append(el('a', {
        class: 'cart-drawer-checkout',
        href: target,
        text: 'Checkout',
      }));
    } else {
      summary.append(
        el('button', {
          class: 'cart-drawer-checkout',
          type: 'button',
          disabled: true,
          text: 'Checkout unavailable',
        }),
        el('p', {
          class: 'cart-drawer-unavailable',
          text: "Checkout isn't available in this HTML preview.",
        }),
      );
    }

    summary.append(el('a', {
      class: 'cart-drawer-viewcart',
      href: urls.cart,
      text: 'View cart',
    }));
    return summary;
  }

  function render({ focusId = null, announce = '' } = {}) {
    if (!dialog) return;
    const cart = readCart();
    const count = cartCount(cart);
    titleEl.textContent = `Your bag (${count})`;

    const scrollTop = bodyEl.scrollTop;
    bodyEl.replaceChildren();

    if (!cart.length) {
      footEl.hidden = true;
      footEl.replaceChildren();
      bodyEl.append(buildEmpty());
    } else {
      const products = readProducts();
      const lines = el('div', { class: 'cart-drawer-lines' });
      cart.forEach((line, index) => {
        lines.append(buildLine(findProductById(products, line.id), line, index));
      });
      bodyEl.append(lines);
      footEl.hidden = false;
      footEl.replaceChildren(buildFooter(cart));
    }

    bodyEl.scrollTop = scrollTop;
    if (announce) statusEl.textContent = announce;
    applyFocus(focusId);
  }

  /* ----- mutations (setCart persists; onChange notifies integration) ----- */

  async function commit(next, message, focusId = null) {
    try {
      await setCart(next);
    } catch (error) {
      console.warn('cart-drawer: setCart failed', error);
      statusEl.textContent = 'Could not update your bag. Please try again.';
      render();
      return;
    }

    try {
      onChange(next);
    } catch (error) {
      console.warn('cart-drawer: onChange hook threw', error);
    }

    render({ focusId, announce: message });
  }

  async function changeQty(index, delta) {
    const cart = readCart();
    const line = cart[index];
    if (!line) return;

    const current = Number(line.qty) || 0;
    const nextQty = Math.max(0, Math.min(MAX_QUANTITY, current + delta));
    if (nextQty === current) return;

    const next = normalizeCart(updateQty(cart, index, nextQty));
    const focusId = next.length < cart.length
      ? null
      : `qty-${delta > 0 ? 'inc' : 'dec'}:${index}`;
    const message = next.length < cart.length
      ? `${line.name} removed from your bag.`
      : `Quantity of ${line.name}: ${nextQty}.`;
    await commit(next, message, focusId);
  }

  async function removeLine(index) {
    const cart = readCart();
    const line = cart[index];
    if (!line) return;

    const next = normalizeCart(removeItem(cart, index));
    await commit(next, `${line.name} removed from your bag.`, null);
  }

  /* ----- dialog construction and open/close semantics ----- */

  function buildDom() {
    if (dialog) return;

    titleEl = el('h2', { class: 'cart-drawer-title', id: TITLE_ID, text: 'Your bag (0)' });
    closeBtn = el('button', {
      class: 'cart-drawer-close',
      type: 'button',
      'aria-label': 'Close your bag',
      'data-focus-id': 'close',
    }, svgIcon(ICON_CLOSE));

    bodyEl = el('div', { class: 'cart-drawer-body' });
    footEl = el('footer', { class: 'cart-drawer-foot', hidden: true });
    statusEl = el('p', {
      class: 'cart-drawer-status',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    });

    dialog = el('dialog', {
      id: 'cart-drawer',
      class: 'cart-drawer',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': TITLE_ID,
    },
    el('header', { class: 'cart-drawer-head' }, titleEl, closeBtn),
    bodyEl,
    footEl,
    statusEl);

    closeBtn.addEventListener('click', () => close());

    /* Escape wins in capture so a host page shortcut never sees it first. */
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key === 'Tab') trapTab(event);
    }, true);

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    });

    /* Backdrop-only close: compare actual click coordinates with the panel
       rect, so clicks inside the panel's own padding never dismiss it. */
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) close();
    });

    dialog.addEventListener('close', () => {
      unlockBody();
      restoreFocus();
      if (activeDrawer === api) activeDrawer = null;
    });

    document.body.append(dialog);
  }

  function open(invoker = null) {
    if (typeof document === 'undefined') {
      throw new Error('cart drawer: open() requires a document');
    }
    if (!dialog) buildDom();
    if (dialog.open) {
      render();
      closeBtn.focus({ preventScroll: true });
      return;
    }

    const active = document.activeElement;
    lastInvoker = invoker && typeof invoker.focus === 'function'
      ? invoker
      : (active && active !== document.body ? active : null);

    if (activeDrawer && activeDrawer !== api) activeDrawer.close();
    document.querySelectorAll('dialog[open]').forEach((other) => {
      if (other !== dialog && typeof other.close === 'function') other.close();
    });
    activeDrawer = api;

    lockBody();
    render();
    try {
      dialog.showModal();
    } catch (error) {
      unlockBody();
      throw error;
    }
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (typeof document === 'undefined') return;
    unlockBody();
    if (dialog?.open) dialog.close();
    restoreFocus();
  }

  function refresh() {
    if (!dialog) return;
    let focusId = null;
    const active = document.activeElement;
    if (dialog.open && active && dialog.contains(active)) {
      const holder = typeof active.closest === 'function'
        ? active.closest('[data-focus-id]')
        : null;
      focusId = holder?.dataset.focusId ?? 'close';
    }
    render({ focusId });
  }

  if (typeof document !== 'undefined') buildDom(); /* ready before first open */

  api = {
    open,
    close,
    refresh,
    get isOpen() { return Boolean(dialog && dialog.open); },
  };
  return api;
}
