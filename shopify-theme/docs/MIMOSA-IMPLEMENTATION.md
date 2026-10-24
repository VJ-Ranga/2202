# Mimosa-Inspired Colombo Edit

The Atelier direction now applies the structure observed on Mimosa to Love Colombo's own products, photography, copy, and logo. Studio and Maison remain alternative directions.

## Implemented changes

- Full-height campaign slideshow with a single model composition, editorial campaign title, bottom-centered shop link, and accessible six-second autoplay controls.
- Minimal Menu-led header with a persistent desktop Sale link, centered original logo, and existing search/cart controls.
- Horizontally scrolling new-arrivals rail with an introductory panel and four real product cards.
- Four full-bleed category photographs arranged in a two-by-two grid on desktop and a single column on mobile.
- Dark brand-statement section, three-photo lookbook, and a dedicated personalisation feature linking to an eligible product.
- Compact uppercase product-card names, alternate-image hover, and a visible option cue linking to the normal product page.
- Product pages with a horizontally scrollable portrait gallery, working thumbnail/keyboard navigation, uppercase product title, rounded size controls, and outlined Add to Bag button.

## Preserved functionality

The full catalog, variant prices, cart drawer, fullscreen search, large size-guide modal, personalisation drawer, wishlist, and separate product/cart/search pages remain available. The personalisation rules and Rs 1,000 per-unit fee are unchanged.

## Intentional differences from the reference

Only Love Colombo assets are used. The source portrait photography is composed with negative space instead of stretching it into a landscape image. Sale remains red. Controls retain accessible touch targets. Unverified instalment offers, newsletter delivery, competitor photography, and competitor brand assets are not added.

Research evidence: `research/MIMOSA-DESIGN-BLUEPRINT.md`.

## Verification

- Homepage checked at 375, 768, and 1440 pixels without horizontal overflow.
- Desktop category tiles use two columns; mobile uses one full-width column.
- Product-card navigation opens the correct product page.
- Gallery thumbnails move to the selected image and keep the active index in sync.
- Size selection and Add to Bag open the cart drawer with the correct Rs 3,990.00 line total.
- Search, the enlarged size guide, and the personalisation drawer remain functional.
- All 103 existing automated tests and JavaScript syntax checks pass.
- Verification used separate test tabs, which were closed after testing.
