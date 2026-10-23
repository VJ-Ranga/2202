# Demo assets & data contract

Status: ready for frontend consumption (full catalog pass, v2).
Owner of this pass: assets/data preparation only (no frontend HTML/CSS/JS, no
frontend plan docs).

Date: 2026-10-22. Sources are read-only: `data/products.json`,
`data/taxonomies.json`, `data/personalisation.json` (catalog exports),
`assets/images/**` (copied library, untouched), local WP font caches.
Design basis: `docs/DESIGN-DIRECTION.md` (approved homepage previews).
Nominations honored: `docs/research/ASSET-CURATION.md` §4–§7.

---

## 1. What this pass produced

```
html-demo/assets/demo-data.json           full data contract (~800 KB)
html-demo/assets/images/                  833 WebP derivatives + 3 logo PNGs
html-demo/assets/fonts/barlow-{400,500,600,700}.woff2   (latin subsets)
html-demo/assets/fonts/bodoni-moda-400{,-italic}.woff2  (serif display)
scripts/prepare-demo-assets.py            reproducible generator + validator
```

Coverage: **451 unique source attachments** (449 referenced by
products/variants + the size-chart + the Pocket2 macro), every featured,
gallery and variation image. 480w for all, +960w where the source is ≥960px
wide, +1440w only for hero assets. No upscaling (the 2025/07–09 800px
attachments stop at 480w and their Media `src` is the 480w file).
Regenerate/revalidate: `python3 scripts/prepare-demo-assets.py` (exits
non-zero on any failure: missing source, upscaling attempt, logo alpha drift,
font identity, contract reference errors — every Media path/dim/aspect audited).

Filename plan (no attachment is copied twice — shared attachments reuse the
first claimant's file):

- first-pass preset names unchanged: `love-notes-pj-960.webp`, `<key>-alt`,
  `<key>-*-1440` etc. Existing preload references hold.
- other featured attachments: `<product-slug>-<w>.webp`
- other gallery attachments: `<slug>-g<i>-<w>.webp`
- variation attachments: `<slug>-v<variantId>-<w>.webp`
- `size-chart-30535-*.webp`, `pocket-embroidery-*.webp`

## 2. Data contract (`assets/demo-data.json`)

Top-level keys, in order: `products`, `categories`, `navigation`, `heroes`,
`editorial`, `personalisation`, `logos`, `fonts`.

```jsonc
{
  "products": [{
    "id": 31845,                       // all 116 catalog products, exact ids
    "name": "Love Notes PJ Set",
    "slug": "love-notes-pj-set",
    "sku": "",
    "price": 3990.0,                   // number, LKR, current product price
    "regularPrice": null,              // number|null; set only when source sells below regular
    "categories": ["PJ's", "Sets"],    // real taxonomy names, search-ready
    "sizes": [{"label": "UK06/XS", "available": true}],
    "image": {"Media"},
    "alternate": {"Media"} | null,     // first gallery shot when one exists
    "description": "short source intro + fabric",
    "fullDescription": "sanitized plain-text source full description",
    "stockStatus": "instock" | "outofstock" | ...,
    "gallery": [{"Media"}...],         // featured first, then public gallery, deduped
    "variants": [{...}],               // 597 total, exactly the source variations
    "sizeGuide": "assets/images/size-chart-30535-960.webp" | null
  }],
  "categories": [                      // all 17 real product_cat terms
    {"name": "Dresses", "slug": "dresses", "image": {"Media"},
     "parentId": null, "description": null, "count": 18},
    {"name": "Blouse", "slug": "blouse", "image": null,
     "parentId": 72, "description": null, "count": 17}
    // only Dresses/Tops/Bottoms/PJ's carry image Media (first-pass tiles preserved)
  ],
  "navigation": [                      // exact primary order, real slugs
    {"name": "Dresses", "slug": "dresses", "children": []},
    {"name": "Tops", "slug": "tops", "children": [
      {"name": "Blouse", "slug": "blouse"},
      {"name": "T-Shirts", "slug": "t-shirts"},
      {"name": "Hoodies/Jackets", "slug": "jackets"}]},
    {"name": "Bottoms", "slug": "bottoms", "children": [
      {"name": "Pants", "slug": "pants"},
      {"name": "Skirts", "slug": "skirts"},
      {"name": "Shorts", "slug": "shorts"}]},
    {"name": "PJ's", "slug": "pjs", "children": []},
    {"name": "DENIM", "slug": "denim", "children": []},
    {"name": "Sets", "slug": "sets", "children": []},
    {"name": "RIBBED SERIES", "slug": "ribbed", "children": []},
    {"name": "Sale", "slug": "sale", "children": []},
    {"name": "Bags", "slug": "bags", "children": []},
    {"name": "Scrunchies", "slug": "scrunchies", "children": []}
  ],
  "heroes": [{                         // exactly 3 slides, matching real pairs
    "eyebrow": "Satin Pyjamas",
    "title": "Midnight & Burgundy",
    "description": "Personalised satin sets in jet black and deep burgundy, finished with contrast piping.",
    "category": "PJ's",
    "left":  {"Media"},                // slide 1 left = 31662 featured (full-body Midnight)
    "right": {"Media"}
  }],
  "editorial": {"left": {"Media"}, "right": {"Media"}},
  "personalisation": {"image": {"Media"}, "title": "Add Your Name", "description": "..."},
  "logos": {"black": "assets/images/love-colombo-logo-black.png",
            "white": "assets/images/love-colombo-logo-white.png",
            "brown": "assets/images/love-colombo-logo-brown.png"},
  "fonts": {"body": "Barlow"}
}
```

```jsonc
// variants — every entry is one source WooCommerce variation, no merging
{
  "id": 29370,
  "options": {"Size": "UK08/S"},       // label -> value from the source attributes
  "size": "UK08/S",
  "price": 3490.0,                     // number|null — 3 source variations ship
                                        // without a price and stay null, unsellable
  "regularPrice": 5990.0,              // number|null (source compare-at)
  "available": false,                  // variation instock AND has a valid price
  "image": {"Media"} | null
}
```

```jsonc
// Media — every value exact and verified:
{
  "src": "assets/images/burgundy-long-set-960.webp",
  "srcset": "assets/images/burgundy-long-set-480.webp 480w, \
             assets/images/burgundy-long-set-960.webp 960w, \
             assets/images/burgundy-long-set-1440.webp 1440w",
  "width": 960, "height": 1200,      // intrinsic size of the `src` file
  "alt": "Model wearing the Burgundy Dreams Long Set on the grey studio sweep",
  "position": "50% 10%"              // suggested CSS object-position for its slot
}
```

Rules the frontend may rely on:

- `width`/`height` are always the intrinsic dims of `src`; every srcset width
  keeps that aspect ratio. No derivative is cropped — crop with CSS
  `object-fit: cover` using `position`.
- `src` is the largest available fallback: the 960w file, else the 480w file
  for the 800px-only 2025 attachments (only the 2025/07/09 sets).
- Paths relative to `html-demo/`; **no external and no localhost URLs anywhere**.
- 4:5 sources render 480×600 / 960×1200 / 1440×1800; 800px attachments 480×480;
  the size chart keeps its chart ratio; Pocket2 is 3:4 (960×1280).

## 3. Pricing and buy-guard rules (no invented data)

- Product `price` = source current price; `regularPrice` set only when source
  regular exceeds current (sale), else `null`.
- Variant `price`/`regularPrice` are the variation's own authoritative source
  values. Exactly **3 variations have no price in source** (30081, 30741,
  31063) — they carry `price: null` and `available: false`; they must remain
  unsellable in UI.
- `sizes[].available` = any variation of that size with buyable stock + valid
  price. The frontend must still guard selections against the arrays — the
  data is the allowed surface, not a license to sell out-of-stock items.
- `gallery` = featured image first, then the source public gallery, unique by
  attachment; `alternate` is `gallery[1]` when a second image exists.

## 4. Hero pairings and copy placement (readability)

Hero slide 1 left panel is now the **full-body Midnight featured image of
product 31662** (`midnight-long-set-*`, 1440w available); right stays the
Burgundy featured (`burgundy-long-set-*`). Both sit on the `#d7d7d7` grey
sweep, so either palette (A or B) can place white or black overlay type in the
empty zones; A/B copy sides for slides: left panel empty LEFT, right panel
empty RIGHT (§4/§9 of ASSET-CURATION). Slides 2–3 keep the mocha/butter pairs
(`2026/07/4-2.jpg` + `2026/07/31-1.jpg`; `2026/09/10.jpg` + `2026/06/22.png`).
`category` strings are real taxonomy terms (PJ's / RIBBED SERIES / PJ's).

## 5. Category strip (4-up, all real photos, native 4:5, zero crop)

| Tile | File source | Rendered asset |
|---|---|---|
| PJ's | `2026/09/10.jpg` | `cocoa-nights-short-set-*` |
| Dresses | `2026/07/4-2.jpg` | `mocha-essential-maxi-dress-*` |
| Tops | `2026/07/1.jpg` (Butter Rib Bodysuit) | `butter-rib-top-*` |
| Bottoms | `2026/07/31-1.jpg` | `mocha-wide-leg-pant-alt-*` |

No "Satin" pseudo-collection was created — only real top-level taxonomy terms
appear; satin editorial works through hero slides and banners instead.

## 6. Editorial banners (§7.4 pair-category banners)

- `editorial.left` = the "Ribbed" mocha banner (`mocha-essential-maxi-dress-alt-*`).
- `editorial.right` = the Midnight black banner (`midnight-long-set-zip-*`).
Both visually distinct from the hero/category crops; nothing duplicates.

## 7. Sizes, filters and shop pages

- All 116 products carry the fields above — no sampling anywhere; `slug`s let
  the frontend build /shop and product routes without extra transformation.
- `categories` carries real `parentId`, source `description` (null when empty)
  and a derived product `count`; filters for sizes and price can be derived
  from product/variant data on the frontend (no schema needed here).
- `sizeGuide` is the local chart image path for 112 source-products that point
  to the "Size Chart - Body Measurements" guide; `null` otherwise (no other
  guides reference an image in source).

## 8. Logos

Source: `assets/images/2025/07/love-colombo-logo.png` (white) and
`love-colombo-logo-2.png` (brown), 861×771 PNG, identical alpha masks verified
byte-for-byte before use:

- `love-colombo-logo-{white,brown}.png`: verbatim copies.
- `love-colombo-logo-black.png`: pure-black recolor of the same mask; the saved
  file's alpha was re-verified byte-identical to the source mask after save.
  Alpha untouched; extrema 0/255.

## 9. Fonts (local only, no remote requests)

- Body: **Barlow** latin subsets 400/500/600/700, copied from the Woodmart
  local Google-fonts cache; family + OS/2 weight verified (fontTools) and CSS
  weight mapping cross-checked before copying. `fonts.body = "Barlow"`.
- Serif display (Concept 3): **Bodoni Moda 400** + italic, copied from
  `wp-content/uploads/fonts` (verified Latin coverage). Provided alongside the
  contract, which carries only `fonts:{body}` as agreed.
- No webfont CDN references exist in demo assets; missing font → system stack
  (C3 serif → Georgia).

## 10. Verification performed (all passing)

- Contract: 116 unique product ids, 597 variants (3 intentionally price-null),
  451 attachments referenced; every `src`/`srcset` path resolves on disk; every
  srcset width token matches the real file; `width`/`height` equal intrinsic
  dims of `src`; aspect uniform per srcset; Media key set exact.
- Preset path stability asserted for the original 12 grid products and their
  alternate names (frontend preload references unchanged).
- Zero `http://`/`https://`/`//`/`localhost` strings in any media path.
- Hero slide 1 left confirmed = 31662 featured full-body Midnight.
- Category counts cross-checked against real product categorization; all 17
  navigation/category slugs verified against `data/taxonomies.json`.
- Spot-checked renders: hero 1440s, category tiles, editorial banners, velvet
  800px source, scrunchies, size chart, first-wave grid and alternates.
