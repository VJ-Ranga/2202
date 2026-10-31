# Finalize HTML Demo — Handoff (2026-10-30)

Goal: finish `shopify-theme/html-demo/` as the final, client-ready HTML template **today**. Shopify theme build follows **tomorrow**.

## Current state (verified 2026-10-30)

- Static multipage demo in `html-demo/`: `index`, `preview`, `collection`, `product`, `cart`, `wishlist`, `search`, `page`, `account`, `order-tracking`. Served with `python3 scripts/serve-demo.py --port 4173` from `html-demo/`.
- 3 concepts (Atelier, Studio, Maison) x 2 palettes (mono, brown) via `?concept=&palette=` query. Newest work: Atelier "Colombo Edit" (Mimosa-style) homepage, commit `b1cb7ac`, see `MIMOSA-IMPLEMENTATION.md`.
- Working: cart drawer, fullscreen search, size guide modal, wishlist, personalisation drawer, hero autoplay.
- Tests: `node --test html-demo/*.test.mjs` = 103/103 pass.
- GitHub repo `VJ-Ranga/2202` is now PRIVATE, so the GitHub Pages demo link 404s. Demo link for the client needs a new host (not decided).
- Branch `codex/shopify-storefront-development`. Untracked: `docs/SHOPIFY-DEVELOPMENT.md`, `tests/`, `theme/` (Shopify theme, has nested `.git` — move aside before committing). Owner said: do not commit the theme yet.

## Gaps to close today

1. **Pick final direction.** Default if not told otherwise: Atelier "Colombo Edit" + mono palette. Remove or hide the chooser/other concepts from the final build (keep files out of the way, do not delete without checking).
2. **Personalisation rework (owner decision, final).** Separate products: plain pyjama (e.g. Rs 2,000) and personalised copy (e.g. Rs 3,000). Price already includes embroidery. Remove all fee logic and copy:
   - `customisation-logic.mjs:59` `fee: ... || 1000`
   - `customisation.mjs:259` fee line + `PERSONALISATION TOTAL: Rs.1,000.00`
   - `customisation.mjs:370` `getFee`
   - `app.js:334` "Rs 1,000 per applied unit" text
   - `store.mjs` / `store.test.mjs` fee handling and tests
   - Keep: 2 placements (Pocket Hem, Pocket; one or both), text (max 10 chars), font (Freestyle Script, Edwardian Script ITC), colour. Cart shows text/font/colour/placement per line; same item with different text = separate lines.
   - Provide a personalised pyjama product in demo data (and a plain twin) so it can be shown.
3. **Colour fix.** Pocket "Navy" is really off white `#e7e5d6`. Rename to "Off white" everywhere (`assets/customisation-data.json:89,131`, `customisation.mjs:141`, tests). Both placements: Off white `#e7e5d6`, Black, White.
4. **WhatsApp float button on every page** (house rule). Not in the code yet. Number is client-confirm placeholder: use the number in `assets/pages-data.json` if present, else placeholder.
5. **Proposal said "same look".** Redesign was built instead. Owner never answered. Do not reopen; note it in the final report only.
6. **Final QA** (`docs/IMPLEMENTATION-PLAN.md` Task 8, still pending): every page at 375 / 768 / 1440, no horizontal overflow, console clean, all links, keyboard + focus on drawers/modals, a11y basics, image sizes/perf. Update `DEMO-VERIFICATION.md` with real results.
7. Fix the known stale facts if they appear on pages: delivery page says Rs 300–350, real shipping is flat Rs 400, free from Rs 5,000.

## Rules for the session

- Design system first (palette, type, buttons, spacing) — it already exists; reuse it, do not add one-off styles. Bootstrap 5 + Font Awesome + Poppins are the house defaults for demos but this demo has its own approved design system: follow what is there.
- Do not touch WordPress at `/home/vjranga/local/2202lovecolombo` (read-only).
- Do not push to GitHub, do not commit unless the owner says so.
- Delegate big build/review work to Codex CLI / OpenCode on `gpt-5.6-luna` (see memory `delegate-to-gpt-luna`: run `codex exec -m gpt-5.6-luna -s workspace-write -C <repo> - < brief.md` in the background; always feed stdin). Verify results in the browser yourself.
- Update the vault when done (see below).

## Tomorrow (Shopify build, not today)

- Port the approved HTML to `shopify-theme/theme/` (Dawn 15.5.0 dev theme #192182452267 only; never the live `test-data` theme).
- Personalisation drawer PoC already works: see vault note `04 Personalisation/Personalisation Shopify PoC.md`.
- Create real plain + personalised pyjama products, import catalog (116 products / 597 variants), collections, pages, menus, shipping, payments (PayHere/Koko/Mintpay unverified).
- Shopify connector needs `/mcp` re-auth first.

## Vault

`~/Documents/obsidian-data/clients/2202-love-colombo/` — see `05 Shopify Build/HTML Finalization Plan.md`. After finishing, update that note and `00 Home.md`.
