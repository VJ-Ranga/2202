# Shopify development setup

Date: 2026-10-24

Store: `2202-5lmpawaa.myshopify.com`

Local theme: `shopify-theme/theme/` (official Shopify Dawn starter).

This is setup only. The HTML demo has not been converted. No products,
payments, domain settings, or existing store themes have been changed.

From the repository root:

```bash
shopify theme dev --path shopify-theme/theme --environment development --no-input
```

The command uploads a separate development theme and prints local, editor,
and remote preview links. Keep the process running while using local preview.
No live theme ID is configured; do not add `--allow-live` or publish the theme.

## Setup verification

- CLI theme-list access to the separate store succeeds.
- A separate development theme was created: `192182452267` (role `development`).
  Existing live theme `test-data` (`192151322667`) remains live.
- Dawn 15.5.0 is installed as the unmodified starter.
- Theme Check: 0 errors, 9 upstream warnings.
- Preview started successfully after the user supplied the storefront password.
  Local preview: `http://127.0.0.1:9292/`.
  Remote preview: `https://2202-5lmpawaa.myshopify.com/?preview_theme_id=192182452267`.
  Theme editor: `https://2202-5lmpawaa.myshopify.com/admin/themes/192182452267/editor`.
  The local URL requires the CLI process to remain running. Future starts may
  require the storefront password interactively or through `--store-password`.
  The password is not stored in project files.

`npm init @shopify/app@latest` is not needed for theme development.

Next stage, when requested: convert the approved HTML components into native
Shopify sections and templates. Product migration and payment configuration
remain separate work.
