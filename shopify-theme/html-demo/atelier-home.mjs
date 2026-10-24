import { el, collectionUrl, productUrl, infoUrl, buildProductCard, ICON } from './core.js';
import { findProduct } from './store.mjs';
import { createAutoplay } from './autoplay.mjs';

const STORIES = [
  { id: 30895, eyebrow: 'The ribbed edit', title: 'Everyday, elevated.', category: 'ribbed', background: '#e4d2b5' },
  { id: 31597, eyebrow: 'The satin collection', title: 'After hours.', category: 'personalised-pyjama', background: '#dedede' },
  { id: 31845, eyebrow: 'New arrivals', title: 'A softer start.', category: 'pjs', background: '#f2f2f2' },
];

function photograph(media, { eager = false, sizes = '50vw' } = {}) {
  return el('img', {
    src: media.src, srcset: media.srcset, sizes, alt: media.alt,
    width: media.width, height: media.height,
    loading: eager ? 'eager' : 'lazy', decoding: 'async',
    ...(eager ? { fetchpriority: 'high' } : {}),
  });
}

export function buildAtelierHome(data) {
  let autoplay;
  let index = 0;
  const hero = el('section', {
    class: 'atelier-campaign', tabindex: '0', role: 'region',
    'aria-label': 'Featured collections', 'aria-roledescription': 'carousel',
  });
  const slides = STORIES.map((story, i) => {
    const product = findProduct(data, story.id);
    const slide = el('article', {
      class: 'atelier-campaign-slide', 'aria-label': `${i + 1} of ${STORIES.length}`,
    });
    slide.style.setProperty('--campaign-background', story.background);
    slide.append(
      el('div', { class: 'atelier-campaign-photo' }, photograph(product.image, { eager: i === 0, sizes: '(max-width: 760px) 100vw, 62vw' })),
      el('div', { class: 'atelier-campaign-copy' },
        el('p', { class: 'atelier-eyebrow', text: story.eyebrow }),
        el(i === 0 ? 'h1' : 'h2', { text: story.title })),
      el('a', { class: 'atelier-campaign-cta', href: collectionUrl(story.category), text: 'Shop now' }),
    );
    hero.append(slide);
    return slide;
  });
  const counter = el('span', { class: 'atelier-campaign-counter', 'aria-hidden': 'true' });
  const live = el('p', { class: 'visually-hidden', 'aria-live': 'polite' });
  const toggle = el('button', { class: 'atelier-slider-button', type: 'button', 'aria-label': 'Pause slideshow', text: 'Ⅱ' });
  const show = (next, manual = false) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.dataset.active = String(i === index);
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    counter.textContent = `${index + 1} / ${slides.length}`;
    live.textContent = `Slide ${index + 1}: ${STORIES[index].title}`;
    if (manual) autoplay?.manualInteraction();
  };
  const previous = el('button', { class: 'atelier-slider-button', type: 'button', 'aria-label': 'Previous slide', onclick: () => show(index - 1, true) });
  const next = el('button', { class: 'atelier-slider-button', type: 'button', 'aria-label': 'Next slide', onclick: () => show(index + 1, true) });
  previous.innerHTML = ICON.arrLeft;
  next.innerHTML = ICON.arrRight;
  hero.append(el('div', { class: 'atelier-campaign-controls' }, previous, counter, toggle, next), live);
  hero.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  let touchStart;
  hero.addEventListener('pointerdown', (event) => { touchStart = { x: event.clientX, y: event.clientY }; });
  hero.addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1), true);
  });
  hero.addEventListener('pointercancel', () => { touchStart = null; });
  show(0);

  const arrivals = el('section', { class: 'atelier-arrivals', 'aria-label': 'New arrivals' });
  arrivals.append(el('div', { class: 'atelier-arrivals-intro' },
    el('p', { class: 'atelier-eyebrow', text: 'Just arrived' }),
    el('h2', { text: 'New arrivals' }),
    el('a', { class: 'atelier-outline-link', href: collectionUrl('new'), text: 'View all' })));
  [31845, 31836, 31824, 31812].forEach((id) => {
    const product = findProduct(data, id);
    if (product) arrivals.append(buildProductCard(product));
  });

  const categories = el('section', { class: 'atelier-category-grid', 'aria-label': 'Shop by category' });
  for (const slug of ['dresses', 'tops', 'pjs', 'bottoms']) {
    const category = data.categories.find((item) => item.slug === slug && item.image);
    if (!category) continue;
    categories.append(el('a', { class: 'atelier-category', href: collectionUrl(slug) },
      photograph(category.image, { sizes: '(max-width: 760px) 100vw, 50vw' }),
      el('span', { class: 'atelier-category-name', text: category.name }),
      el('span', { class: 'atelier-category-cta', text: 'Shop collection' })));
  }

  const statement = el('section', { class: 'atelier-statement' },
    el('p', { class: 'atelier-eyebrow', text: '2202 Love Colombo' }),
    el('h2', {}, 'Dressed for', el('br'), 'your everyday.'),
    el('p', { text: 'Pyjamas, ribbed essentials and pieces for every day.' }),
    el('a', { class: 'atelier-outline-link', href: infoUrl('about-us'), text: 'Our story' }));

  const looks = el('section', { class: 'atelier-lookbook', 'aria-label': 'Explore the looks' });
  [30895, 31662, 31646].forEach((id) => {
    const product = findProduct(data, id);
    if (product) looks.append(el('a', { href: productUrl(id), 'aria-label': `Shop ${product.name}` },
      photograph(product.alternate ?? product.image, { sizes: '(max-width: 760px) 80vw, 33vw' }),
      el('span', { text: product.name })));
  });

  const personalisation = el('section', { class: 'atelier-personalisation' },
    photograph(data.personalisation.image),
    el('div', {}, el('p', { class: 'atelier-eyebrow', text: 'A personal touch' }),
      el('h2', { text: 'Make it yours.' }),
      el('p', { text: 'Add a name, choose your script and select a thread colour for your satin set.' }),
      el('a', { class: 'atelier-outline-link', href: `${productUrl(31597)}#personalisation`, text: 'Explore personalisation' })));

  return {
    sections: [hero, arrivals, categories, statement, looks, personalisation],
    activate() { autoplay = createAutoplay({ root: hero, toggle, live, advance: () => show(index + 1) }); },
  };
}
