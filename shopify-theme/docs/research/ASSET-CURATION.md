# Asset Curation — Visual Research (no code changed)

Research-only companion to `docs/IMAGE-LIBRARY.md`. Every path below is verified on disk
(2000x2500 unless noted; see `assets/image-manifest.json`, `data/products.json`).
Method: contact sheets generated in `/tmp/opencode/curation` (script preserved), each finalist
inspected at full resolution; palettes sampled with a k-dominance histogram per region.

Nothing here mutates `data/` or `assets/`. UI implementation is out of scope; this document
only nominates assets and the crop/object-position values needed once UI work starts.

**Status of all photographs:** everything listed below is treated as a source image library
pending an explicit asset decision by the project owner. Permission or license for any file is
never inferred from attachment status (including "orphan"), from file availability, or from this
document — nomination here is not clearance.

---

## 1. Palettes (sampled from real pixels)

### Palette A — Minimal Brown
| Token | Hex | Source |
|---|---|---|
| ink | `#412311` | `2025/07/love-colombo-logo-2.png` logo fill |
| card cream | `#e1c9a3` | studio backdrop, butter-yellow shoot `2026/07/1.jpg` upper-left (same sweep as `2026/07/4-2.jpg`) |
| card gold | `#e3d1ad` | `2026/07/25.jpg` highlight area |
| floor sand | `#cdbfa5` | wood-framed model floor `2026/07/31-1.jpg` corners |
| garment mocha | approx `#a0765a`-`#c39c76` (varies) | 30895 Maxi Dress bodice @ (900,1100,1300,1600) |
| wood panel | `#4a2d29` / `#472b28` | `2026/04/web-product-2000x2500-1.jpg` panel gap |

### Palette B — B&W UI
| Token | Hex | Source |
|---|---|---|
| white seamless | `#f6f6f6` | e-comm backdrop `2025/07/Untitled-design-6.png` corners |
| grey studio | `#d7d7d7` | `2026/09/2.jpg` top strip |
| garment black satin | `#060503` | 31662 Midnight Black bodice @ (900,1100,1400,1700) |
| text-safe neutral | `#1a1a1a` / `#ffffff` | inferred UI |

---

## 2. Logo B/W adaptation (already shipped)

| Asset | Path | Alpha | Verdict |
|---|---|---|---|
| white logo | `assets/images/2025/07/love-colombo-logo.png` | 861x771 | ✅ **use for B&W UI** — pure white, transparent background |
| brown logo | `assets/images/2025/07/love-colombo-logo-2.png` | 861x771 | ✅ **use for minimal brown UI** |
| octagon/second mark | not shipped in export | — | only WP placeholder webp files exist |

No CSS filter needed: a white-fill and a brown-fill version ship on disk with identical
alpha masks. White works on dark backgrounds; brown `#412311` on light, matching Palette A.

---

## 3. Layout / crop math (from 2000x2500 sources)

All curated model shots are native **4:5 (2000x2500)** — the shop's signature ratio.
| Layout | Visible (cover) | Result | object-position |
|---|---|---|---|
| PDP / category card **4:5** | 100% width, 100% height | zero crop | n/a |
| category card **1:1** | 100% width, 80% height | head-room OK | `50% 12%` |
| diptych / split-hero panel **8:9 (960x1080)** | 90% height, 100% width | feet trimmed only; where torso/waist falls depends on subject position, not a fixed crop line | `50% 10%` |
| full-bleed **16:9 hero (1920x1080)** | 45% height, 100% width | head+torso only | `50% 6-12%` |
| portrait rail **2:3** | 83% width | width trim only | `50% 50%` |

**Recommendation:** site models already shot 4:5. For the hero, prefer a **split hero
(right panel 8:9 portrait, left side typographic)** — full-bleed 16:9 throws away 55% of the
model's frame.

---

## 4. Hero nominations

### Primary split-hero (right panel = 8:9, left side = type)
| Slot | Image | Product | Subject x-span | Copy side | object-position |
|---|---|---|---|---|---|
| right panel | `2026/09/17.jpg` | 31597 Burgundy Dreams Long Set (feature) | 0.30-0.75, Rgap 0.25 | **right** | `50% 10%` |
| right panel | `2026/09/10.jpg` | 31646 Cocoa Nights Short Set | 0.317-0.733, Lgap 0.317 | left | `50% 10%` |
| right panel | `2026/09/2-2.jpg` | 31662 Midnight Black Long Set | 0.315-0.702, Lgap 0.315 | left | `50% 10%` (B&W UI) |
| right panel | `2026/06/22.png` | 30671 Sunkissed Cami Set (butter) | 0.30-0.62, **right empty** | **right** | `50% 10%` |

All four are editorial satin shots on the grey studio sweep (`#d7d7d7`). Place type on the
empty side of the model; in most 2026/09 + 2026/10 slabs the empty side is LEFT, except
17.jpg (right empty) and 22.png (right empty).

### MW / editorial (wood-panel "brand slab") — brown palette
| Image | Product | Notes |
|---|---|---|
| `2026/04/web-product-2000x2500-30.jpg` | orphan (unattached; see note in §4) | light-blue striped shirtdress, arm-up pose, 3/4 crop, dark wood behind — strong editorial slab (unattached; see §4 note) |
| `2026/04/web-product-2000x2500-25.jpg` | 30312 Rose Garden Tiered | tiered pink gingham shirt-dress against wood; wall-corner seam at left ~28% of width — mask or crop around |
| `2026/04/web-product-2000x2500-1.jpg` | 30168 Ivory Breeze Tiered | warm wood, ivory fringe, floor-sand tones |

### Orphan full-bleed editorial candidates (unattached in the export)

"Orphan" only means no product attachment was found in the catalog export.
Unattached status does not prove a free/reusable license, ownership, or that the file is unclaimed — and it does not, by itself, rule out or rule in cart-credit confusion. Every photo in this document is treated as part of the source image library pending an explicit asset decision; permissions must come from the project owner, not from absence of a product link.

| Image | Size | Mood |
|---|---|---|
| `2026/07/25.png` | 2000x2500 (2.2 MB, PNG) | **ghost-mannequin leopard bodysuit** on a tan sweep backdrop — flat product-as-object; large safe zone; hero-able as a "fabric/print" panel |
| `2026/05/27.jpg` | 2000x2500 | retro-print baby tee + black jeans, BACK view |
| `2026/05/28.jpg` | 2000x2500 | floral sheet-tee + grey denim, BACK view |
| `2026/05/2.jpg` | 2000x2500 | **B&W UI candidate**: black `COLOMBO 22` radar tee + jeans on grey studio |
| `2026/05/9.jpg` | 2000x2500 | dotted tee + blue wide-leg on grey; AD/t-shirt vibe |
| `2026/04/web-product-2000x2500-24.jpg`, `-27.jpg` | 2000x2500 | wood-panel florals (not yet pinned to a product) |

---

## 5. Diptych pairs (two-up comparisons)

| Pair | Left | Right | Reading |
|---|---|---|---|
| front / back satin | `2026/09/17.jpg` (front, right empty) | `2026/09/web-product-Love-2000x2500-1.jpg` (back 3/4 crop, left empty) | same garment (Burgundy); type sits on opposite empty sides |
| **Minimal-brown duo** | `2026/07/4-2.jpg` (mocha maxi, cream) | `2026/07/31-1.jpg` (mocha wide-leg, wood floor) | ribbed family, tonal; copy space right in both |
| **B&W duo** | `2026/09/2-2.jpg` (Midnight front) | `2026/09/3-2.jpg` (Midnight profile-zip) | black satin, tonal |
| **Warm studio duo** | `2026/06/22.png` (butter hearts) | `2026/06/31.jpg` (Golden Flutter 30710) | dessert-yellow strolls |

For 8:9 panels set both sides to `object-position: 50% 10%` — no horizontal crop at that
ratio (scaled width = 960px exactly), and only ~10% of height (the feet) is lost.

---

## 6. Category tiles (4-up ab grid — 4:5 native, zero crop)

| Tile | Use this | Product | Why |
|---|---|---|---|
| PJ's | `2026/09/10.jpg` | 31646 Cocoa Nights Short Set | warm-minimal, hands in pockets (feat 9.jpg) |
| Satin / Long | `2026/09/18.jpg` | 31597 Burgundy Dreams Long Set | flagship satin (feat 17.jpg; 18/19 back+profile) |
| Similar / Dresses | `2026/07/4-2.jpg` | 30895 Mocha Essential Maxi Dress | chocolate rib maxi, cream sweep, copy space RIGHT |
| Bottoms / Wide | `2026/07/31-1.jpg` | 31030 Mocha Wide Leg Pant | wood floor + gold heights, copy space RIGHT |

## 7. New arrivals — 8 pins (from `data/products.json` `createdAt` desc; photos verified)

| ID | Name | Price (LKR) | Path | Shoot |
|---|---|---|---|---|
| 31845 | Love Notes PJ Set | 3990 | `2026/10/34.jpg` | white studio, blush |
| 31836 | Blush Serenity PJ Set | 3990 | `2026/10/30.jpg` | white studio |
| 31824 | Pink Daydream PJ Set | 3990 | `2026/10/26.jpg` | white studio |
| 31812 | Bow Sweet PJ Set | 3990 | `2026/10/22.jpg` | white studio |
| 31800 | Blossom Crush PJ Set | 3890 | `2026/10/18.jpg` | white studio |
| 31787 | Daisy Darling PJ Short Set | 3890 | `2026/10/13.jpg` | white studio, cream |
| 31776 | Garden Whispers PJ Set | 3990 | `2026/10/10.jpg` | white studio |
| 31764 | Cherry Kisses PJ Set | 3990 | `2026/10/7.jpg` | white studio |
*(also in this wave, not pinned: 31751 Sunday Brunch 3890 `2026/10/2.jpg`; 31662 Midnight Black 4490 `2026/09/1-2.jpg`; 31654 Merlot Nights 3990 `2026/09/13.jpg`; 31646 Cocoa Nights 3990 `2026/09/9.jpg`; 31638 Teal Nights 3990 `2026/09/5.jpg`)*

---

## 8. Texture / detail / personalisation

| Image | Src | Note |
|---|---|---|
| `2026/07/7-1.jpg` | 30895 gallery | mocha rib macro, raking-light shadow |
| `2026/07/25.png` | orphan | flat leopard swatch-like bodysuit, 3-field crop possible |
| `2026/09/Pocket2.jpeg` | 1086x1448 (3:4) | satin pocket macro with script "Liyan" embroidery + ivory piping — **personalisation demo** (used by plugin data `personalisation.json`), navy/ivory |
| `2026/06/Love-Colombo2303.webp` | brand asset | heart pictogram, text-free |
| `2026/06/Edwardian-Script-ITC.jpg` / `2026/06/Freestyle-Script.jpg` | font previews | not photos; ignore for imagery |

## 9. Copy-space (ink-bbox method, 2026/09 + 2026/10 white-studio stack)

Model spans near-identical band on slab shots: **x 0.28-0.77, y 0.02-0.99.**
Left gap 0.28-0.33, right gap 0.23-0.31. Overlay copy left-of-model, centered, about 30% of
panel width. Recommend LHS text stack at x 4-28%.

---

## 10. Explicit "do not use" (seen, rejected)

- **All 15+ WEB-BANNER-*.png/jpg files** (2023-08 to 2026-03): baked-in ad copy
  (`SLEEP IN STYLE`, `VELVET SHOP`, pink hearts, gradient stock fonts) — not palette-safe,
  not editable.
- **`2025/09` denim source files are 800x800 only** — soft for anything above a 1:1 400px
  tile; do not use for hero. Denim was shot on the grey-white seamless which reads flat in
  a premium layout.
- **`2026/03` foil-sliders** (butterfly frames crinkled silver plastic) — 90s stock-backdrop
  feel, breaks both palettes.
- **Valentine pink banners** (`2026/02/Beige-Gray-...jpg`) — palette-breaking bubblegum pink.
- **`2026/03` wood-panel shots with visible wall-corner seam** at ~15-20% into the frame —
  crop or mirror-flip that half if used at width.
- `2025/09/size-chart.webp` (1536x1024) is a literal chart: good inline asset for PDP only.

## 11. Gaps that need an upload (not fixable in-theme)

- **No clean 16:9 / ultra-wide campaign image was found in the reviewed selection** without baked text (scoped to the files reviewed for this document; the wider `assets/images/` library may hold candidates). If the design needs
  full-bleed, the diptych/split-hero route is mandatory.
- **Personalised-embroidery macro** exists but is navy-only (Liyan pocket). A cream-stitch
  variant would complete the brown palette.
- **Hoodies/Jackets** category has only 7 products with no clean darkwood or ribbed backdrop —
  reuse `2025/07` seamless white catalog images (800x800) or skip the tile.

## 12. Research artifacts

- `/tmp/opencode/curation/sheetA-G.jpg` — contact sheets referenced by this doc
  (A new arrivals, B ribbed, C 2026/04-06, D legacy, E orphans, F gallery-alternates, G finalist crops).
- `/tmp/opencode/curation/rows.json` — 116-row index of every product (id, name, prices incl.
  `regularPrice`, categories, featured path, dims, gallery, createdAt, modifiedAt).
- `/tmp/opencode/curation/bbox2.py` implements ink-bbox sampling used in §9.
