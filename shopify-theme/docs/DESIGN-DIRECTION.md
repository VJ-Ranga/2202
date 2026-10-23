# 2202 Love Colombo — Design Direction Brief

**Status: APPROVED — 2026-10-22.** The owner approved this brief in full on 2026-10-22: all six previews (3 concepts × 2 palettes) proceed to implementation via `docs/IMPLEMENTATION-PLAN.md`. No further approval gate exists within this milestone; flow is execution, then interactive verification, per `PLAN.md` §7 Phase 2.

Date: 2026-10-22.

---

## 1. Purpose

This is the design decision record for the first visual milestone: the 2202 Love Colombo homepage demo. It fixes

- the date of research it rests on and what was verified live,
- two palettes,
- three header + hero concepts,
- six selectable homepage previews (3 concepts × 2 palettes),
- the exact section anatomy, data, art direction, accessibility and performance rules every preview follows,

and it recommends one concept and palette combination to review first.

Scope correction recorded 2026-10-22 (owner steering, same day as approval): the demo is the **full page set, not homepage-only** — collection, product, cart, wishlist, search, information, account, and order-tracking pages are separate webpages (`/collection.html?category=…`, `/product.html?id=…`, `/cart.html`, `/wishlist.html`, `/search.html?q=…`, `/page.html?slug=…`, `/account.html`, `/order-tracking.html`), each built from the approved shared components and each retaining the `concept` and `palette` query so the same six design variants are reviewable on every route. No product popups. The homepage remains the first applied milestone; the other routes follow it under implementation plan Tasks 4–8. The upstream research findings stand unchanged. Catalog data is untouched.

---

## 2. Inputs and evidence

This brief synthesizes four existing research documents, all dated 2026-10-22, plus the project plan:

| Source | Type | What it contributes here |
| --- | --- | --- |
| `docs/research/GLOBAL-FASHION.md` | Live-measured (Chromium/Playwright, 1440×1000, screenshots + DOM) | Ten global storefronts: header/hero geometry, split-hero pattern (COS, Aritzia), overlay headers (Zara, Uniqlo), 4:5 tile discipline (H&M, SKIMS), ranked fit, three header/hero patterns |
| `docs/research/LUXURY-FASHION.md` | Live-measured (Chromium/Playwright, ≈901×833, computed DOM) | Ten maison/retailer sites: measured header band 58–96 px, transparent-overlay header as the dominant pattern, three hero geometries (100vh bleed, 56–61vh landscape, portrait scroll-through), small text-over-hero, mono palette discipline |
| `docs/research/SRI-LANKAN-FASHION.md` | Live-verified 10 Sri Lankan stores (text fetch + limited browser checks) | Local conventions: LKR pricing, Mintpay/Koko instalment lines on cards, weekly-drop merchandising, art-directed two-crop heroes, transparent header precedent on Mimosa, black/white UI precedent on GFLOCK |
| `docs/research/ASSET-CURATION.md` | Local asset review (contact sheets, palette sampling) | What real photography exists: 4:5 studio sets, copy-space measurements, hero/category/product nominations, explicit do-not-use list |
| `PLAN.md` | Project record | Milestone order, approval gates, defined demo scope (§5), acceptance criteria (§8) |

**User-supplied screenshot set (separate from live research):** Mimosa, SKIMS, 24S, Moda Operandi, Stella McCartney, MR PORTER. These are inspiration-grade inputs supplied by the project. Five of the six (Mimosa, SKIMS, 24S, Moda Operandi, Stella McCartney) were also directly live-measured in the research documents; MR PORTER was not re-measured this session, and Mimosa's screenshot styling is inspiration beyond its live capture. The brief's mandate — an image-first, full-width fashion look — follows this user reference set, and the concepts below cite which reference supports each. No imagery, logos, or assets from any researched site is borrowed; only layout patterns are translated.

**Verification honesty carried forward from the research:** Dior was blocked (503/403) and is not assessed anywhere. No "top 10 most popular" or traffic-based claim was verified in any research document; all fit rankings there are judgment-by-fit to this brand, not popularity audits. This brief inherits that language.

**Corrected source notes (ASSET-CURATION.md fixes applied alongside this brief, verified on disk):** its manifest reference now points to `assets/image-manifest.json` (the file never lived under `data/`); the size-chart image path is `2025/09/` (was "2025/07"); an over-broad "no clean campaign image anywhere" claim is now scoped to the reviewed selection; the 8:9 crop row no longer equates a 90%-height crop with "top-of-thigh" framing; and "orphan/unattached" no longer carries a free-license implication — all photographs are explicitly a source image library pending asset decisions.

---

## 3. Mandate (user decision, recorded)

The user has explicitly directed:

1. An **image-first, full-width fashion demo** inspired by the supplied screenshot set (Mimosa, SKIMS, 24S, Moda Operandi, Stella McCartney, MR PORTER).
2. **Two palettes:** (a) a minimally original monochrome interface with a reserved brand brown, and (b) a full black-and-white interface.
3. **Three header + slider concepts**, presented as six selectable homepage previews (3 concepts × 2 palettes) so the client can compare them side by side.
4. **Real local photos only**, drawn from the copied image library; the original logo may be recolored black/white where helpful. No borrowed, external, or localhost imagery.
5. Homepage design variants as the first applied milestone; every other route carries the same concept/palette query so all six variants remain reviewable across the full page set (steered 2026-10-22).

---

## 4. Palettes

Both palettes share the same monochrome base; the palette is a token layer that switches with a single query parameter (§11). `LUXURY-FASHION.md` §5 observed that white + black text is the universal storefront language across all measured luxury sites and that brown appears nowhere as UI accent on any Sri Lankan site — so palette A is a differentiator, not a mirror.

### Palette A — "Mono + Brown" (minimally original)

- Base: white `#FFFFFF`, ink `#000000`, greys `#111111` / `#1A1A1A` for body text, `#E5E5E5` hairlines.
- The brand brown `#412311` (verified logo fill on disk, `assets/images/2025/07/love-colombo-logo-2.png`) is used **sparingly**: small caps eyebrow lines, link hover and underline accents, the logo mark itself, and one optional footer panel. Nothing wider.
- Explicitly **not allowed**: a brown or beige page takeover, sepia-graded photography, warm-tinted UI chrome. Product and hero photos keep their real colors untouched. The interface stays overwhelming white/black/grey.

### Palette B — "Pure Mono" (full black-and-white)

- Base and everything else: `#000000`, `#FFFFFF`, neutral greys only (`#111111`, `#1A1A1A`, `#E5E5E5` hairlines).
- No brand accent anywhere. Photography carries all color, exactly the observed pattern of Celine, Saint Laurent, Loewe, Chanel, Jacquemus and 24S (`LUXURY-FASHION.md` §4.4/§5).

---

## 5. Logo and header assets

- The only brand mark is the **original stacked logo**, PNG with alpha, 861×771 px on disk (`love-colombo-logo.png` white fill and `love-colombo-logo-2.png` brown fill, identical alpha masks — verified in `ASSET-CURATION.md` §2 and by file inspection).
- Headers are **72–100 px tall** (inside the 58–96 px band measured across ten maison sites); the mark renders at 60–80 px width so the stacked proportions stay sensible.
- **No invented long wordmark.** The layout never fakes a wide "two words + since 1984" style wordmark that the brand does not own.
- Both fills already match each palette (white for dark/overlay contexts, brown `#412311` for light contexts in palette A). A pure-black or pure-white recolor of the same alpha mask is permitted where helpful; this is a recolor, not a redesign.
- **On scroll every header turns opaque** with contrast against page content, with a `#E5E5E5` hairline where it sits above light content.

---

## 6. The three concepts

Every concept is a **full-width (edge-to-edge) homepage**. All hero media draws from the real local library. All three keep ≥75% of the first viewport image-led at desktop.

### Concept 1 — "Atelier / Editorial" (recommended)

**Reference lineage:** COS and Aritzia split heroes (Global research §4, §9 — ranked 1 and 6, "most architecturally aligned" and "excellent hero configuration"), maison transparent headers (Luxury research §4.1, 8 of 10 sites), Mimosa's local transparent-header precedent (SL research §1). User screenshots it respects: Mimosa, 24S, MR PORTER.

- **Header:** transparent, full-width, overlaying the hero. Centered original mark (60–80 px wide). Navigation row + utility icons (search, wishlist, cart) in the same bar. Turns opaque + hairlined on scroll.
- **Hero slider:** two real-photo panels side by side at 50/50 width, each nearly viewport high (~70–90 svh desktop). Panels are native 4:5 sources cropped to 8:9, keeping faces and the full garment in frame — the crop math that preserves the model (source 4:5 library; landscape 16:9 full-bleed throws away roughly half the frame, which the asset research already rejected). Overlay copy is small and placed in the measured empty side of each shot (`ASSET-CURATION.md` §4/§9); in most `2026/09`/`2026/10` slabs the empty side is the left, with `2026/09/17.jpg` and `2026/06/22.png` the exceptions whose empty side is right.
- **First-viewport identity:** quiet and type-restrained; the photography speaks and overlay text stays small. Copy and UI render white-on-image or black-on-image depending on the palette and the photo behind.

### Concept 2 — "Studio / Modern" (recommended second)

**Reference lineage:** SKIMS (live-measured Global research §10: solid near-white header, bold 900-weight uppercase nav rows, 16:9 hero); matched user screenshot: SKIMS.

- **Header:** slim **solid white** full-width bar, logo left, nav visible immediately, utility icons right with the strongest emphasis of the three. No transparency on load; the bar keeps its solid background and gains a hairline once the page scrolls.
- **Hero slider:** a large side-by-side **collection slider** (two visible slides with peek), bright and commerce-forward, using the studio white/grey photography set. SKIMS-influence means 4:5 discipline, and bold 900-weight uppercase in headings, but the type stays honest to the mark: short, clean, solution-oriented.
- **First-viewport identity:** cleanest merchandising-first impression of the three; reads "store first, campaign second".

### Concept 3 — "Maison / Statement"

**Reference lineage:** Mango's serif roman+italic hero headline (Global research §3), Massimo Dutti serif logo + refined type (Global research §7), Loewe caption-under-media pattern (Luxury research §3.7). User screenshots it aligns with: Moda Operandi, Stella McCartney.

- **Header:** generous masthead — the centered original mark sits large (~80 px wide) on a section of its own above the hero, underneath a fine-ruled (hairline) navigation bar with utilities. Full-width.
- **Hero slider:** a **full-width landscape strip composed from two real photos** mounted side by side (not a single landscape crop — see §9 on why a single cropped landscape is not allowed with this library). Editorial serif display heading (roman + italic mix) over or under the media, body/UI text in a restrained sans. This two-photo composition honors the "no severe portrait crop" requirement because both photos display in full-height halves; there is no single cropped landscape.
- **First-viewport identity:** the most "brand-editorial" of the three; strongest when the client wants the feeling of a fashion house, not a store.

### Trade-offs at a glance

| | C1 Atelier | C2 Studio | C3 Maison |
| --- | --- | --- | --- |
| First-viewport impression | Editorial calm, image-led | Merchandising-forward | House-brand statement |
| Header transparency | Transparent → opaque | Solid → hairline | Masthead + ruled bar, static |
| Hero media fit with library | Best (8:9 from 4:5, minimal loss) | Good (4:5/peek slider, near-zero loss) | Medium (needs a paired landscape composition) |
| Utility / shop emphasis | Medium | Highest | Lowest |
| Risk | Slightly anonymous type-first look can read as "pure imitator" | Solid header is less striking | Serif headings must earn their weight; landscape needs two well-paired photos |

---

## 7. Shared homepage anatomy (all six previews)

From top to bottom. Every image slot names a verified real file from `assets/images/` (Art direction in §9; data in §8; interaction/tech in §10–11).

1. **Hero slider — 3 real-image slides.** Arrows + numbered counter (`1 / 3`), **manual only — no autoplay**, swipe on touch, keyboard operable, honest `aria-live` announcement of slide change, honors `prefers-reduced-motion` (slide change is a fade/no-motion under the media query).
2. **Category strip — 4-up real photos** (desktop 4 columns, mobile 2 columns): PJ's, Long/Satin sets, Dresses, Bottoms — using nominated files (`2026/09/10.jpg`, `2026/09/18.jpg`, `2026/07/4-2.jpg`, `2026/07/31-1.jpg`) at native 4:5 — zero-crop category cards, not mini product photos.
3. **New arrivals — 4-up product grid** (desktop 4, mobile 2), exact verified product data (§8 table).
4. **Pair category banners** — two large side-by-side tiles (e.g. "Ribbed" mocha pair and Midnight black pair from the measured duos in `ASSET-CURATION.md` §5).
5. **Personalisation close-up** — the actual embroidery macro (`2026/09/Pocket2.jpeg`), presented as detail/atelier content, not a fake product.
6. **Footer** — clean columns, payment note kept honest (no fabricated trust marks), an optional oversized original mark on a mono surface, which in palette A may become the one permitted wider brown surface. The footer is the only place a palette-A brown surface may extend beyond a line.

Quiet instalment text (Mintpay/Koko style) is **only** included once the display rule is confirmed (see §8 note) — otherwise the preview shows price only.

Gutters are minimal at desktop: sections run edge-to-edge or at ≤2.5% side margin, in line with the full-width mandate.

---

## 8. Product grid data — exact, validated

Prices verified directly from `data/products.json` (read-only). No product data was changed.

| ID | Name | Price (display) | Featured image | Role in preview |
| --- | --- | --- | --- | --- |
| 31845 | Love Notes PJ Set | Rs 3,990.00 | `2026/10/34.jpg` | Grid 1 |
| 31800 | Blossom Crush PJ Set | Rs 3,890.00 | `2026/10/18.jpg` | Grid 2 |
| 31787 | Daisy Darling PJ Short Set | Rs 3,890.00 | `2026/10/13.jpg` | Grid 3 |
| 31836 | Blush Serenity PJ Set | Rs 3,990.00 | `2026/10/30.jpg` | Grid 4 |
| 31824 | Pink Daydream PJ Set | Rs 3,990.00 | `2026/10/26.jpg` | reserve |
| 31812 | Bow Sweet PJ Set | Rs 3,990.00 | `2026/10/22.jpg` | reserve |
| 31776 | Garden Whispers PJ Set | Rs 3,990.00 | `2026/10/10.jpg` | reserve |
| 31764 | Cherry Kisses PJ Set | Rs 3,990.00 | `2026/10/7.jpg` | reserve |

The reserved four are ranked alternates from the same `createdAt`-descending wave and can swap in without any design change. The chosen four intentionally include both current price points (two at 3,890, two at 3,990) so the price typography is exercised truthfully.

**Instalment caveat (do not ship copy yet):** `README.md` source issue 7 records that one on-sale card displayed an instalment amount that matched neither price ÷ 3. Until the Mintpay/Koko display rule is confirmed against live provider terms, the demo grid shows the price only, styled with reserved line height so the instalment row can slot in later without re-flow.

---

## 9. Imagery and art direction

- **Source-library stance.** All photography is treated as part of the local source image library pending an asset decision at preview time. `ASSET-CURATION.md` nominations (hero panels, category tiles, texture macro) are the starting shortlist; the reviewed selection contains no clean wide 16:9 campaign asset without baked text, so no concept depends on one.
- **Desktop hero:** the diptych/duo fits the model's face and garment in frame. No arbitrary landscape crop is performed: where a landscape strip is wanted (Concept 3), it is composed from paired full-height panels, not from one cropped portrait.
- **Mobile hero:** a single portrait panel per concept — 4:5 ratio or ~70 svh tall — art-directed per slide (not a mechanical re-crop of the desktop art), never "crushing" the subject's head against the frame edge.
- **Photo recoloring:** none. Real colors stay untouched in both palettes; the brand identity lives in UI chrome and typography, not in filtered photographs.

---

## 10. Accessibility and performance requirements

- **Keyboard:** every hero arrow, dropdown trigger, search overlay, wishlist/cart drawer is keyboard operable with visible focus.
- **Drawers (nav, search, wishlist, cart):** focus moves into the drawer on open, is trapped while open, Escape closes it, and focus returns to the invoking control on close.
- **Motion:** honors `prefers-reduced-motion`; slider has no forced autoplay anywhere.
- **Contrast:** both palettes clear WCAG AA for text; overlay copy over photos uses the measured copy-space zones, not arbitrary scrim gradients.
- **Performance:** first hero image preloaded with correct `fetchpriority`; `srcset`/`sizes` on every hero and grid image; everything below first viewport lazy-loads; existing image sizes are adapted first, and optimized real-photo WebP derivatives are generated in a later asset pass (the library copies are placeholders for the final optimized set).
- **Test widths:** every preview validated at 375 px, 768 px, and 1440 px without horizontal overflow, matching `PLAN.md` §8.

---

## 11. Architecture (approved; demo complete and verified 2026-10-22)

- Static HTML + CSS tokens + small purpose-built JavaScript; **no app framework**. Live state: `html-demo/` exists with optimized assets (69 WebP derivatives), self-hosted WOFF2 fonts (Barlow 400/500/600/700, Bodoni Moda 400 + italic), and `assets/demo-data.json` (full 116-product catalog, 17 categories, hero/editorial nominations); the HTML/CSS/JS layer is complete and verified per `docs/DEMO-VERIFICATION.md`.
- **Shared core:** one component set (header, hero slider, category strip, product grid, banners, drawers, footer) rendered in three header/hero variants; palette is a token layer on top of the same layout, switchable by query parameter, so a reviewer can flip palette/variant in the URL.
- `html-demo/index.html` lists all six previews as links into `preview.html?concept=<c>&palette=<p>` so a reviewer can flip variants from one place. The same two query parameters persist across `collection.html`, `product.html`, `cart.html`, `wishlist.html`, `search.html`, `page.html`, `account.html`, and `order-tracking.html`; `index.html` also links one entry page per route family so a reviewer can enter the full demo from any concept/palette combination.

---

## 12. Explicit exclusions

- No fabricated products, prices, sale badges, customer counts, reviews, "sold in last month," or "watching now" claims (`README.md` issue 5 applies permanently unless a real data source exists).
- No borrowed, external, or `localhost`-dependent imagery or URLs anywhere in the demo.
- No product data changes: `data/` exports are read-only inputs.
- No fabricated trust marks; the footer keeps honest payment copy.

---

## 13. Recommendation

**Review first: Concept 1 — "Atelier / Editorial", built in Palette B ("Pure Mono"), with Palette A ("Mono + Brown") as the immediate second preview.**

Rationale:

1. Its split hero is the strongest measured fit in the global research (COS was ranked first as the fit for both palette variants; Aritzia's two-panel hero was called "excellent" for exactly this style), and the transparent header is the dominant maison pattern (8/10 sites, `LUXURY-FASHION.md` §4.1) with a verified local precedent on Mimosa.
2. It fits the photography library best: the 4:5 studio sources require near-zero destructive cropping at 8:9 diptych panels, and the copy-space measurements support type placement without new artwork.
3. Pure-mono is the observed international store standard, and the brown accent is then applied in the adjacent preview for a direct comparison rather than being baked in before the client sees the mono base.

Concept 2 is recommended as the first fallback if the client weighs merchandising clarity over editorial tone. Concept 3 offers the most distinct brand statement but carries the highest dependency on pairing two hero photographs well.

**Decision record:** approved in full by the owner on 2026-10-22 — the brief, and all six concepts × palettes to be built as selectable previews for side-by-side client comparison (implementation order begins with the §13 recommendation: Atelier/Pure Mono, then Atelier/Mono + Brown). Same-day steering amendment: the brief's scope statement §1 was corrected as recorded above — the demo extends to the full page set with separate webpages; popups and product dialogs are replaced by dedicated routes; implementation is governed by `docs/IMPLEMENTATION-PLAN.md`; interactive verification is recorded in `docs/DEMO-VERIFICATION.md`; Shopify conversion remains future work after client approval.
