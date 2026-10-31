import { renderCampaignHero, campaignImage } from './campaign.mjs';
import { el, collectionUrl } from './core.js';
import { findProduct } from './store.mjs';

// Both slide types share one carousel. The light colours follow Atelier.
const STORIES = [
  { id: 30895, eyebrow: 'The ribbed edit', title: 'Everyday, elevated.', collection: 'ribbed', background: '#e4d2b5' },
  { id: 31597, eyebrow: 'The satin collection', title: 'After hours.', collection: 'personalised-pyjama', background: '#dedede' },
  { id: 31845, eyebrow: 'New arrivals', title: 'A softer start.', collection: 'pjs', background: '#f2f2f2' },
];

export function buildSignatureHero(campaigns, data) {
  const slides = STORIES.flatMap((story, index) => [
    { ...story, type: 'editorial', product: findProduct(data, story.id) },
    { ...campaigns[index], type: 'campaign', background: story.background },
  ]);
  const hero = renderCampaignHero(slides, {
    label: 'Signature campaign and editorial collections',
    onSlideChange(slide) {
      document.body.style.setProperty('--signature-background', slide.background);
      document.body.style.setProperty('--signature-foreground', '#171717');
    },
    renderSlide(slide, index) {
      if (slide.type === 'campaign') {
        return el('a', { class: 'campaign-slide-link signature-banner', href: collectionUrl(slide.collection), 'aria-label': `${slide.title} — shop collection` }, campaignImage(slide, index === 0));
      }
      const image = slide.product.image;
      return el('div', { class: 'signature-editorial' },
        el('div', { class: 'signature-product-photo' }, el('img', {
          src: image.src, srcset: image.srcset, sizes: '(max-width: 760px) 100vw, 62vw',
          alt: image.alt, width: image.width, height: image.height,
          loading: index === 0 ? 'eager' : 'lazy', decoding: 'async',
          ...(index === 0 ? { fetchpriority: 'high' } : {}),
        })),
        el('div', { class: 'signature-copy' },
          el('p', { class: 'signature-eyebrow', text: slide.eyebrow }),
          el('h2', { text: slide.title })),
        el('a', { class: 'signature-shop', href: collectionUrl(slide.collection), text: 'Shop now' }),
      );
    },
  });
  hero.classList.add('signature-hero');
  hero.prepend(el('h1', { class: 'visually-hidden', text: '2202 Love Colombo — made with love' }));
  return hero;
}
