# Global fashion-site visual research for 2202 Love Colombo

Date: 2026-10-22

Purpose: translate observed navigation, hero, category, product, image and typography patterns from prominent global fashion storefronts into recommendations for a Shopify theme for 2202 Love Colombo, a women's clothing brand based in Sri Lanka.

Scope and method:
- Target URLs were opened in Chromium (Playwright) at 1440x1000. Where popups blocked the first render, the site's own consent or country selector was dismissed before capture. Site visuals were verified from screenshots plus DOM/computed-CSS inspection. Text extraction alone was not treated as visual proof.
- Tool access status per entry is listed. No research was done on unverified "top site" popularity; rankings are by fit to this brand.
- Source-site photography, logos and imagery are not borrowed. Only layout patterns are translated.
- Did not write to any source site. No third-party imagery was ingested into the theme.

## 1. Zara

URL access status:
- `https://www.zara.com/us/` — HTTP 200 in Chromium/Playwright. Visual and DOM captured. (Root `https://www.zara.com/` also returned 200 over curl but did not render enough layout to measure.)

Observed live (screenshot + DOM):
- Header is overlay-style and nearly invisible against the hero; no solid white top bar below the utility row. The large `ZAR` display wordmark seen is part of the campaign creative, and page heading text was white 13px in DOM because the real heading is hidden SEO metadata, not the visible page text.
- Hero is full-width and full-bleed, 1440x1000 viewport-height editorial image with large brand wordmark integrated into the creative.
- Nav is folding/hidden behind a hamburger plus utility links (search, log in, bag, help). Category menu appears on demand, not visually dominant in default view.
- Hero typography overlay reads as campaign copy and large display wordmark, not small utility labels.
- Product section not yet measured on the home page; not required for conclusions.

Transferable recommendations:
- Remove the standard solid header from the home page. Use transparent overlay header with utility icons in the top-right and campaign creative occupying the top of the page.
- Use enormous integrated wordmark or campaign headline inside the hero image, not small site logo.
- Use photography as background under nav rather than a banner strip above nav.

## 2. H&M

URL access status:
- `https://www2.hm.com/en_us/index.html` — HTTP 200 in Chromium/Playwright. Visual and DOM captured. (Direct curl showed 403, but the browser session loaded normally.)

Observed live (screenshot + DOM):
- Header is solid white with the red H&M wordmark on the left, family-level nav (WOMEN, MEN, KIDS, HOME, BEAUTY) and utility icons on the right.
- Above the header is a thin red membership banner.
- Hero is a full-width, nearly full-bleed campaign image below the header (1425x802 observed), with large uppercase headline overlay, weight approximately 100 / very thin, 36px, using `HM Slussen`.
- Two large 4:5 portrait campaign category tiles sit side by side under the hero.
- Product grid uses approximately 238x356 tiles on a `NEW IN` carousel (roughly 2:3 images; the `data:` placeholder images were read before lazy-loading, so aspect is inferred from tile box, not from a fully loaded image).
- Product photos are natural colour, not filtered monochrome.

Transferable recommendations:
- Keep a clean white header with strong left wordmark and a simple top-level menu.
- Use large thin uppercase headings in campaign overlays.
- Use 4:5 portrait tiles for category blocks and about a 2:3 ratio for product cards.
- Product photography should remain natural colour, not mood-graded to grey or blackout.

## 3. Mango

URL access status:
- `https://shop.mango.com/gb/en` — HTTP 200 in Chromium/Playwright after dismissing Mango's own country selector with UK preselected. Visual and DOM captured. Direct curl returned a 429 "Vercel Security Checkpoint" page, so the browser route is the meaningful check.

Observed live (screenshot + DOM after dismissing country prompt):
- Header sits directly over a full-width editorial photo. Logo is centered at the top as a wordmark. Left nav is uppercase sans 13px; utility icons are on the right.
- Hero image is 1425x944 in DOM (source asset is `7x3` crop), full-bleed and nearly full-height, with a large two-line serif overlay in approximately 96px: roman phrase plus italic word, "Designed in Barcelona since 1984". Text is white.
- Below the hero, category links (`WOMEN, MEN, TEEN, KIDS, HOME`) are centered.
- Product photography and category tiles continue natural-colour, editorial, warm and image-first.
- We did not visually verify further product section; observed up to hero and nav only.

Transferable recommendations:
- Use overlay header + centred wordmark + uppercase small nav over image.
- Use large serif hero headline mixing roman and italic. This is a strong fit for a minimalist 2202 Love Colombo editorial page.
- Use full-width photo hero with an elegant phrase rather than product-led pitch.

## 4. COS

URL access status:
- `https://www.cos.com/en-gb` — HTTP 200 in Chromium/Playwright after country choice via UK link. Visual and DOM captured.

Observed live (screenshot + DOM):
- Top of page is a dark strip reading `NEW-SEASON ARRIVALS | WOMEN MEN` plus `CLOSE`. Header on white has centred `COS` wordmark and a `GB/EN` location selector at right.
- Hero is full-bleed split into two large portrait panels: SHOP WOMEN and SHOP MEN. Each panel is a tall photo, 1425x944 rendered in screenshot. Women panel photo is close-up and tonal; men panel is full-figure and quiet. Headline overlays are uppercase 35.008px, weight 700, white, letter-spacing 0.35px, using `SuisseIntl`.
- Section headings (newsletter, company, customer service, legal) in footer are almost micro-typography: 13px, uppercase, weight 400, letter-spacing 0.52px.
- Overall look is white-space, black text, natural photography, very low ornament.

Transferable recommendations:
- Use a split or columned full-height hero of 2 to 3 category panels with uppercase short headings above/below the images.
- Use large uppercase headings over photos, and tiny uppercase section headings in content areas.
- Aim for a very quiet black/white interface where products are natural colour and typography carries elegance.

## 5. ARKET

URL access status:
- Correct homepage is `https://www.arket.com/en-gb/` (initial `index.html` link gave a 404). HTTP 200 in Chromium/Playwright after direct visit. Visual and DOM captured. Curl returned 403. On load, ARKET's own location/language banner appears, plus a member banner.

Observed live (screenshot + DOM):
- Header is solid white, logo `ARKET` left, large search field centered, and a secondary nav row: Women, Men, Children, Homeware, Gift card, Resale, ARKET CAFÉ, Customer service, GB|EN.
- Hero is full-width video 1425x800 (approximately 16:9), animated editorial with one model. No large headline visible in the video frame observed; the section below shows `ARKET Editorial`.
- Below, two large 3:4 tiles (713x950 observed) show category portraits.
- Font stack is `arketSansMono`; rendered look is clean minimal sans, not decorative. It reflects setting of user interface in a plain, precise sans.
- Content strategy uses editorial care guides and long captions under lifestyle still-lifes.

Transferable recommendations:
- Editorial video hero with no product advertising can create tone.
- Keep secondary utility links in a separate row from primary category nav.
- Use precise, minimal sans; keep text small and spacious.
- Use 3:4 category tiles rather than square product cards.

## 6. & Other Stories

URL access status:
- `https://www.stories.com/en-gbp` redirected automatically to `https://www.stories.com/en-ww/` — HTTP 200 in Chromium/Playwright. Visual and DOM captured. Curl showed 403. Location/language confirmation panel appeared; page background was dimmed in captured screenshot but layout is visible.

Observed live (screenshot + DOM):
- Font stack is `Quadrant` and `QuadrantMono`, giving serif + mono look. H1 `SALE ENDS SOON` 40px, uppercase, black or near-white depending on section, letter-spacing normal.
- Hero uses a full-width 16:9 image (1425x894 observed), with a mono-style centered overlay and a `SHOP NOW` section.
- Section blocks use two large 4:5 / 8:5:9-ish category tiles (713x894 and 713x950 observed), sometimes 1:1 crop for secondary visuals.
- Product tiles use approximately 5:7 portrait images (464x649 observed). Product names are serif lowercase and thin.
- The retail experience is enriched by an editorial language and strongly styled product-shirts, outerwear and knitwear.

Transferable recommendations:
- Use strong black/white topography (serif + mono) on hero and section headings.
- Use full-width 16:9 editorial image plus a small, centered uppercase/mono subtitle.
- Use classic 5:7 product photography on product cards. Keep product names in a serif or lightly set font.

## 7. Massimo Dutti

URL access status:
- `https://www.massimodutti.com/gb/en` redirected to `https://www.massimodutti.com/gb/` — HTTP 200 in Chromium/Playwright. Visual and DOM captured.

Observed live (screenshot + DOM):
- Header is white, with `Massimo Dutti` left as elegant serif logo, and minimal uppercase menu (NYC, WOMAN, MAN, MD WORLD, SEARCH, LOG IN, BAG). This is upper-end retail editing.
- Hero image is full-width, 1440x810 (16:9), monochrome photograph of one model, with arrows left/right around the campaign and a small(`NYC` / `MAN` / `WOMAN`) editorial hint.
- Below, additional full-width 16:9 campaign images for New In, evening selection, Patti Smith, etc.
- Font stack is `suisse-regular` Helvetica fallback. Tiny but hyper-elegant typography.
- Category mega-menu is broad, with very specific subcategory filtering (e.g. Cashmere, Puffer, Italian knitwear, coats, pants, jeans, dresses).
- Photography sits in black, white and cream range, highlighting garment without full-apparel blocking.

Transferable recommendations:
- Use a clean serif logo and a high-precision sans UI.
- Use editorial, monochrome or fully natural photography on hero.
- Use heavy 16:9 image-led sections. Keep text minimal and product gentlemanly.
- Leader categories with large wide-headline blocks and arrows (NYC / MAN / WOMAN style) rather than a large menu in plain view.

## 8. Uniqlo

URL access status:
- `https://www.uniqlo.com/uk/en/` was blocked with an Akamai "Access Denied" page (HTTP 403). Visual block page captured.
- `https://www.uniqlo.com/us/en/` — HTTP 200 in Chromium/Playwright. Visual and DOM captured.

Observed live (screenshot + DOM):
- Header is transparent over a full-width photo; red UNIQLO tile logo left; uppercase family-level nav (WOMEN, MEN, KIDS, BABY) with underlined active item, search pill center, utility icons right.
- Hero image is full-bleed photo of garments, 1425x920 DOM, with a small dark overlay product text block: `HEATTECH Extra Warm Cashmere Blend` and `Everyday warmth, with a touch of luxury.` plus tiny legal footnote.
- Below, a "Search by category" block shows rows of 80x80 category tiles, very plain data-visual, with sans-serif labels.
- Font stack is system sans; clean, functional, utility-style, not editorial.
- Product photography and category tiles stay natural colour, not colour-washed.

Transferable recommendations:
- Transparent header over full-bleed photo is flexible and lets photos dominate.
- Use small overlay text at bottom-left rather than centred headline if the story is photographic.
- Use icon or small square category tiles for utility; but don't use as the hero statement.
- Keep product photography natural, especially if the "black/white interface, natural photos" palette is chosen.

## 9. Aritzia

URL access status:
- `https://www.aritzia.com/en/home` redirected to `https://www.aritzia.com/intl/en` — HTTP 200 in Chromium/Playwright. Visual and DOM captured. Direct curl showed a Cloudflare challenge, but browser load is usable. An "You're Shopping in Sri Lanka" modal appeared, confirming geo-currency adaptation.

Observed live (screenshot + DOM):
- Header over hero is mostly transparent/dark text with no obvious shopping bar, encouraging imagery depth. Nav layout `New, Clothing, Outerwear, Sweatfleece, Activewear, Accessories, Discover` plus search / bag / sign-in. Mega-menu is long and product-specific.
- Hero is split: two very tall adjacent editorial panels occupying about half screen each, using tone-graded photography (black-and-cream). Overlay text is small and thoughtful: `Yoonchae of KATSEYE shines in our latest Super fabric innovation.` Plus `Shop Now` and `View the Guide`.
- Category blocks below use 3:4 portrait photo tiles (713x950 observed).
- Font stack is `Non-Seasonal Geo`, sans. Product-specific wording uses brand authority, not generic menus.

Transferable recommendations:
- Use two-panel hero the way Aritzia does, with a short authored caption.
- Use editorial, photographic, image-heavy homepage and thin caption-style messages.
- Category tiles should be 3:4 portrait and full-bleed, not miniature product photos.
- Header may sit transparent on top of photos.

## 10. SKIMS

URL access status:
- `https://skims.com/en-lk` — HTTP 200 in Chromium/Playwright and again on curl. Visual and DOM captured. A `cookie` strip appears but does not hide the page.

Observed live (screenshot + DOM):
- Header is white/near-white with small `SKIMS` logo left, top-right utility icons and a geolocation strip. Nav row is dark, bold, uppercase: `New, NikeSKIMS, Best Sellers, Clothing, Bras, Underwear, Shapewear, Mens, Accessories, Sale`, plus search.
- Hero is full-width 1425x622 16:9, often video/photo overlay with large 48px weight 900 uppercase text in `T-Star`: `COMING SOON: THE VARSITY COLLECTION`, plus a small line of support copy, and optional nav-sensitive carousel indicator.
- Category tiles below are 338x428 (about 4:5), with names such as `SWEATERS, TOPS, JACKETS, MATCHING SETS` in 30px/900 uppercase.
- Product tiles use 338x428 / 941x1176, i.e. about 4:5 product photography aligned with a strong monochrome UI.
- Body font `Inter`. Section copy is bold, contract-sharp. Brand voice uses solution-oriented messages (`creating the next generation of underwear, clothing and shapewear`).
- Photography is natural colour. The interface reads as black/white/cream, with subdued c. rgb(45, 42, 38) dark body text.

Transferable recommendations:
- Strongest match for a black/white interface with warm-dark text (not pure black) and natural product imagery.
- Use 4:5 category tiles and product cards.
- Use 16:9 hero with visual-led campaign and headline weight 900.
- Keep body text small, solid, and short, not decorative.

# Ranked fit recommendations for 2202 Love Colombo

Ranked by fit to a large-image, minimal, black/white-leaning women's fashion storefront for 2202 Love Colombo at Sri Lanka scale, not by traffic.

1. **COS** — Most architecturally aligned stock photography/UI: white/black low-contrast, large split category hero, 3-4 story blocks. Strong match for palette 2 (fully black+"natural colour photos") and for palette 1 (black/white minimal).
2. **SKIMS** — Best match for modular product/category rhythm in black/white with warm-dark accent. Great 4:5 tile discipline, product cards, and bold 900-weight upper headings. This aligns with brand voice (solution-oriented and everyday chic) and it is female friendly.
3. **Massimo Dutti** — Strong quiet-luxury match, monochrome photography, refined serif logo and upper-case minimal nav. Adds a lot of editorial credibility without looking promotional.
4. **Mango** — Strong editorial campaign typography and full-width photo, with more obvious retail mechanics than COS. Good if 2202 wants elegant editorial plus clear shop.
5. **Zara** — Strong shaping for a massive wordmark hero and hidden nav. Less welcoming for browsing if menu is fully minimised; however, a giant editorial overlay and nearly invisible header are valuable for "large-image" brand.
6. **Aritzia** — Excellent hero configuration and content-led caption style. Very women-focused and story-rich. Good model if 2202 wants editorial status, though nav has more promo/articulate design.
7. **& Other Stories** — Beautiful serif/mono phrase typography and 5:7 product rectangles. Less minimal if the interface is more sale/feature heavy.
8. **ARKET** — Great 3:4 category tiles and editorial video, but homepage is lifestyle/vibe-led rather than product-led. Good as secondary inspiration for care/product storytelling.
9. **H&M** — Valuable mechanical clean header and product photography patterns, but less aesthetic match for a minimal photo-first brand.
10. **Uniqlo** — Strong transparent header and natural photography, but more utility-focused; useful for homepage composition, not as the aesthetic host.

# Three header/hero patterns to offer 2202

Option A — Minimal fashion editorial (COS / Aritzia / & Other Stories)
- Split hero: 2-3 full-height category panels.
- Large uppercase headings over each panel.
- Incredibly low-chrome top bar or transparent header.
- Body photos natural colour, interface neutral.

Option B — Bold campaign statement (SKIMS / Zara)
- Single full-bleed 16:9 hero.
- Very large 900-weight uppercase brand announcement.
- Hidden or minimal navigation, small utility icons.
- Product/category tiles 4:5 and promos inside hero.

Option C — Quiet-luxury poetic (Mango / Massimo Dutti)
- Full-width image plus elegant serif phrase overlay; some italic.
- Centered wordmark and small uppercase nav.
- Use wide orange or cream photography, meaning warm editorial tone with photos still natural.

# Palette guidance

Palette 1 — Black/white interface with brand-brown accent
- Use near-black neutral around rgb(45, 42, 38) or equivalent for type (observed in SKIMS as dark body text), not pure black, if brown or warm minimal accent is wanted.
- The interface stays monochrome; colour brand warmth comes mainly from photos.

Palette 2 — Fully black/white interface with natural photos
- Header/remote UI colours should be plain #000/#fff, no brand accent.
- Let product and hero photography carry all colour.

For both, giant hero typography and full-width photography need to stay in tact. No source imagery from the sites researched is borrowed; layout/pattern only.

# URL access status summary

| Site | URL checked | Status | Method |
|---|---|---|---|
| Zara | https://www.zara.com/us/ | 200 | Chromium/Playwright, new page. Root also 200 via curl. |
| H&M | https://www2.hm.com/en_us/index.html | 200 | Chromium/Playwright. Curl gave 403. |
| Mango | https://shop.mango.com/gb/en | 200 | Chromium/Playwright after Mango country prompt dismissed. Curl returned 429. |
| COS | https://www.cos.com/en-gb | 200 | Chromium/Playwright after country choice UK. Curl gave 403. |
| ARKET | https://www.arket.com/en-gb/ | 200 | Chromium/Playwright. Curl gave 403. Initial `index.html` was 404. |
| & Other Stories | https://www.stories.com/en-gbp | 200 (redirected to https://www.stories.com/en-ww/) | Chromium/Playwright. Curl gave 403. |
| Massimo Dutti | https://www.massimodutti.com/gb/en | 200 (redirected to https://www.massimodutti.com/gb/) | Chromium/Playwright. |
| Uniqlo | https://www.uniqlo.com/uk/en/ | 403 blocked (Akamai Access Denied) | Chromium/Playwright. `/us/en/` loaded 200. |
| Aritzia | https://www.aritzia.com/en/home | 200 (redirected to https://www.aritzia.com/intl/en) | Chromium/Playwright after site geo modal. Curl showed Cloudflare challenge. |
| SKIMS | https://skims.com/en-lk | 200 | Chromium/Playwright and curl. |

Reference-only design sources supplied by user (SKIMS, Mimosa, 24S, Moda Operandi, Stella McCartney, MR PORTER): no tool measurement was performed on those extra sites beyond SKIMS; layout claims here rest only on the SKIMS capture above and on the ten researched sites.

Captured screenshot paths (local, read-only, no third-party images copied into theme):
- `/home/vjranga/Documents/2202/.playwright-mcp/zara-home.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/hm-home2.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/mango-home3.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/cos-home.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/arket-home2.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/stories-home.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/massimo-home.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/uniqlo-home.png` (blocked page)
- `/home/vjranga/Documents/2202/.playwright-mcp/uniqlo-home2.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/aritzia-home.png`
- `/home/vjranga/Documents/2202/.playwright-mcp/skims-home.png`
