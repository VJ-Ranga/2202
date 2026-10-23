/**
 * boot.js — router entry for the non-home demo documents.
 * body[data-page] picks the renderer from pages.js; core.js supplies the
 * shared single-row header navigation, footer, dialog plumbing and data loading.
 * Home itself boots through app.js on preview.html / index.html chooser.
 */

import {
  state,
  QS,
  loadData,
  renderLoadError,
  buildHeader,
  buildFooter,
  buildMobileMenuDialog,
  syncBadges,
  bindScroll,
} from './core.js';
import { renderRoute } from './pages.js';

const page = document.body.dataset.page || 'collection';

const BASE_TITLES = {
  collection: 'Collection · 2202 Love Colombo',
  product: 'Product · 2202 Love Colombo',
  cart: 'Cart · 2202 Love Colombo',
  wishlist: 'Wishlist · 2202 Love Colombo',
  search: 'Search · 2202 Love Colombo',
  page: 'Information · 2202 Love Colombo',
  account: 'My account · 2202 Love Colombo',
  'order-tracking': 'Order tracking · 2202 Love Colombo',
};

function activeTopSlug() {
  if (page === 'collection') {
    const slug = QS.get('category') ?? QS.get('slug') ?? '';
    if (state.data.navigation.some((n) => n.slug === slug)) return slug;
    for (const n of state.data.navigation) {
      if ((n.children ?? []).some((c) => c.slug === slug)) return n.slug;
    }
  }
  if (page === 'product') {
    const id = Number(QS.get('id'));
    const p = state.data.products.find((x) => x.id === id);
    if (!p) return null;
    const firstCat = (p.categories ?? [])
      .map((c) => state.data.categories.find((k) => String(k.name).toLowerCase() === String(c).toLowerCase()))
      .find(Boolean);
    if (!firstCat) return null;
    if (firstCat.parentId != null) {
      for (const n of state.data.navigation) {
        const childCat = (n.children ?? []).some((c) => {
          const cat = state.data.categories.find((x) => x.slug === c.slug);
          return cat && cat.parentId === firstCat.parentId;
        });
        if (childCat) return n.slug;
      }
    }
    if (state.data.navigation.some((n) => n.slug === firstCat.slug)) return firstCat.slug;
  }
  return null;
}

async function boot() {
  try {
    state.data = await loadData();
  } catch (err) {
    renderLoadError(err?.message ?? 'Unknown fetch error.', boot);
    return;
  }
  document.title = BASE_TITLES[page] ?? '2202 Love Colombo';
  document.body.dataset.concept = state.concept;
  document.body.dataset.palette = state.palette;

  buildMobileMenuDialog();

  const app = document.getElementById('app');
  app.replaceChildren();

  /* page renderers (pages.js) render into #page-root, never #app */
  const mount = document.createElement('div');
  mount.id = 'page-root';
  const main = document.createElement('main');
  main.append(mount);
  app.append(buildHeader({ activeSlug: activeTopSlug() }), main, buildFooter());

  try {
    await renderRoute(page);
  } catch (err) {
    const retry = () => window.location.reload();
    mount.replaceChildren(
      document.createElement('div'),
    );
    const errorView = mount.firstElementChild;
    errorView.className = 'route-error';
    errorView.setAttribute('role', 'alert');
    const heading = document.createElement('h1');
    heading.tabIndex = -1;
    heading.textContent = 'This preview page could not be rendered';
    const message = document.createElement('p');
    message.textContent = 'Some preview content failed to load. Your header, footer, and product data remain available.';
    const button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.textContent = 'Retry page';
    button.addEventListener('click', retry);
    errorView.append(heading, message, button);
    heading.focus();
    console.error('Route render failed:', err);
  }

  syncBadges();
  bindScroll();
}

boot();
