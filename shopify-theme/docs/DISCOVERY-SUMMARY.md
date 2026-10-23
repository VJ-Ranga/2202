# Discovery Summary — Product Data and Image Reconciliation

Generated: 2026-10-22T11:55:23Z

Verification status: **PASS**

This is the independent verification record for the WooCommerce product export and the copied image library. It is read-only against WordPress. Source paths and URLs remain in the JSON; destination paths are added, not substituted.

## Authoritative source counts

| Item | Source count | Exported count |
| --- | ---: | ---: |
| Products | 116 | 116 |
| Products, publish | 116 | 116 |
| Products, draft | 0 | 0 |
| Products, private | 0 | 0 |
| Products, trash | 0 | 0 |
| Products, pending | 0 | 0 |
| Products, future | 0 | 0 |
| Variations | 597 | 597 |
| Variations, publish | 597 | 597 |
| Variations, draft | 0 | 0 |
| Variations, private | 0 | 0 |
| Variations, trash | 0 | 0 |
| Variations, pending | 0 | 0 |
| Variations, future | 0 | 0 |

Product types: {"variable": 113, "simple": 3}. Product descriptions, short descriptions, names, slugs, statuses, IDs, and variation parent links were compared directly against read-only SQL. Variation price, stock, and attribute fields were compared against source post meta.

All **116 product parents** and **597 variation children** are present. No product IDs, variation IDs, or parent links are missing. Both size guides and all 112 product-to-size-guide links were checked.

## JSON and catalog checks

| File | Valid | Bytes |
| --- | --- | ---: |
| `data/products.json` | yes | 4,854,271 |
| `data/taxonomies.json` | yes | 57,909 |
| `data/product-images.json` | yes | 2,002,886 |
| `data/size-guides.json` | yes | 1,471 |
| `data/personalisation.json` | yes | 15,791 |

- `docs/PRODUCT-CATALOG.md` product rows: **116**; JSON products: **116**.
- Product content mismatches: **0**; product identity mismatches: **0**; product meta mismatches: **0**.
- Variation identity mismatches: **0**; variation meta mismatches: **0**.
- Size guides: **2**; content mismatches: **0**.

## Image library

- Manifest schema: `destinationRoot, imageCount, images, source, totalBytes`.
- Manifest images: **5,181**; total bytes: **761,489,786**.
- `python3 scripts/copy-image-library.py --verify` exit code: **0**; result: **OK**.
- Verify mode reads the source tree, manifest, and destination; it writes nothing. It re-hashes every destination file, checks source sizes, and rejects unexpected destination files. Copy mode would write only `assets/images/` and `assets/image-manifest.json`; the source tree is read-only.

## Product image coverage

| Measure | Count |
| --- | ---: |
| Referenced attachments | 450 |
| Attachments with copied destination | 450 |
| Attachments missing destination | 0 |
| Product image references | 1092 |
| References with copied destination | 1092 |
| References missing destination | 0 |
| Inline references (size guide) | 112 |
| Inline references with copied destination | 112 |
| Inline references missing destination | 0 |
| Embedded product image objects checked | 1085 |
| Embedded product image objects missing destination | 0 |

Reference roles: `featured` 116, `gallery` 372, `variation_additional` 7, `variation_featured` 597.

Destination paths use the project-root-relative form `assets/images/<uploads-relative-path>`, for example `assets/images/2025/07/Untitled-design-10.png`. Every reference record retains its original `source_path`, `url`, and `relative_path` fields.

## Inline and remote-image caveats

- Inline references found: **112**, all role `inline_size_guide`; the image is the local `2025/09/size-chart.webp` used by 112 products.
- Remote inline references: **0**. Unmapped inline references: **0**.
- No remote `<img>` sources were found in product descriptions, short descriptions, custom tabs, extra content, or size-guide HTML. Source image URLs still use `http://localhost:8099`; they are retained for provenance, not for storefront use.

## Personalisation configuration

- Public set configuration captured in `data/personalisation.json`: 1 set, 6 assigned products, 2 placements, 4 images.
- Public settings groups: behaviour, design. Feature link: `docs/FUNCTIONAL-REQUIREMENTS.md, Product personalisation (§4)`.
- Images copied to destination: **4/4**. Credential-like keys found: **0**.
- The export contains public presentation/placement/choice configuration only. Customer selections, orders, carts, users, licence keys, and update-check data are excluded.

## Product-data issues

- All 116 source products are published; draft, private, trash, pending, future, and auto-draft product counts are zero.
- No product tags or product brands are assigned. Color is a custom attribute on one product only. SKUs are sparse (16 products).
- Product weights and dimensions are empty in the source for every product and variation.
- Three variations have no current or regular price in the source: 30081, 30741, and 31063.
- WooCommerce category term counts are stale for Tops (33 vs 32 actual) and Bottoms (26 vs 23 actual); exported relationship counts are authoritative.
- Upsell and cross-sell IDs are empty. Related IDs follow WooCommerce related-product logic.
- Source image URLs still point to http://localhost:8099. Destination paths are additive and relative to the project root; source paths and URLs remain in the data.
- Inline image detection covers product descriptions, short descriptions, custom tabs, extra content, and size guides. No remote product-content images were found; the only inline product image is the local size-chart.webp used by 112 products.

## Files

- `data/products.json` — enriched product image fields now include `destination_relative_path`, `destination_exists`, destination bytes/hash, and `copy_status`; source path and URL fields are unchanged.
- `data/product-images.json` — enriched attachments, references, inline references, and an `image_library` block.
- `data/personalisation.json` — public plugin configuration and image references.
- `data/verification-report.json` — full machine-readable verification result.
- `docs/DISCOVERY-SUMMARY.md` — this summary.
- `data/export-personalisation.php`, `data/reconcile-verify.py` — reproducible export/reconciliation scripts.

## Commands

```bash
cd /home/vjranga/Documents/2202/shopify-theme
python3 scripts/copy-image-library.py --verify
python3 data/reconcile-verify.py
```
