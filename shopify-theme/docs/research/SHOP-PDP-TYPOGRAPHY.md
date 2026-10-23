# Collection + PDP typography and layout research

Date: 2026-10-22
Project: 2202 Love Colombo
Research mode: read-only. No source-site code, images, or assets copied.

## Scope and evidence rules

Measured live pages in isolated Chromium contexts at 1440x1200 and 375x1000 where available. Values below are computed CSS styles and rendered boxes, rounded to whole CSS pixels. Screenshots were captured when pages rendered. This is a small reference sample, not a universal standard.

External access varied. SKIMS collection and PDP, Massimo Dutti collection, and Mango women's landing page rendered. COS collection route opened but country/shipping overlays blocked product-grid measurement. Mango direct PDP returned 403. Do not treat blocked pages as measured evidence.

Reference screenshots:

- `/home/vjranga/Documents/2202/.playwright-mcp/ref-skims-collection-1440.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/ref-skims-pdp-1440.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/ref-skims-pdp-375.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/ref-massimo-collection-1440.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/ref-mango-collection-1440.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/own-collection-1440.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/own-collection-375.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/own-product-1440.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/own-product-375.png`

## Live reference measurements

### SKIMS

URLs: `https://skims.com/en-lk/collections/new-arrivals`; `https://skims.com/en-lk/products/nikeskims-stretch-knit-short-sleeve-top-sport-red-and-carob-brown`.

- Font stacks: body `Inter`; product brand line and PDP title `T-Star`.
- Body computed size: 16px / 24px.
- Desktop nav: 16px / 24px; visible labels New, Best Sellers, Clothing, Bras, Underwear, Shapewear, Mens, Accessories, Sale. Header utility line includes 12px shipping copy and 16px currency.
- Collection heading: `NEW ARRIVALS`, 30px, weight 900, 36px line-height.
- Collection product card: four columns at 1440. Card image boxes 341x493, ratio 0.69 (portrait, approximately 2:3). Card grid starts x=24 and columns begin x=24, 369, 715, 1060; observed horizontal gap about 4–5px.
- Collection product brand/title: brand line 12px / 16px, weight 700, T-Star; title 14px / 20px, weight 700, Inter. Prices 14px / 20px, weight 400, Inter. Example prices: LKR 38,800, LKR 71,100.
- Collection controls: Filter 14px / 20px, weight 700; Sort 16px / 24px. Breadcrumb 12px / 16px.
- PDP desktop: two-column visual/detail layout. First product media boxes measured 742x1130 and 713x1087, ratio about 0.66. PDP content starts x=761. Product title is 16px / 24px, weight 900, T-Star, width 617px; subtitle 12px / 16px Inter; current price LKR 26,600 is 16px / 24px, weight 500, Inter.
- PDP controls: `SELECT A SIZE` 16px / 52px control row. Size selectors 12px labels in 36px controls. `ADD TO CART` 16px text, 52px high, 258px wide desktop. Wishlist icon control 52x52.
- PDP mobile at 375: product media becomes square 374x374, then title x=20 y=587, 16px / 24px T-Star, width 320. Subtitle 12px / 16px. Size selector row 320x52. Add-to-cart controls 218x52. Mobile header hides text nav and uses icon controls; body remains 16px / 24px.

### Massimo Dutti

URL: `https://www.massimodutti.com/gb/men/cardigans-n1370` (live collection/category route; men's category used because it rendered product cards).

- Body: `suisse-regular, Helvetica, arial, sans-serif`, 16px / 23.2px.
- Desktop header labels: 13px, weight 300, 13px line-height, letter-spacing 2.08px. Visible groups: NEW YORK, WOMAN, MAN, MD WORLD, SEARCH, LOG IN, BAG.
- Category heading: `MEN'S CARDIGANS`, `suisse-light`, 13px, weight 300, 18.2px line-height. This is intentionally restrained rather than display-sized.
- Product grid: four columns at 1440. Product image boxes 314x471, ratio 0.67 (roughly 2:3). First row begins y=339. Product price text is 13px, weight 300, 13px line-height, same Suisse light stack; observed £60, £90, £70, £100.
- Mobile page rendered navigation as compact icons and category controls. Visible category labels include VIEW ALL, SWEATERS, CARDIGANS, WOOL | CASHMERE at 13px with 32px-high controls. Product images were not loaded in captured 375px viewport, so no mobile image ratio claim.
- No PDP was measured from this session. Category evidence only.

### Mango

URL: `https://shop.mango.com/gb/en/h/women`.

- Body: `DefaultFontEN`, 16px base. Header labels use `HeadingsFontEN`, 12px / 16px, weight 600. Header shows WOMEN, MEN, TEEN, KIDS, HOME plus SEARCH, LOG IN, WISHLIST, BAG.
- Landing-page title `NEW NOW`: 68px / 72px, weight 600, `HeadingsFontEN`. This is editorial landing copy, not product-card or PDP type.
- The direct product URL tested returned `403 FORBIDDEN`; no Mango PDP numbers reported. Page did not expose a loaded product grid in captured viewport, so no Mango card ratio or price claim reported.

### COS

URLs: `https://www.cos.com/en-gb`; `https://www.cos.com/en-gb/women`.

- Body: `SuisseIntl`, 16px base.
- Collection route was live but country/shipping confirmation and cookie layers occupied viewport. Measured visible overlay typography: 13.008px body labels, 16px `READ MORE`; visible header/category labels WOMEN and MEN were 13px. Collection card/PDP measurements unavailable in this run.
- Existing homepage live capture in `GLOBAL-FASHION.md` measured COS campaign headings at 35.008px, weight 700, and footer section headings at 13px. Those are homepage observations, not collection/PDP evidence.

## Project baseline: current 2202 demo

Routes tested: `collection.html?category=all&concept=atelier&palette=mono`; `product.html?id=31845&concept=atelier&palette=mono`.

### Collection at 1440

- Body: Barlow 15px / 23.25px.
- Header is two rows, 114px total: main row 72px plus nav row 42px. Ten visible nav links use 11.5px / 17.825px, weight 600, uppercase, letter-spacing 0.12em.
- Content max width: 985px, x=352. Collection title `All styles`: 38px / 58.9px, weight 600.
- Product grid: four columns. Image boxes 222x278, ratio 0.80 (4:5). Grid gap 8px. Grid begins y=417; first images y=439 after 22px grid top padding.
- Product category label: 10.5px / 16.275px, uppercase, letter-spacing 0.16em. Product name: 15px / 19.5px, weight 500. Price: 14px / 21.7px, weight 600.

### Collection at 375

- Browser layout viewport reports 360px content width because vertical scrollbar; page gutter 16px, content width 328px.
- Header is 108px tall in the rendered page; text nav is hidden and mobile menu carries category labels. Product grid is two columns, 145x181 image boxes, ratio 0.80, with 8px gap at this width.
- Card category/name/price remain 10.5px, 15px, and 14px. Long names wrap to three lines in 141px text width. Prices can wrap to two lines.
- Page title becomes 26px / 40.3px. Filter controls remain 11.5px labels in 34px controls.

### PDP at 1440

- Product media/detail columns each 618px wide. Main product image boxes 618x773, ratio 0.80. Detail panel starts x=823.
- Product title `Love Notes PJ Set`: 34px / 40.8px, weight 600. Product price: 22px / 34.1px, weight 500.
- Size label: 11px / 17.05px, weight 700, uppercase, letter-spacing 0.18em. Size controls use 12.5px / 19.375px; heights 39px. Desktop size buttons are 73–89px wide.
- Existing CSS sets primary `.btn` min-height 48px, 12px uppercase text, and 28px horizontal padding. Existing computed mobile Add to Bag button measured 141x48.
- Description: 14.5px / 23.925px on mobile-rendered content; desktop stylesheet sets `.pd-desc` 14px / 1.65. Fabric line uses 12px uppercase utility text.

### PDP at 375

- Browser content width reports 360px. Product image is 368x460, ratio 0.80, x=4, y=177. Detail content x=40, width 320.
- Product title: 24px / 28.8px, weight 600. Price stays 22px / 34.1px. Size label 11px; size controls 12.5px and 39px high.
- Add to Bag: 141x48 at x=176; View Cart: 135x48 at x=40. Description is 14.5px / 23.925px, width 320.
- Mobile product detail appears after the full product image. Related grid later in page uses one column, with 296x370 product images, ratio 0.80.

## Evidence-led comparison

| Surface | 2202 current | Live references | Read |
|---|---:|---:|---|
| Body | 15px | SKIMS 16px; Massimo 16px; Mango 16px | 2202 is smaller than all three measured current retail bases. |
| Collection name | 15px | SKIMS 14px; Massimo product-name text not reliably isolated | 2202 name is not smaller than SKIMS, but narrow two-up mobile cards force wrapping. |
| Collection price | 14px | SKIMS 14px; Massimo 13px | Current price size sits within sample, not inherently premium or non-premium. |
| PDP title desktop | 34px | SKIMS 16px | 2202 uses much larger PDP title. This is an editorial choice, not proof of better usability. |
| PDP title mobile | 24px | SKIMS 16px | 2202 is more prominent; check line length and image-to-detail transition. |
| PDP price | 22px | SKIMS 16px | 2202 price has stronger hierarchy than SKIMS reference. |
| Product image ratio | 4:5 | SKIMS collection 0.69; Massimo collection 0.67; SKIMS PDP desktop 0.66; SKIMS PDP mobile 1:1 | 2202 product cards are less tall. This gives more catalog density; reference set favors taller cards, but no universal standard follows from four sites. |
| Product grid | 4-up desktop, 2-up mobile | SKIMS 4-up desktop; Massimo 4-up desktop | Grid count aligns with references. |
| Header labels | 11.5px, two rows | SKIMS 16px one nav row; Massimo 13px; Mango 12px | 2202 header has smallest labels and greatest vertical chrome. |

## Project recommendations

### 1. Header: remove second-row overload

User screenshot shows two rows and too many links. Use one desktop row with maximum four visible primary links:

- Recommended: `New In`, `Dresses`, `PJ's`, `SALE`.
- Alternative: `Dresses`, `Tops`, `PJ's`, `SALE`.
- Keep all other categories inside hamburger. Keep search, account, wishlist, and bag as utilities.
- Keep `SALE` red as explicit merchandising signal. Do not make every link uppercase with wide tracking; use readable 13–14px nav text, 16px line-height, and a comfortable 44px control height.
- Keep catalog and product pages separate documents, as current project routing already does. Do not restore product popups.
- Desktop target: one 72px row or one compact 60–72px row. Mobile target: one 60px utility row with hamburger, centered logo, and utilities; labels live inside menu.

This recommendation responds to measured references: SKIMS exposes nine 16px labels in one nav row; Massimo exposes sparse 13px utility/category labels; COS uses restrained 13px labels. It does not claim one universal premium header pattern.

### 2. Type scale: increase reading text, not every label

- Set body copy to 16px minimum, around 24px line-height. This is usability recommendation, not a claim that every premium reference follows it; both SKIMS and Massimo measured 16px bases.
- Set collection card name to 15–16px, with 20–22px line-height. Keep card price 14–15px, 20–22px line-height. Keep category metadata 11–12px, but reduce tracking if it harms scanning.
- Keep PDP title around 32–36px desktop and 24–28px mobile. Current 34px/24px hierarchy is defensible; improve surrounding whitespace and font rendering before enlarging it.
- Keep PDP price around 20–22px desktop/mobile if price emphasis is intentional. Do not reduce to 14px only because SKIMS does; their PDP deliberately uses 16px.
- Keep size labels around 11–12px and option text 12.5–14px. Use 44px minimum option/button hit height where controls are primary. Current 39px size buttons are below this usability target.
- Keep primary buttons at least 44px high; current 48px Add to Bag meets this. Aim 52px for dominant Add to Cart if visual density permits. 44px is usability guidance, not measured premium-site law.

### 3. Product imagery and grid

- Keep 4-up desktop and 2-up mobile. This matches SKIMS and Massimo measured collection grids.
- Test taller product cards: move from current 4:5 (0.80) toward approximately 2:3 (0.67–0.70), matching SKIMS 0.69 and Massimo 0.67. Use real catalog crops before locking; do not distort product photography.
- On mobile, preserve two-up grid only if name and price remain readable. Current 141px text width causes three-line names and two-line prices. Options: use 1px less gutter, shorten visible metadata, or switch selected editorial collections to one-up. Do not shrink text below 15px to force one-line names.
- Keep 6–8px grid gap and rely on whitespace, not borders. This aligns current project and measured references.

### 4. PDP layout

- Keep separate PDP route. Use image-first product detail with two desktop columns and stacked mobile content.
- Current 4:5 PDP image gives strong consistency with catalog. A taller 2:3 PDP ratio would align more closely with SKIMS desktop and Massimo card proportions; validate against actual garment framing first.
- Preserve title, price, options, and Add to Bag as one clear detail block. Increase option hit height from 39px to at least 44px.
- Keep description at 16px / about 24px for customer-facing reading copy. Current 14.5px mobile description is smaller than measured body bases and should increase unless page length becomes unacceptable.
- Use 12px utility labels only for SKU, fabric, category, and stock metadata.

### 5. Premium signal

Premium feel in this sample comes from restrained chrome, taller imagery, whitespace, clear hierarchy, and controlled utility type. Do not equate tiny type or two-row navigation with premium. 2202 currently has premium ingredients in imagery and monochrome discipline, but header density, 15px body copy, 39px options, and short 4:5 product crops make demo feel smaller/basic.

## Limits

- Four-site sample is not representative of all fashion commerce.
- Campaigns, geolocation, consent layers, and responsive breakpoints change frequently.
- COS product grid was blocked by location overlays in this run; Mango PDP was blocked with 403; Massimo PDP was not measured. No numbers are supplied for unavailable surfaces.
- External screenshots are inspection artifacts only. No external images are used in project files.
