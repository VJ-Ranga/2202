# Olivia von Halle Reference and 2202 Demo UI Audit

Date: 2026-10-23
Scope: read-only live reference inspection and isolated-browser audit of `http://localhost:4173`.
Safety: no live purchase, cart, order, login, contact, newsletter, or tracking submission. No external image copied. Existing demo server left running.

## Evidence index

| Evidence | URL / file |
| --- | --- |
| Live reference PDP | `https://oliviavonhalle.com/products/coco-powder-blue-ivory-silk-pyjamas?country=LK` |
| Live initial PDP screenshot | `docs/evidence/ovh-coco-initial.png` |
| Demo presentation screenshot | `docs/evidence/demo-index-1440.png` |
| Demo search zero-result screenshot | `docs/evidence/demo-search-zero-1440.png` |
| Demo mobile search screenshot | `docs/evidence/demo-search-match-375.png` |
| Demo PDP screenshots | `docs/evidence/demo-pdp-atelier-375.png`, `demo-pdp-studio-375.png`, `demo-pdp-maison-375.png` |
| Demo personalisation screenshot | `docs/evidence/demo-pdp-personalisation-1440.png` |
| Demo route screenshots | `docs/evidence/demo-preview-1440.png`, `demo-collection-1440.png`, `demo-product-1440.png`, `demo-cart-1440.png`, `demo-wishlist-1440.png`, `demo-search-1440.png`, `demo-account-1440.png`, `demo-order-tracking-1440.png`, `demo-page-1440.png` |

Some route screenshots use same basename for different `page.html` slugs. DOM and URL evidence below identifies each page precisely.

## 1. Olivia von Halle live reference: observed, not inferred

Reference loaded successfully in isolated browser context. Product page title: `Coco Powder Blue Pyjamas in Silk Satin`. Currency switcher showed `Shipping: Sri Lanka (LKR)`.

### PDP structure

- Promotional banner contains rotating links: `Free worldwide shipping, returns & exchanges`, `U.S: faster domestic shipping & no duties`, `Shop the new collection`, newsletter, and men's capsule link. Close control exists.
- Header contains Olivia von Halle logo, search, account, cart, and menu controls.
- Gallery contains seven product image nodes, thumbnail links, and a 60/40-style commerce split: media first, product information second.
- Product information shows `New`, full product title, wishlist control, `Rs 249,900.00`, colour `Powder Blue`, colour links, size selector, personalisation trigger, `Add to Bag`, and `Free worldwide delivery and returns`.
- Product detail accordions: `Product Details`, `Care`, `Delivery & returns`, `Gift Packaging`.
- Related section is titled `YOU MAY LIKE` and displays related product cards.
- Breadcrumbs appear below the primary product area.
- Footer has three accordions: `About us`, `Customer care`, `Legal`; customer-care links include Shipping, Returns & EU Withdrawal, Size Guide, Personalisation, FAQ's, Care Guide, Contact.

### Personalisation launcher and sidebar

Initial state showed disabled `Add Personalisation` and `Please select a Size`. This is clear variant validation before customisation.

After selecting size `S`, `ADD PERSONALISATION` opened an isolated drawer. Observed drawer content:

- Title: `Make it your own`.
- Supporting copy: traditional hand embroidery; completion in `4-10 working days`.
- Location step: `Pocket`, `Neck`, `Hip Pocket`, `Cuff`, `Collar`.
- Supporting note: optional second location becomes available after first location.
- Inspiration copy covers pocket zodiac, collar mushroom/monogram, and cuff monogram examples.
- Hidden/available step labels in drawer markup: `Make It Yours`, `YOUR TEXT (UP TO 7 CHARACTERS)`, `CHOOSE FONT`, `CHOOSE COLOR`, `CHOOSE LOCATION`.
- Detail mode tabs: `Text Only`, `Symbol Only`, `Text + Symbol`.
- Symbol controls: `Add Symbol`, `Remove Symbol`.
- Summary contains first location plus `2nd Personalisation Optional`, edit/remove controls, and `I understand personalised orders are non-refundable`.
- Final drawer CTA reads `Add to Bag +Rs 0.00` in this captured product state.

Location selection was safe-click tested. Full progression through every live drawer step was not claimed: in this session, `Select Location` remained disabled after the first location interaction. No cart or bag action was invoked.

### Reference design translation

Use OVH as interaction reference, not asset source. Translate behavior only:

1. Size/variant choice gates personalisation.
2. Personalisation opens focused side panel, not an unrelated page jump.
3. One primary step is visible at a time, with optional second placement after first selection.
4. Summary states selections, non-returnable rule, fee, and final action before bag action.
5. Product page keeps typography and purchase controls readable at desktop and mobile.

## 2. Demo audit: click matrix

All demo checks ran in fresh Playwright browser contexts. Demo localStorage was isolated per run. No live commerce mutation occurred.

| Area | Click / keyboard path | Observed result | Evidence / URL | Status |
| --- | --- | --- | --- | --- |
| Header | Homepage, collection, PDP, cart, wishlist, search, account, tracking, info routes | Shared header renders. Main links preserve `concept` and `palette` query. | `http://localhost:4173/preview.html?concept=atelier&palette=mono` | Pass |
| Announcement | Inspect all audited routes for `Free Shipping for orders above Rs 5000` | Text absent on every demo route. | All listed demo URLs | P0 gap |
| Search initial | `/search.html?concept=atelier&palette=mono`, focus search input | Search input exists with aria label `Search styles`; initial catalog shows 116 styles. | `demo-search-1440.png` | Pass |
| Search query | Type `mocha`, press Enter | URL becomes `/search.html?q=mocha&concept=atelier&palette=mono`; three matching products render. | Search URL above; `demo-search-match-375.png` | Pass |
| Search zero | Type `zzzz-no-match`, press Enter | Zero-result message gives alternatives and `CLEAR SEARCH`. | `/search.html?q=zzzz-no-match&concept=atelier&palette=mono`; `demo-search-zero-1440.png` | Pass |
| Search mobile | 375px input, keyboard Enter | Query navigation works; document width stayed 360px inside 375px viewport. | `demo-search-match-375.png` | Pass |
| Wishlist add | PDP `Add to Wishlist` | `lc-wishlist` becomes `[31845]`; no external request. | `/product.html?id=31845&concept=atelier&palette=mono` | Pass |
| Wishlist remove | Click same wishlist control again | `lc-wishlist` becomes `[]`; empty page remains meaningful. | `/wishlist.html?concept=atelier&palette=mono` | Pass |
| Wishlist empty | Open wishlist after removal | `Wishlist · 0 styles`, `Your wishlist is empty`, browse CTA. | `demo-wishlist-1440.png` | Pass |
| PDP variant guard | Open Love Notes PDP before size selection | `Select a size` shown; add action is guarded. | `/product.html?id=31845&concept=atelier&palette=mono` | Pass |
| PDP variant | Select `UK08/S` | Selected state renders; add action becomes usable. | Same PDP URL | Pass |
| Demo add | Click `ADD TO BAG` after size choice | Local cart line created; PDP shows `ADDED` and `View bag`. | Same PDP URL | Pass |
| Cart quantity | Cart `+` control | Quantity 1 to 2; subtotal changes `Rs 3,990.00` to `Rs 7,980.00`. | `/cart.html?concept=atelier&palette=mono` | Pass |
| Cart refresh | Reload cart | Quantity and subtotal persist in `lc-cart`. | Same cart URL | Pass |
| Cart remove | `REMOVE` control | Empty cart state renders; `lc-cart` becomes `[]`. | `demo-cart-1440.png` | Pass |
| Cart checkout | Checkout control | Demo states checkout/payment unavailable; no external checkout invoked. | Cart URL | Pass / honest limitation |
| Account | Open account | No fake login form; copy says credentials are not requested or stored. | `/account.html?concept=atelier&palette=mono`; `demo-account-1440.png` | Pass |
| Tracking | Open tracking, inspect form only | Order number/email form exists; copy says preview cannot access live orders. No submit. | `/order-tracking.html?concept=atelier&palette=mono`; `demo-order-tracking-1440.png` | Pass / honest limitation |
| Contact | Open contact, inspect form only | First name, last name, email, message, and send button. Copy says form does not send. No submit. | `/page.html?slug=contact-us&concept=atelier&palette=mono` | Pass / honest limitation |
| Footer | Inspect all audited pages | Footer links point to actual local About, Contact, collection, cart, wishlist, tracking, account, and policy routes. Phone/email use `tel:` and `mailto:`. | Any audited demo URL | Pass |
| Policies | Open privacy, delivery, refund, terms | All four render non-empty pages. | `page.html?slug=privacy-policy`, `delivery-policy`, `refund-policy`, `terms-conditions` | Pass with content issue |
| Presentation product link | Index `Product details` | Link targets `product.html?id=1`; invalid product state is shown instead of real product. | `http://localhost:4173/index.html` | P1 bug |
| Presentation personalisation link | Index `Personalisation` | Link targets `customisation.html?...`; server returns 404 because file does not exist. | `http://localhost:4173/customisation.html?concept=atelier&palette=mono`; `demo-index-1440.png` | P0 bug |

## 3. Concrete demo findings

### P0 — broken presentation personalisation link

`http://localhost:4173/index.html` advertises `Personalisation`, but target `http://localhost:4173/customisation.html?concept=atelier&palette=mono` returns HTTP 404. This is a direct dead-end in client-facing entry navigation.

Fix target: existing eligible PDP customisation flow, or create a real route. Do not leave link pointing at missing file.

### P0 — source announcement missing site-wide

Source requirement is `Free Shipping for orders above Rs 5000`. Text was absent on homepage, collection, PDP, cart, wishlist, search, account, tracking, contact, and policy pages. This is not a visual preference; it is a missing shared header element.

### P1 — presentation product link points to invalid product

Index `Product details` points to `product.html?id=1`. Demo catalog uses real product IDs such as `31845`; `id=1` produces not-found behavior. Point presentation link at an existing product or label it as a not-found-state test.

### P1 — delivery copy conflicts with documented shipping configuration

Demo delivery page says `LKR 300 – LKR 350`. Existing project research records configured flat shipping as `Rs 400` below `Rs 5,000`, with free shipping at/above `Rs 5,000`. Client must choose one source of truth before launch. Do not silently change either value in this audit.

### P1 — PDP concept query changes header class, not PDP composition

At 1440px, Atelier, Studio, and Maison PDPs all render same product structure and geometry: shared `pd-page`, same product media/detail flow, same Barlow body face. Concept-specific header classes are `head-atelier`, `head-studio`, and `head-maison`, but PDP layout does not yet express three distinct product experiences. Proposed replacements are below.

### No failure found in tested commerce-safe demo controls

Search matching/zero states, wishlist add/remove/empty state, cart quantity/remove/refresh persistence, size guard, unavailable-size presentation, local variant add, contact/account/tracking honesty, footer routing, and policy rendering worked in isolated checks.

## 4. Three genuinely different PDP layout proposals

Shared contract for all concepts:

- Product data, variant rules, price, gallery assets, and customisation eligibility stay identical.
- Desktop keeps readable 16px minimum body/UI copy, variant controls on right, visible price and Add to Bag control.
- Mobile becomes one-column, retains 44px minimum controls, no horizontal overflow, and keeps Add to Bag reachable after variant selection.
- Gallery remains real local product media. No external images or copied OVH imagery.
- Personalisation uses existing audited six-product contract: max 10 characters, two placements, Rs 1,000 per quantity unit, one fee per unit, source-neutral `Navy` treatment.
- Details remain usable as accordions on mobile and keyboard-operable disclosures on desktop.

### Atelier — large two-column gallery

**Job:** let product photography and quiet product facts carry luxury impression.

- Desktop: 58% gallery / 42% sticky detail rail. Gallery uses two-column masonry-like media with first image spanning two rows; no carousel-first hero.
- Detail rail: breadcrumb, small category eyebrow, title, price, colour, size variants, size guide, personalisation trigger, quantity, Add to Bag, delivery note, accordions.
- Gallery interaction: thumbnails become a slim vertical index; click or keyboard focus scrolls gallery to image. Lightbox remains available.
- Personalisation: drawer opens from right over detail rail; background gallery remains visible but inert to keyboard.
- Typography: Bodoni Moda display only for title/short editorial label; Barlow 16px UI/body. Avoid script stand-in for production claims.
- Mobile: single image stack, then sticky bottom purchase bar; details follow first three images.

**Why:** directly translates brief's requested “big 2col gallery” into an image-led PDP without hiding purchase controls.

### Studio — commerce gallery with two-image first view

**Job:** reduce decision time and make variant selection obvious.

- Desktop: 50% gallery / 50% commerce panel. First viewport shows two equal 4:5 images side by side; remaining media sits in a horizontal thumbnail strip or two-up grid below.
- Commerce panel uses solid surface, compact breadcrumb, title, price, stock/availability, size selector, size guide, quantity, Add to Bag, and delivery/returns summary.
- Personalisation is inline expandable block directly below size selection, with progress labels: Placement, Text, Font, Colour, Review. No hidden full-page navigation.
- Related products appear after details, not competing with first-viewport CTA.
- Typography: Barlow for all UI and product title; Bodoni Moda reserved for section labels. Clear 16px minimum copy.
- Mobile: gallery first with swipe, commerce block immediately after; sticky Add to Bag appears only after valid size.

**Why:** strongest shopping-first option. It preserves two-image visual proof while keeping selections and price in one predictable panel.

### Maison — editorial full-bleed product story

**Job:** make product feel like house signature before asking for purchase.

- Desktop: first image full viewport-width, natural 4:5 crop contained in a tall editorial frame; title and price sit in a quiet overlay-safe copy zone or immediately below media, never over busy garment detail.
- Second and third images form alternating full-bleed editorial chapters with short material/craft copy. Purchase panel appears as a right-side sticky sheet once user reaches product facts.
- Product facts sheet contains size, size guide, colour, quantity, personalisation, delivery/returns, Add to Bag. Sheet stays open after variant choice and announces selected state.
- Accordion content becomes editorial chapters: `The piece`, `Care`, `Delivery & returns`, `Personalisation`. Keep semantic headings and disclosure controls.
- Typography: Bodoni Moda title and chapter headings with restrained italic use; Barlow 16px controls/body. No decorative type smaller than readable UI.
- Mobile: no full-screen forced panel; media stack first, then title/price, then purchase sheet as normal flow with sticky CTA.

**Why:** genuinely editorial, not merely Atelier with different font. Purchase controls remain explicit so visual drama does not become conversion friction.

## 5. Prioritised fix list

1. **P0:** remove or repair broken `customisation.html` presentation link.
2. **P0:** add shared announcement bar with exact source text, or mark source copy pending instead of silently omitting it.
3. **P1:** replace presentation `product.html?id=1` link with real product ID and verify screenshot entry.
4. **P1:** resolve delivery charge conflict (`LKR 300–350` vs configured `Rs 400`) with owner; update one canonical source only.
5. **P1:** choose PDP concept-specific structures: Atelier, Studio, Maison specs above. Current concept query alone is insufficient.
6. **P1:** align customisation UI closer to verified OVH behavior: focused side panel, explicit step state, second placement optional, summary, non-returnable text only if source contract says true. Current 2202 source contract says non-returnable is false; do not copy OVH non-refundable wording into 2202 without owner approval.
7. **P1:** keep static-demo boundaries visible on contact, account, tracking, checkout, and payment surfaces. Never show fake success or fake order state.
8. **P2:** add dedicated visual regression checks at 375, 768, and 1440 for all three PDP concepts after layout work.

## 6. Canonical expected behavior

### Static demo

- Every route loads without console errors and preserves `concept` and `palette` query parameters on internal links.
- Every shared page displays announcement behavior consistently once copy is approved.
- Search accepts keyboard input, updates URL query, renders match and zero-result states, and offers clear recovery.
- Wishlist remains browser-local only; add, remove, and empty states are honest.
- Cart remains browser-local only; quantity, remove, subtotal, and refresh persistence work. Checkout states clearly say unavailable.
- PDP blocks Add to Bag until valid variant exists. Personalisation blocks Add to Bag until required text, font, colour, and placement choices are valid.
- Personalisation fee is Rs 1,000 per quantity unit, once per unit, regardless of one or two placements.
- Contact form validates fields then shows “not sent” preview state. It never claims message delivery.
- Account page explains authentication unavailable. It never accepts or stores credentials.
- Tracking page explains no real order lookup. It never claims tracking success.
- Footer links resolve to real local information and policy pages. Contact tel/mailto links remain actual contact actions.

### Future live implementation

- Shopify customer accounts, orders, checkout, tracking, contact delivery, analytics, inventory, and payment integrations require real backend/app configuration.
- Static demo must not imply those integrations exist.
- Production acceptance requires live test environment and explicit authorization before any cart, checkout, order, login, or form submission test.
