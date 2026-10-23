/**
 * pages.js — page renderers for the multipage storefront demo.
 * collection / product / cart / wishlist / search / info / account / tracking.
 * Shopping controls never open dialogs: they navigate between documents.
 * Every store mutation uses store.mjs; core.js owns shared header/footer/urls.
 */

import {
  formatPrice,
  findProduct,
  removeItem,
  cartCount,
  subtotal,
  searchProducts,
  productsByCategory,
  categoryChain,
  applyFilters,
  sortProducts,
  findVariantBySize,
  variantAvailable,
  isBuyable,
  addToCart,
  normalizeCart,
  MAX_QUANTITY,
} from './store.mjs';

import { buildCustomisation } from './customisation.mjs';

import {
  el,
  state,
  QS,
  pageUrl,
  homeUrl,
  collectionUrl,
  productUrl,
  searchUrl,
  infoUrl,
  accountUrl,
  trackingUrl,
  buildProductCard,
  buildWishButton,
  cartAdjust,
  persistCart,
  syncBadges,
  toast,
  catLabel,
} from './core.js';

/* ---------------- helpers ---------------- */

const $app = () => document.getElementById('page-root');

function crumbTrail(slug) {
  const chain = slug && slug !== 'all' && slug !== 'new' ? categoryChain(state.data, slug) : [];
  const items = [el('a', { class: 'crumb-link', href: homeUrl() }, document.createTextNode('Home'))];
  if (slug === 'new') items.push(el('span', { 'aria-current': 'page', text: 'New arrivals' }));
  else if (chain.length) {
    chain.forEach((c, i) => {
      items.push(i < chain.length - 1
        ? el('a', { class: 'crumb-link', href: collectionUrl(c.slug) }, document.createTextNode(c.name))
        : el('span', { 'aria-current': 'page', text: c.name }));
    });
  } else if (slug && slug !== 'all') {
    items.push(el('span', { 'aria-current': 'page', text: catLabel(slug) }));
  }
  return el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, ...items);
}

function pageTitle(text) {
  return el('header', { class: 'page-title' },
    el('h1', { class: 'page-title-text' }, document.createTextNode(text)));
}

function collectionPool(slug) {
  if (!slug || slug === 'all' || slug === 'new') return state.data.products.slice();
  return productsByCategory(state.data, slug);
}

function navUrlParams() {
  const keep = new URLSearchParams();
  for (const key of ['category', 'sort', 'avail', 'size', 'min', 'max', 'page', 'shown']) {
    const v = freshQS().get(key);
    if (v) keep.set(key, v);
  }
  return keep;
}

const freshQS = () => new URLSearchParams(window.location.search);

/* ---------------- collection page ---------------- */

async function renderCollection() {
  const QS = freshQS();
  const slugArg = QS.get('category') ?? QS.get('slug') ?? 'all';
  let currentSlug = slugArg;
  if (currentSlug !== 'all' && currentSlug !== 'new') {
    const known = state.data.categories.some((c) => c.slug === currentSlug);
    if (!known) currentSlug = 'all';
  }
  window.__collSlug = currentSlug;
  const pool = collectionPool(currentSlug);

  const sort = QS.get('sort') ?? '';
  const effectiveSort = sort || 'newest';
  const avail = QS.get('avail') ?? '';
  const sizeSel = (QS.get('size') ?? '').split(',').filter(Boolean);
  const min = QS.get('min') ?? '';
  const max = QS.get('max') ?? '';
  const pageSize = QS.get('page') === '24' ? 24 : 12;
  const shown = Math.min(Number(QS.get('shown') ?? pageSize) || pageSize, 144);

  let working = pool;
  const filters = {};
  if (sizeSel.length) filters.sizes = sizeSel;
  if (avail === 'in' || avail === 'out') filters.availability = avail;
  if (min.trim() !== '' && Number.isFinite(Number(min))) filters.priceMin = Number(min);
  if (max.trim() !== '' && Number.isFinite(Number(max))) filters.priceMax = Number(max);
  if (Object.keys(filters).length) working = applyFilters(working, filters);
  working = sortProducts(working, effectiveSort || '');

  const out = el('section', { class: 'page-body coll-page' });

  /* Full taxonomy remains available through hamburger navigation. */
  const aside = el('aside', { class: 'coll-side', 'aria-label': 'Collections' });
  const sideLink = (slugParam, label, extra = '') => el('a', {
    class: `side-link${extra}${currentSlug === slugParam ? ' is-active' : ''}`,
    href: collectionUrl(slugParam),
  }, document.createTextNode(label));
  aside.append(el('h3', { class: 'side-title' }, document.createTextNode('Shop all categories')));
  aside.append(sideLink('all', 'All styles'));
  const childSlugs = new Set();
  for (const entry of state.data.navigation) {
    (entry.children ?? []).forEach((c) => childSlugs.add(c.slug));
  }
  for (const entry of state.data.navigation) {
    aside.append(sideLink(entry.slug, entry.name));
    if (entry.children?.length) {
      for (const child of entry.children) {
        aside.append(sideLink(child.slug, child.name, ' side-child'));
      }
    }
  }
  /* non-navigation real top terms (Personalised Pyjama etc.) */
  for (const c of state.data.categories) {
    if (c.parentId != null) continue;
    if (state.data.navigation.some((n) => n.slug === c.slug)) continue;
    aside.append(sideLink(c.slug, `${c.name} (${c.count})`));
  }

  /* toolbar */
  const mainCol = el('div', { class: 'coll-main' });
  const categoryNav = el('nav', { class: 'category-chips', 'aria-label': 'Browse collections' });
  for (const entry of state.data.navigation) {
    categoryNav.append(el('a', {
      class: `category-chip${entry.slug === currentSlug ? ' is-active' : ''}${entry.slug === 'sale' ? ' sale-link' : ''}`,
      href: collectionUrl(entry.slug),
      text: entry.name,
    }));
  }
  const sizeOpts = new Set();
  for (const p of pool) {
    for (const v of p.variants ?? []) {
      const o = v.options ?? {};
      if (o.Size) sizeOpts.add(o.Size);              /* garment size only — never colour values */
    }
    for (const s of p.sizes ?? []) if (s.label) sizeOpts.add(s.label);
  }
  const goWith = (mutate) => {
    const next = navUrlParams();
    mutate(next);
    next.delete('shown');
    window.location.href = pageUrl('collection.html', Object.fromEntries(next));
  };
  const availSel = el('select', { class: 'coll-select', 'aria-label': 'Availability' },
    el('option', { value: '', text: 'Availability: all' }),
    el('option', { value: 'in', text: 'Availability: in stock' }),
    el('option', { value: 'out', text: 'Availability: sold out' }),
  );
  availSel.value = avail;
  availSel.addEventListener('change', () => goWith((n) => { if (availSel.value) n.set('avail', availSel.value); else n.delete('avail'); }));
  const sortSel = el('select', { class: 'coll-select', 'aria-label': 'Sort by' },
    el('option', { value: '', text: 'Sort: newest (default)' }),
    el('option', { value: 'price-asc', text: 'Price · low to high' }),
    el('option', { value: 'price-desc', text: 'Price · high to low' }),
    el('option', { value: 'newest', text: 'Newest' }),
    el('option', { value: 'name', text: 'Name A–Z' }),
  );
  sortSel.value = sort || (currentSlug === 'new' ? 'newest' : '');
  sortSel.addEventListener('change', () => goWith((n) => { if (sortSel.value) n.set('sort', sortSel.value); else n.delete('sort'); }));
  const pageSel = el('select', { class: 'coll-select', 'aria-label': 'Styles per page' },
    el('option', { value: '12', text: '12 per page' }),
    el('option', { value: '24', text: '24 per page' }),
  );
  pageSel.value = String(pageSize);
  pageSel.addEventListener('change', () => goWith((n) => { n.set('page', pageSel.value); }));

  const minIn = el('input', { class: 'coll-price', type: 'number', min: '0', placeholder: 'Min', 'aria-label': 'Minimum price', value: min });
  const maxIn = el('input', { class: 'coll-price', type: 'number', min: '0', placeholder: 'Max', 'aria-label': 'Maximum price', value: max });
  const priceApply = el('button', { class: 'btn btn--ghost coll-apply', type: 'button', text: 'Apply price' });
  priceApply.addEventListener('click', () => goWith((n) => {
    if (minIn.value !== '') n.set('min', minIn.value); else n.delete('min');
    if (maxIn.value !== '') n.set('max', maxIn.value); else n.delete('max');
  }));

  const sizeList = el('div', { class: 'coll-sizes', role: 'group', 'aria-label': 'Available sizes' });
  [...sizeOpts].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)).forEach((s) => {
    sizeList.append(el('button', {
      class: `size-pill size-filter${sizeSel.includes(s) ? ' is-on' : ''}`, type: 'button', text: s,
      'aria-pressed': String(sizeSel.includes(s)),
      onclick: () => goWith((n) => {
        const cur = (n.get('size') ?? '').split(',').filter(Boolean);
        const list = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
        if (list.length) n.set('size', list.join(',')); else n.delete('size');
      }),
    }));
  });

  const activeAny = avail || sizeSel.length || min || max || (sort && sort !== 'newest') || QS.get('page') === '24';
  const clearF = el('button', { class: 'text-link coll-clear', type: 'button', text: 'Clear all filters' });
  clearF.addEventListener('click', () => {
    window.location.href = pageUrl('collection.html', { category: currentSlug });
  });

  const countLine = el('p', { class: 'coll-count' });
  countLine.textContent = `Showing ${Math.min(shown, working.length)} of ${working.length} styles`;

  const grid = el('div', { class: 'prod-grid coll-grid' });
  if (!working.length) {
    grid.append(el('div', { class: 'coll-empty' },
      el('h3', { text: currentSlug === 'bags' ? 'No bags available right now' : 'No styles match those filters' }),
      el('p', { text: currentSlug === 'bags' ? 'Explore other collections for sleepwear, dresses and everyday essentials.' : 'Try removing a size, price or availability filter.' }),
      el('a', { class: 'btn', href: collectionUrl('all') }, document.createTextNode('Browse all styles')),
    ));
  } else {
    working.slice(0, shown).forEach((p) => grid.append(buildProductCard(p)));
  }

  let pager = null;
  let pagerNote = null;
  if (working.length > shown) {
    pager = el('button', {
      class: 'btn coll-more', type: 'button',
      text: `Load more · ${Math.min(pageSize, working.length - shown)} of ${working.length - shown} remaining`,
    });
    pagerNote = el('p', { class: 'coll-page-note' }, document.createTextNode(`More styles load in ${pageSize}-style batches in this preview.`));
    pager.addEventListener('click', async () => {
      const next = navUrlParams();
      next.set('shown', String(shown + pageSize));
      history.replaceState(null, '', pageUrl('collection.html', Object.fromEntries(next)));
      const y = window.scrollY;
      await renderCollection();
      window.scrollTo({ top: y });
    });
  }

  const filterDetails = el('details', { class: 'coll-filter-details' });
  filterDetails.append(el('summary', { text: 'Filter & sort' }));
  filterDetails.append(el('div', { class: 'coll-controls' }, availSel, pageSel,
    el('span', { class: 'coll-price-wrap' }, minIn, maxIn, priceApply)));
  if (sizeOpts.size > 1) filterDetails.append(el('div', { class: 'coll-size-row' },
    el('span', { class: 'coll-filter-label' }, 'Size'), sizeList));
  if (activeAny) filterDetails.append(el('div', { class: 'coll-active-row' }, clearF));
  const collToolbar = el('div', { class: 'coll-toolbar' }, countLine, sortSel);

  mainCol.append(pageTitle(slugLabel(currentSlug)), categoryNav, collToolbar, filterDetails, grid);
  if (pager) mainCol.append(pager, pagerNote);
  else if (working.length > 12 && QS.get('page') !== '24' && shown >= working.length) {
    mainCol.append(el('p', { class: 'coll-page-note' }, document.createTextNode(`Showing all ${working.length} — switch to 24 per page for bigger batches.`)));
  }
  out.append(crumbTrail(currentSlug), mainCol);
  $app().replaceChildren(out);
}

function slugLabel(slug) {
  if (slug === 'all') return 'All styles';
  if (slug === 'new') return 'New arrivals';
  return catLabel(slug);
}

function buildSizeGuide(product) {
  const titleId = `size-guide-title-${product.id}`;
  const trigger = el('button', {
    class: 'pd-guide-trigger', type: 'button', 'aria-haspopup': 'dialog',
    text: 'Size guide',
  });
  const dialog = el('dialog', {
    class: 'size-guide-dialog', 'aria-labelledby': titleId,
  });
  const close = el('button', {
    class: 'size-guide-close', type: 'button', 'aria-label': 'Close size guide', text: '×',
  });
  const title = el('h2', { id: titleId, text: 'Measurements & size guide' });
  const productName = el('p', { class: 'size-guide-product', text: product.name });
  const units = el('p', { class: 'size-guide-units', text: 'Body measurements in inches.' });
  const commonGuide = product.sizeGuide === 'assets/images/size-chart-30535-960.webp';
  const chartSrc = commonGuide ? 'assets/images/size-chart-30535-960.webp' : product.sizeGuide;
  const fullChartSrc = 'assets/images/size-chart-30535-1536.webp';
  const chartSrcset = commonGuide
    ? 'assets/images/size-chart-30535-960.webp 960w, assets/images/size-chart-30535-1536.webp 1536w'
    : null;
  const chartSizes = commonGuide ? '(max-width: 760px) calc(100vw - 32px), min(1072px, calc(100vw - 48px))' : null;
  const fallback = el('p', {
    class: 'size-guide-fallback', role: 'alert', hidden: true,
    text: 'Size guide image could not load. Reload page to try again.',
  });
  let image = el('img', {
    src: chartSrc,
    ...(chartSrcset ? { srcset: chartSrcset, sizes: chartSizes } : {}),
    alt: '2202 Love Colombo body measurement chart showing UK sizes, bust, waist, low hip, measuring instructions, and measurements in inches',
    width: '1536', height: '1024', loading: 'lazy',
  });
  const handleImageError = () => { image.hidden = true; fallback.hidden = false; };
  image.addEventListener('error', handleImageError);
  const viewport = el('div', { class: 'size-guide-chart', tabindex: '0', role: 'region', 'aria-label': 'Scrollable size chart' }, image, fallback);
  let zoom = 1;
  const zoomStatus = el('span', { class: 'size-guide-zoom-status', 'aria-live': 'polite', text: '100%' });
  const setZoom = (next) => {
    zoom = Math.min(3, Math.max(1, next));
    image.style.width = zoom === 1 ? '100%' : `${zoom * 100}%`;
    zoomStatus.textContent = `${Math.round(zoom * 100)}%`;
  };
  const zoomOut = el('button', { class: 'size-guide-control', type: 'button', 'aria-label': 'Zoom out', text: '−', onclick: () => setZoom(zoom - 0.25) });
  const zoomIn = el('button', { class: 'size-guide-control', type: 'button', 'aria-label': 'Zoom in', text: '+', onclick: () => setZoom(zoom + 0.25) });
  const zoomReset = el('button', { class: 'size-guide-reset', type: 'button', text: 'Reset zoom', onclick: () => { setZoom(1); viewport.scrollTo({ left: 0, top: 0, behavior: 'auto' }); } });
  const controls = el('div', { class: 'size-guide-controls', 'aria-label': 'Chart zoom controls' }, zoomOut, zoomStatus, zoomIn, zoomReset);
  const header = el('header', { class: 'size-guide-header' }, el('div', {}, title, productName, units), close);
  dialog.append(header, controls, viewport);

  let previousFocus = null;
  let previousScrollY = 0;
  let previousBodyStyles = null;
  let previousScrollBehavior = '';
  let isOpen = false;
  const focusables = () => [...dialog.querySelectorAll('button, [tabindex="0"]')].filter((node) => !node.disabled && !node.hidden);
  const restore = () => {
    if (!isOpen) return;
    isOpen = false;
    if (previousBodyStyles) {
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
    }
    const restoreScrollY = previousScrollY;
    document.documentElement.style.scrollBehavior = 'auto';
    previousFocus?.focus?.({ preventScroll: true });
    const restoreScroll = () => {
      window.scrollTo(0, restoreScrollY);
      if (document.scrollingElement) document.scrollingElement.scrollTop = restoreScrollY;
    };
    requestAnimationFrame(restoreScroll);
    setTimeout(() => {
      restoreScroll();
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    }, 50);
  };
  const closeGuide = () => {
    document.documentElement.style.scrollBehavior = 'auto';
    if (dialog.open) dialog.close(); else restore();
  };
  const openGuide = () => {
    if (document.querySelector('dialog[open]')) return;
    previousFocus = document.activeElement;
    previousScrollY = window.scrollY;
    previousScrollBehavior = document.documentElement.style.scrollBehavior;
    previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${previousScrollY}px`;
    document.body.style.width = '100%';
    isOpen = true;
    setZoom(1);
    image.loading = 'eager';
    if (commonGuide) {
      const highImage = new Image();
      highImage.width = 1536;
      highImage.height = 1024;
      highImage.alt = image.alt;
      highImage.className = image.className;
      highImage.loading = 'eager';
      highImage.src = fullChartSrc;
      highImage.addEventListener('error', handleImageError);
      image.replaceWith(highImage);
      image = highImage;
    }
    dialog.showModal();
    close.focus();
  };
  trigger.addEventListener('click', openGuide);
  close.addEventListener('click', closeGuide);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeGuide(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeGuide(); });
  dialog.addEventListener('close', restore);
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  return el('section', { class: 'pd-guide', 'aria-label': 'Size guide' }, trigger, dialog);
}

async function renderProduct() {
  const QS = freshQS();
  const id = Number(QS.get('id'));
  const p = findProduct(state.data, id);
  const out = el('section', { class: `page-body pd-page pd-page--${state.concept}` });
  if (!p) {
    out.append(crumbTrail(null), pageTitle('Product not found'),
      el('p', { text: `No catalog product with id ${QS.get('id')}. Check the product link or browse all styles.` }),
      el('a', { class: 'btn', href: collectionUrl('all') }, document.createTextNode('Browse all styles')));
    $app().replaceChildren(out);
    return 'Product not found';
  }
  /* breadcrumb matches the category home path */
  const chain = (() => {
    const first = (p.categories ?? []).map((c) => state.data.categories.find((x) => String(x.name).toLowerCase() === String(c).toLowerCase())).find(Boolean);
    return first && first.parentId == null ? categoryChain(state.data, first.slug) : categoryChain(state.data, first?.slug ?? null);
  })();
  const trail = crumbTrail(chain.length ? chain[chain.length - 1].slug : null);
  out.append(trail);
  const layoutSwitch = el('nav', { class: 'pd-layout-switcher', 'aria-label': 'Explore product layouts' },
    el('span', { class: 'pd-layout-label', text: 'Explore product layouts' }),
    ...['atelier', 'studio', 'maison'].map((layout) => el('a', {
      class: `pd-layout-link${layout === state.concept ? ' is-current' : ''}`,
      href: `product.html?id=${encodeURIComponent(p.id)}&concept=${layout}&palette=${state.palette}`,
      ...(layout === state.concept ? { 'aria-current': 'page' } : {}),
      text: layout[0].toUpperCase() + layout.slice(1),
    })),
  );
  out.append(layoutSwitch);

  /* gallery: main + all source thumbs (3+ on real products) */
  const sources = (p.gallery ?? []).length ? p.gallery.slice() : [p.image];
  const mainImgs = sources.map((m, i) => {
    const img = el('img', {
      src: m.src, alt: m.alt, width: String(m.width), height: String(m.height),
      loading: i === 0 ? 'eager' : 'lazy', class: i < (state.concept === 'studio' ? 2 : 1) ? '' : 'is-hidden',
    });
    img.setAttribute('srcset', m.srcset);
    img.setAttribute('sizes', '(max-width: 900px) 92vw, 40vw');
    img.style.objectPosition = m.position || '50% 50%';
    return img;
  });
  const frame = el('div', { class: 'pd-media-frame', dataset: { activeIndex: '0' } }, ...mainImgs);
  const thumbBox = el('div', { class: 'pd-thumbs', 'aria-label': 'Product views' });
  const tbBtns = [];
  sources.forEach((m, i) => {
    const tb = el('button', {
      class: `pd-thumb${i === 0 ? ' is-on' : ''}`, type: 'button',
      'aria-label': `View image ${i + 1} of ${sources.length}`,
      onclick: () => {
        frame.dataset.activeIndex = String(i);
        mainImgs.forEach((im, k) => im.classList.toggle('is-hidden', k !== i));
        tbBtns.forEach((b, k) => b.classList.toggle('is-on', k === i));
      },
    });
    tb.append(el('img', { src: m.src, alt: '', width: '96', height: '120', loading: 'lazy' }));
    tbBtns.push(tb);
    thumbBox.append(tb);
  });
  const mediaCol = el('div', { class: 'pd-media' }, frame, thumbBox);

  /* info column */
  let currentVariant = null;
  const priceWrap = el('p', { class: 'pd-price' });
  const showPrice = () => {
    priceWrap.replaceChildren();
    const v = currentVariant;
    const cur = v && Number.isFinite(v.price) && v.price >= 0 ? v.price : p.price;
    const reg = v && Number.isFinite(v.regularPrice) && v.regularPrice > cur ? v.regularPrice : p.regularPrice;
    if (reg != null && reg > cur) priceWrap.append(el('s', { text: formatPrice(reg) }));
    priceWrap.append(document.createTextNode(formatPrice(cur)));
  };
  showPrice();

  const err = el('p', { class: 'pd-error', 'aria-live': 'polite' });

  let selectedSize = null;
  let qty = 1;
  /* Audited module owns eligibility, validation, drawer state and fee. */
  let pers = null;
  try {
    pers = await buildCustomisation(p, {
      getSelectedVariant: () => currentVariant,
      getQuantity: () => qty,
      onVariationRequired: () => { err.textContent = 'Please choose a size before personalising.'; },
      onAddToBag: async (persona, meta = {}) => {
        const quantity = meta.quantity ?? qty;
        state.cart = addToCart(state.cart, p, selectedSize, quantity, persona);
        persistCart();
        syncBadges();
        toast(`Added to bag — ${p.name} · personalised`);
      },
      viewCartUrl: pageUrl('cart.html'),
      checkoutUrl: pageUrl('cart.html', { checkout: 'preview' }),
    });
  } catch (error) {
    /* Optional feature failure must not block ordinary product purchase. */
    if ((p.categories ?? []).some((category) => String(category).toLowerCase() === 'personalised pyjama')) {
      pers = {
        node: el('section', { class: 'pd-pers-unavailable', id: 'personalisation' },
          el('p', { class: 'pd-error', role: 'status', text: 'Personalisation is temporarily unavailable. You can still add this item to your bag.' }),
          el('a', { class: 'text-link', href: window.location.href }, document.createTextNode('Reload page')),
        ),
      };
    }
  }
  if (pers) pers.node.id = 'personalisation';
  const info = el('div', { class: 'pd-info' });
  info.append(
    el('p', { class: 'pd-cat', text: (p.categories ?? []).slice(0, 4).join(' · ') }),
    el('h1', { class: 'pd-name', tabindex: '-1' }, document.createTextNode(p.name)),
    p.sku ? el('p', { class: 'pd-sku', text: `SKU ${p.sku}` }) : null,
    priceWrap,
    p.stockStatus === 'outofstock'
      ? el('p', { class: 'pd-stock out', text: 'Sold out' })
      : el('p', { class: 'pd-stock in', text: 'In stock' }),
  );

  const sizeLabels = (p.sizes ?? []).filter((s) => s.label).map((s) => s.label);
  const variantOptionKey = p.variants?.length && !sizeLabels.length
    ? Object.keys(p.variants[0].options ?? {})[0]
    : null;
  const optionLabels = variantOptionKey
    ? [...new Set(p.variants.map((v) => v.options?.[variantOptionKey]).filter(Boolean))]
    : sizeLabels;
  if (optionLabels.length) {
    const optionLabel = variantOptionKey ? (variantOptionKey === 'color' ? 'Colour' : variantOptionKey) : 'Size';
    const optionRow = el('div', { class: 'size-row' });
    const stockNote = el('p', { class: 'pd-stock-note', 'aria-live': 'polite', text: `Select a ${optionLabel.toLowerCase()}` });
    optionLabels.forEach((label) => {
      const v = findVariantBySize(p, label);
      const buyable = v ? variantAvailable(v) : false;
      const b = el('button', {
        class: `size-pill${buyable ? '' : ' is-out'}`, type: 'button',
        text: label, 'aria-pressed': 'false',
        title: buyable ? label : `${label} — not available`,
        ...(buyable ? {} : { disabled: '' }),
      });
      if (buyable) {
        b.addEventListener('click', () => {
          selectedSize = label;
          currentVariant = v;
          [...optionRow.querySelectorAll('.size-pill')].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          stockNote.textContent = `${label} selected`;
          showPrice();
        });
      }
      optionRow.append(b);
    });
    info.append(el('h2', { class: 'pd-block-label' }, document.createTextNode(optionLabel)), optionRow, stockNote);
  } else {
    info.append(el('p', { class: 'pd-stock-note', text: 'One size — add straight to your bag.' }));
  }

  if (p.sizeGuide) info.append(buildSizeGuide(p));


  const qtyVal = el('span', { class: 'qty-value', text: '1' });
  const qtyDec = el('button', { type: 'button', 'aria-label': 'Decrease quantity', text: '−' });
  const qtyInc = el('button', { type: 'button', 'aria-label': `Increase quantity (maximum ${MAX_QUANTITY})`, text: '+' });
  const setQty = (next) => {
    qty = Math.min(MAX_QUANTITY, Math.max(1, next));
    qtyVal.textContent = String(qty);
    qtyDec.disabled = qty <= 1;
    qtyInc.disabled = qty >= MAX_QUANTITY;
    qtyInc.setAttribute('aria-label', qty >= MAX_QUANTITY
      ? `Increase quantity (maximum ${MAX_QUANTITY} reached)`
      : `Increase quantity (maximum ${MAX_QUANTITY})`);
  };
  qtyDec.addEventListener('click', () => setQty(qty - 1));
  qtyInc.addEventListener('click', () => setQty(qty + 1));
  setQty(qty);
  const stepper = el('div', { class: 'qty-stepper', 'aria-label': 'Quantity' }, qtyDec, qtyVal, qtyInc);
  const addBtn = el('button', { class: 'btn', type: 'button', text: 'Add to bag' });
  if (!isBuyable(p)) {
    addBtn.disabled = true;
    addBtn.setAttribute('aria-disabled', 'true');
    addBtn.textContent = 'Sold out — not buyable';
  } else {
    addBtn.addEventListener('click', () => {
      try {
        if ((optionLabels.length > 0) && !selectedSize) {
          throw new Error('Select a size before adding to bag.');
        }
        const persona = null;
        state.cart = addToCart(state.cart, p, selectedSize, qty, persona);
        persistCart();
        syncBadges();
        toast(`Added to bag — ${p.name}${selectedSize ? ` · ${selectedSize}` : ''}${persona ? ' · personalised' : ''}`);
        addBtn.textContent = 'Added ✓';
        setTimeout(() => { addBtn.textContent = 'Add to bag'; }, 1800);
      } catch (e2) {
        err.textContent = e2.message.replace(/^(UNKNOWN_SIZE|SIZE_UNAVAILABLE|PRICE_MISSING|INVALID_QTY):\s*/, '');
      }
    });
  }
  const viewCart = el('a', { class: 'quiet-cart-link', href: pageUrl('cart.html') }, document.createTextNode('View bag'));
  const wishBtn = buildWishButton(p);
  wishBtn.classList.add('pd-wish');
  info.append(err, el('div', { class: 'pd-actions' }, stepper, addBtn, wishBtn), viewCart);
  if (pers) info.append(pers.node);
  info.append(el('p', { class: 'pd-desc' }, document.createTextNode(String(p.description ?? '').trim())));
  if (String(p.fullDescription ?? '').trim()) {
    const details = el('details', { class: 'pd-details' }, el('summary', { text: 'Product details' }));
    details.append(el('p', { class: 'pd-desc pd-full' }, document.createTextNode(String(p.fullDescription).trim())));
    info.append(details);
  }

  out.append(el('div', { class: 'pd-cols' }, mediaCol, info));

  /* related — newest first from the product's first real category, self excluded */
  const relHead = state.data.categories
    .find((c) => (p.categories ?? []).some((n) => String(n).toLowerCase() === String(c.name).toLowerCase()));
  if (relHead) {
    const related = productsByCategory(state.data, relHead.slug)
      .filter((x) => x.id !== p.id)
      .slice(0, 4);
    if (related.length) {
      out.append(
        el('h3', { class: 'pd-block-label pd-related-label' }, document.createTextNode(`More ${catLabel(relHead.slug)}`)),
        el('div', { class: 'prod-grid pd-related' }, ...related.map(buildProductCard)),
      );
    }
  }

  $app().replaceChildren(out);
  if (pers && window.location.hash === '#personalisation') {
    pers.node.scrollIntoView({ block: 'center' });
    pers.trigger?.focus();
  }
  document.title = `${p.name} · 2202 Love Colombo`;
}

/* ---------------- cart page ---------------- */

function renderCart() {
  document.title = `Cart · 2202 Love Colombo`;
  const out = el('section', { class: 'page-body cart-page' });
  out.append(crumbTrail(null), pageTitle(`Cart · ${cartCount(state.cart)} ${cartCount(state.cart) === 1 ? 'item' : 'items'}`));
  if (!state.cart.length) {
    out.append(el('div', { class: 'cart-empty' },
      el('h3', { text: 'Your cart is empty' }),
      el('p', { text: 'Fill it slowly — PJ sets, dresses and ribbed essentials from the full catalog.' }),
      el('a', { class: 'btn', href: collectionUrl('all') }, document.createTextNode('Browse all styles')),
    ));
    $app().replaceChildren(out);
    return;
  }
  const lines = el('div', { class: 'cart-lines' });
  state.cart.forEach((line, i) => {
    const p = findProduct(state.data, line.id);
    const row = el('div', { class: 'cart-line' });
    row.append(p ? el('img', {
      class: 'cart-line-img', src: p.image.src, alt: p.name, width: '96', height: '120', loading: 'lazy',
    }) : null);
    row.append(
      el('div', { class: 'cart-line-info' },
        p ? el('a', { class: 'cart-line-name', href: productUrl(line.id) }, document.createTextNode(line.name)) : el('p', { class: 'cart-line-name' }, document.createTextNode(line.name)),
        line.size ? el('p', { class: 'cart-line-size', text: `Size ${line.size}` }) : null,
        line.variantId && line.size === ''
          ? el('p', { class: 'cart-line-size', text: `Variant id ${line.variantId}` })
          : null,
        line.pers ? el('div', { class: 'cart-line-pers' },
          el('strong', { text: 'Personalisation · + Rs 1,000 / unit' }),
          ...(Array.isArray(line.pers.placements) && line.pers.placements.length
            ? line.pers.placements.map((placement) => el('p', {
              text: `${placement.label}: “${placement.text}” · ${placement.fontLabel} · ${placement.colorLabel}`,
            }))
            : [el('p', { text: `${line.pers.name} · ${line.pers.font} · ${line.pers.color}` })]),
        ) : null,
        el('div', { class: 'qty-stepper', 'aria-label': 'Quantity' },
          el('button', {
            type: 'button', 'aria-label': `Decrease quantity of ${line.name}`, text: '−',
            onclick: () => { cartAdjust(i, -1); renderCart(); },
          }),
          el('span', { class: 'qty-value', text: String(Math.min(MAX_QUANTITY, line.qty)) }),
          el('button', {
            type: 'button',
            'aria-label': line.qty >= MAX_QUANTITY
              ? `Increase quantity of ${line.name} (maximum ${MAX_QUANTITY} reached)`
              : `Increase quantity of ${line.name} (maximum ${MAX_QUANTITY})`,
            text: '+',
            disabled: line.qty >= MAX_QUANTITY,
            onclick: () => { cartAdjust(i, 1); renderCart(); },
          }),
        ),
        el('button', {
          class: 'cart-line-remove', type: 'button', text: 'Remove',
          onclick: () => {
            state.cart = removeItem(state.cart, i);
            state.cart = normalizeCart(state.cart);
            persistCart();
            syncBadges();
            renderCart();
          },
        }),
      ),
      el('p', { class: 'cart-line-price', text: formatPrice((line.price + (line.fee ?? 0)) * line.qty) }),
    );
    if (p) lines.append(row);
  });
  const foot = el('div', { class: 'cart-foot' },
    el('div', { class: 'cart-subtotal' },
      el('span', { text: 'Subtotal' }),
      el('strong', { text: formatPrice(subtotal(state.cart)) }),
    ),
  );
  const checkout = el('button', {
    class: 'btn cart-checkout', type: 'button', text: 'Checkout',
    'aria-label': 'Checkout — unavailable in this static preview',
  });
  checkout.addEventListener('click', () => {
    checkout.disabled = true;
    checkout.textContent = 'Preview: order placement unavailable';
    toast('Preview: checkout is disabled; the live theme uses Shopify checkout.');
  });
  foot.append(checkout,
    el('p', {
      class: 'cart-note',
      text: 'This is a website preview. Your bag is saved on this device. Checkout and payment are unavailable.',
    }),
    el('a', { class: 'text-link', href: collectionUrl('all') }, document.createTextNode('Keep shopping')),
  );
  out.append(lines, foot);
  $app().replaceChildren(out);
}

/* ---------------- wishlist page ---------------- */

function renderWishlist() {
  document.title = `Wishlist · 2202 Love Colombo`;
  const out = el('section', { class: 'page-body wl-page' });
  out.append(crumbTrail(null), pageTitle(`Wishlist · ${state.wishlist.length} ${state.wishlist.length === 1 ? 'style' : 'styles'}`));
  if (!state.wishlist.length) {
    out.append(el('div', { class: 'wl-empty cart-empty' },
      el('h3', { id: 'wl-empty-title', text: 'Your wishlist is empty' }),
      el('p', { text: 'Nothing saved yet. Use the heart beside any product — your list persists in this browser.' }),
      el('a', { class: 'btn', id: 'wl-empty-cta', href: collectionUrl('all') }, document.createTextNode('Browse all styles')),
    ));
  } else {
    const grid = el('div', { class: 'prod-grid wl-grid' });
    state.wishlist.forEach((id) => {
      const p = findProduct(state.data, id);
      if (p) grid.append(buildProductCard(p));
    });
    out.append(grid);
  }
  if (typeof window !== 'undefined') window.__rerenderWishlist = () => renderWishlist();
  $app().replaceChildren(out);
}

/* ---------------- search page ---------------- */

function renderSearch() {
  const QS = freshQS();
  document.title = `Search · 2202 Love Colombo`;
  const out = el('section', { class: 'page-body search-page' });
  const input = el('input', {
    class: 'search-input', type: 'search', id: 'page-search-input',
    placeholder: 'Search PJ sets, dresses, fabrics…', 'aria-label': 'Search styles',
    value: QS.get('q') ?? '',
  });
  const icon = el('span', { class: 'search-field-icon', 'aria-hidden': 'true' });
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/></svg>';
  const countLine = el('p', { class: 'search-count', 'aria-live': 'polite' });
  const results = el('div', { class: 'prod-grid search-results' });
  const run = (q) => {
    const hits = q.trim() ? searchProducts(state.data.products, q) : state.data.products.slice();
    countLine.textContent = q.trim()
      ? `${hits.length} of ${state.data.products.length} styles match “${q.trim()}”`
      : `Full catalog · ${state.data.products.length} styles — type a product name, fabric or category`;
    results.replaceChildren();
    if (q.trim() && !hits.length) {
      results.append(el('div', { class: 'search-zero' },
        el('h3', {}, document.createTextNode(`No results for “${q.trim()}”`)),
        el('p', { text: 'Nothing in the 116-style catalog matches. Remove a filter, shorten the query or try “Mocha”, “PJ set”, “Ribbed”.' }),
        el('button', {
          class: 'btn', type: 'button', id: 'search-clear', text: 'Clear search',
          onclick: () => {
            input.value = '';
            run('');
            history.replaceState(null, '', searchUrl(''));
            input.focus();
          },
        }),
      ));
      return;
    }
    for (const p of hits) results.append(buildProductCard(p));
  };
  input.addEventListener('input', () => {
    run(input.value);
    const next = new URLSearchParams();
    if (input.value.trim()) next.set('q', input.value.trim());
    next.set('concept', state.concept);
    next.set('palette', state.palette);
    history.replaceState(null, '', `${window.location.pathname}?${next}`);
  });
  out.append(crumbTrail(null), pageTitle('Search styles'),
    el('div', { class: 'search-field' }, icon, input), countLine, results);
  $app().replaceChildren(out);
  run(input.value);
  if (QS.get('q')) input.focus();
}

/* ---------------- info pages (6 real source slugs) ---------------- */

async function renderInfo() {
  const QS = freshQS();
  const slug = QS.get('slug') ?? 'about-us';
  const allowed = ['about-us', 'contact-us', 'privacy-policy', 'delivery-policy', 'refund-policy', 'terms-conditions'];
  const out = el('section', { class: 'page-body info-page' });
  if (!allowed.includes(slug)) {
    out.append(pageTitle('Page not found'), el('p', { text: 'No info page with that slug. No fabricated page is shown.' }));
    $app().replaceChildren(out);
    return 'Info · not found';
  }
  let pages = [];
  try {
    const res = await fetch('assets/pages-data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`pages-data.json HTTP ${res.status}`);
    const json = await res.json();
    pages = json.pages ?? [];
  } catch (err) {
    out.append(pageTitle('Info pages unavailable'), el('p', { text: `pages-data.json failed to load (${err.message}). Reload the page to retry.` }));
    $app().replaceChildren(out);
    return 'Info · data error';
  }
  const pg = pages.find((x) => x.slug === slug);
  if (!pg) {
    out.append(pageTitle('Page not found'), el('p', { text: 'No info page with that slug. No fabricated page is shown.' }));
    $app().replaceChildren(out);
    return 'Info · not found';
  }
  out.append(pageTitle(pg.title));
  /* Sanitised source markup. The contract carries our own exported HTML, we
     keep text nodes/links and rewrite any internal info href to preserve
     concept/palette; external mailto/tel links are kept verbatim. */
  const body = el('div', { class: 'page-body-content' });
  body.innerHTML = String(pg.contentHtml ?? '');
  body.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    const m = href.match(/^page\.html\?slug=([\w-]+)$/);
    if (m) a.setAttribute('href', infoUrl(m[1]));
  });
  body.querySelectorAll('iframe').forEach((f) => f.remove());
  out.append(body);
  if (slug === 'contact-us') out.append(buildContactBlock());
  if (slug === 'about-us') {
    /* real heading link to current hexa contact doc */
    out.append(el('a', { class: 'text-link', href: infoUrl('contact-us') }, document.createTextNode('Contact us')));
  }
  $app().replaceChildren(out);
  document.title = `${pg.title} · 2202 Love Colombo`;
  return pg.title;
}

function buildContactBlock() {
  const box = el('section', { class: 'contact-block', 'aria-labelledby': 'contact-form-title' });
  const note = el('p', { class: 'form-note', role: 'status', 'aria-live': 'polite' });
  const inputs = {
    first: el('input', { class: 'contact-input', type: 'text', name: 'first-name', required: '', autocomplete: 'given-name' }),
    last: el('input', { class: 'contact-input', type: 'text', name: 'last-name', autocomplete: 'family-name' }),
    email: el('input', { class: 'contact-input', type: 'email', name: 'email', required: '', autocomplete: 'email' }),
    message: el('textarea', { class: 'contact-input contact-msg', name: 'message', required: '', rows: '5' }),
  };
  const btn = el('button', { class: 'btn', type: 'submit', text: 'Send message' });
  const form = el('form', {
    class: 'contact-form', novalidate: '',
    onsubmit: (e) => {
      e.preventDefault();
      note.textContent = '';
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!inputs.email.value.trim() || !emailRe.test(inputs.email.value.trim())) {
        note.textContent = 'Please check the email address.';
        inputs.email.focus();
        return;
      }
      if (!inputs.message.value.trim()) {
        note.textContent = 'Message is empty.';
        inputs.message.focus();
        return;
      }
      note.textContent = 'Preview: message not sent. Please use the contact details shown on this page.';
      form.reset();
      toast('Preview: message not sent');
    },
  });
  form.append(
    el('p', { class: 'form-note static-note', text: 'Preview form: this form does not send messages. Please use the contact details shown on this page.' }),
    el('h2', { id: 'contact-form-title' }, document.createTextNode('Send us a message')),
    el('label', { class: 'contact-label' }, el('span', { text: 'First Name' }), inputs.first),
    el('label', { class: 'contact-label' }, el('span', { text: 'Last Name' }), inputs.last),
    el('label', { class: 'contact-label' }, el('span', { text: 'Email' }), inputs.email),
    el('label', { class: 'contact-label' }, el('span', { text: 'Your Message' }), inputs.message),
    btn,
    note,
  );
  /* location: no external iframe load in the offline demo; show address + real map link */
  const mapLink = el('a', {
    class: 'text-link',
    href: 'https://www.google.com/maps/search/?api=1&query=435%2F20A%2C%20St.%20Joseph%20Estate%2C%20Dalugama%2C%20Kelaniya',
    target: '_blank',
    rel: 'noopener noreferrer',
  }, document.createTextNode('Open the address in Google Maps'));
  const map = el('div', { class: 'contact-map' },
    el('h2', {}, document.createTextNode('Visit the studio')),
    el('p', {}, document.createTextNode('435/20A, St. Joseph Estate, Dalugama, Kelaniya')),
    el('p', {}, el('a', { href: 'tel:+94773672202' }, document.createTextNode('+94 77 367 2202'))),
    el('p', {}, el('a', { href: 'mailto:Info@2202lovecolombo.com' }, document.createTextNode('Info@2202lovecolombo.com'))),
    mapLink,
    el('p', { class: 'foot-note', text: 'Map details open in a new tab from this preview.' }),
  );
  return el('div', { class: 'contact-cols' }, form, map);
}

/* ---------------- account page ---------------- */

function renderAccount() {
  document.title = `My account · 2202 Love Colombo`;
  const out = el('section', { class: 'page-body acct-page' });
  const note = el('p', { class: 'form-note account-preview-note', id: 'account-email-note', role: 'status', 'aria-live': 'polite' });
  const email = el('input', { class: 'contact-input', id: 'account-email', type: 'email', required: '', autocomplete: 'email', placeholder: 'you@example.com', 'aria-describedby': 'account-email-note' });
  const form = el('form', { class: 'account-preview-form', novalidate: '' });
  form.append(
    el('label', { class: 'contact-label', for: 'account-email', id: 'account-email-label' }, el('span', { text: 'Email address' })),
    email,
    el('button', { class: 'btn', type: 'submit', text: 'Continue with email' }),
    note,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      note.textContent = 'Enter a valid email address.';
      email.focus();
      return;
    }
    note.textContent = 'Sign-in is not connected in this preview. No email was saved.';
  });
  out.append(pageTitle('Your account'));
  out.append(el('div', { class: 'acct-cols' },
    el('div', { class: 'acct-col' },
      el('h2', { text: 'Sign in to your account' }),
      el('p', { text: 'Use your email to preview the account entry point. This demo does not request or store passwords.' }),
      form,
    ),
    el('div', { class: 'acct-col' },
      el('h2', { text: 'Account features' }),
      el('ul', {},
        el('li', {}, document.createTextNode('Order history and saved addresses on the live store.')),
        el('li', {}, document.createTextNode('Cart and wishlist persist in this browser preview.')),
        el('li', {}, document.createTextNode('Keep your favourite styles in your wishlist while you browse.'))),
      el('a', { class: 'btn', href: trackingUrl() }, document.createTextNode('Track an order')),
      el('a', { class: 'text-link', href: infoUrl('contact-us') }, document.createTextNode('Contact the store')),
    ),
  ));
  $app().replaceChildren(out);
}

/* ---------------- order tracking page ---------------- */

function renderTracking() {
  document.title = `Order tracking · 2202 Love Colombo`;
  const out = el('section', { class: 'page-body track-page' });
  out.append(pageTitle('Track your order'));
  const note = el('p', { class: 'form-note', id: 'track-status', role: 'status', 'aria-live': 'polite' });
  const orderIn = el('input', { class: 'contact-input', id: 'track-order', type: 'text', required: '', placeholder: 'Order number like 2202-0001', 'aria-describedby': 'track-status track-note', 'aria-invalid': 'false' });
  const emailIn = el('input', { class: 'contact-input', id: 'track-email', type: 'email', required: '', placeholder: 'you@example.com', autocomplete: 'email', 'aria-describedby': 'track-status track-note', 'aria-invalid': 'false' });
  const btn = el('button', { class: 'btn', type: 'submit', text: 'Track order' });
  const result = el('div', { class: 'track-result', role: 'status', 'aria-live': 'polite', hidden: 'true' });
  const form = el('form', { class: 'contact-form', novalidate: '' });
  form.append(note, btn);
  form.prepend(
    el('label', { class: 'contact-label', for: 'track-order' }, el('span', { text: 'Order number' }), orderIn),
    el('label', { class: 'contact-label', for: 'track-email' }, el('span', { text: 'Email' }), emailIn),
    el('p', { class: 'form-note static-note', id: 'track-note', text: 'This preview cannot access live orders.' }),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.textContent = '';
    result.hidden = true;
    result.textContent = '';
    orderIn.setAttribute('aria-invalid', 'false');
    emailIn.setAttribute('aria-invalid', 'false');
    if (!orderIn.value.trim()) {
      note.textContent = 'Enter your order number.';
      orderIn.setAttribute('aria-invalid', 'true');
      orderIn.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailIn.value.trim())) {
      note.textContent = 'Enter the email used for the order.';
      emailIn.setAttribute('aria-invalid', 'true');
      emailIn.focus();
      return;
    }
    result.hidden = false;
    result.textContent = 'Preview only: live order lookup is not connected. No order data was queried.';
  });
  out.append(
    form,
    result,
    el('div', { class: 'acct-note-block' },
      el('h2', { text: 'How tracking works on the live store' }),
      el('p', { text: 'On the live store, enter your order number and email to view courier status. This preview cannot retrieve live order details.' }),
    ),
    el('p', { class: 'acct-note', text: 'Need help? Contact the store and quote your order number.' }),
    el('a', { class: 'text-link', href: infoUrl('contact-us') }, document.createTextNode('Contact the store')),
  );
  $app().replaceChildren(out);
}

export const RENDERERS = {
  collection: renderCollection,
  product: renderProduct,
  cart: renderCart,
  wishlist: renderWishlist,
  search: renderSearch,
  page: renderInfo,
  account: renderAccount,
  'order-tracking': renderTracking,
};
export async function renderRoute(page) {
  return (await RENDERERS[page]?.()) ?? null;
}
