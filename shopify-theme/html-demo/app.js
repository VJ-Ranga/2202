/**
 * app.js — homepage renderer (preview.html).
 * Renders one of the six approved homepage previews
 * (?concept=atelier|studio|maison&palette=mono|brown).
 * Shared plumbing (urls, dialog manager, single-row header navigation, footer,
 * wish toggle, badges) lives in core.js. Commerce controls link out to the
 * multipage documents (collection/product/cart/wishlist/search/account).
 */

import {
  findProduct,
} from './store.mjs';

import { renderCampaignHero, activateCampaignAutoplay } from './campaign.mjs';
import { createAutoplay } from './autoplay.mjs';

import {
  el,
  ICON,
  state,
  concept,
  palette,
  pageUrl,
  homeUrl,
  collectionUrl,
  infoUrl,
  loadData,
  renderLoadError,
  buildHeader,
  buildFooter,
  buildDialog,
  openDialog,
  closeDialog,
  dlgCloseBtn,
  buildCompareDialog,
  buildMobileMenuDialog,
  openCompare,
  compareFab,
  bindScroll,
  syncBadges,
  buildProductCard,
} from './core.js';

/* ---------------- constants ---------------- */

const CONCEPTS = { atelier: 'Atelier · Editorial', studio: 'Studio · Modern', maison: 'Maison · Statement' };
const PALETTES = { mono: 'Pure Mono', brown: 'Mono + Brown' };
const NEW_ARRIVAL_IDS = [31845, 31800, 31787, 31836];

/* ---------------- hero ---------------- */

function heroImg(media, ctx, eager, priority) {
  const img = el('img', {
    src: media.src, alt: media.alt, width: String(media.width), height: String(media.height),
    loading: eager ? 'eager' : 'lazy',
  });
  if (eager && priority) img.setAttribute('fetchpriority', priority);
  img.setAttribute('srcset', media.srcset);
  img.setAttribute('sizes', ctx === 'hero'
    ? '(max-width: 760px) 100vw, 50vw'
    : '(max-width: 760px) 50vw, 25vw');
  img.style.objectPosition = media.position || '50% 50%';
  return img;
}

let heroIdx = 0;
let heroAutoplay = null;

function renderHero() {
  const C = state.concept;
  const hero = el('section', {
    class: 'hero', id: 'hero', tabindex: '0',
    role: 'region', 'aria-label': 'Featured collections — slider',
  });
  const track = el('div', { class: 'hero-track' });

  state.data.heroes.forEach((slide, i) => {
    const copy = el('div', { class: 'hero-copy is-away' });
    copy.append(
      el('p', { class: 'eyebrow', text: slide.eyebrow }),
      el('h2', {}, document.createTextNode(slide.title)),
    );
    if (C !== 'atelier') copy.append(el('p', { class: 'hero-desc', text: slide.description }));
    copy.append(el('a', {
      class: 'text-link', href: collectionUrl(catSlugForTerm(slide.category)),
      text: C === 'studio' ? 'Shop the collection' : 'Shop this story',
    }));

    const panelL = el('div', { class: 'hero-panel hero-panel--left' });
    const leftMedia = i === 0 ? (findProduct(state.data, 31662)?.image ?? slide.left) : slide.left;
    panelL.append(heroImg(leftMedia, 'hero', i === 0, 'high'));

    const panelR = el('div', { class: 'hero-panel hero-panel--right' });
    panelR.append(heroImg(slide.right, 'hero', i === 0, 'high'));

    const side = i === 1 ? 'right' : 'left';
    track.append(el('div', { class: 'hero-slide', dataset: { idx: String(i), side } },
      panelL, panelR, copy));
  });

  const controls = el('div', { class: 'hero-controls' });
  const prev = el('button', {
    class: 'hero-arrow', type: 'button', 'aria-label': 'Previous slide',
    onclick: () => manualHeroSlide(heroIdx - 1),
  });
  prev.innerHTML = ICON.arrLeft;
  const next = el('button', {
    class: 'hero-arrow', type: 'button', 'aria-label': 'Next slide',
    onclick: () => manualHeroSlide(heroIdx + 1),
  });
  next.innerHTML = ICON.arrRight;
  const autoplayToggle = el('button', {
    class: 'hero-autoplay-toggle', type: 'button', 'aria-label': 'Pause slideshow',
    'aria-pressed': 'false', text: 'Ⅱ',
  });
  controls.append(
    prev,
    el('span', { class: 'hero-counter', 'aria-hidden': 'true', text: '1 / 3' }),
    autoplayToggle,
    next,
  );
  hero.append(track, controls, el('p', { class: 'hero-live', 'aria-live': 'polite' }));

  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); manualHeroSlide(heroIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); manualHeroSlide(heroIdx + 1); }
  });

  let startX = null; let startY = null;
  hero.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; });
  hero.addEventListener('pointerup', (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    startX = startY = null;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) manualHeroSlide(heroIdx + (dx < 0 ? 1 : -1));
  });
  hero.addEventListener('pointercancel', () => { startX = startY = null; });

  return hero;
}

function manualHeroSlide(i) {
  heroAutoplay?.manualInteraction();
  slideToState(i);
}

function initHeroAutoplay() {
  heroAutoplay?.dispose();
  const root = document.getElementById('hero');
  if (!root) return;
  heroAutoplay = createAutoplay({
    root,
    toggle: root.querySelector('.hero-autoplay-toggle'),
    live: root.querySelector('.hero-live'),
    advance: () => slideToState(heroIdx + 1),
  });
}

function slideToState(i) {
  if (!state.data?.heroes?.length) return;
  const n = state.data.heroes.length;
  heroIdx = ((i % n) + n) % n;
  const hero = document.getElementById('hero');
  const track = hero?.querySelector('.hero-track');
  if (!hero || !track) return;
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  const slides = [...track.children];
  slides.forEach((s, idx) => {
    const active = idx === heroIdx;
    s.dataset.activeSlide = String(active);
    if ('inert' in s) s.inert = !active;
    if (active) s.removeAttribute('aria-hidden');
    else s.setAttribute('aria-hidden', 'true');
    s.querySelector('.hero-copy').classList.toggle('is-away', !active);
  });
  if (mobile) track.style.transform = 'none';
  else track.style.transform = `translateX(${-slides[heroIdx].offsetLeft}px)`;
  const cur = state.data.heroes[heroIdx];
  hero.querySelector('.hero-counter').textContent = `${heroIdx + 1} / ${n}`;
  hero.querySelector('.hero-live').textContent = `Slide ${heroIdx + 1} of ${n}: ${cur.title}`;
}

function catSlugForTerm(term) {
  const t = String(term ?? '').toLowerCase();
  if (t === "pj's") return 'pjs';
  if (t === 'ribbed series') return 'ribbed';
  const hit = state.data.categories.find((c) => String(c.name).toLowerCase() === t);
  return hit?.slug ?? 'all';
}

/* ---------------- sections ---------------- */

function sectionHead(eyebrow, title, titleId, linkText, linkHref) {
  const head = el('div', { class: 'section-head' });
  const left = el('div');
  left.append(
    el('span', { class: 'eyebrow' }, eyebrow),
    el('h2', { class: 'section-title' }, document.createTextNode(title)),
  );
  if (titleId) left.lastChild.setAttribute('id', titleId);
  head.append(left, el('a', {
    class: 'section-foot-link', href: linkHref ?? collectionUrl('all'), text: linkText ?? '',
  }));
  return head;
}

function renderCategories() {
  /* only the FIRST four curated categories with real media tiles, per brief */
  const curated = state.data.categories.filter((c) => c.image != null && c.parentId == null).slice(0, 4);
  const sect = el('section', { class: 'section', id: 'categories', 'aria-labelledby': 'categories-title' },
    sectionHead('Shop by category', 'The collections', 'categories-title', 'All styles',
      collectionUrl('all')));
  const grid = el('div', { class: 'cat-grid' });
  curated.forEach((c) => {
    const media = el('div', { class: 'cat-media' });
    const img = el('img', {
      src: c.image.src, alt: c.image.alt, width: String(c.image.width), height: String(c.image.height),
      loading: 'lazy',
    });
    img.setAttribute('srcset', c.image.srcset);
    img.setAttribute('sizes', '(max-width: 760px) 50vw, 25vw');
    img.style.objectPosition = c.image.position || '50% 12%';
    media.append(img);
    grid.append(el('a', {
      class: 'cat-card', href: collectionUrl(c.slug),
      'aria-label': `Shop ${c.name} — open the collection page`,
    }, media, el('span', { class: 'cat-name' },
      el('span', { text: c.name }),
      el('span', { class: 'arrow', danger: ICON.arrow }),
    )));
  });
  sect.append(grid);
  return sect;
}

function renderNewArrivals() {
  const sect = el('section', { class: 'section', id: 'new-arrivals', 'aria-labelledby': 'arrivals-title' });
  const head = el('div', { class: 'section-head' });
  const left = el('div');
  left.append(
    el('span', { class: 'eyebrow' }, state.concept === 'studio' ? 'The art of unwinding.' : 'Just in'),
    el('h2', { class: 'section-title', id: 'arrivals-title' }, document.createTextNode('New arrivals')),
  );
  head.append(left, el('a', {
    class: 'section-foot-link', href: collectionUrl('all'),
    text: `View all ${state.data.products.length} styles`,
  }));
  const grid = el('div', { class: 'prod-grid' });
  NEW_ARRIVAL_IDS.forEach((id) => {
    const p = findProduct(state.data, id);
    if (p) grid.append(buildProductCard(p));
  });
  sect.append(head, grid);
  return sect;
}

/* ---------------- editorial pair ---------------- */

function edTile(media, kicker, title, catSlug) {
  const t = el('a', {
    class: 'ed-tile', href: collectionUrl(catSlug),
    'aria-label': `${title}. Open ${catSlug === 'ribbed' ? 'RIBBED SERIES' : 'PJ\u2019s'} collection`,
  });
  const img = el('img', {
    src: media.src, alt: media.alt, width: String(media.width), height: String(media.height),
    loading: 'lazy',
  });
  img.setAttribute('srcset', media.srcset);
  img.setAttribute('sizes', '(max-width: 760px) 92vw, 50vw');
  img.style.objectPosition = media.position || '50% 12%';
  t.append(img, el('span', { class: 'ed-caption' },
    el('span', { class: 'ed-kicker', text: kicker }),
    el('h3', { text: title }),
    el('span', { class: 'text-link', text: catSlug === 'ribbed' ? 'Open Ribbed Series' : 'Open PJ\u2019s' }),
  ));
  return t;
}

function renderEditorial() {
  const e = state.data.editorial;
  const sect = el('section', { class: 'section', id: 'editorial', 'aria-labelledby': 'editorial-title' });
  const head = el('div', { class: 'section-head' });
  const left = el('div');
  left.append(
    el('span', { class: 'eyebrow' }, 'Two fabrics, two moods'),
    el('h2', { class: 'section-title', id: 'editorial-title' }, document.createTextNode('The edit')),
  );
  head.append(left);
  const intro = el('p', { class: 'ed-intro' }, document.createTextNode('Made for slow mornings.'));
  sect.append(head, intro, el('div', { class: 'editorial' },
    edTile(e.left, 'Ribbed series', 'Rib, contoured', 'ribbed'),
    edTile(e.right, 'Personalised pyjama', 'Midnight, after dark', 'pjs'),
  ));
  return sect;
}

/* ---------------- personalisation (info links out, no dialog) ---------------- */

function renderPersonalisation() {
  const d = state.data.personalisation;
  const sect = el('section', { class: 'section perso', id: 'personalisation', 'aria-labelledby': 'perso-title' });
  const media = el('div', { class: 'perso-media' });
  const img = el('img', {
    src: d.image.src, alt: d.image.alt, width: String(d.image.width), height: String(d.image.height),
    loading: 'lazy',
  });
  img.setAttribute('srcset', d.image.srcset);
  img.setAttribute('sizes', '(max-width: 900px) 92vw, 45vw');
  img.style.objectPosition = d.image.position || '50% 40%';
  media.append(img);

  const body = el('div', { class: 'perso-body' });
  body.append(el('span', { class: 'eyebrow' }, 'Personalisation'));
  body.append(el('h2', { id: 'perso-title' }, document.createTextNode(d.title)));
  body.append(el('p', { text: d.description }));

  const input = el('input', {
    class: 'perso-input', id: 'perso-input', maxlength: '10',
    placeholder: 'A name, up to 10 letters', 'aria-describedby': 'perso-preview-note',
  });
  const count = el('span', { class: 'perso-count', text: '0/10' });
  const preview = el('p', { class: 'perso-embroidered', id: 'perso-preview', 'aria-live': 'polite' });
  input.addEventListener('input', () => {
    preview.textContent = input.value;
    count.textContent = `${input.value.length}/10`;
  });
  body.append(
    el('label', { class: 'perso-preview-label', for: 'perso-input', text: 'Text preview — not production artwork' }),
    el('div', { class: 'perso-input-row' }, input, count),
    preview,
    el('p', {
      class: 'perso-note', id: 'perso-preview-note',
      text: 'Shown in a serif italic stand-in for the script fonts. Rs 1,000 per applied unit at the live store; a proof is reviewed before production.',
    }),
    el('a', {
      class: 'text-link', text: 'Shop Personalised Pyjama',
      href: collectionUrl('personalised-pyjama'),
    }),
  );
  sect.append(media, body);
  return sect;
}

/* ---------------- boot ---------------- */

async function boot() {
  try {
    state.data = await loadData();
    if (concept === 'studio') {
      const response = await fetch('assets/campaign-banners.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`campaign-banners.json returned HTTP ${response.status}`);
      state.campaignBanners = await response.json();
    }
  } catch (err) {
    renderLoadError(err?.message ?? 'Unknown fetch error.', boot);
    return;
  }
  document.body.dataset.concept = concept;
  document.body.dataset.palette = palette;
  document.title = `2202 Love Colombo — ${CONCEPTS[concept]} · ${PALETTES[palette]}`;

  buildMobileMenuDialog();
  buildCompareDialog();

  const app = document.getElementById('app');
  heroAutoplay?.dispose();
  app.replaceChildren();

  app.append(buildHeader({ activeSlug: null }));

  const standfirst = concept === 'studio'
    ? el('p', { class: 'hero-standfirst', text: 'Made for slow mornings.' })
    : null;

  const main = el('main', { id: 'main' });
  main.append(...[
    concept === 'studio' ? renderCampaignHero(state.campaignBanners.slides) : renderHero(),
    standfirst,
    renderCategories(),
    renderNewArrivals(),
    renderEditorial(),
    renderPersonalisation(),
  ].filter((n) => n != null));
  app.append(main, buildFooter(), compareFab());

  if (concept !== 'studio') {
    slideToState(0);
    initHeroAutoplay();
  } else {
    activateCampaignAutoplay(document.getElementById('campaign-hero'));
  }
  syncBadges();
  bindScroll();

  let raf = 0;
  if (concept !== 'studio') window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => slideToState(heroIdx));
  });
}

boot();
