# Image Library

Copied from the restored WordPress media library into the Shopify theme workspace.

- **Source (read-only):** `/home/vjranga/local/2202lovecolombo/wp-content/uploads`
- **Destination:** `assets/images/` (relative paths preserved, no symlinks)
- **Manifest:** `assets/image-manifest.json` (source path, destination path, bytes, format, SHA-256 for every file)
- **Script:** `scripts/copy-image-library.py` (`python3 scripts/copy-image-library.py` to re-copy, `--verify` to re-check)

## Totals

| Metric | Value |
|---|---|
| Images copied | 5181 |
| Total bytes | 761,489,786 (726.2 MiB) |
| Full-size originals (filename heuristic) | 577 (282,825,391 bytes) |
| Generated thumbnails (filename heuristic) | 4604 (478,664,395 bytes) |

### By format

| Format | Count | Bytes |
|---|---|---|
| jpg | 4161 | 383,070,723 |
| png | 918 | 374,166,422 |
| webp | 78 | 2,911,868 |
| jpeg | 17 | 1,334,754 |
| svg | 7 | 6,019 |

No gif or avif files exist in the source. SVG files are retained as source assets only; they are not embedded, inlined, or executed.

### By source folder

| Folder | Count | Bytes |
|---|---|---|
| 2026 | 4526 | 647,811,436 |
| 2025 | 644 | 113,647,184 |
| 2021 | 4 | 3,636 |
| uploads root (WooCommerce placeholders) | 7 | 27,530 |

Folders `2023/` and `2024/` exist in the source but contain no files.

## Candidate sources

The 577/4604 originals-versus-thumbnails split and the 551 product-original count below are **filename heuristics**: files whose names lack the WordPress `name-WIDTHxHEIGHT.ext` suffix are counted as originals. This split is not verified against WordPress attachment metadata. The verified figures are the image count (5181), total bytes (761,489,786), the per-file checksums, and the product-image coverage in `docs/DISCOVERY-SUMMARY.md`.

Candidate lists use that same heuristic; pixel dimensions below were read from the copied files with Pillow.

### Logos (2 originals, 54,231 bytes)

| File | Size (px) | Bytes |
|---|---|---|
| `2025/07/love-colombo-logo.png` | 861 x 771 | 29,141 |
| `2025/07/love-colombo-logo-2.png` | 861 x 771 | 25,090 |

Each has generated variants (`-150x150`, `-335x300`, `-430x385`, `-700x627`, `-768x688`) in the same folder.

### Banners (15 originals, 5,771,512 bytes)

| File | Size (px) | Bytes |
|---|---|---|
| `2025/07/WEB-BANNER-SLIDE.png` | 1920 x 700 | 1,141,566 |
| `2025/07/MOBILE-BANNER-velvet-shop-1000-x-900-px.png` | 1000 x 900 | 803,291 |
| `2025/07/MIDDLE-BANNER.png` | 1920 x 500 | 473,507 |
| `2025/09/Beige-Gray-Aesthetic-Photo-Collage-Shop-New-Collection-Promotion-Banner-2.png` | 1920 x 700 | 514,473 |
| `2025/09/Beige-Gray-Aesthetic-Photo-Collage-Shop-New-Collection-Promotion-Banner-1000-x-900-px.jpg` | 1000 x 900 | 120,206 |
| `2026/02/Beige-Gray-Aesthetic-Photo-Collage-Shop-New-Collection-Promotion-Banner.jpg` | 1920 x 700 | 263,134 |
| `2026/02/Beige-Gray-Aesthetic-Photo-Collage-Shop-New-Collection-Promotion-Banner-1.jpg` | 1920 x 700 | 200,006 |
| `2026/02/Copy-of-WEB-BANNER-PC.jpg` | 1000 x 900 | 137,977 |
| `2026/03/WEB-BANNER-PC.jpg` | 1920 x 700 | 246,837 |
| `2026/03/WEB-BANNER-PC-2.jpg` | 1920 x 700 | 183,924 |
| `2026/03/WEB-BANNER-PC-2-1.jpg` | 1920 x 700 | 101,925 |
| `2026/03/WEB-BANNER-PC-3.png` | 1920 x 700 | 615,107 |
| `2026/03/WEB-BANNER-PC-1920-X-700.png` | 1920 x 700 | 370,818 |
| `2026/03/WEB-BANNER-MOBILE-2.png` | 1000 x 900 | 427,037 |
| `2026/03/WEB-BANNER-MOBILE.jpg` | 1000 x 900 | 171,704 |

All banner names also have generated `150x*`, `400x*`, `430x*`, `700x*`, `768x*`, `1300x*`, `1536x*` variants.

### Product images (551 originals by filename heuristic, 276,937,043 bytes)

Originals excluding logos, banners, placeholders, icons, and SVG. Full list is in `assets/image-manifest.json`; group by month:

| Folder | Originals |
|---|---|
| 2025/07 | 24 |
| 2025/08 | 5 |
| 2025/09 | 56 |
| 2025/10 | 12 |
| 2026/02 | 30 |
| 2026/03 | 78 |
| 2026/04 | 40 |
| 2026/05 | 34 |
| 2026/06 | 67 |
| 2026/07 | 90 |
| 2026/08 | 49 |
| 2026/09 | 29 |
| 2026/10 | 37 |

Largest originals are 2000 x 2500 PNG studio shots in `2026/06/` (`2026/06/21.png`–`2026/06/30.png`, `2026/06/41.png`–`2026/06/45.png`, `2026/06/47.png`, 6–10 MB each). Detailed product mapping belongs in `docs/PRODUCT-CATALOG.md` (product data agent).

### Icons / SVG source assets (7, 6,019 bytes)

`2021/08/wd-cursor-dark.svg`, `2021/08/wd-envelope-dark.svg`, `2021/08/wd-phone-dark.svg`, `2021/11/w-map-placeholder.svg`, `2025/07/wd-cursor-dark.svg`, `2025/07/wd-envelope-dark.svg`, `2025/07/wd-phone-dark.svg`

## Excluded content

Nothing under the source tree was modified. Excluded by directory:

| Excluded directory | Files | Reason |
|---|---|---|
| `jetbackup-1a129969caae/` | 38 | Backup/snapshot system data |
| `wc-logs/` | 81 | WooCommerce logs (private) |
| `fonts/` | 36 | woff2 fonts, not images |
| `elementor/` | 33 | Plugin-generated CSS/fonts |
| `facebook_for_woocommerce/` | 22 | Plugin CSV/HTML export cache |
| `woodmart/` | 13 | Theme google-fonts cache |
| `rank-math/` | 8 | SEO XML sitemaps |
| `wpcode/` | 5 | Snippet cache (HTML/JSON) |
| `woocommerce_uploads/` | 1 | Protected WooCommerce uploads |
| `wpcf7_uploads/` | 0 | Empty; private contact-form uploads |

Excluded non-image files inside otherwise-included date folders (12 total): 9 `xts-*.css` theme files (`2025/07`, `2026/06`), 1 `2026/06/VJ-Tool-Kit-1.zip` archive, 2 `2026/06/*.mp4` videos.

No PHP, SQL, logs, configs, archives, or customer files were copied. No external HTTP requests were made.

## Verification

Run `python3 scripts/copy-image-library.py --verify`. Latest run:

- Selected source images: **5181**
- Manifest entries: **5181**
- Files in `assets/images/`: **5181**
- Destination bytes: **761,489,786** (matches manifest total)
- Every destination file re-hashed and matched against its manifest SHA-256; source sizes re-checked; no unexpected extra files in destination
- Random 15-file sample re-hashed against both source and destination: 0 mismatches
- Source tree total 5430 files = 5181 copied + 249 excluded; no missing or unreadable assets
