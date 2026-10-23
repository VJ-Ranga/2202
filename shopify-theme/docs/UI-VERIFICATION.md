# UI Verification

Date: 2026-10-23

## Shared shell

- Announcement bar renders on homepage, collection, PDP, cart, wishlist, search, account, tracking, and info routes: `Free Shipping for orders above Rs 5000`.
- Header remains one row: 82px desktop, 64px mobile; four visible links plus hamburger.
- Footer uses four full-width columns with readable 16px links and responsive two-column mobile layout.
- Root presentation links resolve to real destinations: all styles, product `31845`, and product `31597#personalisation`.

## PDP compositions

- Atelier: image-led 58/42 gallery/detail layout, Bodoni title, vertical thumbnail rail.
- Studio: shopping-first gallery with first two 4:5 images visible side by side and compact Barlow purchase rail.
- Maison: editorial tall gallery, Bodoni italic display title, separated purchase rail.
- All layouts preserve product ID, concept, palette, variants, prices, size guard, and Add to Bag.
- Mobile uses one-column 4:5 media, thumbnail selection, readable 16px controls, 44px options, and 52px primary CTA.
- PDP geometry verified for Atelier, Studio, and Maison at 375px, 768px, and 1440px viewports. All visible PDP descendants stay within client bounds; Studio mobile media/info are 320px wide inside 360px client width.
- Fixed root cause: concept grid tracks used 340px/360px minimums and Studio media min-content sizing. Replaced with `minmax(0, 1fr)`, zeroed grid-item minimum widths, constrained media/images to available width, and removed `.pd-page` horizontal overflow masking.
- Product layout switcher preserves `id` and `palette` while changing `concept`.
- Size guide uses exact source chart `assets/images/2025/09/size-chart.webp` copied to `html-demo/assets/images/size-chart-30535-1536.webp` at `1536×1024`; responsive markup retains `960w` fallback and loads exact `1536×1024` asset on modal open. Chart content shows body measurements, bust, waist, low hip, how to measure, and inches. Accessible centered dialog works across all three concepts and both palettes. Desktop dialog measures `1120×810` at 1440px; mobile measures `359×846` at 375px.
- Size guide zoom controls reach `125%` and preserve chart ratio; browser proof reports `currentSrc` `size-chart-30535-1536.webp`, natural `1536×1024`, and ratio `1.5`; Escape/backdrop close returns focus to `Size guide`, restores body scroll styles and a scrolled `500px` position, and keeps PDP variant/Add to Bag controls functional. Image-load failure shows visible retry guidance instead of blank content.

## Personalisation

- Trigger renders after normal purchase actions and opens source-owned right drawer.
- Missing size blocks drawer and focuses size control.
- Drawer callback adds selected variant, quantity, placement payload, and one Rs 1,000 fee per unit.
- Negative fallback verified with `assets/customisation-data.json` returning HTTP 503: eligible six-product category keeps title/gallery/size/add-to-bag, shows `Personalisation is temporarily unavailable. You can still add this item to your bag.` and `Reload page`; product `31845` shows no optional notice. Plain `31597` add uses `UK12/L`, price `4490`, no persona, no fee, no page errors.
- Normal Add to Bag remains unpersonalised and has no duplicate fee.
- Verified product `31597`, `UK12/L`, `Pocket Hem`, `Amara`, `Freestyle Script`, `Black`: cart line `price 4490`, `fee 1000`.

## Route checks

- Search keyboard query and zero-result recovery verified.
- Account email preview validates without storing credentials.
- Tracking form validates order/email and reports preview limitation without fabricating order state.
- Tracking validation QA: empty submit visibly shows `Enter your order number.`; order-only submit visibly shows `Enter the email used for the order.`; valid values show honest preview notice, make no lookup request, and invalid resubmission clears stale success output. `aria-invalid` and status associations update correctly.
- Account QA: visible `Email address` label is linked to required email input; invalid and valid messages are visible; no email is stored. Account feature copy uses shopper-facing wishlist language.
- No console errors or horizontal overflow at tested 375px, 768px, and 1440px contexts.
- Drawer QA remains verified for Amara and Zoe, quantity 2: price `4490`, fee `1000`, subtotal `10980`; dirty-close confirmation guard behaves correctly.
- Quantity cap QA verified: PDP increment stops at `99`, disables with maximum label, never displays `100`, then decrement reaches `98`. Cart quantity `99` plus is disabled, minus reaches `98`, subtotal renders without `INVALID_QTY`.
