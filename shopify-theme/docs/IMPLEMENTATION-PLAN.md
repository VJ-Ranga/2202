# HTML Multipage Demo — Implementation Record

Date: 2026-10-22.
Approval record: `docs/DESIGN-DIRECTION.md` (three concepts × two palettes, six homepage previews) was **approved in full by the owner on 2026-10-22**. Multipage demo implementation and verification are complete. No further approval gate exists within this milestone; verified demo is ready for client review. Shopify conversion remains future work after approval.

Legend: `[x]` complete. Historical task labels below describe delivered work; verification details live in `docs/DEMO-VERIFICATION.md`.

Ownership boundary for this plan:

| Area | Owner | Files |
| --- | --- | --- |
| HTML/CSS/JS, components, a11y, responsive | Frontend agent | `index.html`, `preview.html`, `collection.html`, `product.html`, `cart.html`, `wishlist.html`, `search.html`, `page.html`, `account.html`, `order-tracking.html`, `styles.css`, `app.js`, `store.mjs`, `store.test.mjs` |
| Optimized assets, demo data, fonts | Asset agent | `assets/images/`, `assets/fonts/`, `assets/demo-data.json` |
| Information-page content export + content tracking docs, README, approval records | Docs agent | `assets/pages-data.json`, `docs/PAGE-CONTENT.md`, `scripts/export-demo-pages.php`, `PLAN.md`, `README.md`, `docs/DESIGN-DIRECTION.md` (status), this file |

## Global constraints (every task inherits these)

- Sole design authority: `docs/DESIGN-DIRECTION.md` (approved). Section references below (§) are to that document.
- Real local photos only; no borrowed, external, or localhost URLs. Images served from `html-demo/assets/images/`.
- No fabricated data: no sale badges, review counts, "sold/watching" claims, invented products or prices. Prices come from `data/products.json` and are never edited. Instalment copy stays out until the Mintpay/Koko rule is confirmed (README issue 7).
- Checkout is a labeled demo: a notice states the preview has no payment and places no order.
- No app framework. Static HTML + CSS tokens + small purpose-built JavaScript.
- No autoplay anywhere. Motion honors `prefers-reduced-motion`.
- Dev server: `python3 -m http.server 4173 --bind 0.0.0.0` run from the `html-demo/` directory → `http://localhost:4173/`.
- URL scheme: `preview.html?concept=atelier|studio|maison&palette=mono|brown`. Defaults: `concept=atelier`, `palette=mono`. The comparison index `index.html` links all six combinations.
- Route set (owner-steered 2026-10-22): separate webpages only, no product popups or any product dialogs — `preview.html` (homepage), `collection.html?category=<slug>`, `product.html?id=<id>`, `cart.html`, `wishlist.html`, `search.html?q=<query>`, `page.html?slug=<slug>`, `account.html`, `order-tracking.html`. The `concept` and `palette` query parameters carry over onto every route; each route defaults to `atelier`/`mono` when the params are missing or invalid.
- Information pages render from `assets/pages-data.json` (`docs/PAGE-CONTENT.md`); the demo contact form must end with a visible **"Preview: message not sent"-notice** (no fake send), and order tracking must present no fabricated found orders. Social links are empty (no real handles exist); the top menu lists all ten main categories; the footer links the actual other pages.
- Cart and wishlist persist in `localStorage` under namespaced keys (`lc-cart` and `lc-wishlist`), shared by all six previews.

## Delivered and planned architecture (as extended by the 2026-10-22 steering record):

```text
html-demo/
  index.html          comparison index — six preview links + section links to the route families
  preview.html        the homepage template (concept + palette from query)

  styles.css          tokens + shared layout + per-concept variant rules
  app.js              renderers, drawers, slider, cart and wishlist wiring
  store.mjs           pure-JS cart/wishlist store (framework-free)
  store.test.mjs      Node test-runner tests for store.mjs
  assets/
    demo-data.json    products (12), categories (4), heroes, editorial, personalisation, logos, fonts
    pages-data.json   the six "page.html?slug=..." info pages + contact record + social record
    images/           optimized WebP derivatives (real photos, no color grading)
    fonts/            self-hosted WOFF2 (Barlow 400/500/600/700, Bodoni Moda 400 + 400 italic)
```

---

## Task 1 — Optimized real-photo assets, fonts, and demo data (asset agent)

- [x] Generate optimized WebP derivatives from nominated real photos in `assets/images/` (widths 480/960/1440, `srcset`-ready; hero 8:9 diptych panels per §9; 4:5 category tiles zero-crop; product cards native 4:5). Nominated sources verified to exist: `2026/09/10.jpg`, `2026/09/18.jpg`, `2026/07/4-2.jpg`, `2026/07/31-1.jpg`, `2026/09/Pocket2.jpeg`, the eight grid products of §8, and both logo files with alpha.
- [x] Recolor only the logo (white / brown `#412311` alpha-mask variants per §5). No photo recoloring.
- [x] Self-host fonts as WOFF2 (6 files): Barlow 400/500/600/700 (UI/body per PLAN §3 "Barlow") and Bodoni Moda 400 regular + italic (Concept 3 serif display). No CDN requests.
- [x] Build `assets/demo-data.json`: 12 products sourced from `data/products.json` (IDs 31845 `Rs 3,990.00`, 31800 `Rs 3,890.00`, 31787 `Rs 3,890.00`, 31836 `Rs 3,990.00`, plus 8 ranked alternates), 4 category cards, hero slide nominations, editorial embroidery macro, personalisation names, logo paths, font list. Images referenced as relative `assets/images/...` paths.
- [x] Hero copy fields use measured copy-space sides per §6/§9 (left in most `2026/09`/`2026/10` slabs; `2026/09/17.jpg` and `2026/06/22.png` right).

## Task 2 — Store module with tests (frontend agent)

- [x] `store.mjs`: pure-JS module, no DOM dependency. Exposes cart state, wishlist state, and derived subtotal; validates the product/variant exists in `assets/demo-data.json` before accepting; reads/writes `localStorage` (`lc2202.cart`, `lc2202.wishlist`) with JSON persistence and corrupt-value fallback to empty state.
- [x] `store.test.mjs`: Node built-in test runner. Cases: valid variant accepted; invalid variant rejected; cart subtotal math correct for mixed quantities; remove shrinks total; persistence — write, reload state, read back identical from `localStorage`. Run: `node --test store.test.mjs` from `html-demo/`.

## Task 3 — Shared CSS token layer (frontend agent)

- [x] `styles.css` token layer: base mono tokens (`#FFFFFF`, `#000000`, `#111111`, `#1A1A1A`, `#E5E5E5` hairlines) with `data-palette` switch. Palette `mono`: no accent anywhere. Palette `brown`: brand brown `#412311` only on eyebrow small-caps, link hover/underline accents, the logo mark, and the one permitted footer surface (§4). Same layout behind both palettes.
- [x] Concept modifiers via `data-concept`: header height (transparent overlay ~72+ px; solid studio bar; maison masthead + ruled nav bar), type scale, 900-weight uppercase studio headings, serif display for maison, gutters ≤2.5% side margin, edge-to-edge sections.
- [x] Brown footer usable only in palette brown bodies, never as full takeover backgrounds on the page flow.

## Task 4 — Three strongly differentiated header/hero variants (frontend agent)

- [x] **Atelier** (`concept=atelier`): transparent overlay header with centered stacked logo mark (60–80 px width), nav row + search/wishlist/cart utilities in the same bar; hero = 50/50 two-panel diptych at ~70–90 svh desktop (8:9 from 4:5 sources), small overlay copy in measured copy-space, then opaque + `#E5E5E5` hairline on scroll. Mobile: single portrait panel per slide (§9).
- [x] **Studio** (`concept=studio`): solid white slim header, logo left, 900-weight uppercase nav immediate, strongest utility emphasis; no transparency on load; hairline after scroll. Hero = collection slider, two visible slides with peek, bright commerce-forward 4:5 tiles.
- [x] **Maison** (`concept=maison`): masthead section with centered mark ~80 px wide on its own band above a fine-ruled nav bar (static, no overlay); hero = full-width landscape composition built from two real panels side by side (never a single cropped landscape); editorial serif display heading (roman + italic mix from Bodoni Moda), restrained sans UI text.
- [x] Shared slider behavior for all three: 3 real-photo slides, arrows + `1 / 3` counter, keyboard operable, swipe on touch, `aria-live` slide announcement, manual only (no autoplay), fade/no-motion transition under `prefers-reduced-motion`, first hero image preloaded with correct `fetchpriority`, `srcset`/`sizes` on every hero and grid image, below-viewport images lazy-load.

## Task 5 — Comparison index + query-parameter routing (frontend agent)

- [x] `index.html`: static, six working links to `preview.html?concept=<c>&palette=<p>` covering atelier/studio/maison × mono/brown; each link labeled with concept and palette name so a reviewer can flip directly. No building the homepage markup here.
- [x] `preview.html`: single template whose `data-concept`/`data-palette` attributes derive from `URLSearchParams`; falls back to `atelier`/`mono` for missing or invalid values (never a broken state). Section anatomy per §7 in order: hero slider, category strip, new-arrivals grid, pair banners, personalisation close-up, footer.
- [x] Route pages (same file pattern): `collection.html?category=<slug>` (all ten top-menu categories resolvable: Dresses, Tops, Bottoms, PJ's, DENIM, Sets, Ribbed, Sale, Bags, Scrunchies), `product.html?id=<id>`, `cart.html`, `wishlist.html`, `search.html?q=<query>`, `page.html?slug=<slug>`, `account.html`, `order-tracking.html`. Every route reads `concept`/`palette` from the query, falls back to `atelier`/`mono`, and links between routes carry the params forward. No product popups: product selection happens on dedicated `/product.html?id=…` pages.

## Task 6 — Functionality (frontend agent)

- [x] Mobile navigation drawer (hamburger) with focus trap, Escape close, focus return to invoker.
- [x] Search overlay over `demo-data.json` products; Enter/submit navigates to `/search.html?q=<query>`; empty query and no-result states readable. Removed behavior: no in-page matching-product popup — results are a route.
- [x] Category links navigate to `/collection.html?category=<slug>`; the collection page's product links navigate to `/product.html?id=<id>`. No `href="#"` or nonfunctional anchors: every link either triggers a real handler or points at a real reachable route. No in-page selection panel, no quickview dialog anywhere.
- [x] Product page `/product.html?id=<id>`: image, name, real price, size choice (rejected state — add-to-cart stays inert until a size is selected), quantity stepper, add-to-cart feedback, wishlist toggle. Cart: quantity +/- and remove without stale totals, running subtotal from `store.mjs`, cart page `/cart.html` with empty state; the homepage cart drawer keeps the same store.
- [x] Wishlist lives in `localStorage` via `store.mjs`; header wishlist control shows its count and links to `/wishlist.html`.
- [x] Checkout action inside the cart explicitly labels itself as a demonstration — "no payment" notice; no payment flow, no order placement.
- [x] Information pages (`/page.html?slug=`): render `pages-data.json` content exactly; the contact page shows the sanitized published info (map embed optional to drop) and the demo contact form; effective submit always ends in a visible "Preview: message not sent" state, never a fake success path.
- [x] `/account.html` — static inert login demo (Username or email address / Password / Log in / Remember me / Lost your password?); no account creation, no fabricated orders.
- [x] `/order-tracking.html` — order ID + billing/lookup demo mirroring the WP page shape; any Track action yields an explicit "no orders found in this demo" state; no fabricated order results, no customer data.
- [x] Footer on every route carries the real other-page links (six information pages, Order Tracking, Account, Cart, Wishlist) and carries no dead social icons; the top menu exposes all ten main categories.

## Task 7 — Responsive + accessibility (frontend agent)

- [x] Works without horizontal overflow at 375, 768, and 1440 px for all six previews (§10, PLAN §8).
- [x] Keyboard: all hero arrows, nav items, dropdown triggers, search overlay, drawers operable with visible focus; logical tab order across every route page.
- [x] Drawers and dialogs: focus moves in on open, trapped while open, Escape closes, focus returns to the invoking control on close.
- [x] `prefers-reduced-motion`: slider fade/no-motion, no slide autoplay motivation — transitions reduced, motion-critical states still readable.
- [x] Contrast: both palettes text meets WCAG AA; overlay copy sits in measured copy-space zones over photos, not arbitrary scrims.

## Task 8 — Interactive verification (docs owner + both agents sign off)

**Status: complete — fresh results recorded in `docs/DEMO-VERIFICATION.md`.**

- [x] Start server: `python3 -m http.server 4173 --bind 0.0.0.0` from `html-demo/`; confirm it serves every route and returns 200: `preview.html` with each `?concept=...&palette=...` combination (atelier/studio/maison × mono/brown), plus `index.html` and the remaining route pages (`collection.html?category=…`, `product.html?id=…`, `cart.html`, `wishlist.html`, `search.html?q=…`, the six `page.html?slug=…` values, `account.html`, `order-tracking.html`).
- [x] Validate at 375, 768, 1440 px on each of the six variant previews and on each added route page: no horizontal overflow, correct per-concept header/hero (three visibly distinct headers), correct per-palette tokens (mono shows zero brown anywhere; brown shows brown only in §4-allowed slots).
- [x] `index.html` six links produce exactly the six query-parameter combinations; each target renders the requested variant (application defaults `atelier`/`mono` when params missing).
- [x] Interaction accuracy against `assets/demo-data.json` (and spot-check prices/names back against read-only `data/products.json`): the `/product.html?id=…` page shows the real name/price/image/sizes (UK06/XS…UK16/2XL) for its id; cart subtotal recomputes after qty +, qty −, and remove; wishlist survives page reload; `/collection.html?category=…` lists only that category's real products.
- [x] No placeholder links: grep for `href="#"`/dead anchors returns nothing; category and product controls all drive the panel/dialog, never dead-end.
- [x] No uncaught JavaScript errors in any flow (open server console during the full walkthrough: navigation, search, collection filtering, product page, size selection, cart mutations, wishlist, reload persistence, each information page).
- [x] All routes resolve and return 200 from the demo server: `preview.html` (all six combinations), `collection.html` (each of the ten top-menu categories present later; at least Dresses/PJ's/Sale empty-state and a populated one), `product.html` (one real id + one unknown id handled gracefully), `cart.html`, `wishlist.html`, `search.html?q=…` (hit and no-hit), each of the six `page.html?slug=` values, `account.html`, `order-tracking.html`; zero `href="#"` dead anchors anywhere; every internal link resolves to a real route or tel/mailto; every route page carries the concept/palette query forward or defaults cleanly.
- [x] Information-page content match: `page.html?slug=<s>` HTML body equals `pages-data.json` `contentHtml` for each of the six slugs; contact page shows the sanitized published address/phone/email (`docs/PAGE-CONTENT.md` §4) and the demo form fields [First Name, Last Name, Email, Your Message].
- [x] Demo-honesty checks: contact form submit always yields the visible "message not sent" preview notice (no fake success anywhere); order tracking yields "no orders found" demo state (no fabricated orders, no customer data); account page creates no state.
- [x] Social record honored: no social icons with guessed/fake handles render anywhere (`pages-data.json` social is an intentional empty array).
- [x] All asset requests return 200: every `srcset` resolution loads, no 404 images/fonts/data; zero external/localhost-origin requests.
- [x] Node store tests pass: `node --test store.test.mjs` from `html-demo/`.
- [x] Checkout shows the explicit demo/no-payment notice; anywhere else in the demo there is no payment step.
- [x] Mark per-checkpoint results here; then request owner/client review. Verification failure re-opens the owning agent's task above — it does not gate on a new approval.

---

## Task 9 — Information-page content layer (docs agent) — delivered 2026-10-22

- [x] `assets/pages-data.json` written: 6 pages (`about-us` 4400, `contact-us` 4439, `privacy-policy` 29129, `delivery-policy` 29131, `refund-policy` 29133, `terms-conditions` 29127; all verified `publish` live), `contact` record (address "435/20A, St. Joseph Estate, Dalugama, Kelaniya", phone `+94773672202`, email `Info@2202lovecolombo.com`, fields First Name/Last Name/Email/Your Message), `social` record (intentionally empty — no brand handles exist anywhere in WP; footer socials are dead `#` anchors in the source).
- [x] Content read from `_elementor_data` Elementor source JSON (not rendered theme HTML); WP header/footer/announcement markup never entered the data.
- [x] Sanitization verified by scan: no `<script>`, no `on*` handlers, no `wd-`/Elementor classes, no WP shortcodes, no `<img>`, zero `localhost` strings inside any `contentHtml` (the only `localhost:8099` strings are `sourceUrl` provenance fields).
- [x] Link audit: 9 hrefs total — `tel:+94773672202` ×3, `mailto:info@2202lovecolombo.com` ×2, `mailto:Info@2202lovecolombo.com` ×1, `page.html?slug=contact-us` ×1, `page.html?slug=refund-policy` ×1, `page.html?slug=privacy-policy` ×1; plus the one external Google Maps embed `<iframe>` (documented in `docs/PAGE-CONTENT.md` §3).
- [x] `scripts/export-demo-pages.php` delivered: read-only WP source re-extraction (page rows + Elementor JSON + published contact form fields), `php -l` clean, live-tested via `wp eval-file`.
- [x] `docs/PAGE-CONTENT.md` records provenance, sanitization rules, image-needs for the asset agent, the demo contact/orphan-state contracts, and the WP data conflicts inherited from discovery.
- Route wiring of these pages into `page.html?slug=…` remains frontend-agent work (Tasks 5/6 above); Task 8 verifies delivery.
