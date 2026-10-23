# 2202 Love Colombo — Demo Information-Page Content (`pages-data.json`)

Date: 2026-10-22. Content owner of this file and `html-demo/assets/pages-data.json`: docs agent.
Canonical demo copy: `html-demo/assets/pages-data.json`. Raw read-only source extraction: `scripts/export-demo-pages.php`.

## 1. Provenance and verification (all 2026-10-22, read-only)

IDs were verified live with `wp post list --post_type=page --post_status=publish` against
`/home/vjranga/local/2202lovecolombo` before extraction. Source of truth for all extracted copy:
the Elementor JSON stored in the `_elementor_data` post meta (not the rendered Woodmart HTML), so
theme header/footer/announcement markup was never part of the input.

| WP ID | WP slug (canonical permalink) | WP title | Elementor source size | Demo slug | Demo title |
| --- | --- | --- | --- | --- | --- |
| 4400 | `about-us` | About us | 8,553 chars | `about-us` | About Us |
| 4439 | `contact-us` | Contact us | 5,147 chars (map iframe + info list + Fluent Forms widget) | `contact-us` | Contact Us |
| 29129 | `privacy-policy` | Privacy Policy | 2,723 chars | `privacy-policy` | Privacy Policy |
| 29131 | `delivery` (`/delivery/` is the WP permalink; title is "Delivery Policy") | Delivery Policy | 2,140 chars | `delivery-policy` | Delivery Policy |
| 29133 | `refund-policy` | Return & Refund Policy | 1,803 chars | `refund-policy` | Return & Refund Policy |
| 29127 | `terms-conditions` | Terms & Conditions | 2,559 chars | `terms-conditions` | Terms & Conditions |

Every article slug was verified `publish` and the WP `post_modified` times are recorded in the raw
extraction (`scripts/export-demo-pages.php` output). The demo slug `delivery-policy` is a deliberate
demo key; the WP permalink differs (`/delivery/`).

Re-derive the raw source (read-only, never writes WordPress):

```bash
cd /home/vjranga/local/2202lovecolombo
wp --allow-root eval-file /home/vjranga/Documents/2202/shopify-theme/scripts/export-demo-pages.php > /tmp/demo-pages-raw.json
```

The script also re-emits the published contact form definition directly from the Fluent Forms
tables (`wp_fluentform_forms` row 1). No forms were submitted and no customer, order, submission, or
credential data was read or exported.

## 2. Sanitization rules applied to every page

The committed `contentHtml` is hand-cleaned; these rules are the contract:

- Elementor container/widget wrappings removed; no `wd-`/Woodmart classes, no `data-*` widget
  attributes, no Elementor/Fluent runtime markup classes. The only `class` values used are four
  neutral grouping hooks (`page-intro`, `page-features`, `page-section`, `page-outro`,
  `page-columns`, `page-column`, `page-map`, `page-contact`) that a page template may style or
  ignore without any dependency.
- No `<script>`, no `on*` event attributes, no WP runtime dependencies. Zero `<img>` tags: any
  imagery the page needs is an asset-derivative decision (§5), not content markup.
- Fluent Forms/reCAPTCHA runtime markup removed; the form only exists in `contact.formFields` /
  `contact.fields` as data the demo page renders with its own controls (§4).
- Heading-level normalization: Elementor's decorative `h3` section heads became `h2`; the `h5`
  callouts became body `p` text; word-for-word copy is unchanged (punctuation, `&`-escapes and
  en-dashes are the deliberate exceptions).
- Elementor hard line-breaks (`<br>`) inside paragraphs were joined into plain sentences.
- Link policy — every `href` in the file is one of: a demo route
  (`page.html?slug=privacy-policy`, `page.html?slug=refund-policy`, `page.html?slug=contact-us`),
  `tel:+94773672202`, `mailto:info@2202lovecolombo.com` (also the verbatim-cased
  `mailto:Info@2202lovecolombo.com` on the About page's partner record), or an explicit external
  URL (§3). No `localhost` URL appears anywhere in `contentHtml`; the *only* `localhost:8099`
  strings are the `sourceUrl` provenance fields, which are never rendered by the frontend.
- Stale exchange link fixed: the Elementor contact list linked the phone with a placeholder
  `tel: (064) 332-1233` left over in the builder; the *displayed* number is `+94773672202`
  (and `077 367 2202` on the policy pages — same number in international format). The demo links
  `tel:+94773672202` and displays the number exactly as the page showed it.

Link inventory in the committed file (whole file, verified by scan):

- `tel:+94773672202` (present on contact-us, delivery-policy, refund-policy)
- `mailto:info@2202lovecolombo.com` (delivery-policy, refund-policy)
- `mailto:Info@2202lovecolombo.com` (contact-us)
- `page.html?slug=contact-us` (delivery-policy "Order Issues")
- `page.html?slug=refund-policy` (terms-conditions "Returns & Exchanges")
- `page.html?slug=privacy-policy` (terms-conditions "Privacy")
- external only inside the contact-us map document (§3)

Verified counts: 6 pages; `contentHtml` lengths — about-us 2,028, contact-us 1,092,
privacy-policy 1,897, delivery-policy 1,562, refund-policy 1,508, terms-conditions 2,094
  characters; 9 hrefs total across the file; zero `localhost` strings inside any `contentHtml`;
  the only `http://localhost:8099` strings are the six `sourceUrl` provenance fields.

## 3. External content decision — Google Maps embed

The WP contact page embeds a Google Maps `<iframe>` (centered on the Nihal Apparel location).
The embed markup was rebuilt verbatim with `title` added for accessibility. Inner `<iframe>`
attributes are DOM-structural only; no Google script was copied. If the client review prefers a
zero-third-party preview, this document may be dropped by the frontend agent without needing any
data change (the iframe is self-contained inside `contentHtml`).

## 4. Contact record and form (rendered shape in demo)

`pages-data.json` carries:

```json
"contact": {
  "address": "435/20A, St. Joseph Estate, Dalugama, Kelaniya",
  "phone": "+94773672202",
  "email": "Info@2202lovecolombo.com",
  "fields": ["First Name", "Last Name", "Email", "Your Message"]
}
```

WP source facts (all 2026-10-22, read-only):

- Fluent Forms form id 1, "Contact Form", `published`.
- Visible fields by DB reading and the rendered page both agree: First Name (names[first_name]),
  Last Name (names[last_name]), Email (email), Your Message (message). Required flag: none of the four is enforced as required in the WP form 1 definition.
- Submit button text is `Submit Form` (Elementor widget rendered `aria-label="Submit Form"`).
- A Google reCAPTCHA field is present in the WP form definition. A static demo cannot pass a real
  reCAPTCHA challenge, so the demo carries no reCAPTCHA element; the omission is recorded here rather than fake-submitted or silently hidden.

Demo contact-page behavior contract (no real submission exists):

- A static demo cannot send any message. The demo form must surface a visible notice that the
  message was **not** sent — for example "Preview: message not sent". Fake success ("message sent")
  banners are prohibited: no notice may pretend the form reached a server.
- Treating inputs as required on the demo form is a frontend choice; whatever path is taken, no
  false "sent" acknowledgment appears anywhere.
- No newsletter, order, or email state is ever created by the demo preview.

## 5. Imagery extracted but NOT copied (asset-agent scope)

The pages reference one substantive background image and one icon set. Per ownership boundary this
document only records them; it does not copy, recolor, or hard-link them into `contentHtml`.

| Source | Where it lives | Suggested demo use (asset agent) |
| --- | --- | --- |
| `2026/06/2202about.webp` (WP `about-us` hero band 4400) | already in the copied library at `assets/images/2026/06/2202about.webp` | optional About-page hero band derivative into `html-demo/assets/images/` if the client wants the About page's image-led hero; `contentHtml` does not depend on it |
| Font Awesome glyphs (`fa-gem`, `fa-tags`, `fa-infinity`, `fa-leaf`) used by the About icon boxes | first-party icon fonts only, not copied | demo may render the four feature blocks text-only (as committed), or substitute neutral inline SVG icons later |
| Woodmart helper SVGs (`wd-cursor-dark.svg`, `wd-phone-dark.svg`, `wd-envelope-dark.svg`) | in the copied library | not needed; the demo renders contact info textually |

## 6. Social links — honest recorded state

The homepage/footer observation record said "footer socials Facebook, X, Instagram, YouTube,
Pinterest". Verified 2026-10-22: **every one of those footer entries links to `#`** — no real
handle exists anywhere in the WP database (verified by scanning all `wp_options` values for any
`facebook.com/…`, `instagram.com/…`, `youtube.com/…`, `tiktok.com/…` brand URL; the only hits are
plugin administrator sample data, e.g. a Woodmart Instagram widget demo pointing at
`ozdesignfurniture`, which is not this brand). Consequently `pages-data.json` ships
`"social": []` — an intentionally empty array. The demo page must not fake or guess handles; a
real social block waits for brand handles from the client.

## 7. Demo routes and anything not in `pages-data.json`

The scope of this data file is the six information pages + the contact record + the (empty) social
record. Demo-only pages that reuse the WP-information experience are frontend-agent scope and need
no WordPress content export:

- `/account.html` — static login demo mirroring the WP `/my-account/` login form shape
  (Username or email address, Password, Log in, Remember me, Lost your password?); registration is
  disabled in WP, so no account can be created in the demo and every control stays inert.
- `/order-tracking.html` — order-tracking demo mirroring the WP `/order-tracking/` WooCommerce form
  (Order ID, Billing email, Track). **No fake found orders**: any Track action yields a
  "no orders found in this demo" state (the same honest preview rule as the contact form).
- `/cart.html`, `/wishlist.html`, `/search.html?q=…`, `/collection.html?category=…`,
  `/product.html?id=…` — commerce demo routes built by the frontend agent from `demo-data.json`
  (owned separately); nothing in this file blocks them.

## 8. Relationship to the discovery docs

- `docs/PAGE-INVENTORY.md` still records the platform observation for every WP route; this file is
  the **demo content** layer for the six information pages, sanitized and de-platformed.
- Copy conflicts carried over unchanged from discovery (client decisions, not content decisions,
  and inherited here verbatim): shipping charges "LKR 300 – LKR 350" per the published Delivery
  Policy vs. the DB flat Rs 400 rate (`README.md` issue 1); the "Powered by Nihal Apparel" credit;
  the "Userfull Links" footer typo; the XXL "16 - 28" chart value. The demo renders the published
  page copy unchanged and flags the conflict where it applies.
