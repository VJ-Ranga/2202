You are finishing the HTML demo for 2202 Love Colombo (Sri Lankan women's clothing store moving from WooCommerce to Shopify). Repo: /home/vjranga/Documents/2202. Demo: shopify-theme/html-demo/. We must finish the HTML interface TODAY; the Shopify theme build is tomorrow. Move fast, work autonomously, and make sensible defaults without asking.

FIRST read, in order:
1. /home/vjranga/Documents/2202/shopify-theme/docs/FINALIZE-HTML-HANDOFF.md (the checklist and rules — follow it exactly)
2. ~/Documents/obsidian-data/clients/2202-love-colombo/05 Shopify Build/HTML Finalization Plan.md
3. shopify-theme/docs/DESIGN-DIRECTION.md, MIMOSA-IMPLEMENTATION.md, DEMO-VERIFICATION.md
4. ~/Documents/obsidian-data/clients/2202-love-colombo/04 Personalisation/Personalisation Shopify PoC.md and Personalisation.md

DO, in this order:
1. Lock the final direction: Atelier "Colombo Edit" + mono palette (default). Remove the concept/palette chooser from the final build.
2. Rework personalisation (owner's final decision): separate plain and personalised pyjama products, price already includes embroidery. Delete all Rs 1,000 fee logic, fee lines, totals and copy (customisation-logic.mjs, customisation.mjs, app.js, store.mjs and their tests). Keep 2 placements (Pocket Hem, Pocket; one or both), text max 10 chars, 2 fonts, colours. Add a plain + personalised pyjama pair to the demo data.
3. Rename colour "Navy" to "Off white" (#e7e5d6) everywhere (data, code, tests). Colours: Off white, Black, White, both placements.
4. Add a WhatsApp float button on every page (placeholder number if none in data).
5. Full QA: every page at 375 / 768 / 1440, no horizontal overflow, console clean, keyboard and focus on drawers/modals, links, a11y. Run `node --test shopify-theme/html-demo/*.test.mjs` (currently 103 pass; update tests for the removed fee, keep all green).
6. Update docs: DEMO-VERIFICATION.md with real results, FINALIZE-HTML-HANDOFF.md status, and the vault note "HTML Finalization Plan" + 00 Home.md.

RULES: Do not modify WordPress (/home/vjranga/local/2202lovecolombo). Do not commit or push unless I say so. Do not touch shopify-theme/theme/ today. Reuse the existing design system, no one-off styles. Delegate large build/review chunks to Codex CLI / OpenCode on gpt-5.6-luna (run `codex exec -m gpt-5.6-luna -s workspace-write -C <repo> - < brief.md` in the background, always feed stdin) and verify everything yourself in the browser. Keep a task list. When done, report what changed, what you verified, and anything you could not verify.
