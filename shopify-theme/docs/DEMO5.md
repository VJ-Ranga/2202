# Demo 5 — edge-to-edge version of Demo 4

Owner approved this additional variant on 2026-10-31. Demo 4 is retained.

Open: http://localhost:4173/preview.html?concept=edge&palette=mono

Demo 5 shares Demo 4’s six-slide hero, full category menu, collections/new arrivals/editorial/personalisation content, vertical product gallery with side thumbnails, Mintpay/Koko display and interactive static checkout preview. The added `edge.css` changes spacing only: edge-to-edge category/product/editorial photography, 4px image gutters, smaller section gaps, compact outer page padding and a full-width personalisation image/text split. Text keeps readable inner padding; mobile stacks the personalisation columns.

Implementation: internal concept `edge`; shared base styles in `signature.css`, overrides in `edge.css`. Product gallery base is shared in `product-gallery.css`. Concept/palette carry across the routes. The index, comparison menu and product-layout switcher now include Demo 5.

Verification: both palettes at 320/375/768/1024/1440 widths on homepage; no horizontal overflow. All six hero slides present; three personalisation steps and four new-arrival payment rows retained. Demo 4 category/product/personalisation spacing metrics match their pre-change measurements. Five-card index and ten-choice comparison menu checked. Product selection → drawer → checkout → Koko payment simulation passed with correct delivery/total, and checkout checked at 320/375/768/1440. Zero JavaScript errors during the checks. All 111 Node tests pass. No real payments, order creation, commit, push or publication.
