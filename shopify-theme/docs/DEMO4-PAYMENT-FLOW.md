# Demo 4 payment flow — 2026-10-31

Owner requested Mintpay/Koko throughout the demo and a complete checkout-like experience. This implementation is an interactive static preview, not a live payment connection.

## Visible surfaces

- Homepage, collection, wishlist, search results and related-product cards: price-based instalment estimate and provider logos.
- Live search overlay: same price-based estimate on each result/recommendation card.
- Product details: current selected-variant price used by the compact payment row.
- Cart drawer: instalment estimate follows the current subtotal; checkout links to the new preview route.
- Cart page: dynamic subtotal estimate and Continue to checkout.
- Footer on Demo 4 pages: Mintpay, Koko and cash-on-delivery branding.
- `checkout.html?concept=signature&palette=mono`: selected Mintpay/Koko/COD method, cart item summary, delivery and three-payment schedule.

## Flow and calculations

Cart estimates exclude delivery. Checkout adds the recorded Sri Lanka delivery rule (Rs 400 below Rs 5,000; free from Rs 5,000). The payment schedule splits the full checkout total in integer cents, distributing remainder cents so all three payments sum exactly to the total. Changing payment method clears any previous completion state. Cart changes from the header drawer or another tab rebuild the checkout summary.

Continue with Mintpay/Koko opens a clearly labelled payment preview, followed by Complete demo payment. The result explicitly states no payment was taken or order created. The bag is retained. No contact, address, card details, provider login or payment authorization are collected; no request is sent to a payment endpoint.

Other demo concepts retain their existing checkout-unavailable behaviour.

## Verification

- End-to-end product → drawer → cart → checkout → simulation tested with Mintpay, Koko and COD.
- Qty 1 at Rs 3,990: delivery Rs 400, total Rs 4,390; schedule Rs 1,463.34 + Rs 1,463.33 + Rs 1,463.33.
- Qty 2: total Rs 7,980, free delivery; schedule three times Rs 2,660.
- Cart remains intact after simulation; no non-GET requests sent during the flow.
- Empty checkout has a shopping recovery link and no payment action.
- No overflow at 320/375/768/1440 widths during the checkout checks; zero JavaScript errors or local HTTP failures.
- Existing and payment-calculation Node tests: 111 passed, 0 failed.

Actual merchant activation, Shopify gateway installation/configuration, redirects to provider checkout, webhooks, refunds and test/live orders remain separate work.
