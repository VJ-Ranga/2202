# MIMOSA DESIGN BLUEPRINT — live audit of mimosaforever.com

Status: research only, read-only audit. No source code, theme, or demo file was changed.
Method: live browser audit (Playwright, new test pages created and closed per step; the
pre-existing tab was never navigated, resized, or closed) plus one read-only `webfetch`.
All numbers below are computed styles / bounding boxes measured in the live DOM, not memory.

---

## 1. Sources audited (actual URLs)

| # | URL | Viewport | Purpose |
|---|-----|----------|---------|
| S1 | `https://mimosaforever.com/` | 1440×900 | Homepage structure + metrics |
| S2 | `https://mimosaforever.com/` | 1920×1080 | Hero 100vh, grid reflow check |
| S3 | `https://mimosaforever.com/` | 375×812 | Mobile homepage |
| S4 | `https://mimosaforever.com/collections/new-arrivals` | 1440×900 | Collection grid + hover probe |
| S5 | `https://mimosaforever.com/collections/new-arrivals` | 375×812 | Mobile collection |
| S6 | `https://mimosaforever.com/products/mft2tc20582` | 1440×900 | Real PDP (slug below) |
| S7 | `https://mimosaforever.com/products/mft2tc20582` | 375×812 | Mobile PDP |
| S8 | `https://mimosaforever.com/` (webfetch, text) | — | Nav/footer/product link inventory |

**Real PDP slug chosen:** `/products/mft2tc20582` — "Halter Neck Tie Up Printed Top",
LKR 5,650.00, color BROWN PRINTED, sizes UK06–UK16. Chosen because it is the first card
of the live homepage "NEW ARRIVAL" row, so hero → card → PDP is one continuous path.

Access: no block, no CAPTCHA, no geo/age gate on any URL (HTTP 200, full DOM readable).
No mutation performed: no cart writes, no forms, no orders, no external clicks.

## 2. Evidence (local screenshots, git-ignored)

| File (docs/evidence/) | Capture |
|---|---|
| `mimosa-home-desktop-1440.png` | Homepage full page @1440 |
| `mimosa-home-desktop-1920-viewport.png` | Homepage viewport @1920 |
| `mimosa-home-mobile-375.png` | Homepage full page @375 |
| `mimosa-collection-desktop-1440.png` | Collection full page @1440 |
| `mimosa-collection-mobile-375.png` | Collection full page @375 |
| `mimosa-pdp-desktop-1440.png` | PDP full page @1440 |
| `mimosa-pdp-mobile-375.png` | PDP full page @375 |

Note: content width is 1425/1905/360 px at the three widths (15 px classic scrollbar
in the headless engine); all boxes below are as measured.

## 3. Global design tokens (measured, not inferred)

- **UI font:** `Montserrat` — body 12 px / weight 500 / line-height 15.6 px /
  `text-transform: uppercase` / `letter-spacing: 0.48px` (desktop); 11 px / ls 0.44 px @375.
- **Display font:** `"Noto Sans"` weight 400, uppercase, line-height ≈ 1.0 — used for
  H1 (38.8895 px desktop, 24.0002 px mobile), section intro headings (29.126 px),
  editorial statement (46.998 px desktop / 28.8 px mobile), watermark text (76.6 px).
- **Ink:** `rgb(28,28,28)` text; buttons are outline style (transparent background,
  1 px border, black text, uppercase 12 px, height 45 px desktop / 40 px mobile).
- **Palette:** no chromatic accent in chrome; all color comes from photography.
  "Sale price" is a text prefix in the same black — **no red anywhere measured**.
- **Micro-gutter system:** product grids use `gap: 4px` (desktop) / `2px` (mobile);
  media/category grids use `gap: 0`.
- **Side margins:** text/section content inset 48 px desktop / 20 px mobile;
  product and media grids are full-bleed (start at x=0).

## 4. Homepage — actual measurements

### 4.1 Header
| Property | 1440 | 1920 | 375 |
|---|---|---|---|
| Box | 1425×70 | 1905×70 | 360×59 |
| Position | `sticky`, z-index 4 | same | same |
| Background over hero | `rgba(0,0,0,0)` (transparent) | same | same |
| Logo | 135×25 at x645 (dead center) | 135×25 at x885 | 100×19 centered |
| Left | "Menu" text button, 69×15 at x28 | same | hamburger at x20 |
| Right | login/search/cart 16×16 icons at x1317/1349/1381 | same | cart only (16×16 at x324) |
| Inline nav links | **none visible at any width** (menu is a drawer at all sizes) | — | — |

Header sits on top of the hero (`allow-transparent-header` on the slideshow element).
Scroll behavior: header becomes sticky with `--header-is-sticky: 1` / `--header-is-visible: 1`.

### 4.2 Hero (slideshow)
- Section box: **1425×900 @1440, 1905×1080 @1920, 360×812 @375 → exactly `100vh`/full-bleed**
  at every width (verified `height === innerHeight` at 1920 and 375).
- Element: `<slideshow-carousel autoplay="4" transition="distortion" allow-swipe
  allow-transparent-header cell-selector=".slideshow__slide">`.
  **Autoplay interval = 4 s**, custom `distortion` transition, swipe enabled,
  **pause/play toggle button** 24×24 (desktop x1373,y848; mobile x316,y768).
- 4 slides; dot pagination (4 × 6 px dots, group 60×6) bottom-**right**
  (desktop x1297,y857; mobile x248,y777), not centered.
- Copy placement: **no headline text in the slide** — the campaign copy is baked into
  the banner image; the only DOM text is the CTA link.
- CTA: `.button` "shop now" — 154×45 desktop (x635, y775 → 80 px above hero bottom,
  horizontally centered), 116×40 mobile (x122, y692 → 120 px above bottom),
  12 px/11 px Montserrat uppercase, black text. Image overlay `--overlay: 0 0 0 / 0.2`.
- Mobile uses dedicated portrait banner sources (`srcset` media `max-width: 999px`),
  i.e. art-directed mobile art, not a re-crop.

### 4.3 First product row ("featured-product-list")
- Section: y=900, 1425×680 @1440.
- **Grid: `display:grid; grid-template-columns: 5 × 329.25px; gap: 4px`**
  (5 × 449.25 px @1920; 5 × 208 px, gap 2 px @375). Container 1329 wide, inset 48 px.
- Cell 1 = **intro block** (dark `color-scheme--scheme-4`), 329×579: heading
  "NEW ARRIVAL" in `"Noto Sans"` 29.126 px uppercase white + "View all" link 12 px.
  Remaining 4 cells = product cards; last card bleeds past the right edge
  (x1381 + 329 > 1425) ⇒ row behaves as a **horizontal carousel with peek**.
- Cards visible: 4.0-ish of 4 + intro (mobile: 1 full card + intro block, carousel).

### 4.4 Category tiles ("media-blocks") — the 2×2 big tiles
- Section 1425×1873 @1440; `grid-template-columns: 712.5px 712.5px; gap: 0`.
- Tiles: Timeless 713×922, Dresses 713×922, Tops 713×949, The Vanta Studios 713×949
  (aspect ≈ 0.77). @1920: 952.5 px columns, heights 1233/1268.
  @375: **single column**, 360×466 each (4 stacked, gap 0).
- Labels: 12 px Montserrat uppercase, set on/under image.

### 4.5 Editorial story sections
- **reading-text ("About us"):** 1425×830 @1440 / 360×753 @375. Full-bleed background
  image (1425×900 desktop, 360×812 mobile), centered statement paragraph
  `"Noto Sans"` **46.998 px** uppercase white (mobile 28.8 px), width 960 px,
  plus centered outline CTA "more about Us" 188×45.
- **hot-spots ("Own the Look"):** 1425×713 @1440 / 360×415 @375. Full-bleed lookbook
  image with 40×40 circular `.hot-spot` dots (3–4 dots, 12 px inner glyph) that open
  product popovers; giant watermark headline behind at `"Noto Sans"` 76.61 px,
  `rgba(28,28,28,0.1)`.

### 4.6 Footer
- 1425×809 @1440 (mobile 360×480).
- Desktop: 3 columns — **Shop** x48, **Explore** x466, **NEWSLETTER SIGN UP** x929
  (w448) with inline email field 282×45 + "Subscribe" button 154×45; social icons;
  oversized logo image at bottom; copyright "© MIMOSA. All rights reserved.
  E-commerce Solution by KONEKT" at x48, y5743, 12 px uppercase.
- Mobile: **collapsed `<details>` accordions** — "Shop" and "Explore" summaries
  320×42 each, closed by default; newsletter + logo below.

## 5. Collection (`/collections/new-arrivals`) — actual measurements

- **Banner:** section y=70, 1425×246 @1440 — centered H1 "New Arrivals" `"Noto Sans"`
  38.8895 px uppercase at x48,y118 (mobile 24.0002 px, x20,y107), followed by a
  centered bold intro paragraph in a `max-w-sm` block (section-spacing--tight).
- **Toolbar:** single "Filter & sort" button top-right, 121×15 at x1276,y346,
  12 px uppercase (`link-faded-reverse`). Mobile: "Filter & sort (1430)" 152×14 at
  x20,y320, 11 px — **result count lives inside the button label**.
- **Grid:** full-bleed, `grid-template-columns: 4 × 353.25px; gap: 4px`,
  x=0 (no side padding), 24 cards/page, pagination "1 2 3 … 60" centered (320×40).
  Mobile: **2 × 179 px, gap 2 px**, x=0, 24 cards.
- Card figure ratio **0.800 (4:5)** at every width (353×442 desktop, 179×224 mobile).

### 5.1 Product card anatomy + hover (measured live)
- Figure 4:5, `.product-card--info-outside` — info sits below the image.
- Title: Montserrat 12 px / 500 / uppercase / ls 0.48 px (11 px mobile), 1 line.
- Price block (single 12 px uppercase stack):
  `Sale price LKR 6,250.00` + `or 3 X LKR 2,083.33 or 2.5% cashback with [Mintpay]`
  + `or 3 X LKR 2,083.33 with [Koko]` — **two BNPL rows with provider logos**.
- Color: `.product-card__swatch-list` — 16×16 square swatch + color name
  ("Color BROWN" label text), sits under price.
- Quick buy: `.product-card__quick-buy` absolutely positioned bottom of figure,
  full card width, 329×77 @1440, label "Choose options"; `display: block` on mobile
  (always visible — no hover there).
- **Hover (verified by dispatching a real hover):** primary image `opacity → 0`,
  `.product-card__image--secondary` `display:block; opacity → 1` (crossfade to second
  shot) **and** `.product-card__figure:hover .product-card__floating-size-selector`
  fades/translates in (size chips, min-width 50 px, up to 6 columns).

## 6. PDP (`/products/mft2tc20582`) — actual measurements

### 6.1 Desktop 1440
- Layout: left **gallery** 665×860 at x48, `position: sticky`;
  right **info** 568 wide at x761, `position: sticky; top: 0`;
  gap 48 px, page padding 48 px. Info inner content 520 px (x809).
- Gallery: `.product-gallery` = grid with a single `.product-gallery__image-list`
  holding **4 images laid out horizontally** at x48/717/1385/2054 (each 665×860,
  ratio 0.773, `object-fit: cover`) ⇒ **horizontal paged/scroll-snap gallery in a
  sticky left column**, no thumbnails, no dot pager in DOM.
- Info column top→bottom:
  1. Vendor link "Mimosa" — `.vendor.subheading`, 12 px subdued.
  2. **H1** `"Noto Sans"` **38.8895 px**, uppercase, w520, y126 (2 lines → h78).
  3. Price block y215, h65: "Sale price LKR 5,650.00" + Mintpay row ("or 3 X
     LKR 1,883.33 with") + Koko/cashback row — 12 px uppercase.
  4. Payment terms slot (`shopify-payment-button` = "Buy it now" also present).
  5. **Variant pickers** (`variant-picker`, y705, h146):
     - `color :` — pill label **154×36** ("BROWN PRINTED").
     - `size:` — pill labels ~71–74×36, gap 12 px, wrap: UK06/08/10/12/14.
     - Pills are styled radio `<label>`s (native input visually hidden).
  6. **Quantity** 122×45 (buttons 48×43) + **"Add to cart" outline button 390×45**
     on the same row (y879), then **"Buy it now" full-width 520×45** (y862 in flow).
  7. **Four disclosure buttons, not accordions:** "Delivery Information" (164×15),
     "Shipping & returns" (143×15), "Fit & Fabric" (85×15), "Care Instructions"
     (138×15) — `button.link.subheading`, 12 px, stacked 43 px apart (y935/979/1022/1066).
     They open dialogs; no `<details>` exists inside `.product-info`
     (`infoDisclosures: []` in the DOM probe).
  8. **No size-guide control exists** — full-DOM text search for
     `size guide|size chart|find your size|measure` returned **zero matches**.
- **Sticky add-to-cart bar:** `.product-sticky-add-to-cart`, `position: fixed`,
  640×143 white, desktop anchored x757,y729 (bottom-right), contains title +
  variant "BROWN PRINTED / UK06" + price + "Add to cart" 167×45.
  State at scroll-top: `visibility: hidden; opacity: 0` ⇒ appears after scroll.
- **Related:** `.shopify-section--related-products` y1170, 1425×833, heading
  **"Similar Styles"** styled as a 12 px uppercase badge/subheading (x48,y1258),
  **4 product cards** in one row.
- No breadcrumb element on the page. Page height 2812 px.

### 6.2 Mobile 375
- Order: gallery first (320×414 at x20, `position: relative` — not sticky),
  then info below (static, x20 w320): vendor y529 → **H1 24.0002 px uppercase**
  (y555, 2 lines) → variants → qty/CTA → disclosures → related.
- Variant pills 34 px tall (color 144×34; sizes 70×34 wrapping to 2 rows: UK06–UK14/16).
- Quantity 120×40 + "Add to cart" 192×40 side by side; "Buy it now" full 320×40;
  buttons 11 px uppercase, height 40.
- Disclosures stacked: Delivery Information y1412, Shipping & returns y1454,
  Fit & Fabric y1497, Care Instructions y1539.
- Sticky bar: `fixed`, 360×72 at bottom (hidden at scroll-top, same as desktop).
- Related: y1601, 360×994, "Similar Styles" + 4 cards. Page height 3075 px.

## 7. Prioritized differences vs the LoveColombo demo

### P0 — structure (drive the rework)
1. **Hero:** Mimosa = single full-bleed `100vh` slideshow, autoplay 4 s + visible pause
   toggle, dots bottom-right, CTA alone near bottom-center, no DOM headline.
   Demo = manual-only (no autoplay) split/diptych hero with arrows + `1/3` counter.
2. **Header:** Mimosa = transparent sticky, **centered logo, Menu button left,
   icon-only utilities right, no inline nav at any width**. Demo = nav row + icons
   in same bar (Atelier) or masthead above hero (Maison).
3. **First row:** Mimosa = dark intro-block cell as grid column #1 + 4-card carousel,
   5 columns, `gap: 4px`, full card bleed at right edge. Demo = plain static 4-up grid.
4. **Category section:** Mimosa = **2×2 zero-gutter half-width tiles (~0.77 aspect,
   labels uppercase)**. Demo = 4-up category strip.
5. **Card:** Mimosa = 4:5 figure, info outside, BNPL dual rows under price,
   square color swatch + name, full-width "Choose options" overlay, hover =
   image crossfade + floating size chips. Demo = price-only card (BNPL held back by
   `DESIGN-DIRECTION.md` §8 caveat), no swatch, no hover swap.

### P1 — page-level parity
6. **Collection:** centered H1 + bold intro paragraph (246 px banner), right-aligned
   "Filter & sort (count)" button, **full-bleed 4-col grid gap 4px** (mobile 2-col gap 2),
   pagination centered. Demo = inset grid with side margins and 4 columns at fixed gutter.
7. **PDP desktop:** sticky two-column (665 gallery / 48 gap / 568 info, both sticky),
   horizontal-paged gallery, H1 38.9 px uppercase, pill variants (36 px),
   qty + outline ATC on one row, Buy-it-now full width, **4 dialog-opening text links
   instead of accordions**, **fixed bottom-right sticky ATC panel (640×143)** that
   fades in on scroll, "Similar Styles" + 4 related cards.
8. **PDP mobile:** gallery → info vertical stack, 24 px H1, 34 px pills,
   qty+ATC row, fixed 360×72 bottom bar.
9. **Editorial:** full-bleed image statement section (47 px/28.8 px uppercase white,
   centered CTA) + hot-spot lookbook with 40 px dots and 76 px 10 %-opacity watermark.
10. **Footer:** 3 columns + inline newsletter field (282 + 154), oversized logo,
    mobile collapsed `<details>` accordions (42 px rows).

### P2 — detail polish
11. Type: 12 px/11 px uppercase UI with `0.48px` tracking; display family separate
    from UI family; button height 45/40 outline style.
12. Micro-gutters 4/2 px; content inset 48/20 px; grid full-bleed.
13. Overlay on hero imagery `0 0 0 / 0.2`; mobile art-directed hero sources.
14. Swatch 16×16 square; pagination "1 2 3 … 60"; result count in filter button.

## 8. Actionable mapping → LoveColombo (own photos/assets only)

Rule that governs every line below: **layout, spacing, type scale and interaction
pattern may be adopted; no Mimosa asset, image, font file, logo, icon or copy string
is copied.** All imagery = LoveColombo's own local library (`assets/images/`,
`html-demo/assets/`), all type = self-hosted Barlow / Bodoni Moda, all marks = the
original stacked logo. No external image URLs in the generated site.

| Mimosa pattern (measured) | LoveColombo target | Own-content substitution |
|---|---|---|
| 100vh single-column slideshow, 4 s autoplay + pause, dots bottom-right, CTA bottom-center | Atelier hero slot: full-bleed `100svh` slide stack | 3 real-photo slides from `assets/images/2026/…`; CTA text = own collection links |
| Transparent sticky header, centered mark, Menu left, icons right | Atelier header: same geometry, `transparent → opaque + #E5E5E5 hairline on scroll` | Original stacked logo (white fill on hero, brown/black on light) — recolor of own alpha mask only |
| Intro-block cell + 4-card carousel, 5 cols, gap 4 | Homepage "New arrivals" row: dark intro cell (heading "NEW ARRIVALS" + View all) as column 1, horizontal scroll row, `gap: 4px` | 6 existing demo products (31845/31800/31787/31836 + reserves) with own photos |
| Card: 4:5, info outside, BNPL 2 rows, swatch, "Choose options" overlay, hover swap + size chips | `component-card` restyle | Own product names/prices; BNPL rows only after §8 display-rule confirmation (reserved line-height already in place); own color swatches |
| 2×2 zero-gutter category tiles | Replace 4-up category strip with 2×2 tiles (`grid-template-columns: 1fr 1fr; gap: 0`), mobile 1-col | PJ's / Long-Satin / Dresses / Bottoms tiles from own category photos |
| Full-bleed editorial statement 47 px uppercase + centered CTA | Reuse existing "Personalisation close-up" section slot, restyle to full-bleed + centered uppercase display line | Embroidery macro `2026/09/Pocket2.jpeg` (own), statement text = own brand copy |
| Hot-spot lookbook (40 px dots + watermark heading) | Optional "Own the Look" module on homepage, dots link to own PDPs | Own lookbook photo; hotspot targets = the 6 real demo products |
| Collection: centered banner, Filter & sort (count), full-bleed 4-col gap 4 / 2-col gap 2 | `collection.html` banner + toolbar + grid | Own intro sentence per collection; own 116-product catalog data |
| PDP: sticky 665/568 split, horizontal gallery, pill variants, qty+outline ATC, buy-now, 4 text disclosures, fixed bottom-right sticky ATC, "Similar Styles" 4-up | `product.html` layout + sticky panel + related row | Own gallery photos (4 per product), own descriptions inside the disclosures |
| PDP mobile: gallery → info stack, 24 px H1, 34 px pills, fixed 360×72 bar | Existing responsive PDP breakpoints | same |
| Footer 3-col + inline newsletter + mobile accordions | Existing footer block | Own link columns, honest payment copy (no fabricated marks) |

### Must-preserve checklist (unchanged by this direction)
- Header cart drawer, fullscreen premium search overlay, real PDP route,
  big size-guide modal, source-WP right personalisation drawer,
  exact 6 products + personalisation fee, wishlist, account, order tracking.
- Palette: B&W + minimal brown (own colors); **Sale RED stays as an explicit
  LoveColombo requirement** — Mimosa shows no red, so red is an own addition,
  applied only to sale badges/price where the demo already defines it.
- Demo's documented accessibility rules (keyboard, focus trap, `prefers-reduced-motion`)
  and `DESIGN-DIRECTION.md` §7/§10 "no autoplay" — see decision points.

### Decision points for the owner (explicit conflicts, not silent changes)
1. **Hero autoplay.** Mimosa autoplays every 4 s *with* a visible pause toggle.
   Approved demo spec says manual-only, "no forced autoplay anywhere". Recommendation:
   adopt Mimosa's slider geometry (full-bleed, dots bottom-right, CTA placement) and
   offer autoplay as an opt-in flag defaulting to OFF, with the pause control Mimosa ships.
2. **BNPL rows on cards/PDP.** Mimosa shows Mintpay + Koko rows under every price.
   Demo holds them back until the display rule is confirmed (`DESIGN-DIRECTION.md` §8,
   README issue 7). Layout keeps reserved line height so rows drop in without reflow.
3. **Size guide.** Mimosa has none on the audited PDP (zero DOM matches).
   LoveColombo keeps its own big size-guide modal; place its trigger beside the size
   pills (own addition, clearly labeled).
4. **PDP disclosures.** Mimosa uses 4 dialog-opening text links, not accordions.
   Demo's `component-accordion` can keep `<details>` semantics while adopting the
   12 px uppercase underlined-link styling — visual parity without losing disclosure semantics.

## 9. Concept recommendation

**Rework Concept 1 — "Atelier / Editorial" (the default primary) into the main
Mimosa direction. Do not build a 4th concept.**

Why Atelier, not Maison:
- Atelier already ships the two load-bearing Mimosa traits: **transparent overlay
  header with centered mark** and **full-bleed image-led first viewport**; only the
  hero geometry (50/50 diptych → single full-bleed slideshow), header controls
  (nav row → Menu-left/icon-right, no inline nav) and the downstream section
  anatomy (intro-block row, 2×2 tiles, editorial, footer) need Mimosa alignment.
- Maison's signature — masthead sitting **above** the hero with a ruled nav bar and a
  two-photo landscape strip — is structurally furthest from Mimosa's overlay-header,
  single full-bleed `100vh` slideshow. Reworking Maison would mean discarding its core
  idea rather than steering it.
- Studio stays as the merchandising fallback; Maison stays as the fashion-house
  statement variant. One strong direction, as requested.

Palette: **Palette B ("Pure Mono") first, Palette A ("Mono + Brown") second** —
unchanged from `DESIGN-DIRECTION.md` §13; Mimosa's chrome is achromatic, so the
photography (own, natural color) carries the color, and Sale RED remains the single
permitted brand-red usage per the owner's rule.

## 10. What must NOT be taken from Mimosa
- No Mimosa images/banners (incl. mobile portrait banners), logo (`MIMOSA.svg`),
  icons, icon fonts, CSS/JS, collection copy, product names/prices, or provider
  logo images (Mintpay/Koko marks stay out; BNPL rows render text-only or with own assets).
- No `Montserrat`/`Noto Sans` font files — metrics above are targets to *match* with
  self-hosted Barlow (UI) and Bodoni Moda (display) at the same sizes/tracking/case.
- No external image URLs anywhere in generated pages (already a demo exclusion).
