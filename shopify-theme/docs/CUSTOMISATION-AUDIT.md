# Customisation Audit

Date: 2026-10-22

## Scope and safety

Audit used read-only files under `/home/vjranga/local/2202lovecolombo`, the public product pages at `http://localhost:8099`, and checked-in exports. No WordPress files, options, database rows, carts, orders, forms, or customer data were modified or submitted.

## Verified source counts

- Plugin: `wc-personalisation-panel` 0.7.31.
- Published personalisation sets: 1.
- Eligible products: 6.
- Eligible IDs, source order: `31597`, `31630`, `31638`, `31646`, `31654`, `31662`.
- Placements: 2, source order: `Pocket Hem`, `Pocket`.
- Steps: 3 per placement.
- Text limit: 10 characters.
- Font choices: 2 per placement.
- Colour choices: 3 per placement.
- Set fee: Rs 1,000 per unit.
- Choice and text prices: Rs 0.00.
- Non-returnable flag: false / disabled.
- Proof message: `Artwork preview sent via WhatsApp or email for approval before production`.

The public page `sage-dream-pj-set` (product ID 31630) was opened in an isolated browser context. The page showed `Add Personalisation`, blocked opening until a size was selected, then showed both placement cards. `Pocket Hem` was opened; text input accepted `Liyan`, showed `5 / 10`, and exposed both font choices plus all three colour choices. No add-to-cart control was activated.

## Source configuration

Global design settings show:

- Button: `Add Personalisation`, outline, full width, after product form.
- Placement layout: list.
- Step flow: stacked.
- Progress: bar.
- Panel source flow: placement selection, placement steps, review, optional second placement, Add to Bag.
- Server validation: text required, text capped at 10 characters, choice IDs resolved server-side.
- Price calculator: `unit` applies the complete personalisation add-on to each quantity unit.

The export records both placements. The frontend contract charges Rs 1,000 once per product unit, not once per selected placement. This matches the source set fee model; no source rule adds another set fee for a second placement.

## Source issue retained

Pocket colour choice is labelled `Navy`, but source value is `#e7e5d6`, the same value used for Pocket Hem `off white`. Export retains source label and value. It does not silently correct source data. Frontend should render this choice as a neutral outlined swatch or label-only choice, not as a filled navy swatch.

## Output contract

`html-demo/assets/customisation-data.json` is public configuration only. It contains no customer, order, cart, session, nonce, credential, licence, or update data.

Root contract:

```json
{
  "eligibleProductIds": [31597, 31630, 31638, 31646, 31654, 31662],
  "feePerUnit": 1000,
  "maxLength": 10,
  "placements": [],
  "nonReturnable": false,
  "proofMessage": "...",
  "sourceIssues": ["..."]
}
```

Each placement contains `id`, `label`, `image`, `fonts`, `colors`, and source-order `steps`. Each font contains `id`, `label`, and `previewImage`. Each colour contains `id`, `label`, and source `value`.

All public image paths are relative to `html-demo/`:

- `assets/images/customisation-pocket-hem.webp`
- `assets/images/customisation-pocket.webp`
- `assets/images/customisation-font-freestyle-script.webp`
- `assets/images/customisation-font-edwardian-script-itc.webp`

## Reproduction

From project root:

```bash
python3 scripts/prepare-customisation.py
```

The script reads `data/personalisation.json`, validates eligible IDs against `data/products.json`, reads only four source-owned upload files, creates four WebP derivatives, and writes the public JSON contract.

## Frontend recommendation

Use source-matching right-side fixed drawer, not inline section or product popup. The earlier inline recommendation is superseded by `docs/WP-CUSTOMISATION-PARITY.md`. Render section only when product ID exists in `eligibleProductIds`. Keep size/variant guard before personalisation. Use placement cards, stacked locked steps, 10-character counter, font preview cards, neutral Navy swatch treatment, review summary, and one Rs 1,000 fee per quantity unit. Attach selected placement data to each cart line. Keep second placement fee at zero.

## Frontend edge cases

- Non-eligible product: hide section and do not attach personalisation data.
- Missing size or variant: keep customisation disabled until valid variant exists.
- Empty text: block review and cart action.
- Text longer than 10 characters: reject or cap at 10; show counter.
- Missing font or colour: block review and cart action.
- Second placement: allow only once; do not add another fee.
- Quantity greater than one: charge Rs 1,000 per unit and preserve selections on line.
- Source Navy value mismatch: do not display misleading navy fill; surface source issue.
- Non-returnable: do not display non-returnable notice because source flag is false.
- Proof message: display only as informational copy; do not imply WhatsApp/email submission in static demo.
- No cart/order submission in audit flow.
