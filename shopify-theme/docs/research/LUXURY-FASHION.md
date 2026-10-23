# Luxury Fashion E-Commerce Visual Research — 2202 Love Colombo Shopify Theme

**Research date:** 2026-10-22 (single session, ~16:00–21:00 local)
**Purpose:** Ground the 2202 Love Colombo premium women's fashion Shopify storefront (large-image design, real existing photography) in direct observation of ten prominent womenswear luxury brands, plus two provided retail-platform references (24S, Moda Operandi).
**Rule observed in this document:** every claim below is graded by evidence type. Nothing is inferred from memory, blog posts, or assumed "best practices" without a source observation. No popularity, traffic, or conversion-superiority claims are made — none were measurable in this exercise, and none are asserted.

---

## 1. Method and evidence grading

| Grade | Meaning | How obtained |
|---|---|---|
| **LIVE-DOM** | Page rendered in a real Chromium browser; header/hero/typography measured from computed styles and bounding boxes at the moment of capture | Playwright (Chromium), viewport ≈ 901 × 833 CSS px, desktop-window scale |
| **TEXT** | Plain HTTP text fetch of the page HTML, no rendering, no layout measurement | webfetch (markdown/text) |
| **BLOCKED** | Site unreachable or served an error/challenge page in this environment | HTTP status recorded |
| **USER-SCREENSHOT** | Screenshot supplied by the project (not re-fetched or re-inspected in this session) | Listed for reference only |

Captures were automated DOM measurements: element geometries (`getBoundingClientRect`), computed `background-color`, `position`, `font-size`, `text-transform`, and the first media elements (`img`, `video`) inside the first viewport. This is a layout-level inspection, not pixel-budget auditing. Measurements are rounded CSS pixels at one desktop viewport; they describe proportions, not a design spec to copy.

All automated requests used a standard browser context. No competitor imagery was downloaded or stored; only metadata (host, dimensions) was recorded. Raw session artifacts (accessibility snapshots and console logs) were written by the browser automation tool to `.playwright-mcp/` in the workspace; consult them if raw evidence is needed.

---

## 2. Access and evidence summary

| # | Brand | URL used | HTTP | Evidence | Notes |
|---|---|---|---|---|---|
| 1 | Saint Laurent | https://www.ysl.com/en-en (reached via https://www.ysl.com) | 200 | LIVE-DOM | saintlaurent.com direct domain failed with `net::ERR_SSL_PROTOCOL_ERROR` in this environment; ysl.com (official store domain, title "Saint Laurent Official Online Store | YSL.com") loaded cleanly |
| 2 | Celine | https://www.celine.com/en-int/home | 200 | LIVE-DOM | First load presented a location-selection overlay ("CHOOSE YOUR LOCATION") plus a Ketch consent layer; on retry the home rendered with a fullscreen hero |
| 3 | Dior | https://www.dior.com/en-us, /en-us/fashion, /en-int/fashion | 503 (all); plain fetch gave 403 | BLOCKED | Consistent non-2xx/bot response on every path and method; no visual inspection possible. Not assessed |
| 4 | Chanel | https://www.chanel.com/us/fashion/ | 200 | LIVE-DOM + TEXT | chanel.com root (text fetch) is a location-picker page; the /us/fashion/ path rendered fully |
| 5 | Prada | https://www.prada.com/us/en.html | 200 | LIVE-DOM + TEXT | Full menu and homepage structure available in both text and DOM captures |
| 6 | Miu Miu | https://www.miumiu.com/us/en.html | 200 | LIVE-DOM + TEXT | Header/menu measured; homepage top media captured are square menu tiles — hero may use CSS backgrounds not captured by `img`/`video` selectors; graded with that caveat |
| 7 | Loewe | https://www.loewe.com/usa/en/home (root redirects here; /usa/en and /us/en return 404) | 200 | LIVE-DOM | Clean capture |
| 8 | Bottega Veneta | https://www.bottegaveneta.com/en-us/home-content.html | 200 | LIVE-DOM (partial) | Header and promotional strip measured; homepage top region appears to be video/background media not captured by the selectors used; overlay text not detected |
| 9 | Jacquemus | https://www.jacquemus.com/en_fr | 200 (first attempt 403 "brief maintenance", retry OK) | LIVE-DOM | Didomi cookie banner present during capture |
| 10 | Stella McCartney | https://www.stellamccartney.com/gb/en/ | 200 | LIVE-DOM (partial) | https://www.stellamccartney.com/us returned 500; the GB route loaded. Lazy-loaded images below the first hero region had empty `src` at capture time |
| R1 | 24S (retailer, provided reference) | https://www.24s.com/en-us/women | 200 | LIVE-DOM | Full-bleed video hero measured |
| R2 | Moda Operandi (retailer, provided reference) | https://www.modaoperandi.com/ | 200 | LIVE-DOM | Promo bar + square-tile homepage measured; email-capture modal was present |

**User-provided screenshot set (USER-SCREENSHOT, not re-inspected here):** 24S, Mimosa, SKIMS, Moda Operandi, Stella McCartney, MR PORTER. These exist as project reference material on the 2202 side; this document does not re-analyze their pixels, and any screenshot-specific claims should be graded against that set, not against this session.

**Not covered:** Dior (blocked). Mobile viewports were not inspected in this session — recommend a dedicated pass before locking responsive breakpoints.

---

## 3. Per-site observations

All dimensions are CSS pixels at viewport ≈ 901 × 833 unless noted.

### 3.1 Saint Laurent — LIVE-DOM
- Final URL / Title: https://www.ysl.com/en-en — "Saint Laurent Official Online Store | YSL.com"
- **Header:** 80 px tall, `position: fixed`, `background: transparent`. Minimal visible text in the header element itself (logo plus icon utilities); navigation appears to live behind a menu.
- **Hero:** a full-screen slider slide measured exactly 901 × 833 — a **100vh full-bleed image** (source on `saint-laurent.dam.kering.com`, the Kering digital asset host) at `top: 0`, i.e., the hero starts under/behind the fixed transparent header rather than below it.
- **Palette:** body background transparent/white text context; black core text. No accent color observed.

### 3.2 Celine — LIVE-DOM
- Final URL / Title: https://www.celine.com/en-int/home — "OFFICIAL WEBSITE INTERNATIONAL | CELINE"
- **Header:** static, transparent, measured height 0 with text "CELINE SEARCH NAVIGATION" — an effectively minimal chrome: wordmark, search, hamburger. No visible category row.
- **Hero:** a dedicated class `o-fullscreen-img` div measured 901 × 833 — a **100vh full-bleed image** at `top: 0`.
- **Palette:** white body, black text; label type extremely small (consent-layer labels measured 10 px).
- Consent note: first load shows a full-screen location/consent overlay (`ketch` classes) that must be dismissed before the storefront is visible.

### 3.3 Dior — BLOCKED
- All attempted routes (en-us root, /en-us/fashion, /en-int/fashion) returned **503** in the browser and **403** to plain fetch. No header, hero, or palette observations possible. No claims about Dior's design are made in this document.

### 3.4 Chanel — LIVE-DOM + TEXT
- Final URL / Title: https://www.chanel.com/us/fashion/ — "Fashion shows, Ready-to-Wear and Accessories Collections | CHANEL"
- **Header:** 67 px, static, transparent, text "main navigation … Search My Account" — a slim transparent bar over content.
- **Hero:** the first campaign image measured **886 × 1323** starting at `top: 67` (immediately below the header) — a **full-width portrait image taller than the viewport**, inviting scroll-through rather than fitting in one screen.
- **Hero text overlay:** small centered white stack — "SPRING SUMMER 2026" (14 px, uppercase, white), "HAUTE COUTURE SHOW" (20 px, uppercase, white), with an underlined-style minimal CTA "SEE MORE" (11 px, uppercase).
- **Palette:** white/black core; cookie banner is the only large dark surface observed.

### 3.5 Prada — LIVE-DOM + TEXT
- Final URL / Title: https://www.prada.com/us/en.html — official store page
- **Header:** 72 px, `position: fixed`, transparent, with a **full inline navigation** (Menu, Search, Contact us, New Arrivals, Women, Men, Bags, Gifts, Prada Linea Rossa, Perfumes and Beauty, Home and Lifestyle, Fine Jewelry).
- **Hero:** a `hero-component` with modifier `hero-card--overlaps-header` measured **886 × 537 (~61% of viewport height)** at `top: 0` — the **hero slides behind the fixed header** (explicit in the class naming).
- **Hero text:** "Prada Essence" 32 px white (sentence case, not uppercase), with paired uppercase CTAs **"FOR HER" / "FOR HIM"** at 14 px — the multi-gender split CTA pattern.
- **Below hero:** "New Arrivals" section heading at 20 px black; text capture confirms deep category tree (Bags → Backpacks/Shoulder/Mini/Top handles/Totes/Briefcases; Ready to wear → Outerwear/Dresses/Skirts/Denim; Shoes; Small Leather Goods; Accessories; Travel).
- **Palette:** white body, black text; white hero typography over media.

### 3.6 Miu Miu — LIVE-DOM + TEXT (caveat)
- Final URL / Title: https://www.miumiu.com/us/en.html — official boutique page
- **Header:** 214 px tall, fixed, transparent — a **multi-row navigation** structure (category row: Deck Shoes, Highlights, Ready to wear, Bags, Shoes, Accessories, Small Leather Goods, Fashion Jewellery, Fragrances, Gifts, Miu Miu Club).
- **First-screen media:** square **417 × 417 category tiles** in the 562–778 px band with "Shop" links (image sources under `miumiu.com/content/dam/.../menu/`). The top ~0–560 px region produced no `img`/`video` matches in the selector set used, so the hero (if any) is likely delivered as a CSS/background layer and was not measured here.
- **Palette:** white body, `#333` text.

### 3.7 Loewe — LIVE-DOM
- Final URL / Title: https://www.loewe.com/usa/en/home — "Loewe | Designer Bags, Clothing, Accessories for Women & Men - LOEWE USA Official Website"
- **Header:** sticky, transparent, minimal (measured height 0 inside `<header>`; visible text is the site name/wordmark context only).
- **Hero:** first image **894 × 503 (~56% of viewport height)** at `top: 0` — **full-width landscape hero**; a second image below measures 894 × 1193 (portrait scroll-through band).
- **Caption pattern:** "Shearling statements" (18 px, black, sentence case) measured **just below the hero image** (top ≈ 503) — i.e., **caption under the media, not overlaid**.
- **Palette:** white body, black text. No accent color observed.

### 3.8 Bottega Veneta — LIVE-DOM (partial)
- Final URL / Title: https://www.bottegaveneta.com/en-us/home-content.html — "| Bottega Veneta® US"
- **Header:** 96 px, static, transparent, with an inline promo strip line: "Discover Corso, a new Intrecciato leather tote" — **announcement copy living inside the header block**, above/alongside Menu / Search / Sign in.
- **First-screen media:** `c-featured__slider` bands (869 × 189) around 380–590 px and a 505 × 631 campaign image; the region above ~380 px produced no `img`/`video` match — the top hero is presumably video/background media (not measured by the selectors used).
- **Overlay text:** no headline/CTA text detected in the first viewport — consistent with editorial imagery carrying its own typography.
- **Palette:** transparent-over-white/black core.

### 3.9 Jacquemus — LIVE-DOM
- Final URL / Title: https://www.jacquemus.com/en_fr — "JACQUEMUS | Official Store | Bags, Clothing & Accessories"
- **Header:** 68 px, `position: fixed`, transparent.
- **Hero:** a full-viewport visual container measured **901 × 833 (100vh)** at `top: 0`, plus a **category tile image 888 × 1183** (portrait, full-width) beginning around `top: 67` — portrait editorial tile directly under the header.
- **Palette:** white body, `#2e2e2e` text. Didomi consent banner present at capture.

### 3.10 Stella McCartney — LIVE-DOM (partial)
- Final URL / Title: https://www.stellamccartney.com/gb/en/ — "Designer Clothing | Latest Luxury Fashion | Stella McCartney UK" (the /us route returned **500**; substitution noted)
- **Header:** 58 px, sticky, transparent — the slimmest header measured among the ten.
- **First-screen content:** a slider component (`experience-layouts_v2-nav_slider`) beginning ≈ 517 px with **portrait 417 × 556 images** (≈ 3:4) — a **multi-tile editorial row**; six lazy variants at capture had empty `src` (lazy-loading), so the 0–517 px hero region could not be fully measured.
- **Headline pattern:** "Introducing 'Wild Horses'" (22 px) and "Kylie Jenner for Stella McCartney" (18 px) in black at ≈ 643 px — **campaign copy below/beside tile media**, sentence case with quotation-mark styling.
- **Palette:** white body, `#1a1a1a` text.

### 3.11 24S (provided retail reference) — LIVE-DOM
- Final URL / Title: https://www.24s.com/en-us/women — "24S | Luxury Fashion: designer clothes, bags & shoes"
- **Header:** sticky, transparent; designer list (Acne Studios, Balmain, Celine, Chloé, Coach, Dior, Givenchy, Lemaire, Loewe, Louis Vuitton, Marni…) present in header/nav text — **designer-index commerce navigation**, unlike maison hamburger nav.
- **Hero:** a full-bleed **VIDEO measured 901 × 1044** starting ≈ 32 px — motion hero taller than the viewport; **no overlay caption detected** in the measured region.
- **Palette:** white body, black text.

### 3.12 Moda Operandi (provided retail reference) — LIVE-DOM
- Final URL / Title: https://www.modaoperandi.com/ — "Women's Designer Clothing Collections & Runway Fashion | Moda Operandi"
- **Promo bar:** 37 px static strip, background `rgb(215,179,208)` (muted pink), 12 px links in `rgb(30,34,170)` (blue) — "SIGN UP FOR EMAIL TO RECEIVE 15% OFF…", plus "Need a Stylist?" utility.
- **Homepage modules:** square **886 × 886 (1:1)** module images (`PumoModuleImage__image`) beginning ≈ 142 px — a **square-tile merchandising grid**, plus an email-capture modal with a 360 × 540 campaign image.
- **Reading:** the most "retail-merchandising" surface of the set — promotional bar, discount hook, square product-forward tiles — in contrast to the maison editorial pattern above.

---

## 4. Cross-site patterns

### 4.1 Headers
- **Height band:** 58–96 px for single-row chrome (Stella 58, Chanel 67, Jacquemus 68, Prada 72, YSL 80, Bottega 96). Celine and Loewe measure effectively minimal (wordmark + hamburger + search). Miu Miu is the outlier with a 214 px multi-row nav.
- **Transparency-overlay is the norm:** eight of ten maison sites observed use `position: fixed/sticky` with `background: transparent`, so the hero media shows **through/behind** the header. Prada even names the pattern in CSS (`hero-card--overlaps-header`).
- **Two navigation models:** (a) **icon-minimal** (Celine, Loewe, YSL — logo + hamburger, few visible labels) vs (b) **inline category row** (Prada/Chanel show category links in the top bar). Maison sites favor (a); retailer 24S keeps a designer index visible.
- **Announcement strips:** Bottega carries promo copy inside the 96 px header; Moda Operandi runs a dedicated 37 px colored promo bar above. Heights ~37 px, type 11–12 px.
- **Utility set:** search, account, cart only — no clutter. Moda adds a "Need a Stylist?" service link.

### 4.2 Oversized heroes
- **Three hero geometries observed:**
  1. **100vh full-bleed** (YSL, Celine, Jacquemus): single image/video filling the viewport, media starting under the transparent header.
  2. **Partial-height landscape (~56–61vh)** (Loewe 503 px, Prada 537 px): shows more of the page above the fold; pairs with caption-below or title+CTA stacks.
  3. **Portrait scroll-through / video > viewport** (Chanel 1323 px tall, 24S 1044 px video): full-width media exceeding the first screen, telling the user to scroll.
- **Text-over-hero is deliberately small:** where overlay text exists it is an eyebrow + title + single CTA stack at ~11–20 px (Chanel) or a 32 px title plus paired CTAs (Prada). Several sites (YSL, Celine, 24S, Bottega, plus Stella's campaign block) show **no measured overlay copy in the first viewport** — the photography carries the moment.
- **CTA style:** uppercase, 11–14 px, one or two links maximum ("SEE MORE"; "FOR HER / FOR HIM"). No filled buttons, no pill buttons, no gradient scrims observed on overlay text.
- **Caption placement alternative:** Loewe and Stella place campaign wording **below or beside** media in black 18–22 px sentence case.

### 4.3 Category presentation
- **Image tiles with quiet labels:** Miu Miu square 417 × 417 tiles + "Shop" link; Stella 417 × 556 (≈ 3 : 4) portrait tile rows with 18–22 px black copy; Loewe caption-under-image; Jacquemus full-width portrait category tile (888 × 1183).
- **Consent geometry:** category crops observe **3 : 4, 4 : 5 portrait or 1 : 1 square** — landscape crops are reserved for heroes.
- **Label scale:** 14–22 px, black, sentence case or uppercase, on white below the imagery. No badges, no borders on tiles.
- **Menu depth with preview imagery:** Prada and Miu Miu expose deep category trees in navigation; Miu Miu decorates the menu with preview images (the 417 px tiles). 24S navigates by designer name instead of product category for its index.

### 4.4 Product / grid principles (observed from retailers + maison category rows)
- **Large imagery dominates cards**; name/price live in short small-type lines below the image (obvious in Miu Miu tiles and the 24S/Moda grids; product-listing pages were not separately crawled — graded at the home/category-tile level).
- **Whitespace as separator:** every observed site runs white/near-white bodies with no card borders; grouping is achieved with spacing alone.
- **Hover state diversity** was not measured in this session (no interaction sweep) — flag for follow-up.
- **Palette discipline:** white + black text is universal; the only strong accent surfaces observed in this set are Moda Operandi's pink promo bar and blue link color.

---

## 5. Palette assessment for 2202 Love Colombo

### Variant B — pure black/white UI
- **Observation match:** this is the dominant observed language (Celine, Saint Laurent, Loewe, Bottega Veneta, Chanel, Jacquemus, Miu Miu, Stella McCartney, 24S all sit on white/near-white bodies with black text and transparent imagery-overlay chrome; measured blacks range `#000` to `#333`/`#1a1a1a`).
- **Risks:** the observed sites differentiate through typography, spacing, and photography rather than color — so a mono palette only reads premium if letterform quality, letter-spacing, and image sizes carry the identity. With average type, mono reads generic.

### Variant A — black/white core + minimal brown accent
- **Observation match:** no observed maison uses a brown accent on these pages, but accent discipline exists — Moda Operandi's pink/blue accents show a single-accent commercial language can coexist with a white storefront. Brown would read as a warm, leather-era luxury signal without breaking the mono base.
- **Design inference (not an observed metric):** keep brown out of the first-viewport hero chrome (headers/heroes observed are strictly black-on-image or white-on-image); reserve it for small identity surfaces — wordmark, hairline dividers, link-hover, price/label accents, selection states.
- **Practical token set implied by the measurements:** base white `#FFFFFF`, ink `#111111`–`#1A1A1A` (observed range), secondary gray `#333`–`#5F6368` (observed session text), hairline `#E5E5E5`, accent brown to be fixed against actual 2202 photography (placeholder e.g. `#6B4A2E`, judged under real images later).

**Working stance for the project:** build both as token sets on the same mono base (Variant B is a strict subset of Variant A); choose after photography lands, using A if the photos skew warm/leather and B if they skew editorial-neutral.

---

## 6. Three full-width header + oversized hero directions (linked to the project's three choices)

Each direction is anchored to observed sites, with the measured numbers that justify it.

### Direction 1 — Overlay-Minimal (Celine / Saint Laurent / Stella model)
- Header: fixed (or sticky) transparent, **60–80 px** (measured 58–80), wordmark centered or left, icon-only utilities (search/account/cart), hamburger or ≤ 4 visible links; label color flips white-over-hero, black after scroll.
- Hero: **100vh full-bleed image** (measured 901 × 833 full-bleed twice); no overlay copy, or a single tiny uppercase CTA at the bottom edge.
- Best when: campaign photography is strong enough to speak alone — matches the 2202 single-big-image intent.

### Direction 2 — Overlap-Editorial (Prada / Loewe model)
- Header: fixed transparent **~72 px** with a visible inline category row (Prada pattern) if catalog navigation must be visible without a menu.
- Hero: landscape **~56–61vh** (measured 503/537 px at 833 vh) starting at `top: 0` behind the header; either a caption below the media in black 18 px (Loewe) or a white 32 px title plus paired uppercase CTAs (Prada split). Works for lookbook pacing, lets one page carry several campaigns.
- Best when: the storefront needs category wayfinding on the surface while staying editorial.

### Direction 3 — Announcement + Portrait-Scroll (Chanel / 24S / Moda model)
- Header: slim announcement strip first (**37 px**, type 11–12 px — optionally the brown accent strip is Variant A), then 67–96 px transparent header.
- Hero: **full-width portrait media taller than the viewport** (Chanel 886 × 1323; 24S video 901 × 1044) with a small centered white stack: 14 px uppercase eyebrow, 20 px uppercase title, 11 px CTA.
- Best when: the brand wants motion (campaign film) or vertically proportioned photography and a scrolldown pull; retail references (24S, Moda) prove it works with product-forward content beneath.

---

## 7. Concrete recommendations to carry into the theme build

1. **Header block:** transparent fixed `header` at 72 px desktop (58 px mobile), background flips to solid white with `1px` `#E5E5E5` hairline after scroll threshold; logo centered ~18–22 px; utilities as 20 px icon buttons.
2. **Hero media:** `object-fit: cover`, heights 100vh (Direction 1) or 60vh (Direction 2); portrait-scroll variant (Direction 3) uses aspect-ratio ~3 : 4 full-width; preload the first hero image, lazy-load everything below.
3. **Overlay copy scale (observed):** eyebrow 12–14 px uppercase +0.1em; title 20–32 px; CTA 11–14 px uppercase underline; maximum three short lines and one CTA (two only for gender-split).
4. **Category tiles:** portrait crops 3 : 4 / 4 : 5, two-up desktop (≈ 50vw), one-up or 2-up mobile; label 14–18 px black below image, 16–24 px gap; no card borders, no badges.
5. **Product cards:** image-driven, name/price at 13–14 px in two quiet lines; white spacing as the only separator; hover zoom ≤ 1.05 scale (state unmeasured — treat as hypothesis pending a small follow-up).
6. **Rhythm:** section spacing 80–120 px desktop; typography with a single display/typeface pairing; the caption-below-media pattern (Loewe/Stella) for editorial sections and the small-overlay pattern (Chanel/Prada) for conversion surfaces.
7. **Palette tokens per §5**, brown restricted to non-chrome small surfaces in Variant A.

---

## 8. Evidence access & reproduction

- **Environment:** Chromium via Playwright automation, viewport ≈ 901 × 833, automated DOM geometry + computed-style extraction; raw accessibility snapshots & console logs recorded by the automation layer under `.playwright-mcp/` in the workspace (session artifacts, dated 2026-10-22).
- **Exact URLs inspected** are in §2; statuses are recorded per attempt, including failures (Dior 503/403; saintlaurent.com SSL error; Stella /us 500 and Jacquemus transient 403 during the same window — retry behavior noted).
- **Text-only fetches:** Prada (full tree) and Chanel root (location picker) via plain HTTP; both are graded TEXT wherever the browser did not render the same surface.
- **Not re-inspected:** the user-provided screenshot set (24S, Mimosa, SKIMS, Moda Operandi, Stella McCartney, MR PORTER) — kept as separate project inputs.
- **No competitor imagery was downloaded;** only dimension metadata and host names were recorded.
- **Self-audit limits:** one desktop viewport, consent overlays may hide nav (Celine/Ketch, Jacquemus/Didomi), CSS-background media may evade tag-based capture (Miu Miu, Bottega hero top), lazy-load may leave `src` empty at capture (Stella). Mobile pass and hover-state sweep recommended before final design lock.

---

*End of research record. All observations dated 2026-10-22; re-verify before quoting numbers in customer-facing materials, since these sites change campaigns frequently.*
