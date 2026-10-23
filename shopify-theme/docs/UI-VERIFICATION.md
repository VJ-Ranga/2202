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

## Hero autoplay amendment

- Client-approved autoplay supersedes earlier manual-only notes: Atelier, Maison, and Studio campaign heroes advance every 6 seconds and wrap continuously.
- Shared autoplay lifecycle has one timer per hero, clean disposal, fresh interval after manual arrows/swipes, persistent manual pause, accessible 44px Pause/Play control, and live-region suppression during automatic rotation.
- Pointer hover, hero focus, hidden tab, out-of-view state, open dialogs, pagehide, and reduced motion stop autoplay. Reduced-motion default shows `Play slideshow` and one click explicitly starts playback; runtime preference changes return control to Play. Touch pointers do not trigger desktop hover pause. Explicit Play can override reduced-motion default; Play resumes only after relevant automatic blocks clear.
- Browser proof: Atelier and Studio advanced `1 / 3` to `2 / 3` after 6.3 seconds; pause label changed to `Play slideshow`, slide held after 6.2 seconds, Play label changed to `Pause slideshow`, and resumed to `3 / 3`. Hover pause/resume verified on Studio. No console/page errors. Test tabs and contexts closed.

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

## Cart drawer and search overlay integration

Date: 2026-10-23. Modules `cart-drawer.mjs` / `search-overlay.mjs` are frozen (import `store.mjs` only); integration lives in `core.js` (`ensureCartDrawer` / `ensureSearchOverlay`, exported `openCartDrawer(invoker)` / `openSearchOverlay(invoker, initialQuery)`), `pages.js`, `styles.css`.

- Header cart/search icons keep their real `href`; only an unmodified primary click is intercepted (Ctrl/Meta/Shift/Alt and middle click keep native browser behaviour — middle click verified opening the cart document in a new tab).
- Lazy single-promise factories: first header click creates the modal, awaits its stylesheet, and belongs to one instance per document; a rapid double-click yields one drawer (`count: 1`).
- `aria-haspopup="dialog"` on both icons; after creation `aria-controls` points at the module DOM ids `#cart-drawer` / `#spo-search-overlay`, and `aria-expanded` is set on open and restored by the module's native `close` event (Escape verified).
- Fresh storage: cart icon on `collection.html` opens `Your bag (0)` with the empty state, `Continue shopping` link, and unchanged URL (`http://127.0.0.1:4173/collection.html`).
- PDP `29643` Light Blue Denim Jacket, `UK10/M`, Add to bag commit syncs badges then opens the drawer from live central state: title `Your bag (1)`, real option line `Size: UK10/M`, subtotal `Rs 2,390.00`. Plus → qty 2 / `Rs 4,780.00` with badge 2 persisted in `lc-cart`; minus restores `1 / Rs 2,390.00`; Remove returns `Your bag (0)` with empty state and `[]` storage. Invalid size shows the error line and never opens the drawer; sold-out stays disabled.
- Drawer `Checkout` hands off to the existing full `cart.html?checkout=preview` document, which now renders the clear notice `Preview: checkout opens at the live store — order placement is unavailable in this HTML preview.`; `View cart` opens the ordinary full cart page.
- Drawer mutations on `cart.html` re-render the full cart document live via the established rerender pattern (`window.__rerenderCart`): drawer plus at qty 2 → page title `Cart · 2 items`, subtotal `Rs 4,780.00` both surfaces, drawer stays open. Reverse direction verified too: full-page plus (qty 3) refreshes the open drawer to `3 / Rs 7,170.00`. Full cart page plus button was stuck disabled at qty 1 (`setAttribute('disabled','false')`); fixed boolean-safe, plus enabled and functional.
- Personalisation kept exact WP success state: placing `Pocket Hem: "Amara" · Freestyle Script · off white` for `31597` commits the line with fee inside the open success dialog and does not open a second cart modal; a programmatic header-cart attempt while the success dialog is up is refused. A later real header cart click shows the fee line `+ Rs 1,000.00 per unit`, the placement summary, and the correct subtotal.
- Search icon opens the overlay with unchanged URL and autofocus (`#spo-search-input`); typing `Mocha` after the 180 ms debounce shows `3 results` (Mocha Essential Maxi Dress / Skirt / Wide Leg Pant) and `View all 3 results`; Enter submits to the full `search.html?q=Mocha` document (3 matches). Zero query `zzzqqq` shows `No matches for "zzzqqq".`, `Browse all styles`, and a working Clear; the default state lists real Shop categories and 6 new arrivals. Escape closes and restores focus to the search icon.
- Cross-modal mutex: clicking the other header icon while one of our modals is open hands over correctly (search open → cart click opens drawer, cart open → search click opens overlay), while foreign open dialogs (customisation success, size guide, compare, mobile menu) are never stolen — the opener waits.
- Cross-tab `storage` sync verified: a `lc-cart` write from another tab re-hydrates central state, refreshes the open drawer (`Your bag (2)`, Chambray Button Down Blouse, `Rs 2,980.00`) and the badge; the existing wishlist flow (toggle, badge, storage) is untouched.
- Keyboard: Tab cycles the drawer focusables (name, qty controls, remove, checkout, view cart, close, wraps); Escape always closes and returns focus to the invoking icon; body scroll lock restores cleanly.
- Autoplay: open hero continued then paused while the drawer stayed open (`2 / 3` held for 7.5 s); resume on close handled by the existing `dialog[open]` observer.
- Mobile 375 px: search icon visible again (44 px grid touch target next to the 44 px cart), wishlist/account hidden, hamburger · centred logo · search · cart with no overlap and no horizontal overflow; desktop four-link row untouched.
- Negative fallback: routing `cart-drawer.css` to HTTP 500 logs `cart-drawer: failed to load …/cart-drawer.css; refusing to open an unstyled drawer` and lands the user on the full cart document instead of an unstyled or blank state.
- Module Node suites: `store 65`, `autoplay 8`, `search-overlay 14`, `cart-drawer 9` — 96/96 pass. Test tabs closed; no console or page errors outside the injected negative test.
