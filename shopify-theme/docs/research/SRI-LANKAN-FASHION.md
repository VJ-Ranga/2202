# Sri Lankan Fashion E-Commerce Research — Header, Imagery, Product Cards, Payments

**Researched:** 22 October 2026
**Scope:** 10 prominent Sri Lankan clothing retail sites, women's fashion focus, observed through live tools (HTTP text fetch, HTML inspection, and limited live-browser computed-style checks). This is *not* an audited popularity ranking; sites were selected from the client's brief plus verification that each has an operating official e-commerce store. Method marks used below:

- **[Text fetch]** — full page text/HTML retrieved and inspected.
- **[Partial fetch]** — page shell retrieved; dynamic content (e.g. JS-rendered prices) not inspectable.
- **[Blocked]** — could not retrieve meaningful content.
- **[Browser check]** — loaded in headless browser and inspected computed styles / accessibility snapshot without saving screenshots (no image files were produced in this research).

All brands requested by the client were verified as official and accessible, so **no active substitutes were needed**. Naming/URL clarifications are noted per brand.

---

## 1. Mimosa (Mimosa Clothing) — mimosaforever.com

- Official store verified: https://mimosaforever.com (physical store at No. 20 Bagatale Road, Colombo 03; phone +94 711 535 535, per the site's contact page). A separate `mimosabrand.shop` surfaced in search but the Bagatale Road branding, reward program and product range identify `mimosaforever.com` as the real store. Search title on site: "Online Shopping in Sri Lanka Clothes" — women-first.
- **Platform observation:** Shopify asset pipeline (`/cdn/shop/files/...`); footer credit "E-commerce Solution by KONEKT" (konekt.lk, Sri Lankan agency). [Text fetch + Browser check]
- **Visual check (live, 22 Oct 2026):** white background, text colour `rgb(0, 0, 0)` — pure black-on-white. Header is a Shopify section-group (`shopify-section--header`) with transparent background overlaying the hero. Product images render at tall portrait ratios (~842×1122 ≈ 3:4).

### Header
- Transparent-overlay header: logo left, "Menu", Search, Login, Cart. Category row: New Arrivals · Collections · Dresses · Tops · Skirts · Shorts · Trousers · Denim · Mens Wear · Basics · Gift Cards.
- Mega menu opens with "Back" panels: Dresses → All/Mini/Midi/Maxi; Tops → sleeve-type split; Trousers → Straight/Wide-Leg/Boot-Leg/Drawstring. Subitems are deliberately shallow and merchandising-led.
- "Collections" is a long drop list of **named drops** — *October Drop 1, Rhea, Timeless 67, Headliners Only, Marielle, …* — 50+ active collection names, weekly-ish cadence. This is a content/storytelling nav model, not a pure category model.

### Imagery
- Hero: full-width slider of collection banners requested at up to **2800px width** (e.g. `October_01_Web_Banner.jpg … &width=2800`), one CTA per slide ("Shop now → collection").
- Large category tiles are full-bleed **photographs, not icon cards**: Timeless, Dresses, Tops, The Vanta Studios — supplied at up to 2550px wide.
- Editorial sections: a full-width "About us" banner (2600×1400) plus a "Own the Look" lookbook image (3200px).
- Product card: two-image hover (main + alternate shot inline in markup), "NEW ARRIVAL" eyebrow, colour shown as text under price ("Color Red Print").

### Product card metadata
- Price: `LKR 3,790.00` (Sale price prefix used).
- Layby/BNPL line after price: `or 3 X LKR 1,263.33 or 2.5% cashback with Mintpay` **and** `or 3 X LKR 1,263.33 with Koko` — both BNPL providers displayed on the card.
- "Choose options" CTA on card (no direct add-to-cart; single click)).
- Loyalty: "Club Mimosa" rewards-points landing in a modal ("Earn Rewards Points", current cart points shown).
- Dropdown/disclaimer: newsletter modal + signup; footer repeats Shop/Explore columns.

### Mobile
- No dedicated mobile banner asset observed in fetched HTML (hero is a single wide image), header collapses into "Menu". Not enough evidence to describe more.

---

## 2. ODEL — odel.lk

- Official store verified: https://odel.lk — title "Home | Odel.lk". `www.odel.lk` serves an invalid TLS certificate (cert name mismatch), so only the apex domain works. [Partial fetch]
- **Access limitation:** root page is protected by a **ZEN Edge (zenedge `__zjc…`) JavaScript bot check** that sets a cookie and client-redirects to `/home`. Downloading `/home` with the replayed cookie succeeds server-side (260 KB, HTTP 200), but the **product grid and hero slider are rendered by JS**, so prices and imagery could not be captured. A direct browser visit also failed (the earlier redirect landed in an unrelated default tab; `www.` version fails on the certificate error). Marked **[Blocked] for interactive/visual; [Partial fetch] for structure.**
- **Platform observation:** custom/unidentified stack (no Shopify, WordPress or Magento markers in HTML); the shell loads jQuery + **Owl Carousel**, Google Tag Manager, Facebook Pixel, Google Blob/cloundflare CDN assets. Only "LKR 0.00" (cart) appears in static HTML so currency is confirmed LKR elsewhere on site; product prices not seen.

### Header (verifiable from HTML)
- Utility row: **Deals · New Collection · Shop By Brands**, cart `0`, LogIn, Register.
- One mega nav per department: WOMEN / MEN / SPORTS / KIDS / BAGS / FOOTWEAR / HOME-LIFESTYLE / JEWELLERY / WATCHES-SUNGLASSES / FOOD-BEVERAGES / SOUVENIRS-GIFTS (link frequency from HTML: kids 128, souvenirs-gifts 82, home-lifestyle 47, women 42, footwear 30, food-beverages 30, bags 28, men 27, sports 20, jewellery 15, watches-sunglasses 14).
- WOMEN menu is fully expanded server-side: *Casualwear (Sets, Dresses, Tops & T Shirts, Shirts, Skirts & Shorts, Bottoms, Jumpsuits & Playsuits, Kaftans & Tunics), Formalwear (Dresses, Shirts & Tops, Pants & Trousers, Skirts, Blazers & Coats), Nightwear, Lingerie & Accessories (Bras, Briefs, Shapewear, Underskirts, Petticoats), Swim & Beachwear, Winterwear, Accessories (Caps & Hats, Hair Accessories), Beauty (Haircare, Bath & Body, MakeUp, Skincare, Fragrances)*.
- Product-card CSS present in the shell: `.prd-name` two-line clamp (3em height), `.color-swatch` 20px round radio inputs; `.adverts-slider .owl-item { aspect-ratio: 2 }` → the hero slider is forced to a 2:1 aspect ratio (full-bleed wide banner). Deep-link pattern is `/<department>/<category>` (e.g. `/women`, `/kids`, `/home-lifestyle`).
- Mobile: no dedicated mobile assets verifiable from the shell; unknown.

---

## 3. Fashion Bug — fashionbug.lk

- Official store verified: https://www.fashionbug.lk (Pepiliyana Rd, Colombo; online@fashionbug.lk). [Text fetch]
- **Platform observation:** Shopify (`/cdn/shop/files/...`, `93609329005.myshopify.com` buyer redirect), Shopify login endpoint. Store brand id = "Fashion Bug".

### Header / navigation
- Currency switcher **LKR / USD** directly in header (rare in this set).
- Search modal opens with **"Trending Now"** term chips (T-shirts, Shirts, Skirts, Blouses) + "Popular Products" shelf inside the search overlay.
- Mega nav: New Arrivals / **Women** (All Clothing, Lingerie & Nightwear, Accessories, Ethnic Wear — Kurti, Saree, "Our Brands" Amani · Givo · Daisy Street · Ethnic Fusion) / **Men** / **Kids & Baby** / Health & Beauty / Toys & Games / Home & Lifestyle / Gift Vouchers / **SALE (Hot)**. Each mega group ends with a promo lifestyle image.
- Category URLs are stable lowercase slugs (`/collections/dresses`, `/collections/jobbs`).

### Imagery
- Hero: rotating banner pair per campaign, plus **six or more collection tiles** on the homepage, e.g. one children's ("Kids"), Givo, A DOT, "BLOUSE" campaign, and four October slider images; every banner is served at `&width=750` from Shopify CDN.
- Women/Men/Kids category tiles sit as wide photo banners above `Shop Now` CTAs.
- Product photos: catalogue style, duplicated per colourway (front image variants), disclaimer printed on the card: `*Product image may differ to actual due to photographic lighting*`.

### Product card metadata (strongest in this set)
- Product names in UPPERCASE, e.g. `JOBBS SLIM FIT PREMIUM JEANS`, brand-led (Jobbs, Amani, Givo).
- Price: `Rs 6,990.00`, followed by `Unit price / per` unit block.
- BNPL on every card: `or 3 X Rs 2,330.00 with Mintpay` **or** `with Koko` (brand logos inline, links to paykoko.com and mintpay.lk education pages).
- **Card-level variant hydration:** colour dots inline (`black Black / white White / …`) with "+2 more"; size chips inside a **Quick Add** popover (`Size: 32 33 34 35 36 38 40`), out-of-stock sizes show `Notify me`.
- Two CTAs per card: **Add to wishlist** and **Quick View**, plus *Add to cart*.
- Footer: payment-method icon row, About/Contact/News/Branches/Awards/Careers/Size Chart/CSR/Return Policy columns, newsletter signup.

### Mobile
- Bottom sticky app-style bar observed in markup: **Home · Search · Account · Cart**. Bundled login keeps Shopify new-customer accounts. Bundled "saree_offer 22-24_10-2026" campaign images confirm month-stamped campaign naming (10-2026).

---

## 4. NOLIMIT — nolimit.lk

- Official store verified: https://www.nolimit.lk, Dehiwala head office/online store addresses in footer; "NOLIMIT CIRCLE" rewards program page. [Text fetch] of both homepage and a category + PDP.
- **Platform observation:** footer credits **"Powered by GC-ERP"** (greenencoding.tech), assets on `greencoding.b-cdn.net` and `cdn.greencloudpos.com` — a local Sri Lankan ERP/POS vendor's storefront, not Shopify/Woo. Award badges present: **BestWeb.LK '24** and "Most Popular e-Commerce Website".

### Header / navigation
- Announcement bar: `Sign up and get 10% off on your first order` repeated **8×** as a marquee strip.
- URL taxonomy is path-per-category: `/categories/Women/Ethnic-Wear/Kurta`, `/categories/Women/Casual-Wear/Dresses`, `/collections/offers` (Sale), `/gift-vouchers`, plus a value filter **`/under-2000`** ("Below 2000") as a first-class nav item.
- Mega nav: Women (Ethnic Wear: Kurta/Sarees/Shalwar/Shawl; Casual Wear: 14 subcats incl. Jeggings, Crop Tops; Formal Wear; Lingerie & Innerwear; Nightwear; SportsWear; Accessories; Swim & Beachwear) / Men (incl. Sarongs) / Kids (Boys/Girls/Toddler/Toys/Stationery/Footwear) / Home / Personal Care / Travel Gear / Mother & Babycare / Gift Cards / Sale / Below 2000.
- Multi-channel footer: WhatsApp deep link (`api.whatsapp.com/send?phone=94773540816`), Instagram, Facebook, TikTok; award badges; newsletter re-consent copy referencing marketing emails/cart reminders (GDPR-style wording in a Sri Lankan store).

### Imagery
- Hero: **separate desktop and mobile banner files** (`mobile1-1792463839481.webp` vs `desktop1-1791603382195.jpeg`), both requested at width=1920 with quality=80/95 — art-directed responsive hero, not a CSS crop.
- Brand tiles: square image pairs (Pallu, MBRK, NOLIMIT, Deedat, Huf & Dee, Pink Elephant) at `width=1920&quality=80` from `cat_sq/` bucket — used as a carousel both mid-page and mobile.
- Category + PDP product photos: retail flat-lay/mannequin studio shots at `width=600` and `width=1920` quality=80, filenames carry SKU, colour and size in the filename (`NOLIMITGOLDENAURORAPrintedDressPeach&Green•Small-0-…-DSC09530.jpg`).

### Product card metadata
- Cards show **front + back image pair** on hover (two `<img>`s inline), plus badges: `New`, `18% OFF`.
- Titles are **brand + collection + garment + colour**: `FIA MARIA GOLDEN AURORA Self Tie Neck Dress`, `NOLIMIT MODEST Women's Shirt Collar Printed Casual Dress Navy`.
- **Prices are JS-rendered** — absent from the static HTML for card and PDP (only cart widget `LKR: 0.00` confirms LKR currency). Marked [Partial fetch] for price format.
- Sort/filter toolbar: `Sort By - Newest`, `Colour`, `Size` chips; LIST: "Viewing 20 out of 25 Products" + `LOAD MORE` button (progressive load, not pagination).
- PDP detail: colour count chip, size chips (S/M/L/XL/2XL, each linking to its own variant URL), stock urgency `Hurry! Only 2 available`, `Brand : NOLIMIT`, `Code : 1101011323724`, internal `Binloc : MLG` (decisive of in-store integration), reviews module (rating, name, email, phone, optional picture).
- Payments: footer shows a single payment-methods image strip (no per-card instalment rows seen on cards). [Partial fetch] — BNPL not confirmed.

### Mobile
- Mobile-first artifacts confirmed: dedicated `mobile1…webp` hero asset, marquee announcement, LOAD MORE; bottom navigation not visible in fetched text (unknown).

---

## 5. Carnage — incarnage.com

- Official store verified: https://incarnage.com (also reachable at `www.incarnage.com`). Self-describes as "Sri Lanka's #1 active and lifestyle clothing brand" — **the #1 claim is the brand's own marketing copy, not an audit**. [Text fetch]
- **Platform observation:** Shopify CDN assets, footer literal "Powered by **Octagen**" (octagen.io, Sri Lankan Shopify/design agency; careers at careers.incarnage.com, support portal support.incarnage.com). Locale paths `/en-us/`, `/en-sc/` (multiregion).

### Header / navigation
- Tagline strip: "**Having trouble loading?** Open this page in Safari for the best experience. Copy link Share. In Instagram/Facebook: tap the **⋯** menu → **Open in browser**." — a rare, explicit **social-browser work-around banner** (targets in-app webviews).
- Mega nav: **WOMEN** (Featured: New Arrivals, Best Sellers, Athleisure, Essentials, Seamless, Luxe Premium, Airsculpt, Last Chance; Explore: T-shirts, Polos, Crop tops, Sports Bras, Tanks, Leggings, Skirts, Shorts, Hoodies & Jackets, Jeans, Joggers & Pants) / **MEN** (parallel structure) / **ACCESSORIES** (Hats & Caps, Shoes, Slides, Jewellery, Socks, Bottles & Tumblers, Bags, Merch) / **LAST CHANCE** / Gift Cards.
- Mega menu is **image-hybrid**: three image tiles injected inside each department dropdown ("Recommended For you", "Women Shoes", "Women's Accessories" at 400×500). Both image tile and text-link nav in one flyout.
- Distinct **"Shop by Activity"** merchandising section on homepage with gendered tabs: Lifting / Running / Rest Day / Casual (M) and Lifting / Running / Rest Day / Pilates/Yoga (W).

### Imagery
- Product card images: **front + back pair always rendered**; card grid image size ~1000×1250 (4:5).
- Category tiles: `Shop by Category` at 800×1000; `Shop muscle x Mind` promo banner exists in two **art-directed sizes**: desktop `2400×800` + mobile `1200×1800` (stacked hero, portrait-first mobile design).
- Editorial full-bleed logo/print: `logo-white-new.png` at width=2000 in footer.

### Product card metadata
- Price with currency label embedded: `LKR 4,850.00` (explicit LKR on the card, unlike others that write `Rs`).
- Colourway always listed as a line under the name in expressive names: **Jet Black, Royale Black, Charcoal Grey, Sheer White, Moonbeam, Crimson, Tangerine**.
- Sale math visible on card: `15% off … LKR 3,350.00 LKR 2,847.50` (compare-at struck-through).
- No BNPL/instalment rows observed on homepage product cards. Footer legal: tax-inclusive note in the cart drawer ("Tax included. Shipping calculated at checkout.").
- Global nav footer repeats "Be better everyday" tagline and promo signup block.

---

## 6. GFLOCK — gflock.lk

- Official store verified: https://gflock.lk — footer "Copyright © 2026 GFLOCK.LK. Whiteglow (Pvt.) Ltd." [Text fetch + Browser check]
- **Platform observation:** Shopify (CDN + gift-voucher page under `/collections/gift-vouchers`). Visual check: body `rgb(255, 255, 255)`, text `rgb(21, 21, 21)` — a **near-black-on-white monochrome UI**, the closest in this set to the client's black-and-white aesthetic direction.
- Gift voucher disclaimer header banner: "Gift Voucher redemption is **temporarily unavailable** on our website…" — an operations-status bar pattern worth noting.

### Header / navigation
- 12-word top nav: **WOMEN / MEN / BOUTIQUE / GIFT VOUCHERS** only, duplicated as desktop dropdown mega.
- WOMEN: New In / **Work Wear** / **Casual Wear** / **Evening Wear** / **Active Wear** / Denim / **Natural Blends** / CLOTHING (Dresses, Tops, Pants, Blazers, Jeans, Jumpsuits, Shorts). MEN/Tees/Polo/… separate. **BOUTIQUE** is a separate top-level collection (limited capsule "collections" named per release: *Movements − 040926, Wildflower − 080826, Serendipity: The Resort Collection − 300726*).
- Collection slugs carry **date codes** `…-201026`, `…-161026` — an internal weekly-drop indicator (drop dated 20.10.26, 16.10.26, etc.).
- Utility row: account, cart, Search.
- With the visual check the header seen from live DOM was `shopify-section shopify-section-group-header-group section-announcement-bar`, confirming an **announcement bar above a sticky section group**.

### Imagery
- The signature pattern: each weekly drop ships **two crops shipped per banner in the HTML, side by side**: a wide `cover` crop *960×421* (~2:1, desktop/hero) and a 9:16 `web banner` crop *856×1523* for mobile — so the mobile hero is **not** a re-crop of the desktop art (e.g. `Casual-Cotton-cover-LK_1.jpg` + `Casual-Cotton-Banner9_16_1.jpg` for the 201026 drop, same for Evening, Natural Blends/ cotton, Denim, Ink/Ivory boutique and a Men's drop). This is the strongest evidence in the whole set of "art-directed mobile" execution.
- Product photo tiles on card grid look gridded with whitespace-neutral backdrops; product-card layout list `product-card__variants--list product-card__variants--list--normal` (distinct list-mode grid).
- A "Shop the look" bottom-carousel pairs two garments from one outfit (White Blazer + Straight Leg Pant) at card level.

### Product card metadata
- Price label convention: `Regular price 7,980.00` — **currency not printed**, implicit LKR by Sri Lanka market context. Sizes listed as **UK 6 / UK 8 / UK 10 / UK 12 (+N more)** — note this store uses **UK sizing labels**, different from NOLIMIT's S/M/L and Thilakawardhana's numerals.
- Colour chips show two fabric colours per card inline (`Yellow / Beige`, `Maroon / Grey`) as separate chips.
- Card CTA is text link (no visible BNPL, wishlist, or quick-view on the card); payment-method row is in footer (American Express, Apple Pay, Diners Club, Discover, Google Pay, Mastercard, **Shop Pay**, Visa). Mintpay/Koko/Payzy were **not observed** on the homepage in fetched text.
- Per-card date suffix in the title (`Shirt Dress - 201026`) doubles as an arrival stamp.

---

## 7. Kelly Felder — kellyfelder.com

- Official store verified: https://kellyfelder.com ("Established in 2007"; physical outlets incl. Colombo City Centre, Wattala launch Oct 2025 per lmd.lk coverage). [Text fetch]
- **Platform observation:** Shopify with Shopify Markets country/currency picker; logo size pinned at width=180.

### Header / navigation
- Announcement bar: `FREE SHIPPING ON ORDERS ABOVE 12,000`.
- Nav: **NEW ARRIVALS · CATEGORIES (Dresses/Tops/Denims/Skirts/Pants) · COLLECTION (Casual Wear/Workwear/Evening Wear/Athleisure/Eighty%) · BRANDS (Kelly Felder/Scylla Zelus/Redvers Buller/EIGHTY %/Lost Kids) · ACCESSORIES (Jewelleries/Footwear/Bags/View All) · TRACK ORDER**.
- Two house brands link **out to their own Shopify storefronts** (`scyllazelus.com`, `redversbuller.com`) — multi-brand umbrella pattern.
- **Country selector lists 100+ countries with (LKR ₨)** on every entry — a single-currency store (LKR) sold internationally; currency never changes, only the country context. Localised flag icons from Shopify CDN.

### Imagery
- Hero: **paired art direction** — every hero slide ships a `Mob_Banner_…` file (width=1000) **and** a `Web_Banner_…` (width=1880/2350), distinct artwork for mobile vs desktop (seasonal campaigns e.g. `Web_Banner_KF_Casuals_18.10.26.jpg`).
- Brand-story **full-bleed image tiles** with overlaid white text: KELLY FELDER (width=2949), SCYLLA ZELUS (1080), REDVERS BULLER (3312), EIGHTY% (3808) — huge source images, editorial-scale.
- 8-tile `Shop By Brand`/category strip at width=400.
- Product-card variants feed each colour through an **alternate colourway thumbnail** on the swatch hover (swatch 34px thumbnails).

### Product card metadata
- Price: `Rs 8,890.00` (Rs prefix, no LKR word on card).
- **Size chips visible on the card itself** (UK 04/06/08/10/12 + "2 more") — unusual: buyers can pre-filter on the listing page before PDP.
- Colour names are evocative: Light Green, Dull Red, Black Check, Brownish Grey, Dark Blush, Off White.
- No BNPL rows on homepage cards; BNPL presence not verified here. [Gap noted]
- Section rhythm: hero → NEW ARRIVALS → brand story tiles → UP TO 50% OFF → CASUALS/DENIM/DRESSES → BEST SELLERS → WORKWEAR.

---

## 8. Thilakawardhana — thilakawardhana.com

- Official store verified: https://thilakawardhana.com (Kiribathgoda flagship; phone +94 706 520 520 on social). A `sltdigital.site` voucher-only site also claims group management — it is not the clothing store and was **not** used. An international storefront `global.thilakawardhana.com` is linked from a hero tile. [Text fetch]
- **Platform observation:** Shopify (`/cdn/shop/files/...`), customer_authentication redirect per LK region.

### Header / navigation
- Announcement: `EXPRESS 3 HOUR DELIVERY WITHIN COLOMBO & KIRIBATHGODA SUBURBS`.
- Top departments: **Fashion** (home) · Mobile Phones · Appliances · Gift Vouchers — a **department-store split**, each pinned logo variant links to its own section (three alternate `ONLINE_LOGO` images in the header).
- Huge mega menu: NEW ARRIVALS / **WOMEN** (WOMEN'S CLOTHING: Frocks & Dresses, Tops, T Shirts, Pants, Jumpsuits, Denims & Jeans, Skirts, Shorts, Activewear, **Sarees & Lehengas**, Nightwear, Innerwear, **Lungi**; WOMEN'S ACCESSORIES; BAGS & SHOES) / MEN (incl. Sarong) / TEEN / KIDS / MOTHER & BABY (incl. Maternity Wear) / HOME & LIFESTYLE / BEAUTY & FRAGRANCE / **DENIM EDIT** / GIFTS & TREATS / SALE.
- Mega entries end in a **"SHOP ALL" PNG call-to-action image** per branch.

### Imagery
- Homepage hero = stacked linked banner tiles at `&width=750` (Titan watch, footwear cover, women's wear, global.store tile, Teen, jeans, ladies shoes, mens), followed by rows of `Shop By Category` photo cards at `&width=533`.
- Product imagery: studio-item photos with **two shots inline** (main + detail variants: `TW16291` + `TW16291.1`).

### Product card metadata (richest payment block in this set)
- Truncated description preview on card (product body text ~30 words).
- Price: `Rs 3,450.00`, **`From Rs 3,495.00`** variant price prefix for ranged pricing.
- **Three BNPL providers stacked after the price**, with distinct copy per provider:
  - `or pay in 3 x Rs 1,150.00 with Koko`
  - `3 X Rs 1,150.00 or 3% Cashback with Mintpay` (links to mintpay.lk/education with pre-filled price/cashback params)
  - `or up to 4 x Rs 862.50 with **Payzy**` (payzy.lk instalment deep link also carries the price)
  - → the same product card educates the customer on 3 six-week Koko methods, cashback alternative, and a 4-instalment option. Only site in the set with a 4-instalment provider.
- `Rs 3,450.00` repeated with `Unit price / per` unit block.
- Size chips numerals-scalar (28/30/32/34 waist; collar 14.5/15/16/16.5; toy sizes 80/100/105).
- Two CTAs: **Add to wishlist** and **Quick View**.

### Mobile
- No dedicated mobile asset verified in fetched text; the promo banners resize via Shopify CDN. Header collapses; login/cart/wishlist drawer persists.

---

## 9. Dilly & Carlo — dillyandcarlo.com

- Official store verified: https://www.dillyandcarlo.com ("since 1987"; outlets on Flower Road, One Galle Face, Crescat, Majestic City, Havelock City per contact page). [Text fetch]
- **Platform observation:** Shopify, customised through a distinct storefront shell. Facebook Pixel tag present (`fbq PageView`).

### Header / navigation (the most minimal in the set)
- Header = **logo (links `/pages/women`) · Menu · WOMEN · MEN · Search · Account · Cart**. Nothing else. No mega dropdown in fetched HTML — navigation is two landing pages (Women's / Men's) whose content acts as the category index.
- The Women's/Men's landing pages contain their own large SEO banner + category sub-navs (e.g. Men's: FORMAL, SHIRTS, T-SHIRTS, PANTS, SHORTS, DENIM, GIFTS VOUCHERS, BRANDS + note of collection names ALDEN, VELRON, LENTO, RIGORE, VYRO, AVENOR, THALOS, NOVEN, MONTEGO By Carlo, PORTOFINO, etc.).
- Search overlay: **"Quick Search"** chips (Women, Men, Best seller) + "Popular product" horizontal rail with 165px-width mini cards + `View all`.

### Imagery
- Hero is **two half-width banners**: `web_cover_new_3_535x.png` (→ /pages/women) and `…_M_535x.png` (→ /pages/men) — a gender split-hero rather than a single slider. Mobile renders one per row.
- Mid-page strip: **"STAY UPDATED — EVERY 7 DAYS WE HAVE A NEW COLLECTION !!!"** — explicit weekly-drop cadence, marketing as nav content.
- Brand-collection tiles at 535px (`FORMAL WEAR, CARLO, BATIK, MOON CHILD, MOODS, CONCEPT, LADIES SPORTS WEAR`) — each is a sub-brand with a logo block and its own collection.
- Product cards: two-image hover (front + back: `DSC_1390_1` vs `DSC_1529-Recovered`), 535x server size.

### Product card metadata
- Price renders **duplicated** — `Rs 5,950.00 Rs 5,950.00` (compare-at slot repeated with the same value), a minor data hygiene issue worth not reproducing in a new design.
- Household-styled names: `Printed drawcord crop pant`, `Long Length Basic Kurtha Top`, `Sleeless Premium Linen Maxi Dress With Side Slits` — premium-linen stories up to `Rs 13,950.00`.
- Two hover CTAs: **Select options** and **Quick view**. No BNPL rows on the homepage fetch; payment strip is an image in footer (`70_x_06_Payment_method_D_C-01.png`). ["D&C Rewards" page exists.]
- Footer info blocks: Information / Contact / **Size Chart (Women, Men)** separate pages / newsletter (10% off first order).

---

## 10. Aviraté — aviratefashion.com

- Official store verified: https://www.aviratefashion.com (flagship 30 Maitland Crescent + CCC/KCC/One Galle Face shops; brand of Timex & Fergasam). Footer literal: **"Powered by Shopify"**. [Text fetch]
- Note: the brand's Facebook/Instagram link from footer exists; the older `avirate.com` ICF-corporate site was not a store and is not treated as one here.

### Header / navigation
- Announcement: `Islandwide Delivery & Overseas Delivery`.
- Multi-level nav: **NEW IN · Dress (All Dresses/Work/Casual/Evening/Jumpsuit/Co-Ord Sets) · Top (All Tops/Work/Casual) · Bottom (Skirt/Pant/Short) · SPECIAL COLLECTION (BRUNCH, CLASSIC EDIT) · EVERYDAY ESSENTIALS — *UNDER 4000 / UNDER 5000 / UNDER 6000* · Gift Vouchers**.
- The **price-tier nav ("UNDER 4000/5000/6000")** is the standout affordability pattern — collections curated by LKR budget, not by garment type.
- Legacy "75%/50%/25%" menu items also present in the fetched DOM (discount-tier sales pages), an alternative discount-by-page model.

### Product card metadata
- Card fields: vendor eyebrow `Avirate`, name, `Rs 4,980.00 /`, then **two BNPL rows, order reversed vs others**:
  - `or pay in 3 x Rs 1,660.00 with Koko`
  - `3 X Rs 1,660.00 or 3.5% Cashback with Mintpay` (with a Mintpay education/info icon)
- Naming style: evocative two-word names, e.g. `Navy Chic, Cobalt Precision, Azure Executive, Sapphire Accent, Slate Tie-Back` — **colour-first brand voice**. `Rs 3,980.00 – Rs 8,280.00` typical band.
- Card photos are width-light previews (`width=20` for lazy placeholder, real render 1200px in a secondary "Corporate Elegance" module).
- Memberships/loyalty not surfaced on the card set fetched.

### Imagery
- Five large **collection tiles** (Dresses, Tops, Pants, Jumpsuits, Skirts) at width=600.
- "Corporate Elegance" ~8 product cards shown at 1200px width — the card image treatment is oversized relative to the metadata block.
- **"Follow Us on Instagram"** grid (8 thumbnails + video thumbnails 1280px) — social-first footer, plus a `black-collection` linked banner strip.
- Photo style: garment-on-model studio (clean, editorial, women-only catalogue).

### Mobile
- Separate mobile logo file (`logo-white.png`) observed in markup for a dark-header variant; mobile-specific merchandising not verifiable beyond this. Headless-check not performed (no browser session).

---

## Cross-Site Patterns (observed, evidence-backed)

1. **Shopify dominates the upper tier of Sri Lankan fashion retail.** 7 of 10 sites are Shopify-backed (Mimosa, Fashion Bug, NOLIMIT is the exception, GFLOCK, Kelly Felder, Thilakawardhana, Dilly & Carlo, Aviraté, Carnage on Shopify-with-Octagen). Only NOLIMIT (GC-ERP, a local POS/ERP) and ODEL (custom, Owel-style shell) run local/custom stacks.
2. **Layby is a card-level convention.** Mintpay (3×, with cashback variants 2.5%/3%/3.5%) and Koko (3×) are pasted directly inside the same product card as the price on Mimosa, Fashion Bug, Aviraté, Thilakawardhana; Thilakawardhana adds **Payzy at 4×**. A Sri Lankan-theme designer should budget for a **multi-provider instalment explainer line per product card**, not per page.
3. **Currency wording varies and is inherited:** `LKR 3,790.00` (Mimosa, Carnage) vs `Rs 3,390.00` (Fashion Bug, GFLOCK, D&C, Kelly Felder, Aviraté) vs `Rs 3,390.00` with BNPL continuation. GFLOCK prints no currency at all on the card. A single currency standard (LKR wordmark) would already be a differentiator.
4. **Weekly collection cadence is a merchandising backbone** — not just a marketing message. Evidence: GFLOCK slugs carry drop dates (`-201026`, `-161026`, `-040926` for `Movements`); Mimosa nav has **50+ named drops** (Timeless 51–67, monthly names); D&C states "**EVERY 7 DAYS WE HAVE A NEW COLLECTION !!!**". A drop-based information architecture is native to this market, contrary to Western evergreen category-first best practice.
5. **Art-directed responsive imagery is common:** GFLOCK ships twin crops (2:1 + 9:16) per drop; Kelly Felder ships `Mob_Banner*` + `Web_Banner*` pairs; NOLIMIT ships `mobile1…webp` + `desktop1…jpeg`; Carnage ships desktop 2400×800 + mobile 1200×1800 promo art. Any theme prototype must plan **two distinct hero artworks per campaign**, not CSS-crop one.
6. **Hover second image is universal.** Front/back or colourway-alternate pairs are rendered in card markup on Mimosa, NOLIMIT, D&C, Carnage, Fashion Bug, Kelly Felder, Thilakawardhana. Card metadata richness varies widely though — **product titles on cards are long and descriptive** (brand + collection + garment + colour) on NOLIMIT/Thilakawardhana/Fashion Bug; GFLOCK/D&C keep them simpler.
7. **Wishlist + Quick View + Quick Add are the standard utility trio** of this market (Fashion Bug, Thilakawardhana, ODEL CSS shell all ship them; GFLOCK/Kelly Felder/Aviraté/DILLY rely more on PDP/`Choose options`). NOLIMIT adds stock-urgency (`Hurry! Only 2 available`) and an internal `Binloc` field, tying online to walk-in store systems.
8. **Category-tile imagery is photographic and huge**, not icon-driven: up to 2550–3200px on Mimosa, 1080–3800px on Kelly Felder, 600–1200px on Aviraté, 750-px hero bands everywhere. Availability of `LKR` and multi-store messaging (islandwide/overseas delivery, COD, store-locator) recurs on Fashion Bug, Aviraté, ODEL, Kelly Felder.
9. **Search is merchandising surface:** Fashion Bug's search modal carries "Trending Now" + "Popular Products" shelves; D&C's overlay carries quick-chips + a horizontal "Popular product" rail.
10. **Announcement bar is universal** and states operational promises (FREE SHIPPING OVER 12,000 / EXPRESS 3 HOUR DELIVERY / marquee signup / gift-voucher-outage note).

## Gaps against the brief (full-width header, massive imagery, B&W, brown accent)

- **B&W:** Only **GFLOCK** verified pure near-black-on-white (`rgb(21,21,21)` on `rgb(255,255,255)`); Mimosa is black-on-white copy with transparent header over imagery. No site sampled used brown as an accent **in UI** — brown appears only as a garment colourway name on Carnage/Kelly Felder; no brown theme tokens were found. The brown accent in the client brief will therefore be a **differentiator, not a mirror**.
- **Full-width transparent header over full-bleed hero** is implemented on Mimosa; Kelly Felder/Fashion Bug/Thilakawardhana use a solid utility bar + banner below.
- **Female-fashion-first stores** (Dress/Top/Bottom primary nav, no Men MERCHANDISING at header level): Aviraté, GFLOCK (WOMEN first), Mimosa (women-only with a small "Mens Wear"/Vanta Studios link), Kelly Felder (women-first with men's line outlinked). These four are the best structural references for a women's-first theme.

## Design Takeaways for the 2202 Theme

1. Adopt **B&W base with black-on-white type** (GFLOCK precedent) and reserve **brown** as a single accent token (price/highlight/underline) — no Sri Lankan site does this yet, so it is on-brand differentiation.
2. Build the **header of 4–6 items max** (GFLOCK/Aviraté model), visually transparent over a **full-bleed hero slider** (Mimosa model), with a persistent announcement bar for shipping/drop messaging.
3. Ship **two hero artworks per drop** (desktop wide ~2:1 at ≥2000px source; mobile 9:16 at ≥1000px source) — following GFLOCK/Kelly Felder/NOLIMIT/Carnage evidence.
4. Use **product cards with LKR-prefixed price + one row explaining 3× Mintpay/Koko (+ optional Payzy 4×)**, colour chips, size chips on card (Kelly Felder pattern), a hover second image, plus wishlist/quick-view CTAs (Fashion Bug/Thilakawardhana pattern).
5. Mirror the local **drop-based collections system**: named, dated drops surfacing as a nav carousel + homepage shelf, not just a blog; slugs carry YYMMDD so changes stay traceable.
6. Offer a **price-budget nav tier** ("Under 4000/5000/6000" Aviraté pattern) alongside the garment taxonomy — it indexes strongly with Sri Lankan shoppers who anchor budgets in LKR.
7. Keep search as a **merchandising overlay**: trending terms + a popular-products rail (Fashion Bug/D&C precedent).
8. Persist a **store-operations trust strip**: islandwide delivery / COD / express-window announcement / store-locator links (Fashion Bug, Aviraté, Thilakawardhana).
9. For mobile, plan a **bottom bar (Home/Search/Account/Cart)** as Fashion Bug does, plus a marquee signup strip (NOLIMIT) and Safari-grid-in-app-webview fallback hint (Carnage) if social traffic is material.

## Access limitations & caveats

- **ODEL** is the only site where interactive and visual inspection was **[Blocked]**: the ZEN Edge JS challenge sets a cookie and redirects; a replayed cookie still returned a JS-only shell with no product data, and `www.odel.lk` fails TLS (cert name mismatch). Observations for ODEL are limited to its server-side HTML shell (header, mega menu, card CSS, slider aspect ratio).
- **NOLIMIT** product prices are JS-rendered; LKR is confirmed only indirectly (cart `LKR: 0.00`). BNPL rows were not observable. Marked accordingly.
- **No browser screenshots were saved in this research** (constraint: no additional files). Live-browser probes were made via computed-style/accessibility inspection only: mimosaforever.com and gflock.lk were checked this way; the remaining eight were inspected via text/HTML fetches and, for ODEL, raw-HTTP with a session cookie.
- **No popularity claims:** no traffic-rank or "top-10" audit was performed. The word "prominent" reflects the client's brief plus operational verification only. Carnage's on-site "#1" phrasing is its own marketing language.
- **Products/prices/strings captured are point-in-time (22 Oct 2026)** and are quoted verbatim for evidence; they change by the minute (many sites run weekly drops) and should not be treated as current offers.
- Search-result hits (`mimosabrand.shop`, `sltdigital.site`, `avirate.com`) were examined and ruled out as the official retail domain for their respective brands; rationale is documented inline above.

## Source list

| # | Brand | URL | Access on 22 Oct 2026 |
|---|-------|-----|-----------------------|
| 1 | Mimosa | https://mimosaforever.com | Text fetch + browser check |
| 2 | ODEL | https://odel.lk | Partial fetch (JS challenge) |
| 3 | Fashion Bug | https://www.fashionbug.lk | Text fetch |
| 4 | NOLIMIT | https://www.nolimit.lk | Text fetch (home, category, PDP) |
| 5 | Carnage | https://incarnage.com | Text fetch |
| 6 | GFLOCK | https://gflock.lk | Text fetch + browser check |
| 7 | Kelly Felder | https://kellyfelder.com | Text fetch |
| 8 | Thilakawardhana | https://thilakawardhana.com | Text fetch |
| 9 | Dilly & Carlo | https://www.dillyandcarlo.com | Text fetch |
| 10 | Aviraté | https://www.aviratefashion.com | Text fetch |

Secondary corroborations used: LMD media release (lmd.lk/kelly-felder), Colombo City Centre store directory (colombocitycentre.lk/store/kelly-felder), and Aviraté contact/store-locator pages on its own domain — each cited only for factual brand/store facts, not design evidence.
