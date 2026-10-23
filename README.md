# 2202 Love Colombo

Client-review HTML storefront for the planned migration from WordPress/WooCommerce to Shopify.

## Public preview

[Open the client presentation](https://vj-ranga.github.io/2202/)

GitHub Pages serves the `gh-pages` branch, which contains only `shopify-theme/html-demo/`. The complete project remains on `main` and runs locally. Documentation, source exports, and local WordPress backups are not part of the published site. The `.nojekyll` file keeps the published demo a plain static website.

After committing and pushing demo changes to `main`, publish the HTML-only branch from the repository root:

```bash
bash shopify-theme/scripts/publish-pages.sh
```

Publishing uses a Git subtree push and GitHub Pages branch publishing, without a custom GitHub Actions workflow.

## Run the preview

From the repository root:

```bash
python3 shopify-theme/scripts/serve-demo.py
```

Open [http://localhost:4173/](http://localhost:4173/) for the client presentation. The preview server disables asset caching so changes appear after a normal reload.

## Explore the storefront

- Three design directions: **Atelier**, **Studio**, and **Maison**.
- Two interface palettes: **black and white** and **brown accents**.
- Separate collection, product, search, wishlist, cart, account, tracking, contact, and policy pages.
- Full exported catalog: **116 products** and **597 variations**, with optimized local product photography.
- Original campaign banners in Studio and three product-page compositions.
- Product personalisation follows the audited WordPress plugin: size selection, a right-side drawer, placement, text, font, colour, editable review, and an optional second placement.

The HTML preview stores its bag and wishlist on the current device. Payment, sign-in, live order tracking, and message delivery are not connected to a backend. Shopify production integration follows client approval.

## Verification

```bash
node --test shopify-theme/html-demo/store.test.mjs
```

See [project documentation](shopify-theme/README.md), [UI verification](shopify-theme/docs/UI-VERIFICATION.md), and [WordPress personalisation parity](shopify-theme/docs/WP-CUSTOMISATION-PARITY.md).

## Assets and source material

The runnable demo includes optimized images and local fonts. Original WordPress backups, the unoptimized local image library, temporary files, and browser captures are excluded from version control. Product exports retain local source paths and URLs for provenance; the runnable storefront uses only its bundled assets.
