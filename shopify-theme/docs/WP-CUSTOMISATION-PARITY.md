# WordPress Customisation Parity Audit

Date: 2026-10-23

## Scope and safety

Read-only inspection of `/home/vjranga/local/2202lovecolombo/wp-content/plugins/wc-personalisation-panel`, checked-in exports, and the live eligible product page:

`http://localhost:8099/product/burgundy-dreams-long-set/`

Live browser checks used isolated Playwright contexts. Size `UK06/XS` was selected only to unlock the UI. No cart action, order action, form submission, AJAX add-to-cart request, database write, WordPress write, customer export, order export, log export, or secret export occurred.

## Source evidence

- Plugin version and boot: `wc-personalisation-panel.php:3-78`.
- Public settings defaults and set lookup: `includes/class-settings-store.php:41-248, 294-370`.
- Trigger hook, front-end config, variation guard, and currency: `includes/class-cart-handler.php:18-52, 141-240`.
- Drawer markup: `templates/panel.php:19-57`.
- Trigger markup: `templates/button.php:21-31`.
- Wizard state and events: `assets/js/wcpp-panel.js:23-119`.
- Placement, stacked steps, validation, review, and second placement: `assets/js/wcpp-panel.js:151-295, 365-546, 548-631`.
- Cart payload: `assets/js/wcpp-panel.js:633-685`.
- Server validation and price payload: `includes/class-ajax-handler.php:34-196`.
- Server price application: `includes/class-price-calculator.php:23-105`.
- Drawer styles: `assets/css/panel-default.css:155-253, 286-421, 682-760, 780-1000`.
- Public export: `data/personalisation.json`.

## Exact source configuration

### Eligibility and assignment

- Set ID: `30537`, name `pyjama set`, published.
- Eligible product IDs, source order: `31597`, `31630`, `31638`, `31646`, `31654`, `31662`.
- Assignment: category ID `110`, `Personalised Pyjama`; `apply_all = false`.
- Product lookup priority: explicit product set, apply-all set, matching category set, then no set.
- Global behaviour: enabled `1`; non-returnable `0`.

### Trigger

- Label: `Add Personalisation`.
- Hook: `woocommerce_after_add_to_cart_form` (`after_form`).
- Placement: below entire purchase form, after Add to Cart and Buy Now.
- Full width: yes.
- Style: `outline`.
- Background/border token: `#412311`.
- Text token: `#f8f3ef`.
- Radius: `6px`.
- Animation: `lift`.
- Source button markup is a `<button>`, not a checkbox, and carries product ID plus dialog ARIA attributes.
- No selected-placement preview is written back onto trigger button. Trigger remains `Add Personalisation`.

### Variation guard

On variable products, trigger click reads `form.variations_form input[name="variation_id"]`. If zero, drawer does not open and toast says:

`Please choose the product options (e.g. size) before personalising.`

Live Burgundy page check:

- URL slug: `burgundy-dreams-long-set`.
- Product ID: `31597`.
- Size options: `UK06/XS`, `UK08/S`, `UK10/M`, `UK12/L`, `UK14/XL`, `UK16/2XL`.
- First enabled selection `UK06/XS` resolved variation ID `31598`.
- Button rendered below purchase form.

### Drawer and overlay

- Side: right.
- Width: `420px` desktop.
- Mobile breakpoint: `500px`; width becomes `100%`.
- Position: fixed, top `0`, height `100%`, right `0`, z-index `99999`.
- Background: `#ffffff`.
- Border radius token: `6px`; source CSS fallback is `10px`, runtime design token is `6px`.
- Open transform: `translateX(0)`; closed right transform: `translateX(105%)`.
- Open transition: `350ms`, cubic-bezier `cubic-bezier(0.22, 1, 0.36, 1)`.
- Overlay: fixed inset, z-index `99998`, source color `#1f120b`, opacity `45%`, blur `4px` while open.
- Body overflow: hidden while open.
- Close controls: header close button `✕`, `aria-label="Close"`; Escape; overlay click.
- With no choices, outside click and Escape close immediately.
- With an active placement or completed placement, close/outside/Escape opens confirmation:
  - `You'll lose your personalisation choices. Are you sure?`
  - `YES, CLOSE`
  - `KEEP EDITING`
- Close confirmation is an in-panel modal overlay. It does not use browser `confirm()`.
- Close button returns focus only through normal DOM behavior; source does not implement a dedicated focus-return routine.

Live browser geometry at 1265×720 viewport:

- Open panel: x `845`, width `420`, height `720`.
- Overlay: x `0`, width `1265`, height `720`.
- Panel appeared from right.

### Panel styling and labels

- Header: padding `20px 22px 16px`; bottom hairline; centered uppercase title.
- Header title on first open: `CHOOSE PLACEMENT`.
- Title: 12px, 700 weight, `0.16em` letter spacing, uppercase.
- Content: vertical scroll; padding `24px 22px 28px`.
- Progress: shown, bar style, 3px high; color `#412311`; empty hairline `#ece9e4`.
- Panel content headings: 21px, 700 weight, line-height `1.25`.
- Footer: padding `16px 22px 22px`, top shadow/hairline.
- Footer buttons: full width, minimum height `48px`, uppercase, 12px, 700 weight, `0.12em` letter spacing, radius `6px`, background `#412311`, white text.
- Next button source text: `Continue` in stacked mode (`design.next_text` is `Next`, but JS uses `i18n.continue` first).
- Add button: `Add to Bag`.

### Placement picker

First open always starts in phase `select` with no placement selected.

Header and body labels:

- Header: `Choose placement` (rendered uppercase by CSS).
- Heading: `Where would you like it?`
- Cards, source order:
  1. `Pocket Hem`, image `2026/06/Love-Colombo2303.webp`.
  2. `Pocket`, image `2026/09/Pocket2.jpeg`.
- Layout: vertical list (`placement_layout = list`), 14px gap.
- Card border: 1.5px, radius 6px runtime token, white background.
- Card footer: 14px 18px, uppercase 12px, 700 weight, `0.12em` tracking, right arrow `›`.
- Card images display natural source aspect ratio in list mode.
- Selecting card immediately enters its steps.
- At least one placement required before review/Add to Bag.
- A placement can be selected once only.
- Maximum: both placements, two total.

### Steps

Both placements contain exactly three steps in this order:

1. `Add Text` — type `text`, placeholder `Add Text`, max 10 characters, price `Rs.0.00`.
2. `Select Font` — image choice cards:
   - `Freestyle Script`, price `Rs.0.00`.
   - `Edwardian Script ITC`, price `Rs.0.00`.
3. `Select Colour` — swatches, price `Rs.0.00`:
   - Pocket Hem: `off white` `#e7e5d6`, `Black` `#000000`, `White` `#ffffff`.
   - Pocket: `Navy` `#e7e5d6`, `Black` `#000000`, `White` `#ffffff`.

Source issue: Pocket `Navy` label has source value `#e7e5d6`. Preserve both. Do not invent `#000080`. Render neutral/outlined treatment if needed so label does not claim a visual source value that source does not provide.

Step behavior:

- `step_flow = stacked`: all three sections render together.
- Step 1 starts unlocked; steps 2 and 3 start locked.
- Locked sections have opacity `0.32`, no pointer events, and muted heading.
- Answering text unlocks font; selecting font unlocks colour.
- No font or colour is preselected.
- Progress starts `0%`; each answered step contributes one third; complete state is `100%`.
- Empty text blocks Continue, adds `Required` badge and shake animation.
- Text input has native `maxlength=10` and live counter `0 / 10` through `10 / 10`.
- Client JS treats any non-empty string as present. Whitespace-only input is therefore truthy in source JS. Server then runs `sanitize_text_field`; do not add stricter trimming unless product owner approves.
- Native maxlength prevents an 11th typed character; browser test produced `ABCDEFGHIJ` from 11 attempted characters.
- Source does not define allowed character classes, case rules, or Unicode policy. Do not invent them.

### Review and optional second placement

After all three steps complete:

- Header: `Review`.
- Body heading: `Your Choices`.
- Each placement card shows uppercase placement name, `Edit`, remove `✕`, then step labels and values.
- `Edit` reopens that placement with selections preserved.
- Remove deletes placement. Removing final placement returns to placement picker.
- If one placement remains, `＋ Add another placement` appears.
- After first placement, picker contains only unused placement.
- After second placement, no add-another control remains.
- Second placement is optional, not mandatory.
- Both placements show in review when selected.
- Source review total stays `Rs.1,000.00` for both placements because set fee is once per unit and all choices are zero.

Exact review example verified:

```text
Your Choices
POCKET HEM
ADD TEXT / Liyan
SELECT FONT / Freestyle Script
SELECT COLOUR / off white
POCKET
ADD TEXT / Ranga
SELECT FONT / Edwardian Script ITC
SELECT COLOUR / Black
Personalisation fee / +Rs.1,000.00
PERSONALISATION TOTAL: / RS.1,000.00
```

### Fee and cart integration

Source fee:

- Set price: `1000.00`.
- Fee type: `unit`.
- Base price: selected variation price.
- Total add-on: set fee plus all selected choice prices.
- Current choices all price `0.00`.
- Unit line total: `(base variation price + personalisation total) × quantity`.
- Two placements do not double the set fee.
- Quantity is read from product form and server-clamped to `1..99`.
- Browser sends IDs and typed text; server re-derives labels, colors, images, and prices.
- Server rejects duplicate placements, duplicate steps, invalid IDs, incomplete steps, invalid variation ownership, and missing variation on variable products.
- WooCommerce add-to-cart validation filter runs before cart mutation.
- Add-to-cart endpoint is `wcpp_add_to_cart`; audit did not call it.

The source success screen after a successful cart mutation would show:

- `Added to your bag!`
- proof note: `Artwork preview sent via WhatsApp or email for approval before production`
- `Checkout`
- `View Cart`
- `Continue Shopping`

This audit did not trigger that screen.

### Non-returnable and proof

- `non_returnable = 0`; no non-returnable badge should display.
- Proof message is informational only. It does not prove that WhatsApp/email submission happened.

## Separate inspiration reference: Olivia von Halle

Fetched read-only from `https://oliviavonhalle.com/products/coco-powder-blue-ivory-silk-pyjamas?country=LK`. This is inspiration only, not 2202 source configuration. Do not copy its values into the 2202 contract.

Observed structure:

- Heading: `Make it your own`.
- Copy: `Add the perfect finishing touch to your OvH with traditional hand embroidery, completed in 4-10 working days.`
- Warning: `Please note that personalised items are non-returnable unless faulty.`
- First picker: `Select a Location`.
- Optional second location explicitly offered after first selection.
- Locations: `Pocket`, `Neck`, `Hip Pocket`, `Cuff`, `Collar`.
- Personalisation mode picker: `Text Only`, `Symbol Only`, `Text + Symbol`.
- Step 1: `Add Text`, up to 7 characters, with symbol/character guidance.
- Step 2: `Select Font`, choices `Script`, `Block`, `Serif`.
- Step 3: `Select Colour: White`.
- Summary includes `Edit`, `Remove`, `2nd Personalisation`, an explicit non-refundable acknowledgement, `Add to Bag +£0`, and `Close`.

OVH flow supports visual inspiration for a side-panel wizard and optional second placement. Its 7-character limit, locations, fonts, colours, pricing, return policy, and symbol rules are not 2202 facts.

## Current demo parity discrepancies

Frontend files were not modified in this audit.

Current `html-demo/customisation.mjs` and `customisation.css` differ from source:

1. Current UI is inline expandable; source is right-side fixed drawer.
2. Current trigger is checkbox `Add Personalisation · +Rs 1,000 per item`; source is standalone full-width button `Add Personalisation` under the purchase form.
3. Current inline layout uses a two-column placement grid at desktop; source uses vertical placement list.
4. Current UI renders placement forms in page flow; source renders one placement's stacked wizard inside drawer, then review, then optional second placement.
5. Current UI uses `Personalise this set`, `Choose one or two placements...`, `Use this personalisation`, and `2 placements included`; these are not source plugin labels.
6. Current UI adds text preview copy; source plugin does not render a text preview in its wizard.
7. Current UI uses `text.trim()` validation in `customisation-logic.mjs`; source client JS checks only empty string, while server sanitizes with `sanitize_text_field`. Current behavior is stricter for whitespace-only text.
8. Current UI chooses first placement and exposes forms inline; source initial state has no default placement and requires a placement card click.
9. Current UI fee preview is page-level; source fee appears in review as `Personalisation fee` and total.
10. Current UI cart attachment is local demo state; source attaches server-resolved data to WooCommerce cart line and recalculates price server-side.
11. Existing export previously omitted exact panel, message, selection, and integration metadata. `scripts/prepare-customisation.py` now exports those fields without changing existing keys. Frontend still needs to consume them.

## Shopify transfer architecture

Static preview parity and production Shopify behavior are separate contracts.

- Line-item properties can carry placement IDs, labels, text, font IDs, color IDs, source values, and proof metadata. They do not change Shopify line price by themselves.
- Static demo currently adds `feePerUnit` in `store.mjs`; this proves local subtotal behavior only. It does not prove Shopify checkout pricing.
- Production fee options require one verified pricing mechanism:
  1. a product-options/personalisation app that supports per-unit pricing and line-item properties;
  2. a separate Rs 1,000 add-on variant kept quantity-synchronised with the personalised product, with robust cart-line removal/quantity handling; or
  3. a Shopify Function/cart transformation design whose availability and plan/API support are verified for target store.
- Do not assume Shopify Functions or line-item properties alone can reproduce WooCommerce price recalculation.
- Preserve source product variant selection before opening personalisation. Preserve source IDs and selected values in line-item properties regardless of pricing mechanism.
- Validate all IDs and prices server-side or through the selected app/function. Do not trust browser-submitted fee values.

## Public config additions

`html-demo/assets/customisation-data.json` now retains existing contract keys and adds:

- `panel`: right side, width, mobile breakpoint, overlay, animation, title, progress, card tokens.
- `messages`: exact source UI labels and close/variation/error messages.
- `selection`: source state limits and validation behavior.
- `integration`: source hook and server-validation facts.

No customer, order, cart, session, nonce, credential, licence, update, or log data is included.
