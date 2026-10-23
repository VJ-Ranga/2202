import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createCartDrawer,
  findProductById,
  optionSummary,
  pickLineImage,
  personalisationFee,
  personalisationSummary,
  checkoutUrl,
} from './cart-drawer.mjs';

const data = JSON.parse(readFileSync(new URL('./assets/demo-data.json', import.meta.url), 'utf8'));
const scrunchies = findProductById(data.products, 30106);
const sageSet = findProductById(data.products, 31630);
const sageVariant = sageSet.variants.find((variant) => variant.options.Size === 'UK08/S');

const urls = {
  cart: 'cart.html?concept=atelier&palette=mono',
  shop: 'collection.html?category=all&concept=atelier&palette=mono',
  checkout: '',
  product: (id) => `product.html?id=${id}&concept=atelier&palette=mono`,
};

const deps = () => ({
  getCart: () => [],
  getProducts: () => data.products,
  setCart: () => {},
  urls,
});

// ---------- frozen factory API ----------

test('factory validates every injected dependency up front', async () => {
  await assert.rejects(() => createCartDrawer({}), TypeError);
  await assert.rejects(() => createCartDrawer({
    getCart: () => [], getProducts: () => [], setCart: () => {},
  }), TypeError);
  await assert.rejects(() => createCartDrawer({
    ...deps(),
    urls: { cart: 'cart.html', shop: 'collection.html', checkout: '', product: null },
  }), TypeError);
  await assert.rejects(() => createCartDrawer({ ...deps(), onChange: 'nope' }), TypeError);
});

test('factory resolves without a document and exposes the frozen API', async () => {
  const drawer = await createCartDrawer(deps());
  assert.deepEqual(Object.keys(drawer).sort(), ['close', 'isOpen', 'open', 'refresh']);
  assert.equal(drawer.isOpen, false);
  drawer.close();
  assert.equal(drawer.isOpen, false);
});

// ---------- real catalog option and image resolution ----------

test('variation image wins when line.variantId matches a real variation', () => {
  const line = { id: 30106, variantId: 30118, size: 'Coral Pop', qty: 1, price: 250 };
  const image = pickLineImage(scrunchies, line);
  assert.equal(image.src, scrunchies.variants.find((variant) => variant.id === 30118).image.src);
  assert.notEqual(image.src, scrunchies.image.src);
});

test('image falls back to product image, then gallery, then null', () => {
  assert.equal(
    pickLineImage(scrunchies, { id: 30106, variantId: 999999, size: 'Coral Pop' }).src,
    scrunchies.image.src,
  );
  assert.equal(
    pickLineImage({ id: 1, gallery: [{ src: 'assets/images/fallback.webp' }] }, { id: 1 }).src,
    'assets/images/fallback.webp',
  );
  assert.equal(pickLineImage({ id: 1 }, { id: 1 }), null);
  assert.equal(pickLineImage(undefined, { id: 1 }), null);
});

test('option summary names Size and Colour from the real variation keys', () => {
  assert.equal(
    optionSummary(scrunchies, { variantId: 30118, size: 'Coral Pop' }),
    'Colour: Coral Pop',
  );
  assert.equal(
    optionSummary(sageSet, { variantId: sageVariant.id, size: 'UK08/S' }),
    'Size: UK08/S',
  );
  assert.equal(
    optionSummary(sageSet, { size: 'UK08/S' }),
    'Size: UK08/S',
  );
  assert.equal(optionSummary(sageSet, { size: '' }), '');
});

// ---------- personalisation: real fee, real placement detail ----------

test('personalisation detail exposes audited placements and the actual line fee', () => {
  const line = {
    id: 31630,
    variantId: sageVariant.id,
    size: 'UK08/S',
    qty: 2,
    price: 3990,
    fee: 1000,
    pers: {
      name: 'Ava',
      font: 'Script',
      color: 'Gold',
      placements: [{
        id: 'p1',
        label: 'Left chest',
        text: 'Ava',
        fontId: 'script',
        fontLabel: 'Script',
        colorId: 'gold',
        colorLabel: 'Gold',
        colorValue: '#c9a227',
      }],
    },
  };

  assert.deepEqual(personalisationSummary(line), {
    placements: [{ label: 'Left chest', text: 'Ava', meta: 'Script · Gold' }],
    legacy: '',
  });
  assert.equal(personalisationFee(line), 1000);
  assert.equal(personalisationFee({ ...line, fee: 0 }), 0);
  assert.equal(personalisationFee({ ...line, fee: 'not-a-number' }), 0);
});

test('legacy personalisation text remains readable when no placement list exists', () => {
  assert.deepEqual(personalisationSummary({
    pers: { name: 'Ava', font: 'Script', color: 'Gold' },
  }), {
    placements: [],
    legacy: 'Ava · Script · Gold',
  });
  assert.deepEqual(personalisationSummary({}), { placements: [], legacy: '' });
});

// ---------- honest checkout target ----------

test('checkout target is only the provided URL, never invented', () => {
  assert.equal(checkoutUrl(urls), '');
  assert.equal(checkoutUrl({ checkout: 'preview-checkout.html' }), 'preview-checkout.html');
  assert.equal(checkoutUrl({ checkout: '   ' }), '');
  assert.equal(checkoutUrl({}), '');
  assert.equal(checkoutUrl(null), '');
});

// ---------- stylesheet contract ----------

test('stylesheet keeps the closed guard, 480px side panel, mobile width and 35% backdrop', () => {
  const css = readFileSync(new URL('./cart-drawer.css', import.meta.url), 'utf8');
  assert.match(css, /dialog\.cart-drawer:not\(\[open\]\)\s*\{\s*display:\s*none/);
  assert.match(css, /width:\s*480px/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /@media \(max-width:\s*600px\)/);
  assert.match(css, /width:\s*100vw/);
  assert.match(css, /background:\s*rgba\(0,\s*0,\s*0,\s*0\.35\)/);
  assert.match(css, /\.cart-drawer-body\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /\.cart-drawer-qty-btn\s*\{[\s\S]*?width:\s*44px/);
});
