# Demo 4 UI check — 2026-10-31

Scope: static Demo 4 and the shared product-gallery behaviour. This is not a production Shopify/payment verification.

## Payment presentation

Removed the separate About Mintpay/About Koko links and the oversized explanation block. Product cards and product details now show a compact three-payment estimate with the two local provider logos. Product details retain the short note “Demo estimate · provider terms apply.” Full explanation is available as a title tooltip. Current product/selected-variant price is used; no cashback percentage or merchant-activation claim is added.

Live reference inspected: https://sugarworld.lk/shop/ — compact amount plus provider logos. A Mimosa product URL could not be fetched during this pass, so no fresh Mimosa-product measurement is claimed.

## Browser results

- 15 routes at 1440 and 375 pixels: homepage, collection, two product pages, cart, wishlist, search, account, tracking and six information pages.
- No horizontal overflow, standalone null/undefined text nodes, page JavaScript exceptions or local HTTP error responses during the route checks.
- No About payment links remain on the product page; current-price split checked (Rs 3,890 / 3 displayed as Rs 1,296.67).
- Missing size blocks Add to bag; selecting size allows add and opens the cart drawer.
- Size guide, search with three Mocha results, menu open/Escape, and personalisation size guard/open checked.
- Demo 4 vertical gallery: mouse wheel, thumbnail clicks, Up/Down keys and thumbnail selection checked at 320/375/768/1440/1906 pixels. Demo 1 retains horizontal gallery behaviour.
- Existing Node test suites: 108 passed, 0 failed. `git diff --check` passed.

This pass does not resolve the separately documented catalog/content migration decisions, does not submit contact forms or place orders, and does not verify live gateway activation. No WordPress edits, commit, push or deployment performed.
