# 2202 Love Colombo — Shopify Theme Workspace

This workspace plans and prepares the migration of the 2202 Love Colombo storefront from WordPress/WooCommerce to a Shopify theme. Discovery is complete and verified, the design direction was approved by the owner on 2026-10-22, and the multipage HTML demo is ready for client review: homepage plus `/collection.html`, `/product.html`, `/cart.html`, `/wishlist.html`, `/search.html`, `/page.html`, `/account.html`, and `/order-tracking.html`, all sharing the approved concept/palette query so the same six design variants apply everywhere; no product popups. The theme directory does not exist yet and starts only after demo approval. The WordPress installation at `/home/vjranga/local/2202lovecolombo` is a read-only source and is never modified by this project.

Date of verification: 2026-10-23. Machine-readable result: `data/verification-report.json` (status `pass`, all checks true, no open issues).

## Verified at a glance

| Item | Verified value |
| --- | --- |
| WordPress | 7.1.3 (`wp core version`) |
| WooCommerce | 11.2.0; currency LKR displayed as `Rs.` |
| Products | 116 published, 0 draft/private/trash (113 variable, 3 simple) |
| Variations | 597 published, 0 in any other status |
| Catalog mismatches | 0 (identity, content, meta, and variation checks all matched read-only SQL) |
| Size guides | 2, linked from 112 products (0 broken links) |
| Personalisation | 1 set, 6 assigned products, 2 placements, 4 images |
| Images copied | 5,181 files, 761,489,786 bytes, SHA-256 manifest |
| Product image coverage | 450/450 attachments, 1092/1092 references, 112/112 inline images resolved |
| Public routes documented | 18 (plus navigation, product-page elements, forms, states) |
| JSON exports valid | 6 of 6 |

Note: the "577 originals / 4,604 thumbnails" split in `docs/IMAGE-LIBRARY.md` is a filename heuristic, not metadata verification.

## Documentation index

| File | Contents |
| --- | --- |
| `PLAN.md` | Objective, environment, design options, demo scope, phases, approval gates, inspection boundaries |
| `docs/PAGE-INVENTORY.md` | 18 public routes with evidence markers, menus/header/footer, catalog facts, full product-page element list |
| `docs/FUNCTIONAL-REQUIREMENTS.md` | Per-function current behavior, demo behavior, Shopify mapping, P0/P1/P2 priorities, verbatim copy, open unknowns |
| `docs/PRODUCT-CATALOG.md` | All 116 products with variations, prices, categories, and image references |
| `docs/DISCOVERY-SUMMARY.md` | Independent verification record for catalog export and image reconciliation |
| `docs/IMAGE-LIBRARY.md` | Copied image library: totals, banner/logo/product candidates, exclusions, verification |
| `docs/DESIGN-DIRECTION.md` | Design brief (two palettes x three concepts, six selectable previews) — **approved by the owner 2026-10-22** |
| `docs/PAGE-CONTENT.md` | Demo information-page content: WP source IDs, sanitization rules, contact/form record, demo behavior contracts for the six information pages |
| `docs/IMPLEMENTATION-PLAN.md` | Execution record for `html-demo/`, ownership, run instructions, and verification status |
| `docs/research/GLOBAL-FASHION.md` | Live-measured visual research on ten global fashion storefronts (2026-10-22) |
| `docs/research/LUXURY-FASHION.md` | Live-measured visual research on ten luxury/maison storefronts plus 24S and Moda Operandi (Dior blocked) |
| `docs/research/SRI-LANKAN-FASHION.md` | Live-verified research on ten Sri Lankan clothing stores, local commerce conventions |
| `docs/research/ASSET-CURATION.md` | Read-only asset nominations, palette samples, crop math from the copied image library — photos are a source library pending asset decisions |

## Data index (`data/`)

| File | Contents |
| --- | --- |
| `products.json` | 116 products with variations and enriched image fields (4,854,271 bytes) |
| `taxonomies.json` | Categories, sizes, and attribute terms |
| `product-images.json` | 450 attachments, 1092 references, 112 inline references, image-library block |
| `size-guides.json` | 2 size guides with source HTML |
| `personalisation.json` | Public personalisation configuration (no customer or credential data) |
| `verification-report.json` | Full machine-readable verification result |
| `export-personalisation.php`, `reconcile-verify.py` | Reproducible read-only export and reconciliation scripts |

## Image library (`assets/`)

- `assets/images/` — 5,181 public images copied from the WordPress uploads directory, relative paths preserved.
- `assets/image-manifest.json` — source path, destination path, byte size, format, and SHA-256 for every file.
- Excluded from the copy: backup, log, cache, plugin-export, and private upload directories plus non-image files; the full exclusion list with counts is in `docs/IMAGE-LIBRARY.md`.

## Scripts

| Script | Purpose |
| --- | --- |
| `scripts/copy-image-library.py` | Re-copy the image library or verify it (`--verify` re-hashes every file, writes nothing) |
| `scripts/export-demo-pages.php` | Read-only re-extraction of the information-page Elementor sources and the published contact form (run through `wp eval-file`; writes nothing to WordPress) |
| `data/reconcile-verify.py` | Re-run catalog and image reconciliation checks |
| `data/export-personalisation.php` | Re-export public personalisation configuration read-only |

Reproduce all verification:

```bash
cd /home/vjranga/Documents/2202/shopify-theme
python3 scripts/copy-image-library.py --verify
python3 data/reconcile-verify.py
```

## HTML demo preview (ready for client review — full page set)

Run the demo (static server, no build step):

```bash
cd /home/vjranga/Documents/2202/shopify-theme/html-demo
python3 scripts/serve-demo.py --port 4173 --bind 0.0.0.0
```

Routes (owner-steered 2026-10-22: no product popups; separate webpages; the `&palette=mono|brown` and `&concept=atelier|studio|maison` query carries over onto every route so all six design variants are reviewable everywhere):

| Route | Demonstrates | Data source |
| --- | --- | --- |
| `index.html` / `preview.html?concept=…&palette=…` | approved homepage, six selectable variants | `assets/demo-data.json` |
| `collection.html?category=<slug>` | collection grid (all ten top categories in the top menu) | `assets/demo-data.json` |
| `product.html?id=<id>` | full product page with accessible size-guide modal | `assets/demo-data.json` |
| `cart.html` | quantities, removal, totals, empty state, labeled no-payment demo | `store.mjs` / localStorage |
| `wishlist.html` | saved items, empty state | `store.mjs` / localStorage |
| `search.html?q=<query>` | product search results | `assets/demo-data.json` |
| `page.html?slug=<slug>` | About, Contact, Privacy, Delivery, Refund/Return, Terms — real published WP copy, sanitized | `assets/pages-data.json` |
| `account.html` | static inert login demo (registration disabled in WP) | — |
| `order-tracking.html` | track order (no fake found orders) | — |

Current contents of `html-demo/`: full 116-product and 597-variant catalog, 17 categories, ten-category navigation, optimized real-photo WebP derivatives, self-hosted WOFF2 fonts, six sanitized information pages, and separate route documents for every approved destination. Run store tests with `node --test store.test.mjs` from `html-demo/`. Full suite: `node --test *.test.mjs` from `html-demo/`.

Status: multipage demo ready for client review. Premium header, collection, PDP, and audited personalisation refinement is integrated. Fresh verification covers 96 Node tests (65 store + 14 search overlay + 9 cart drawer + 8 autoplay lifecycle), JavaScript syntax, six homepage variants at 375/768/1440 px, pairwise header bounds across all six concept/palette variants at 375/1024/1440 px, Studio source-owned campaign banners with responsive pairs and keyboard/swipe controls, one-row premium header with four visible links plus full hamburger catalog, Sale red merchandising, newest-first collection ordering, collection filtering, search, natural 4:5 PDP media, PDP variant pricing, readable 60/40 gallery/detail layout, cart persistence, wishlist, mobile menu, invalid products, six information routes, image loading, and autoplay hero controls with 6-second accessible rotation, persistent pause, interaction/visibility/dialog guards, and reduced-motion defaults, plus zero console errors. Checkout is explicitly unavailable in this static preview; Shopify conversion and backend checkout remain future work. The demo contact form shows a visible "Preview: message not sent" notice and never pretends to send; social links are absent until the client supplies real handles (verified: WP footer socials are dead `#` anchors). Audited personalisation now supports six eligible products, one or two placements, source font/colour choices, validation, and Rs 1,000 per-unit fee. The header integrates the frozen `cart-drawer.mjs` / `search-overlay.mjs` modules: an unmodified primary click on the cart or search icon opens the accessible cart drawer / live search overlay (href and aria fallback preserved for Ctrl/Meta/Shift/Alt/middle click), the drawer reads and commits the same central cart the pages use, PDP Add to Bag opens it with the just-added item, cross-tab storage changes sync badges, and a failed CSS load falls back to the full cart/search page.

## Source issues needing a client decision

1. **Shipping copy conflict:** `/delivery/` states charges "LKR 300 – LKR 350" while the database has a flat Rs 400 rate; free shipping above Rs 5,000 matches. One source of truth is needed, plus confirmation of the announcement "Free Shipping for orders above Rs 5000".
2. **Three priced-less variations:** IDs 30081, 30741, and 31063 have no current or regular price in the source.
3. **Sparse product data:** weights and dimensions are empty for every product and variation; SKUs exist on only 16 of 116 products; no tags or brands are assigned; the `bags` category has 0 products; WooCommerce category counts for Tops and Bottoms are stale (exported relationships are authoritative).
4. **Size chart typo:** the XXL row reads "16 - 28" (likely "16 - 18") in the shared size guide.
5. **Fabricated counters:** "Items sold in last month" and "People watching this product now" are theme settings with `fake_data` sources — they must not ship as live claims without a real data source or removal.
6. **Homepage product rows:** NEW ARRIVALS, Women's Collection, and New PJ Collection showed the same sampled first 12 products; intended composition must be confirmed.
7. **Installment display:** one on-sale card showed an installment amount matching neither price ÷ 3 — verify the MintPay/Koko display rule before reusing the copy.
8. **Payment gateways:** "Bank Transfer" and "WebXPay" exist in the database but are absent from the runtime gateway list; PayHere, Koko, and MintPay each need their own Shopify integration confirmed with the provider before checkout planning.
9. **Source image URLs:** data files retain `http://localhost:8099` URLs for provenance; storefront use must switch to the copied `assets/images/` paths.
10. **Small content decisions:** footer typo "Userfull Links", the "Powered by Nihal Apparel" credit, registration currently disabled in WooCommerce, and non-existent URLs redirecting (301) to the homepage instead of a 404 page.

Checkout remains unexercised: no forms were submitted and no cart, checkout, or login state was created during discovery, so the rendered checkout and cart drawer contents are still unconfirmed.

## Information pages and demo data files

Files in the demo, with content owners recorded in `docs/IMPLEMENTATION-PLAN.md`:

| File | Contents |
| --- | --- |
| `html-demo/assets/demo-data.json` | Full 116-product catalog, 17 categories, category cards, hero/editorial nominations (asset agent) |
| `html-demo/assets/pages-data.json` | Six sanitized information pages (About/Contact/Privacy/Delivery/Refund/Terms), contact details and form fields, social record (empty — no real handles exist in WP); provenance in `docs/PAGE-CONTENT.md` (docs agent) |

## Approval record

2026-10-22 — the owner approved `docs/DESIGN-DIRECTION.md` in full: the image-first full-width mandate, both palettes, all three header/hero concepts, and all six selectable previews, built as one `preview.html` page driven by query parameters. Same-day steering correction: the demo extends to the full page set — `/collection.html`, `/product.html`, `/cart.html`, `/wishlist.html`, `/search.html`, `/page.html`, `/account.html`, `/order-tracking.html` — with the concept/palette query retained so the same six variants apply; no product popups; every destination its own webpage. Implementation record is complete. Next review point is client review of verified demo. Shopify theme conversion follows client approval. `theme/` (Phase 5) still requires demo approval before creation.
