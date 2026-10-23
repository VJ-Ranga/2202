# 2202 Love Colombo — Evidence-Based Page and Navigation Inventory

Date: 2026-10-22 (report revised after evidence re-check, same day)
Source: local WordPress installation `/home/vjranga/local/2202lovecolombo`, served at `http://localhost:8099/`. Permalinks `/%postname%/` (option `permalink_structure`), so page slugs below are canonical.
Method: read-only HTTP GET of public pages (curl), read-only WP-CLI/DB queries (`wp post list`, `wp term list`, `wp menu item list`, `wp option get`, SELECT-only `wp db query`, re-run to verify where cited), and direct reading of plugin/theme source. No forms submitted, no cart/checkout/login state created, no customer/order/private data exported.

Evidence markers: **O** = directly observed (rendered HTML, DB value, or source file, path cited) · **I** = inferred from config but not verified in a rendered flow · **U** = unconfirmed, verify before demo/Shopify build · **P** = proposed here, not client-approved.

## 1. Platform facts (source stack) — all **O**

| Component | Version / detail | Evidence (source path or command) |
| --- | --- | --- |
| WordPress | 7.1.3 | `wp core version` |
| WooCommerce | 11.2.0; currency LKR; prices rendered as `Rs.` prefix, thousands separator `,`, 2 decimals (`woocommerce_currency_pos = left`) | `wp plugin list`; `wp option get woocommerce_currency*`; rendered price markup `woocommerce-Price-currencySymbol` |
| Active theme | Woodmart Child 1.0.0 on Woodmart 8.4.1 | `wp theme list` |
| Announcement marquee | `vj-marquee-banner` 1.2.1 | `wp plugin list`; rendered class `vj-marquee-banner` on every fetched page |
| Payment plugins | `payhere-payment-gateway` 2.4.5, `mintpay` 2.2.3, `paykoko` (plugin folder `3.0.4`, Plugin Name: Paykoko — Koko BNPL) | `wp plugin list`; `wp-content/plugins/3.0.4/index.php` |
| Other active commerce plugins | `facebook-for-woocommerce` 3.7.6, `recaptcha-woo` 1.4.7, `wc-personalisation-panel` 0.7.31, `woocommerce-analytics` 0.9.16 | `wp plugin list`; `wp-content/plugins/wc-personalisation-panel/wc-personalisation-panel.php` |
| Marketing/SEO | `google-site-kit` 1.189.0, `seo-by-rank-math` 1.0.280 | `wp plugin list`; rendered `@context` JSON-LD |
| Page builders | `elementor` 4.3.4 (homepage body class `elementor-page-1038`), `smart-slider-3` 3.5.1.39 (hero markup `n2-ss-*`) | rendered homepage HTML |
| Catalog size | 116 published products, 597 published variations, 94 in stock / 22 out of stock | SELECT COUNT on `wp_posts` (post_type product/product_variation) and grouped `_stock_status` |
| Blog | Zero posts (0 rows in `wp_posts` post_type `post`) | `wp post list --post_type=post` |

## 2. Public routes (canonical URLs and WP IDs) — all **O** (fetched HTTP 200 on 2026-10-22 unless stated)

| Canonical URL | WP ID / type | Purpose and observed content that must survive in the demo | Notes |
| --- | --- | --- | --- |
| `http://localhost:8099/` | 1038, page (`home-fashion-flat`; `show_on_front = page`, `page_on_front = 1038`) | Marquee announcement; 3-row header; Smart Slider 3 hero with separate PC and mobile banner imagery (`wp-content/uploads/2026/03/WEB-BANNER-PC-2-1.jpg`, `WEB-BANNER-PC-1920-X-700.png`, `WEB-BANNER-PC-3.png`, `2026/03/WEB-BANNER-MOBILE-2.png`, `2026/03/WEB-BANNER-MOBILE.jpg`, `2025/07/WEB-BANNER-SLIDE.png`, `2025/07/MOBILE-PJ-1000-x-900-px.png`); middle banner `2025/07/MIDDLE-BANNER.png`; product carousels headed **NEW ARRIVALS**, **Women's Collection**, **New PJ Collection** (12 cards each; the sampled first 12 products were identical across the three — see Unknowns) | Homepage is the WP front page, not a separate "published homepage" route |
| `/shop/` | 47, page (`woocommerce_shop_page_id=47`) | H1 "Shop"; "Showing 1–12 of 116 results"; sort menu; sidebar widgets Sort by / Top rated products / Filter by price (slider) / Filter by size (swatch links with counts) / Stock status (On sale, In stock) / Price filter links; "Load more products" AJAX button (`pagination-more-btn`; `grid-columns-4`); product cards with hover second image, quick view, wishlist, compare, add-to-cart icon, sale and sold-out labels | |
| `/product/love-notes-pj-set/` | 31845, product | Full product-page inventory: §5 | |
| `/product/sage-dream-pj-set/` | 31630, product | Product in "Personalised Pyjama" category; "Add Personalisation" button present | — |
| `/product-category/{slug}/` e.g. `/product-category/dresses/`, `/product-category/tops/`, `/product-category/sale/`, `/product-category/bags/`, `/product-category/ribbed/` | term IDs in DB | Same shop grid + filters as `/shop/`; category description renders only for categories that have one: **ribbed** ("Our signature ribbed pieces designed for comfort and effortless style.", 72 chars) and **denim** ("Love Denim Collection", 21 chars); all other product_cat descriptions are empty | Empty category: `bags` has 0 products |
| `/cart/` | 13 | Empty cart message "Your cart is currently empty… Return to shop" | Cart-with-items view not observed (**U**; adding items was out of scope) |
| `/checkout/` | 14 | Redirects (HTTP 302) to cart when cart is empty | Filled-checkout layout **U** |
| `/my-account/` | 15 | Login form: Username or email address, Password, Log in, Lost your password?, Remember me. Registration disabled (`woocommerce_enable_myaccount_registration = no`) | Register endpoint `/my-account/register/` returns 301 |
| `/wishlist/` | 60 | Woodmart wishlist, rendered empty state "This wishlist is empty…" | Shopify needs app/company-built backend see FUNCTIONAL-REQUIREMENTS §4 |
| `/compare/` | 45 | Woodmart compare, empty state "Compare list is empty…" | Same caveat |
| `/order-tracking/` | 29021 | WooCommerce order tracking form: Order ID + Billing email + Track button | WooCommerce consumer page; no theme-level Shopify equivalent — see FUNCTIONAL-REQUIREMENTS §4 |
| `/about-us/` | 4400 | Brand story: "Founded in 2020… state-of-the-art garment factory… Uniquely Limited Pieces" | |
| `/contact-us/` | 4439 | Address "435/20A, St. Joseph Estate, Dalugama, Kelaniya"; "Phone: +94773672202"; "Info@2202lovecolombo.com"; Fluent Form 1 (First Name, Last Name, Email, Your Message, Submit) with Google reCAPTCHA (`https://www.google.com/recaptcha/api.js?render=explicit`) | |
| `/delivery/` | 29131, "Delivery Policy" | Sri Lanka-only delivery; charges stated "LKR 300 – LKR 350"; free delivery above LKR 5,000; processing 1–2 working days; Colombo 1–3 working days; slug is `/delivery/`, not `/delivery-policy/` | Copy conflicts with DB shipping config (see FUNCTIONAL-REQUIREMENTS §3) |
| `/refund-policy/` | 29133, "Return & Refund Policy" | Exchanges within 7 days; unused/unwashed with tags; sale items non-exchangeable | |
| `/privacy-policy/` | 29129 | Data collected, payment security statements | |
| `/terms-conditions/` | 29127 | 18+ statement, availability and pricing disclaimers | |
| `/blog/` | 38 (`page_for_posts = 38`) | "Nothing Found" — zero posts exist | Placeholder page for future content |

## 3. Navigation — all **O** unless noted

- WP nav menus: **100 "CATAGORIES"** assigned to WP locations `main-menu` and `mobile-menu` (`wp theme mod list`); **101 "BLACK MAIN MENU"** (Home, Shop, About us, Contact us — Home added 2026) rendered in the secondary header row via Woodmart header builder config `whb_default_header` (menu_id `black-main-menu` in that serialized option); **103 "CATA"** is a registered duplicate categories menu with no WP location and is not rendered on public pages (**I**).
- Header row 1 (secondary/top): Home, Shop, About us, Contact us + cart entry.
- Header row 2 (main): 16 category links with nesting — Tops (Blouse, T-Shirts, Hoodies/Jackets), Bottoms (Pants, Skirts, Shorts), plus Dresses, PJ's, DENIM, Sets, RIBBED SERIES, Sale, Bags, Scrunchies. Rows render from menus 101/100 respectively.
- Cart element: desktop instance style 2 ("Icon with subtotal" family), mobile instance style 5; both configured with `position = side` in `whb_default_header` (element ids `5u866sftq6yga790jxf3` and `u6cx6mzhiof1qeysah9h`), i.e. a hidden-sidebar cart drawer. With an empty cart no drawer markup is rendered; drawer content loads on click (**U** rendering, config **O**).
- Search: full-screen overlay (`wd-display-full-screen`), AJAX enabled (`ajax = True` in `whb_default_header` search element `duljtjrl87kj7pmuut6b`), with two scope tabs "Search for posts" and "Search for products" (rendered markup).
- Header rows sticky config: top-bar row `sticky = false`, main row `sticky = true`, mobile row `sticky = false` per `whb_default_header` row params; rendered classes `whb-sticky`/`wd-header-sticky` match this (**O**).
- Mobile: hamburger → side-hidden mobile nav with the category tree + Wishlist, Compare, "Login / Register"; bottom sticky toolbar `wd-toolbar` with labeled items Home | Shop | Wishlist | My account; scroll-to-top button (aria-label "Scroll to top button"); footer socials Facebook, X, Instagram, YouTube, Pinterest.
- Footer: brand blurb; contact block (address/phone/email as Contact page); "Footer Menu" (Home, Shop, Order Tracking, Contact us); "Quick Links" (Privacy Policy, Delivery Policy, Return & Refund Policy, Terms & Conditions); "Userfull Links" (sic — existing typo; Cart, Checkout, Wishlist); "Top Categories" (Dresses, Tops, Skirts, Pj's); "© 2026 – 2202lovecolombo.com · Powered by Nihal Apparel".

## 4. Catalog data (for demo `data/products.json` scope) — **O** via WP-CLI

Category counts (`wp term list product_cat`,`count`): PJ's 43, Sale 42, RIBBED SERIES 27, Tops 33, Sets 31, Bottoms 26, Dresses 18, Blouse 17, T-Shirts 14, Pants 12, DENIM 9, Skirts 9, Hoodies/Jackets 8, Shorts 6, Personalised Pyjama 6, Scrunchies 4, Bags 0. (Counts count non-exclusive membership; totals exceed 116.)

Global attribute `pa_size` ("Product Size"): UK06/XS 89, UK08/S 112, UK10/M 112, UK12/L 112, UK14/XL 112, UK16/2XL 53. `product_brand` taxonomy exists with zero terms; a "Filter by color" layered-nav widget configured with attribute `pa_color` that no longer exists in the taxonomy table (widget options `widget_woodmart-woocommerce-layered-nav`, index 6) — dead config, **O**.

Reference product **Love Notes PJ Set** (ID 31845, SKU `2620-1-2-1-1-1`): variable product, 6 size variations (UK06/XS, UK08/S, UK10/M, UK12/L, UK14/XL, UK16/2XL), Rs. 3,990.00 LKR, all variations in stock, 4 gallery images `wp-content/uploads/2026/10/34.jpg`–`37.jpg` (2000×2500), categories PJ's and Sets.

## 5. Product-page element inventory (URL `http://localhost:8099/product/love-notes-pj-set/`, ID 31845)

All **O** from the fetched page HTML and the cited DB rows:
1. Breadcrumbs.
2. Gallery: thumbnail rail + main swiper (Swiper + PhotoSwipe CSS parts `wd-swiper`, `wd-photoswipe` enqueued); lazy-loaded responsive `srcset` images.
3. Title, price Rs. 3,990.00; sale items render "Original price was: … / Current price is: …" strikethrough (seen for companion items in related row).
4. Installment/social-proof block: MintPay and Koko one-line installment labels (verbatim strings in FUNCTIONAL-REQUIREMENTS §9), "16 Items sold in last month", "15 People watching this product now!". Both counters are configured in theme option `xts-woodmart-options` as fabricated values in 10–20 range (`counter_visitor_data_source = "fake_data"`, `sold_counter_sales_type = "fake_data"`), not real analytics — see FUNCTIONAL-REQUIREMENTS §6.
5. Size Guide button (opens per-product sizing table; guide selected per product via postmeta `woodmart_sguide_select` — Love Notes points to post 29317 "Size Chart - Body Measurements").
6. Variations form: "Size Choose an option" swatch row, "Clear" choice, per-variation "In stock" pill (`class="stock in-stock wd-style-with-bg"` inside `data-product_variations`), backorders disabled for all six variations, min quantity 1 (`min_qty`).
7. Quantity control: −/+ buttons aria-labeled "Decrease quantity"/"Increase quantity", input aria-label "Product quantity", min 1.
8. Buttons: "Add to cart", "Buy now" (two instances: form + sticky bar).
9. Action icons: Add to wishlist, Add to compare, share icons Facebook, X, Pinterest, LinkedIn, Telegram.
10. Meta: SKU, Categories, Share.
11. Estimated delivery: "Estimated delivery: October 24, 2026 – October 28, 2026" — generated by Woodmart Estimate Delivery rules post 29135 "Estimate Delivery" (`est_del_day_min = 2`, `est_del_day_max = 5`, Sunday excluded via `est_del_skipped_date = [0]`, date format "F j, Y"); shown on product, mini-cart, cart, checkout, order details, and emails per `estimate_delivery_show_on_*` options.
12. Tabs: **Description**, **Additional information**, **Size Guide** (`tab-item-title-description`, `tab-item-title-additional_information`, `tab-item-title-size-guide`); Size Guide tab body is empty for Love Notes (the guide renders via button/modal); Additional information lists the size attribute values from `shop_attributes` table.
13. Related products row: sold-out labeled cards ("Sold out" badge class), "This product has multiple variants. The options may be chosen on the product page" tooltip text on variable cards, hover action icons (Quick view, Compare, Add to wishlist).
14. Sticky add-to-cart bar (`btn btn-accent wd-sticky-add-to-cart`); CTA text switches to "Select options" while a variation is unselected.
15. "Add Personalisation" trigger appears only on products in the "Personalised Pyjama" category (absent on Love Notes — 0 matches in the page; present on `/product/sage-dream-pj-set/`, set config in FUNCTIONAL-REQUIREMENTS §4). Drawer itself was not walked (needs add-to-cart, forbidden) — **U**.

Size chart found in guide post 29317, meta `woodmart_sguide` (**O**, verbatim):

| Size | UK | US | EU | Japan |
| --- | --- | --- | --- | --- |
| XS | 6 - 8 | 4 | 34 | 7 |
| S | 8 -10 | 6 | 36 | 9 |
| M | 10 - 12 | 8 | 38 | 11 |
| L | 12 - 14 | 10 | 40 | 13 |
| XL | 14 - 16 | 12 | 42 | 15 |
| XXL | 16 - 28 | 14 | 44 | 17 |

The XXL UK value "16 - 28" looks like a data typo (possibly "16 - 18"). Flag for client confirmation (**U**).

## 6. Search behavior

- `/` search overlay: two scope tabs (posts / products), AJAX results (`wd-search-results` classes on results container; Woodmart config `ajax = true`, post_type options include post and product).
- `/?s=pjs/` (GET, read-only) returned a search-results archive with product cards in the grid (`wd-product` nodes present) and the same global layout (**O**).

## 7. 404 and edge behavior

- Requesting a non-existent URL (e.g. `/nonexistent-page-xyz/`) returns **HTTP 301 → homepage**; no dedicated 404 template is rendered (**O**).
- `/checkout/` with an empty cart returns HTTP 302 (**O**).

## 8. Assets located (reuse candidates) — all **O** (referenced in fetched page HTML)

All paths under `wp-content/uploads/`:
- Logo `2025/07/love-colombo-logo.png` (861×771) and `2025/07/love-colombo-logo-2.png` (used in Rank Math Organization schema).
- Desktop banners `2026/03/WEB-BANNER-PC-2-1.jpg`, `2026/03/WEB-BANNER-PC-1920-X-700.png`, `2026/03/WEB-BANNER-PC-3.png`, `2025/07/WEB-BANNER-SLIDE.png`, `2025/07/MIDDLE-BANNER.png`.
- Mobile banners `2026/03/WEB-BANNER-MOBILE-2.png`, `2026/03/WEB-BANNER-MOBILE.jpg`, `2025/07/MOBILE-PJ-1000-x-900-px.png`.
- Checkout payment banner image set in `woocommerce_payhere_settings.banner_image`: `2026/03/visa-scaled.png` (file exists on disk).
- Product gallery reference `2026/10/34.jpg`–`37.jpg` (2000×2500).
- Fonts: Barlow loaded locally (site-wide, Woodmart `woodmart_local_google_fonts`); Roboto only inside Smart Slider 3 slide CSS.
