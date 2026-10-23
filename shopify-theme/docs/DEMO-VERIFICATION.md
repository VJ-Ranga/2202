# 2202 Love Colombo — Demo Verification Report

Date: 2026-10-23
Status: Ready for client review.

## Scope

Verified static multipage demo in `html-demo/`. Demo server runs from `html-demo/`:

```bash
python3 scripts/serve-demo.py --port 4173 --bind 0.0.0.0
```

Review entry points:

- `http://localhost:4173/index.html` — six-link chooser index.
- `http://localhost:4173/preview.html?concept=atelier&palette=mono` — homepage preview.
- `preview.html` accepts `atelier|studio|maison` and `mono|brown`.
- Separate destinations: `collection.html`, `product.html`, `cart.html`, `wishlist.html`, `search.html`, `page.html`, `account.html`, and `order-tracking.html`.
- Internal links preserve `concept` and `palette` query parameters.

## Automated checks

Command:

```bash
node --test store.test.mjs
for f in app.js core.js pages.js boot.js store.mjs; do node --check "$f"; done
```

Result: 65 store tests passed; zero failures, cancellations, or skips. All owned and customization JavaScript modules passed syntax checks.

- Cache headers verified: HTML responses send `Cache-Control: no-store, max-age=0`, `Pragma: no-cache`, `Expires: 0`, and `Clear-Site-Data: "cache"`; static JS/CSS send no-store headers without clearing storage.

## Isolated browser checks

Browser checks used fresh Playwright contexts, separate from any existing browser page.

- Six homepage combinations tested at 375, 768, and 1440 px.
- Studio homepage uses three source-owned campaign slides: The Ribbed Edit → `ribbed`, Sleep In Style → `pjs`, and Satin Scrunchies → `scrunchies`.
- Studio campaign slider uses matching 1000×900 mobile sources for Ribbed and Sleep In Style. Scrunchies uses uncropped desktop source on mobile because no matching mobile source exists; baked copy and subjects remain intact.
- Campaign controls sit below banners. No autoplay or duplicate overlay copy. Keyboard arrows and pointer swipe cycle `1 / 3`, `2 / 3`, `3 / 3`; inactive slides are `aria-hidden` and inert.
- Studio campaign desktop ratio measured `2.742857`; Ribbed and Sleep mobile ratio measured `1.111111`; no campaign image 404s. Studio header is solid, sticky, and measured 82px desktop / 64px mobile above banner.
- Four primary navigation links rendered on desktop: Dresses, Tops, PJ’s, Sale. Hamburger exposes full ten-category navigation and children.
- No horizontal overflow at tested widths.
- Desktop header measured 82px; mobile header measured 64px. Fresh bounds checks found 0px logo-center delta, no logo/link/util/menu intersections, four exact desktop nav labels, nav group inside header, and no horizontal overflow across Atelier, Studio, and Maison at 1440px and 375px.
- Collection grid measured 319px cards at 1440px with no permanent sidebar. Default collection ordering is newest-first using descending source import IDs; first products are current PJ styles.
- PDP measured 60/40 image/detail columns, 44px options, 52px Add to Bag, and 16px description copy. Product media uses natural 4:5 framing; 1440px frame and source image ratios both measured 0.800 with 0px top letterbox.
- No broken local images and zero console errors. Source Pocket `Navy` label/value mismatch (`#e7e5d6`) remains documented pending artwork colour confirmation; no invented colour value is shown.
- Top navigation opened a separate collection document with canonical `?category=...` URL.
- New-arrivals collection rendered full catalog with newest sorting.
- Collection size filter updated URL and result state.
- Search returned matching catalog results.
- PDP unavailable options were disabled.
- PDP selected variant showed its own source price before add-to-bag.
- Colour-variant product added successfully.
- Simple product added without size selection.
- Cart retained variant and one-size lines, rendered subtotal, and persisted local state. Fresh personalisation flow verified Pocket Amara / Freestyle / Black plus Pocket Hem Zoe / Edwardian / White, UK12/L, quantity 2: `Rs 10,980.00` subtotal with one `Rs 1,000` fee per unit.
- Invalid product ID rendered not-found state without fake product.
- Wishlist add/remove updated page state.
- Mobile menu opened and closed with Escape. Scoped drawer redesign verified at 375px and 1440px: fixed left panel, full viewport height, 20px category rows, 16px support/sub-links, 44px close control, sticky header, one internal scroll region, red Sale, and all links preserving concept/palette query parameters. Background scroll stayed at `220px` during wheel input and restored after close.
- Six information routes rendered non-empty content: About, Contact, Privacy, Delivery, Refund, Terms.
- Fresh QA screenshots captured at `/tmp/2202-collection-1440-campaign-final.png`, `/tmp/2202-collection-375-campaign-final.png`, `/tmp/2202-pdp-1440-campaign-final.png`, `/tmp/2202-pdp-375-campaign-final.png`, `/tmp/2202-studio-1440-campaign.png`, and `/tmp/2202-studio-375-campaign.png`.
- Menu screenshots captured at `/tmp/2202-menu-375-fixed.png` and `/tmp/2202-menu-1440-fixed.png`.

## Independent coordinating-agent verification

The coordinating agent independently confirmed through browser interactions and terminal checks:

- Homepage product card navigates to `/product.html?id=31845`.
- `UK08/S` selection and add-to-cart work.
- Cart subtotal renders `Rs 3,990.00`.
- Dresses collection initially renders 12 product cards.
- No product modals appear.
- Delivery Policy renders its title and non-empty policy content.
- Mobile PDP at 375 px has no horizontal overflow.
- Node test suite passes 65 tests.

## Honest static-demo limits

- Checkout and payment are unavailable.
- Account backend and customer authentication are unavailable.
- Order tracking does not query real orders.
- Contact form performs client validation and shows message-not-sent preview state.
- Shopify theme conversion, backend checkout, inventory synchronization, and customer accounts remain future work after client approval.

WordPress source at `/home/vjranga/local/2202lovecolombo` was not modified. Partial frontend files from interrupted prior work were preserved and completed; no abort-specific error log was available.
