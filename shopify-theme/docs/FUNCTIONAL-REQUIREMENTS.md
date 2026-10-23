# 2202 Love Colombo — Functional Requirements for HTML Demo and Shopify Theme

Date: 2026-10-22 (revised same day after evidence re-check)
Companion documents: `docs/PAGE-INVENTORY.md` (routes, IDs, element evidence), `PLAN.md` (phases, approval gates). Nothing below is client-approved; every current-state claim is either directly observed (**O**, with URL or source path), inferred from config (**I**), or unconfirmed (**U**). All priorities and Shopify mappings are proposals (**P**).

Method and boundaries: read-only GET of public pages at `http://localhost:8099/`, read-only WP-CLI/DB queries, and direct reading of plugin/theme source at `/home/vjranga/local/2202lovecolombo/wp-content/…`. No form submissions, no cart/order/login state, no secret/customer/order exports.

Priority scale (proposed, not approved): **P0** demo milestone cannot ship without · **P1** needed for a launch-quality demo · **P2** decision deferred / nice-to-have.

## 1. Global storefront functions

| # | Function | Current behavior (**O** with evidence) | HTML demo behavior (**P**) | Shopify mapping (**P**) | Decision / dependency |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Announcement marquee | `vj-marquee-banner` plugin renders scrolling "Free Shipping for orders above Rs 5000" site-wide (rendered class `vj-marquee-banner` on every fetched page) | CSS marquee bar with the same text until the offer is confirmed | Theme section (announcement bar) with editable text setting; ticker styling in CSS | Approve offer text and bar/ticker form. **P0** |
| 1.2 | Header rows | Row 1 (secondary): Home, Shop, About us, Contact us + cart entry (menu 101 "BLACK MAIN MENU"). Row 2 (main): 16 category links nested Tops (Blouse, T-Shirts, Hoodies/Jackets) and Bottoms (Pants, Skirts, Shorts) (menu 100). Rendered in `home.html` and menu list via `wp menu item list` | Recreate both rows, responsive | OS 2.0 Header section with two navigation blocks; submenus dropdown or (proposed) mega-menu blocks | Approve labels and sticky-on-scroll (main row only, per `whb_default_header` row params). **P0** |
| 1.3 | Search | Full-screen overlay search (`wd-display-full-screen`) with tabs "Search for posts" / "Search for products"; header-builder search element has `ajax = True`; results classes `wd-search-results`; `/` results archive reachable by `/?s=` and shows product cards | Products-only search overlay; suggestions filtered client-side from `data/products.json`; posts tab deferred (**P2**) | Native predictive search (Liquid `predictive_search` / predictive search API) scoped to products in theme settings | Scope decision: products-only recommended. **P0** |
| 1.4 | Cart entry → drawer | Header cart link with "0 items" badge; desktop shows subtotal "Rs. 0.00"; both cart element instances configured `position = side` in `whb_default_header` (ids `5u866sftq6yga790jxf3` style 2, `u6cx6mzhiof1qeysah9h` style 5) meaning a hidden-sidebar cart drawer. No drawer markup renders with an empty cart; drawer content loads on click — rendering with items **U** | Cart drawer with quantity +/-, remove, subtotal, "View cart", "Checkout"; plus `/cart/`-equivalent page with empty state | Cart drawer = custom drawer UI on Cart AJAX API (native); cart page = `templates/cart.json`. Checkout is Shopify-hosted and outside the theme | Approve drawer vs page-only. **P1** |
| 1.5 | Mobile menu + toolbar | Side-hidden mobile nav with full category tree + Wishlist, Compare, "Login / Register"; bottom toolbar `wd-toolbar` labeled Home, Shop, Wishlist, My account (`home.html`) | Same menu tree; wishlist/account destinations per the §4 decisions | Header/Footer sections in OS 2.0; toolbar sticky CSS | Toolbar and mobile menu are navigation foundations of the homepage milestone. **P0** |
| 1.6 | Scroll-to-top | Desktop scroll-to-top button (aria-label "Scroll to top button", `home.html`) | Same | Small JS + snippet. **P2** | — |
| 1.7 | Footer | Brand blurb; contact block equal to Contact page; "Footer Menu" (Home, Shop, Order Tracking, Contact us); "Quick Links" (Privacy Policy, Delivery Policy, Return & Refund Policy, Terms & Conditions); "Userfull Links" (typo; Cart, Checkout, Wishlist); "Top Categories" (Dresses, Tops, Skirts, Pj's); social icons Facebook, X, Instagram, YouTube, Pinterest; "© 2026 – 2202lovecolombo.com · Powered by Nihal Apparel" | Recreate; copy changes go to client review | Footer section rows with menu/link blocks; social links as theme settings | Approve typo fix ("Useful Links") and whether the "Powered by Nihal Apparel" credit stays. **P0** |
| 1.8 | Policy links | Four policy pages exist (IDs 29129, 29131, 29133, 29127 at `/privacy-policy/`, `/delivery/`, `/refund-policy/`, `/terms-conditions/`) and are linked from the footer | Delivered into the demo 2026-10-22 via `html-demo/assets/pages-data.json` (with the two editorial pages About/Contact and the full six-page set under `page.html?slug=…`; see `docs/PAGE-CONTENT.md`). Published copy rendered verbatim; the delivery-charge conflict stays flagged (`README.md` issue 1) | Shopify pages; URL redirect map needed at launch since slugs differ (`/delivery/` → likely `/pages/delivery-policy`) | Copy conflicts are surfaced to the client at review (Phase 4); delivery-policy demo key carries the `-policy` slug, WP permalink `/delivery/`; redirect planning at launch. **P0** (links), **P2** (rename decision) |
| 1.9 | Contact info | "435/20A, St. Joseph Estate, Dalugama, Kelaniya"; "Phone: +94773672202"; "Info@2202lovecolombo.com" (documented on `/contact-us/` ID 4439 and footer) | Same | Store settings + theme text | Confirm. **P0** |
| 1.10 | Fonts and colors | Barlow loaded site-wide as a locally hosted font (Woodmart `woodmart_local_google_fonts`); Roboto only inside Smart Slider 3 slide CSS. Footer bg `rgb(42,21,9)`; page-title band `rgb(65,35,17)`; widget-title color `rgb(31,18,11)`; WooCommerce email accent `#8a542f` (option `woocommerce_email_base_color`) | Barlow as primary face with sans-serif fallback; palette variables from the four observed values | `font_picker` first — availability of Barlow in the Shopify font library must be verified in the theme editor at build time (**U**); fallback = self-hosted Barlow woff2 shipped in theme assets with `@font-face` | Confirm final palette per the design-direction decision (PLAN §4). **P0** |
| 1.11 | Analytics | GA4 `G-P9HRGR5HXC` and Google Ads tag `GT-KVFV4QQK` injected by Google Site Kit; Meta pixel `781005558027554` via `facebook-for-woocommerce` (`fbevents.js` + `fbq`); all rendered in `home.html` | None in the demo preview | Google & Meta official Shopify integrations, or custom pixels under Shopify Customer Events | Merchant supplies final pixel IDs at Shopify setup. **P2** for demo; **P1** pre-launch |
| 1.12 | Consent banner | None observed on any inspected page (no banner markup; only `recaptcha-woo` script loads) | Not included in demo (**P2**) | Shopify privacy banner is a storefront privacy setting (Settings → Customer privacy config; banner renders across the storefront and checkout), not a checkout-only feature; plus app options | Business decision with owner;not a demo implementation obligation. **U** legal need |
| 1.13 | SEO metadata | Rank Math: Organization schema (name "2202 Love Colombo – Affordable Luxury Streetwear Made in Sri Lanka", logo 2), WebSite + `SearchAction`, Product/ItemPage schema with SKU, categories, 4 images, availability, LKR price on product pages | Keep meta title/description/canonical on demo pages | OS 2.0 templates with JSON-LD snippets (product schema is native); migration of any Rank Math meta at catalog migration | **P1**; redirect map at launch. **P2** |

## 2. Payments — exact current customer-facing labels

All enabled-gateway titles and descriptions read from WooCommerce options (**O**, `wp option get …`) and plugin source. Gateway availability is scoped to WooCommerce checkout (`/checkout/`; could not be observed rendered — **U**). Runtime gateway list from `WC()->payment_gateways()->get_available_payment_gateways()`: `cod, bacs, mintpay, payhere, darazbnpl`.

| Gateway (Woo id) | Enabled | Title shown to customer | Description shown | Source |
| --- | --- | --- | --- | --- |
| PayHere (`payhere`) | yes | **"Credit/Debit Cards"** | "You'll be redirected to PayHere to complete your purchase."; checkout banner image `uploads/2026/03/visa-scaled.png`; plugin text "PayHere — The eCommerce Payment Service Provider of Sri Lanka" | `woocommerce_payhere_settings`; `wp-content/plugins/payhere-payment-gateway/gateway/class-wcgatewaypayhere.php` |
| COD (`cod`) | yes | **"Cash on delivery (COD)"** | "Pay with cash upon delivery." | `woocommerce_cod_settings` |
| Koko BNPL (`darazbnpl`) | yes | **"Koko: Buy Now Pay Later"** | "Pay in 3 interest free installments with Koko." | `woocommerce_darazbnpl_settings`; `wp-content/plugins/3.0.4/index.php` |
| MintPay (`mintpay`) | yes | No title in settings — customer-facing label is the product-page installments block (§9) | "3 X or 6% Cashback with MintPay" pattern; hosted logo images from static.mintpay.lk | `woocommerce_mintpay_settings`; rendered markup |
| Direct bank transfer (`bacs`) | yes | **"Direct bank transfer"** | Instructions with Sinhala text incl. WhatsApp confirmation to +94773672202; `bank_name` empty in settings | `woocommerce_bacs_settings` |
| Local Bank Transfer gateway (`woocommerce_local_bank_transfer_settings`) | yes in DB | **"Bank Transfer"** | "Make your payment directly into our bank account."; Nations Trust Bank PLC, Kiribathgoda | Option exists but gateway id is absent from the runtime enabled-gateway list — likely stale/hidden (**U**) |
| WebXPay (`woocommerce_webxpay_settings`) | yes in DB | **"Visa / Master / Amex / Diners Club / Discover / China Union Pay / DFCC Wallet / Sampath Vishwa / eZcash / MCash / FriMi / UPay / Genie"** | Description "Visa / MasterCard" | Same — absent from runtime gateway list (**U**) |

Do not carry these titles into Shopify unreviewed. WooCommerce gateway plugins can not be assumed to work on Shopify: PayHere/Koko/MintPay require their own Ship provider integrations (official apps or checkout extensions) — verification with each provider is a launch gate (**U**). COD and bank transfer map to Shopify manual payment methods natively.

## 3. Shipping (current config, **O**)

Single shipping zone "Fast Shipping" limited to Sri Lanka (`LK`) with flat rate Rs 400 and free shipping (min Rs 5,000; also a second free-shipping instance requiring a coupon). Sources: `wp_woocommerce_shipping_zone_methods`, `woocommerce_flat_rate_1_settings`, `woocommerce_free_shipping_2_settings`, `woocommerce_free_shipping_4_settings`.

Conflict to resolve before demo copy sign-off (**U**): `/delivery/` (page 29131) states charges "LKR 300 – LKR 350" while DB has flat Rs 400, and "free delivery above LKR 5,000" matches the DB threshold. Proposed demo copy (**P**): flat Rs 400 below Rs 5,000, free at/above Rs 5,000 — pending owner confirmation, one source of truth.

Shopify mapping (**P**): one Sri Lanka shipping zone, flat rate + free-shipping threshold native; coupon-conditional free shipping via Shopify discounts — decide at launch.

## 4. Functions off the standard path

| Function | Current (**O** with source) | Demo (**P**) | Shopify mapping (**P**) | Decision / dependency |
| --- | --- | --- | --- | --- |
| Wishlist | Woodmart wishlist; `/wishlist/` (page 60) renders "This wishlist is empty…" empty state; "Add to wishlist" icon on cards and product page | Static per-browser wishlist (localStorage) or clear placeholder | No native Shopify wishlist; logged-in persistence requires an app or a custom authenticated backend — theme-only browser code with customer metafields is not a workable persistence path | Owner decision + app budget. **P1** |
| Compare | Woodmart compare; `/compare/` (page 45) empty state "Compare list is empty…" | Static modal comparing selected items | Same app-required persistence class as the wishlist | Owner decision. **P2** |
| Quick view | `wd-quick-view-btn` icons on cards (38 rendered occurrences on `/shop/`), Magnific popup (`wd-mfp-popup` CSS part) | Modal preview with size selector + product link | Custom drawer/dialog section or app; keep/drop decision | Owner decision. **P1** |
| Order tracking | WooCommerce order tracking page (ID 29021): Order ID + Billing email + Track | Non-functional demo link with clear message | No theme-native equivalent; order status pages exist per order; lookup pages come from tracking apps (**U** choice and cost) | Owner approves tracking solution. **P1** |
| Customer accounts | Login only (registration disabled `no`, option `woocommerce_enable_myaccount_registration`); "Remember me", "Lost your password?" | Placeholder screen marked non-functional | Shopify hosted customer accounts (classic or new); signup toggle separate from theme | Ask owner whether Shopify accounts should be enabled. **P1** |
| Product personalisation | Plugin `wc-personalisation-panel` 0.7.31 (`wp-content/plugins/wc-personalisation-panel/`). Rendered "Add Personalisation" button on products in "Personalised Pyjama" category (verified on `/product/sage-dream-pj-set/`; absent on Love Notes). Config (option `wcpp_settings`): button "Add Personalisation", then panel options. One personalisation set, post ID 30537, title "pyjama set", assigned to term 110 "Personalised Pyjama", priority 10: two placements — "Pocket Hem" (image `2026/06/Love-Colombo2303.webp`) and "Pocket" (`Pocket2.jpeg`) — each with three steps: Add Text (free text, max 10 chars), Select Font (Freestyle Script, Edwardian Script ITC), Select Colour (colors: off white/Black/White for Pocket Hem; Navy/Black/White for Pocket; every choice priced Rs 0.00). Pricing: `set_price = 1000.00` with fee type `unit` — Rs 1,000.00 added to the line-item unit price via cart price recalculation (`class-price-calculator.php` adds `total_price` to `base_price`); per-choice prices would also aggregate into `total_price` but are all zero today. `behaviour.success_message` = "Artwork preview sent via WhatsApp or email for approval before production"; `non_returnable = 0` (disabled in config although README documents a notice feature). Drawer flow itself not exercised (**U**) | Either accurate static wizard sample with consistent totals, or clearly marked omitted feature | Line-item properties alone cannot change cart price; adding the Rs 1,000 personalisation add-on on Shopify needs an options/fee app or a Shopify Function (pricing function). Function is one possible implementation, not a blanket pricing solution for arbitrary staff | Owner decision + scope. **P1** |
| Coupons | `woocommerce_enable_coupons = yes`; code entry at cart/checkout | Optional coupon field in demo | Shopify discount codes native; checkout field is hosted | **P2** |
| Guest checkout | `woocommerce_enable_guest_checkout = yes` | n/a | Shopify checkout allows guest by default | n/a |
| Newsletter | None observed on any page (0 occurrences) | Not invented | Shopify Email or marketing app | **P2** |

## 5. Collection / shop page functions

Current (**O** on `/shop/` and category archives): result count "Showing 1–12 of 116 results" (`woocommerce-result-count`); sort options Popularity, Average rating, Newness, Price: low to high, Price: high to low; sidebar widgets in order Sort by, Top rated products, Filter by price (slider + range links), Filter by size (attribute `pa_size`, swatch links with counts UK06/XS 89, UK08/S 112, UK10/M 112, UK12/L 112, UK14/XL 112, UK16/2XL 53; query `?filter_size=…`), Stock status (On sale, In stock), Price filter links; "Load more products" AJAX button plus `page/N` pagination links; `woodmart-ajax-shop-on` body class (AJAX layered navigation); off-canvas mobile filter drawer (`opt-shop-off-canvas-sidebar` CSS part); grid `grid-columns-4`, 12 per page.

Stale configurations to NOT carry over (**O**): a "Filter by color" widget whose attribute `pa_color` no longer exists, and "Filter by Brand" widgets against empty `product_brand` taxonomy (rebuild only if the merchant wants these attributes re-imported as Shopify options/metafields).

HTML demo (**P**): client-side filtering over `data/products.json` (size, price, stock, sort), load-more at 12-per-page increments, mobile filter drawer, empty-filter-result state with clear-filters CTA.

Shopify mapping (**P**): built-in collection filtering (`facets` for size as product option or metafield, price range, availability) and native sorting; load-more via theme pagination pattern; per-page via `paginate` settings in the template.

### Product cards

Per-card content observed on `/shop/` (**O**): lazy first image with hover second-image swap (`hover-img` markup, 12 occurrences on the page); hover action set Quick view / Compare / Add to wishlist (`wd-quick-view-btn`, `wd-compare-btn`, plus add-to-cart icon `class="wd-add-btn wd-action-btn wd-style-icon wd-add-cart-icon"`, 12 occurrences); category line + name + price; sale strikethrough formatting ("Original price was… Current price is…"; one `onsale` badge rendered on the sampled shop page); sold-out card label ("Sold out" badge class); MintPay/Koko installment line (§9); tooltip "This product has multiple variants. The options may be chosen on the product page" on variable cards.

## 6. Product-page functions (full element inventory in PAGE-INVENTORY §5)

| Function | Current (**O**) | Shopify mapping (**P**) | Decision |
| --- | --- | --- | --- |
| Gallery + lightbox | Thumb rail + main swiper; PhotoSwipe lightbox CSS; lazy `srcset` | Media gallery section + lightbox | **P0** |
| Size variations (6) and per-variant stock | `data-product_variations` with per-variant availability pills; backorders disabled; stock at variant level (94 in / 22 out of stock across 116 products) | Native variants — `pa_size` becomes the variant option; per-variant stock via `variant.available`; keep no-backorder behavior | **P0** |
| Quantity control | −/+ buttons with aria labels; min 1 | Theme quantity input | **P0** |
| Add to cart | Form posts; "Add to cart" button | Cart AJAX API | **P0** |
| Buy now | "Buy now" button (renders twice: form + sticky bar CTA) | Shopify dynamic checkout button (`payment_button` / accelerated checkout), NOT an arbitrary `/checkout` URL; behavior configurable per checkout settings | Confirm whether to keep a single button in demo. **P1** |
| Missing size selection guard | Sticky CTA reads "Select options" while unchosen; tooltip present | Proceed disabled + "select size" hint per PLAN acceptance criteria | **P0** |
| Size guide | Button + modal; per-product guide via postmeta `woodmart_sguide_select` (Love Notes → post 29317 chart, table verbatim in PAGE-INVENTORY §5); guide tab body empty on that product | Map guide to a page/metafield; render button + modal in the product section | **P1** (confirm XXL typo first) |
| Estimated delivery | "October 24, 2026 – October 28, 2026" from Woodmart estimate rules post 29135 (min 2 / max 5 working days, Sundays excluded) on product, mini-cart, cart, checkout, order, and emails | Rebuild as a rule-driven snippet with documented rules; only if owner confirms window | **P1** |
| Tabs (Description / Additional information / Size Guide) | Standard three tabs (`tab-item-title-*`) | Product section blocks: description, specifications, size-guide page reference | **P0** |
| SKU / categories / share | Meta row + Share icons (Facebook, X, Pinterest, LinkedIn, Telegram) | Native meta + share links | **P1** |
| Reviews | `woocommerce_enable_reviews = yes`; no review markup or star ratings rendered on sampled pages; JSON-LD on product pages contains no aggregateRating | Do not fabricate; only an app if merchant supplies data | **P2** |
| Sold / visitors counters | "Items sold in last month: 16"; "15 People watching this product now!" — theme option `xts-woodmart-options` sets `counter_visitor_data_source = "fake_data"`, `sold_counter_sales_type = "fake_data"`, both on min 10 – max 20 (`wp-content/themes/woodmart/inc/integrations/woocommerce/modules/counter-visitors/class-main.php` uses `wp_rand`); i.e., configured display values rather than verified analytics | Decision: keep as settings-driven widget, re-source from Shopify analytics/app, or drop | PLAN rule: no fabricated live claims; owner must approve source. **P1** |
| Sticky add-to-cart | Bottom sticky bar (`btn btn-accent wd-sticky-add-to-cart`) | Theme snippet | **P1** |
| Personalisation trigger | per §4 | per §4 | **P1** |
| Related products | Related products grid after tabs | Product Recommendations API (`/recommendations/products`) or `product_recommendations` Liquid on the product template — the home page recommendations endpoint is dynamic, not a static "same collection" list | **P0** |

## 7. Forms and notifications

| Form | Current (**O**) | Shopify mapping (**P**) | Decision |
| --- | --- | --- | --- |
| Contact form | Fluent Form 1 on `/contact-us/` (page 4439): First Name, Last Name, Email, Your Message, Submit; reCAPTCHA v3 loaded via `recaptcha-woo`; Fluent SMTP in the stack | Shopify native contact template (name/email/body, custom field options; Shopify handles spam protection) | Approve field list and whether to keep the address/phone/email block. **P0** |
| Order tracking | Order ID + Billing email + Track button (page 29021) | Tracking app or order-status link (see §4) | **P1** |

## 8. State matrix (per PLAN acceptance criteria; demo requirements all **P**)

| State | Where | Current (**O**) | Demo requirement | Priority |
| --- | --- | --- | --- | --- |
| Empty cart | `/cart/` (13) | "Your cart is currently empty… Return to shop" | Same intent, Shopify wording | **P0** |
| Empty wishlist / compare | `/wishlist/` (60), `/compare/` (45) | "This wishlist is empty…", "Compare list is empty…" | Keep if features kept | **P1** (follows §4 decisions) |
| Empty search results | `/` overlay; `/` = archive | No results panel rendered by Woodmart | Products-only no-result state with suggested alternatives | **P1** |
| No filter matches | `/shop/` filters | Not directly exercised; widget action configured | Clear-filters CTA + zero-count message | **P1** |
| 404 | Any bad URL | 301 → homepage; no 404 template (PAGE-INVENTORY §7) | Dedicated 404 template in demo | **P2** |
| Loading | images/lists | Litespeed lazy images + `lazyloadRunObserver`; Woodmart AJAX spinners | Skeleton/spinner states | **P1** |
| Sold out | cards + variations | "Sold out" card badge; per-variation "In stock" pill; 22 of 116 products out of stock | Grayed-out swatch, disabled CTA, label | **P0** |
| Missing size selection | sticky CTA reads "Select options" | "This product has multiple variants. The options may be chosen on the product page" tooltip | Disabled CTA + select-size hint | **P0** |
| Accessibility | everywhere | aria-labels on quantity +/-, product quantity input, search, toolbar, scroll-to-top; screen-reader price spans; `role="complementary"`/`navigation` regions | Keyboard-reachable menus/modals/drawer, visible focus, contrast vs dark palette, alt text for reused images | **P0** (375 / 768 / 1440 per PLAN) |
| Checkout guard | `/checkout/` | 302 → cart when empty | Explicit empty-cart state instead of silent redirect | **P0** |

## 9. Verbatim copy captured (reused in the demo only after client approval)

- Announcement: **"Free Shipping for orders above Rs 5000"** (`vj-marquee-banner` track, all pages).
- Installments line (product page 18 px `product-price-installments-not-in-variation-single`; product cards 13 px `…-not-in-variation`): `3 X <b>Rs. 1,330.00</b> or <b>6%</b> Cashback with` [MintPay logo `https://static.mintpay.lk/static/base/logo/mintpay-pill.png`, alt `mintpay_logo_woocommerce`] + info icon linking `https://mintpay.lk/education?price=…&cashback=600`; cards continue `or 3 X <b>Rs.1,330.00</b> with` [Koko logo `https://paykoko.com/img/logo1.7ff549c0.png`, alt `Koko` + info icon].
- Displayed installment amount matches price ÷ 3 for the sampled cards (Rs. 3,990.00 → 1,330.00; Rs. 2,490.00 → 830.00; Rs. 2,290.00 → 763.33; Rs. 3,790.00 → 1,263.33; Rs. 4,490.00 → 1,496.67; Rs. 2,790.00 → 930.00). One on-sale card ("Hot Pink Velvet Hoodie and Track Pants Set": original Rs. 5,990.00, sale Rs. 3,490.00) still displayed "3 X Rs. 1,330.00" which matches neither price ÷ 3 — stale or miscomputed rendering on that card (**U**; verify rule before demo pricing copy).
- Behavioral strings: "Estimated delivery: <date range>"; "Items sold in last month"; "People watching this product now!"; cart/wishlist/compare empty messages; "This product has multiple variants. The options may be chosen on the product page"; personalisation success message "Artwork preview sent via WhatsApp or email for approval before production".

## 10. Priority summary (proposed; normalizes the tiers named in §1–§8)

- **P0** (homepage milestone per PLAN §5): announcement bar, both header rows, main category nav, search entry, cart entry, hero slider (PC and mobile imagery), three product rows, middle banner image, footer, mobile menu + bottom toolbar; responsive at 375/768/1440; shared component decisions (fonts, palette tests).
- **P0** (full review demo): product card pattern with sale/sold-out labels; collection page (filters, sort, load-more, empty state); product page (gallery, size selection with per-variant stock, add-to-cart, missing-size guard, tabs, quantity); cart drawer/page with quantities and totals and empty state; info-page template for About/Contact/Delivery/Return/Privacy/Terms; accessibility criteria per §8.
- **P1** (owner decision required because these are visible consumer features today): quick view, wishlist, related-products recommendations source, size guide content sourcing, estimated delivery rules, sticky add-to-cart, sold/visitors counter data source, personalisation drawer, order-tracking destination, customer accounts registration, cart drawer vs page, Buy-now mapping, app choices for wishlist/compare/tracking/personalisation, Koko/MintPay display rules retained.
- **P2** (deferred until owner input): posts scope in search, compare feature itself, coupon field, newsletter, 404 template, scroll-to-top on mobile, review infrastructure, consent banner, analytics IDs beyond demo.

## 11. Unknowns and verification list

1. PayHere / Koko / MintPay Shopify production availability for this merchant — gate for checkout planning (**U**).
2. Rendered checkout layout and exact gateway label order with a filled cart (**U**; forbidden during discovery).
3. Cart drawer content rendering with items (config says side cart; not observed) (**U**).
4. Purpose of the coupon-requirement free-shipping instance and any promo codes in circulation (**U**).
5. Whether "Bank Transfer" and "WebXPay" gateways show in checkout (in DB yes, absent from the runtime enabled-gateway list) (**U**).
6. Intended composition of the NEW ARRIVALS / Women's Collection / New PJ Collection rows; at inspection all sampled first 12 products were identical (**U**).
7. Grid columns and per-page count across breakpoints (4-col/12 on desktop verified; tablet/mobile unverified) (**U**).
8. `bags` category shows zero products — intentional or pending (**U**).
9. Personalisation set pricing policy: Rs 1,000/unit configured with zero-cost steps and a "sent via WhatsApp" fulfillment message — confirm whether exact figure/flow is final (**U**; flow not exercised).
10. XXL size chart typo ("16 - 28") (**U**).
11. Whether Shopify customer account registration should be enabled (currently off in WooCommerce) (**U**).
12. Whether Barlow is available in the Shopify font picker, or whether the theme must self-host Barlow woff2 (**U**; verify at build).
