# 2202 Love Colombo — HTML Demo and Shopify Theme Plan

Date: 2026-10-22
Status: Product, function, and image discovery completed and verified 2026-10-22. Design direction approved by the owner 2026-10-22 (`docs/DESIGN-DIRECTION.md`, all six previews). Owner steering correction recorded 2026-10-22: the demo scope is the **full page set, not homepage-only** — every route keeps the approved concept/palette query so the same six design variants apply across collection, product, cart, wishlist, search, information, account, and order-tracking pages; no product popups, all destinations are separate webpages. Multipage demo ready for client review; verification recorded in `docs/DEMO-VERIFICATION.md`.

## 1. Project objective

Create a Shopify theme for 2202 Love Colombo, currently running on WordPress and WooCommerce.

The delivery sequence is:

1. Understand the existing storefront, content, assets, and shopping experience.
2. Agree on the design direction and HTML demo scope.
3. Build a responsive, standalone HTML demo for client review.
4. Record client feedback, revise the demo, and obtain explicit approval.
5. Convert the approved experience into a Shopify Online Store 2.0 theme.
6. Validate the theme in a Shopify development store before launch planning.

The HTML demo is the first deliverable. Shopify development starts only after client approval of the demo.

## 2. Local environment

| Item | Value | Evidence |
| --- | --- | --- |
| Workspace | `/home/vjranga/Documents/2202` | Inspected directory |
| Project planning folder | `/home/vjranga/Documents/2202/shopify-theme` | Created for this project |
| WordPress installation | `/home/vjranga/local/2202lovecolombo` | Inspected directory |
| Local storefront | `http://localhost:8099/` | Homepage, shop, and product page opened successfully |
| Database | `2202lovecolombo_db` | Supplied by project owner |
| Database user | `2202lovecolombo_user` | Supplied by project owner |
| Table prefix | `wp_` | Supplied by project owner |
| Nginx site | `2202lovecolombo` | Supplied by project owner |
| WordPress version | `7.1.3` | Verified 2026-10-22 with `wp core version`; WooCommerce 11.2.0 verified with `wp plugin list` (`docs/PAGE-INVENTORY.md` §1) |

No database credentials are required for the initial HTML design work. Existing backup archives and audit documents are present in the workspace. The workspace is not currently a Git repository.

## 3. Current project understanding

### Business and brand

- Store name: **2202 Love Colombo**.
- Homepage title: **2202 Love Colombo - Made with Love**.
- Product focus: women's clothing, sleepwear, and accessories.
- Prices display in rupees using `Rs.`. Confirm the intended Shopify store currency during setup.
- Current announcement: **Free Shipping for orders above Rs 5000**. Confirm this offer before publishing the demo.
- Current body and heading font: **Barlow**, with sans-serif fallbacks.

### Existing platform and source material

- The installation includes Woodmart and Woodmart Child theme directories.
- Rendered storefront markup and assets identify the Woodmart/WooCommerce experience.
- Existing audit documentation describes Elementor, Smart Slider, and other WordPress integrations. Those historical findings are context, not a verified inventory of the current restore.
- Existing logos, product photography, desktop banners, and mobile banners are available under `wp-content/uploads/`.
- Use the local installation as the reference for content and current behavior. Copy selected public assets into the demo later so the client preview does not depend on localhost.

### Navigation observed

- Main links: Home, Shop, About us, Contact us.
- Categories: Dresses, Tops, Bottoms, PJ’s, Denim, Sets, Ribbed Series, Sale, Bags, and Scrunchies.
- Tops subcategories include Blouse, T-Shirts, and Hoodies/Jackets.
- Bottoms subcategories include Pants, Skirts, and Shorts.
- Utility destinations include Cart, Checkout, Wishlist, Compare, and Login/Register.
- Footer destinations include Order Tracking, Privacy Policy, Delivery Policy, Return & Refund Policy, and Terms & Conditions.

### Homepage observed

- Shipping announcement.
- Logo, desktop navigation, mobile navigation, and cart entry.
- Banner slider with separate desktop and mobile imagery.
- Product sections headed **NEW ARRIVALS**, **Women's Collection**, and **New PJ Collection**.
- Footer with contact information, navigation, policies, and categories.
- Mobile sticky toolbar with Home, Shop, Wishlist, and My account.

### Shop page observed

- Product cards with images, product names, categories, and rupee prices.
- Installment-payment messaging on product cards.
- Price, size, and stock-status filters; sorting controls.
- The inspected shop page renders 12 product cards. This is not a total catalog count.

### Product page observed

Reference: `http://localhost:8099/product/love-notes-pj-set/`

- Product: **Love Notes PJ Set**.
- Displayed price: **Rs.3,990.00** at inspection time.
- Product photography, description, and feature list.
- Sizes: UK06/XS, UK08/S, UK10/M, UK12/L, UK14/XL, and UK16/2XL.
- Quantity control, Add to cart, Buy now, Wishlist, Compare, and Size guide.
- Description, Additional information, and Size guide tabs.
- Installment messaging and an estimated-delivery display.

Stock, price, shipping, installment terms, and delivery dates remain reference content until confirmed. Sales and visitor counters must not become fabricated live claims in the demo.

### Reference assets located

- Logo: `wp-content/uploads/2025/07/love-colombo-logo.png`.
- Desktop banners include `wp-content/uploads/2026/03/WEB-BANNER-PC-2-1.jpg` and `WEB-BANNER-PC-1920-X-700.png`.
- Mobile banners include `wp-content/uploads/2026/03/WEB-BANNER-MOBILE-2.png` and `WEB-BANNER-MOBILE.jpg`.
- Reference product gallery includes `wp-content/uploads/2026/10/34.jpg`.

These are candidate source assets, not a final asset selection.

### Discovery milestone — completed and verified 2026-10-22

Product, function, and image discovery is complete. Machine verification status is **pass** with an empty issues list (`data/verification-report.json`); project index in `README.md`.

- **Catalog:** 116 published products and 597 published variations (113 variable, 3 simple) exported read-only and matched against SQL with zero identity, content, or meta mismatches (`docs/DISCOVERY-SUMMARY.md`, `docs/PRODUCT-CATALOG.md`, `data/products.json`).
- **Pages and functions:** 18 public routes plus navigation, product-page elements, forms, states, payments, and shipping configuration documented with evidence markers (`docs/PAGE-INVENTORY.md`, `docs/FUNCTIONAL-REQUIREMENTS.md`).
- **Images:** 5181 images totalling 761,489,786 bytes copied to `assets/images/` with a SHA-256 manifest; all 450 product image attachments, 1092 product image references, and 112 inline references resolve to a copied file (`docs/IMAGE-LIBRARY.md`, `assets/image-manifest.json`).
- **Configuration:** personalisation (1 set, 6 assigned products, 2 placements, 4 images), 2 size guides with 112 product links, taxonomies, and payment and shipping option values captured read-only (`data/personalisation.json`, `data/size-guides.json`, `data/taxonomies.json`).

## 4. Design approaches to choose from

### A. Brand-preserving refresh — recommended

Retain recognizable branding, products, and category structure. Improve spacing, typography hierarchy, product presentation, and mobile usability.

Benefit: gives the client a familiar foundation while improving the storefront. Trade-off: requires agreement on how far the visual refresh should go.

### B. Close recreation of the current storefront

Reproduce the existing layout and styling as closely as practical before Shopify conversion.

Benefit: straightforward comparison and reduced visual change. Trade-off: may preserve current clutter and platform-specific design choices.

### C. Full visual redesign

Develop a substantially new storefront using the existing brand and product assets.

Benefit: greater freedom to improve brand presentation. Trade-off: more design decisions, feedback cycles, and potential asset needs.

**Approved 2026-10-22:** the drafted design brief `docs/DESIGN-DIRECTION.md` was approved in full by the owner. The mandated direction is the image-led storefront treatment (approach C's freedom, applied to the approved full-width image-first homepage), executed through the two-palette / three-concept preview set in that brief, with later pages built from the approved shared components.

## 5. HTML demo scope (page list approved 2026-10-22; full set steered same day)

The owner approved the demo scope; the five-page minimum below became the **complete** route list with pages beyond the homepage steered in as separate webpages — see "Approved steering rules" in this section and `docs/PAGE-CONTENT.md`.

### Completed milestone

The full multipage HTML demo is ready for client review. Homepage includes six selectable previews; commerce and information routes use separate documents.

### Complete review demo

1. **Homepage**: announcement, navigation, hero, categories, featured collections, and footer.
2. **Collection/shop page**: product grid, sorting, filters, and empty-result state.
3. **Product page**: gallery, size selection, quantity, product information, size guide, and add-to-cart feedback.
4. **Cart experience**: cart page `/cart.html` (quantities, removal, totals, empty-cart state) with the cart drawer retained on the homepage flow.
5. **Information pages**: About, Contact, Privacy Policy, Delivery Policy, Return & Refund Policy, Terms & Conditions — required, not conditional. Real published WordPress copy, sanitized, delivered in `html-demo/assets/pages-data.json` (`docs/PAGE-CONTENT.md`).

Proposed demo interactions:

- Responsive navigation and mobile menu.
- Product gallery switching.
- Size and quantity selection.
- Demonstration cart with consistent totals and clear validation.
- Representative sorting and filters using local sample product data.

Approved steering rules for all routes (2026-10-22):

- Separate webpages, no popups: `/collection.html?category=<slug>`, `/product.html?id=<id>`, `/cart.html`, `/wishlist.html`, `/search.html?q=<query>`, `/page.html?slug=<slug>`, `/account.html`, `/order-tracking.html`.
- The homepage concept/palette query (`?concept=atelier|studio|maison&palette=mono|brown`) carries over unchanged onto every route, so a reviewer sees the same six design variants everywhere.
- Top menu lists all ten main categories (Dresses, Tops, Bottoms, PJ's, DENIM, Sets, Ribbed, Sale, Bags, Scrunchies). The footer links the actual other pages: the six information pages, Order Tracking, Account, Cart, Wishlist.
- Contact form cannot actually send in a static demo: it shows a clear "Preview: message not sent" notice instead. Fake success is prohibited.
- Order tracking shows no fabricated found orders; Account is a static, inert login demo.
- Compare remains out only because the two approved stores have no compare destination in the nav tree; if the client asks, it follows the same demo-state rules.

Payment processing, order placement, customer authentication, and stock synchronization are not HTML demo features. Any checkout handoff must clearly indicate that the preview is a demonstration.

## 6. Proposed implementation structure

The workspace separates read-only discovery output from verified demo code. Shopify theme conversion remains future work after client approval:

```text
shopify-theme/
  PLAN.md
  README.md                      (exists - project index)
  docs/                          (exists - discovery documentation)
    DISCOVERY-SUMMARY.md
    FUNCTIONAL-REQUIREMENTS.md
    IMAGE-LIBRARY.md
    PAGE-INVENTORY.md
    PRODUCT-CATALOG.md
    PAGE-CONTENT.md              (information-page content provenance and sanitization record)
    client-feedback.md           (proposed - after demo review)
    approval.md                  (proposed - after demo review)
  data/                          (exists - catalog exports and verification)
    products.json
    taxonomies.json
    product-images.json
    size-guides.json
    personalisation.json
    verification-report.json
    export-personalisation.php
    reconcile-verify.py
  assets/                        (exists - copied image library)
    image-manifest.json
    images/
  scripts/                       (exists - reproducible tooling)
    copy-image-library.py
    export-demo-pages.php        (read-only information-page source re-extraction)
  html-demo/                     (approved and created 2026-10-22)
    index.html                   (comparison index: six preview links)
    preview.html                 (homepage template; query chooses concept+palette)
    styles.css
    app.js
    store.mjs
    store.test.mjs
    assets/
      demo-data.json
      pages-data.json            (six information pages + contact + social record)
      images/                    (optimized WebP derivatives of real photos)
      fonts/                     (self-hosted Barlow + Bodoni Moda WOFF2)
  theme/                         (proposed - created after approval)
    assets/
    config/
    layout/
    locales/
    sections/
    snippets/
    templates/
```

Use HTML, CSS, and lightweight JavaScript for the demo unless a concrete requirement justifies additional tooling. Use a local HTTP server when loading JSON data. Keep sample data separate from presentation and structure repeated visual components so they map cleanly to Shopify sections and snippets.

The `docs/`, `data/`, `assets/`, and `scripts/` directories already exist and hold the verified discovery output indexed in `README.md`. `html-demo/` was created after the 2026-10-22 approval; its single `preview.html` is driven by query parameters (`?concept=atelier|studio|maison&palette=mono|brown`) instead of separate collection/product/cart pages for this milestone, so every variant shares one code path. `theme/` remains future work for Phase 5.

## 7. Delivery phases and approval gates

### Phase 1 — Discovery and scope (COMPLETE 2026-10-22)

- Complete the current-page and asset inventory.
- Review the storefront at desktop and mobile sizes.
- Confirm brand direction, reference sites, page list, required features, and approved content.
- Confirm which existing behaviors should be retained or removed.

**Exit:** owner approves the design approach and HTML demo scope.

### Phase 2 — Homepage design and demo (owner approval recorded 2026-10-22)

- Agree on colors, type scale, spacing, image treatment, and shared components.
- Build the responsive homepage using approved local assets (front-end agent; six selectable previews per `docs/DESIGN-DIRECTION.md`).
- Verify interactions and responsive behavior (`docs/IMPLEMENTATION-PLAN.md` Task 8 — pending).

**Status:** owner approved the design direction 2026-10-22 and immediately steered the demo to the full page set (separate webpages for every route; no product popups). No further internal approval gate exists; the steering record entered Phase 3 scope on the record date. **Exit:** client approves the visual direction, or supplies a consolidated revision list — reached only after verification completes.

### Phase 3 — Full HTML demo (all routes, per the 2026-10-22 steering record)

- Apply approved components to the full page set listed in §5: the homepage routes plus `/collection.html?category=…`, `/product.html?id=…`, `/cart.html`, `/wishlist.html`, `/search.html?q=…`, `/page.html?slug=…`, `/account.html`, and `/order-tracking.html`.
- Implement agreed demonstration interactions and states — no product popups; every destination is its own webpage.
- Information pages render the sanitized published copy from `html-demo/assets/pages-data.json` (`docs/PAGE-CONTENT.md`); the contact form and order tracking follow the honest preview rules (no fake send, no fake orders).
- Optimize selected assets and validate responsive behavior.
- Provide a shareable preview that does not depend on the developer's WordPress installation.

**Exit:** client can review all agreed pages and interactions.

### Phase 4 — Client approval

- Record feedback, decisions, and revisions in `docs/client-feedback.md`.
- Record approved pages, preview version, date, approver, and any accepted limitations in `docs/approval.md`.
- Obtain explicit client approval before Shopify conversion.

**Exit:** approved HTML demo is the visual reference for the Shopify theme.

### Phase 5 — Shopify theme development

- Confirm access to a Shopify development store and the theme starting point.
- Map shared UI to Liquid layout, sections, blocks, snippets, and JSON templates.
- Connect products, collections, variants, navigation, cart, and theme settings to Shopify data.
- Make appropriate content and presentation editable through the theme editor.
- Confirm Shopify-compatible solutions for any retained wishlist, compare, installment messaging, and tracking requirements.
- Keep checkout changes within the capabilities of the selected Shopify plan and supported extension points.

**Exit:** the theme reproduces the approved demo using Shopify data and supported behavior.

### Phase 6 — Validation and launch preparation

- Run Shopify Theme Check and storefront testing.
- Test variants, sold-out states, collection navigation, cart updates, and checkout handoff.
- Verify theme-editor settings and responsive layouts.
- Plan catalog migration, redirects, analytics, shipping, taxes, payment setup, domain cutover, and launch separately with the owner.

**Exit:** acceptance results are documented and launch dependencies have owners.

## 8. Acceptance criteria

### HTML demo

- All agreed pages are reachable through working navigation.
- Layouts work at representative widths of 375, 768, and 1440 pixels without unintended horizontal overflow.
- Shared styling and components remain consistent across pages.
- Selected assets load without localhost URLs or missing files.
- Interactive controls work with keyboard input and have clear labels and focus states.
- Missing size selection, empty cart, and empty filter results have understandable states.
- Demo cart quantities and totals stay consistent.
- No uncaught JavaScript errors occur in agreed demo flows.
- Client feedback is resolved or explicitly accepted, and approval is recorded.

Verification state 2026-10-22: **pending**. These criteria are checked only through `docs/IMPLEMENTATION-PLAN.md` Task 8 after the frontend and asset tasks land; nothing here is claimed done until each check is observed.

### Shopify theme

- Approved demo components map to maintainable Shopify templates, sections, and snippets.
- Product, collection, variant, price, and cart data come from Shopify.
- Merchants can edit agreed settings through the theme editor.
- Theme Check findings are resolved or documented with an accepted reason.
- Critical shopping flows pass in the development store.

## 9. Dependencies and unresolved decisions

Resolve these during scope and design discussions, one decision at a time:

1. **Design direction:** close recreation, brand-preserving refresh, or full redesign?
2. **Review scope:** homepage first, followed by which additional pages?
3. **Brand inputs:** approved logo, colors, fonts, references, and new photography, if any.
4. **Features:** retain wishlist, compare, quick view, mobile toolbar, installment messaging, and size guides?
5. **Content:** approved banners, featured collections, copy, prices, policies, and shipping offer.
6. **Client review:** reviewer, feedback method, shareable hosting, and target dates.
7. **Shopify setup:** store access, plan, base theme, app budget, and responsibility for catalog migration.

No schedule or fixed price is established by this document.

## 10. Inspection boundaries and notes

- The initial planning pass inspected the workspace, WordPress directory, theme directory, and three storefront routes only; it did not touch the database, plugin registry, or full catalog.
- A subsequent read-only pass, completed and verified 2026-10-22, extracted the full catalog and configuration: 116 products, 597 variations, taxonomies, size guides, personalisation settings, the active-plugin list, and payment and shipping option values, all checked against the database (`docs/DISCOVERY-SUMMARY.md`, `data/verification-report.json`, status pass).
- Checkout remains unexercised. No forms were submitted and no cart, checkout, or login state was created, so the rendered checkout layout, gateway order with a filled cart, and cart drawer with items are still unconfirmed (`docs/FUNCTIONAL-REQUIREMENTS.md` §11). Payment and shipping items above were captured as configuration values, not as a rendered checkout.
- Existing audit documents refer to an older environment and must not supply current version or catalog counts without fresh verification.
- The existing local storefront reported browser console errors during inspection. Their causes were not investigated in this planning pass.
- The new demo should use selected public brand and product content rather than copying WordPress scripts or runtime dependencies.
- WordPress, its database, and existing workspace files remain reference sources for this project.

## 11. Immediate next action

Approved and in execution. The design brief `docs/DESIGN-DIRECTION.md` was approved in full by the owner on 2026-10-22 (all six previews), and steering the same day expanded the demo from homepage-only to the full page set with separate webpages and no product popups. Execution follows `docs/IMPLEMENTATION-PLAN.md`: assets and demo data are delivered, the information-page content layer is delivered (`html-demo/assets/pages-data.json`, `docs/PAGE-CONTENT.md`, `scripts/export-demo-pages.php`), the frontend agent builds `html-demo/`, then Task 8 verifies all routes at 375/768/1440 px with interaction checks before any client review is requested. Verification is pending and is not claimed done.
