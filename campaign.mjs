import { el, ICON, collectionUrl } from './core.js';
import { createAutoplay } from './autoplay.mjs';

let activeController = null;
const setups = new WeakMap();

function srcset(variants) {
  return Object.values(variants).map((item) => `${item.src} ${item.width}w`).join(', ');
}

function campaignImage(slide, eager) {
  const desktop = slide.desktop.variants;
  const fallback = desktop['960'];
  const img = el('img', {
    src: fallback.src,
    alt: slide.alt,
    width: String(fallback.width),
    height: String(fallback.height),
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
  });
  img.setAttribute('srcset', srcset(desktop));
  img.setAttribute('sizes', '100vw');
  if (eager) img.setAttribute('fetchpriority', 'high');
  const picture = el('picture');
  if (slide.mobile) {
    picture.append(el('source', {
      media: '(max-width: 760px)',
      srcset: srcset(slide.mobile.variants),
      sizes: '100vw',
    }));
  }
  picture.append(img);
  return picture;
}

export function renderCampaignHero(slides) {
  let current = 0;
  const hero = el('section', {
    class: 'campaign-hero', id: 'campaign-hero', tabindex: '0',
    role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Studio campaign collections',
  });
  const track = el('div', { class: 'campaign-track' });
  const slideNodes = slides.map((slide, index) => {
    const link = el('a', {
      class: 'campaign-slide-link',
      href: collectionUrl(slide.collection),
      'aria-label': `${slide.title} — shop collection`,
    }, campaignImage(slide, index === 0));
    return el('div', {
      class: 'campaign-slide',
      role: 'group',
      'aria-roledescription': 'slide',
      'aria-label': `${index + 1} of ${slides.length}: ${slide.title}`,
    }, link);
  });
  slideNodes.forEach((node) => track.append(node));

  const live = el('p', { class: 'campaign-live', 'aria-live': 'polite' });
  const counter = el('span', { class: 'campaign-counter' });
  const update = (next) => {
    current = (next + slides.length) % slides.length;
    slideNodes.forEach((node, index) => {
      const active = index === current;
      node.dataset.activeSlide = String(active);
      node.setAttribute('aria-hidden', String(!active));
      if ('inert' in node) node.inert = !active;
    });
    counter.textContent = `${current + 1} / ${slides.length}`;
    live.textContent = `Slide ${current + 1} of ${slides.length}: ${slides[current].title}`;
  };
  const prev = el('button', { class: 'campaign-arrow', type: 'button', 'aria-label': 'Previous campaign', onclick: () => manualUpdate(current - 1) });
  prev.innerHTML = ICON.arrLeft;
  const next = el('button', { class: 'campaign-arrow', type: 'button', 'aria-label': 'Next campaign', onclick: () => manualUpdate(current + 1) });
  next.innerHTML = ICON.arrRight;
  const autoplayToggle = el('button', { class: 'campaign-autoplay-toggle', type: 'button', 'aria-label': 'Pause slideshow', 'aria-pressed': 'false', text: 'Ⅱ' });
  const controls = el('div', { class: 'campaign-controls' }, prev, counter, autoplayToggle, next);
  hero.append(track, controls, live);

  hero.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); manualUpdate(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); manualUpdate(current + 1); }
  });
  let startX = null;
  let startY = null;
  hero.addEventListener('pointerdown', (event) => { startX = event.clientX; startY = event.clientY; });
  hero.addEventListener('pointerup', (event) => {
    if (startX == null) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = startY = null;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) manualUpdate(current + (dx < 0 ? 1 : -1));
  });
  hero.addEventListener('pointercancel', () => { startX = startY = null; });

  const manualUpdate = (next) => {
    activeController?.manualInteraction();
    update(next);
  };
  update(0);
  setups.set(hero, () => {
    activeController?.dispose();
    activeController = createAutoplay({
      root: hero,
      toggle: autoplayToggle,
      live,
      advance: () => update(current + 1),
    });
  });
  return hero;
}

export function activateCampaignAutoplay(hero) {
  setups.get(hero)?.();
}
