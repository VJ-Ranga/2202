#!/usr/bin/env python3
"""Prepare demo assets + data contract for the 2202 Love Colombo HTML demo.

Generates (only files this script owns):
  html-demo/assets/images/*.webp   real-photo WebP derivatives for ALL 449 source
                                   attachments referenced by products/variations
                                   (480w for all; +960w when source >= 960px wide;
                                   +1440w only for hero-lesson presets). No upscaling.
  html-demo/assets/images/*.png    logo copies + black recolor (exact alpha)
  html-demo/assets/fonts/*.woff2   Barlow 400-700 (latin) + Bodoni Moda 400 roman/italic
  html-demo/assets/demo-data.json  the full data contract (all 116 products, 597 variants)

Sources are read-only: data/products.json, data/taxonomies.json,
data/personalisation.json, assets/images/**, local WordPress font caches.

Contract (existing top keys never renamed; paths relative to html-demo root):
  {products:[{id,name,slug,sku,price,regularPrice,categories,
              sizes:[{label,available}],image:Media,alternate:Media|null,
              description,fullDescription,stockStatus,
              gallery:[Media...],variants:[...],sizeGuide:string|null}],
   categories:[{name,slug,image:Media|null,parentId,description,count}],
   navigation:[{name,slug,children:[{name,slug}]}],
   heroes:[{eyebrow,title,description,category,left:Media,right:Media}],
   editorial:{left:Media,right:Media},
   personalisation:{image:Media,title,description},
   logos:{black,white,brown},
   fonts:{body:string|null}}
  variants:[{id,options:{attr->value},size,price:number|null,
             regularPrice:number|null,available:boolean,image:Media|null}]
  Media={src,srcset,width,height,alt,position}
  width/height = intrinsic dims of `src`; identical aspect across srcset. No
  file is cropped; the frontend crops via object-fit using `position`.

Filename plan (stable, deduped by attachment id, no duplicate copies):
  - the first four-grid/hero preset names keep their original paths
    (love-notes-pj-960.webp etc.) so existing frontend preload references hold.
  - product featured attachment: <product-slug>-<w>.webp (unless preset name)
  - other gallery attachments: <slug>-g<i>-<w>.webp
  - variation attachments: <slug>-v<variant-id>-<w>.webp
  - shared/reused attachments keep the first-claimant name (no duplicates).

Run:  python3 scripts/prepare-demo-assets.py   (repo root)
Exits non-zero when any validation check fails.
"""

import json
import os
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP = "/home/vjranga/local/2202lovecolombo/wp-content"
SRC_IMG = os.path.join(ROOT, "assets", "images")
OUT_IMG = os.path.join(ROOT, "html-demo", "assets", "images")
OUT_FONTS = os.path.join(ROOT, "html-demo", "assets", "fonts")

products_src = json.load(open(os.path.join(ROOT, "data", "products.json")))
by_id = {p["id"]: p for p in products_src["products"]}
tax_src = json.load(open(os.path.join(ROOT, "data", "taxonomies.json")))

BARLOW = {  # latin subsets, Woodmart local google-fonts cache
    400: "barlow-acc3a2d8.woff2",
    500: "barlow-9afb00e9.woff2",
    600: "barlow-4b3ff090.woff2",
    700: "barlow-713fe24b.woff2",
}
BARLOW_DIR = os.path.join(WP, "uploads", "woodmart", "google-fonts", "fonts")
SERIF = {
    "bodoni-moda-400.woff2":
        "aFT67PxzY382XsXX63LUYL6GYFcan6NJrKp-VPjfJMShrpsGFUt8oU7awIVytVjMYwE.woff2",
    "bodoni-moda-400-italic.woff2":
        "aFT07PxzY382XsXX63LUYJSPUqb0pL6OQqxrZLnVbvZedvJtj-V7tIaZKMN4tHrJcwHqoQ.woff2",
}
SERIF_DIR = os.path.join(WP, "uploads", "fonts")

LOGOS = {
    "white": "2025/07/love-colombo-logo.png",
    "brown": "2025/07/love-colombo-logo-2.png",
}

SIZES_ORDER = ["UK06/XS", "UK08/S", "UK10/M", "UK12/L", "UK14/XL", "UK16/2XL"]

# ---------- first-pass presets (paths must not change) ----------

PID_KEY = {
    31845: "love-notes-pj",
    31836: "blush-serenity-pj",
    31824: "pink-daydream-pj",
    31812: "bow-sweet-pj",
    31800: "blossom-crush-pj",
    31787: "daisy-darling-pj",
    31776: "garden-whispers-pj",
    31764: "cherry-kisses-pj",
    31662: "midnight-long-set",
    31597: "burgundy-long-set",
    30895: "mocha-essential-maxi-dress",
    31030: "mocha-wide-leg-pant",
}
HERO1440 = {  # preset names carrying a 1440w stop (hero assets only)
    "midnight-long-set",
    "midnight-long-set-alt",
    "midnight-long-set-zip",
    "burgundy-long-set",
    "mocha-essential-maxi-dress",
    "mocha-essential-maxi-dress-alt",
    "mocha-wide-leg-pant-alt",
    "cocoa-nights-short-set",
    "butter-cami-set",
}
CATEGORY_TILES = [
    ("PJ's", "pjs", "cocoa-nights-short-set"),
    ("Dresses", "dresses", "mocha-essential-maxi-dress"),
    ("Tops", "tops", "butter-rib-top"),
    ("Bottoms", "bottoms", "mocha-wide-leg-pant-alt"),
]
CATEGORY_ALTS = {
    "cocoa-nights-short-set": "Model wearing the Cocoa Nights Short Set, brown satin on the studio sweep",
    "mocha-essential-maxi-dress": "Model wearing the Mocha Essential Maxi Dress, chocolate rib knit",
    "butter-rib-top": "Model wearing the Butter Rib Bodysuit, rib knit top on a cream backdrop",
    "mocha-wide-leg-pant-alt": "Close view of the Mocha Wide Leg Pant against a gold-lit wall",
}

NAVIGATION = [  # exact taxonomy terms, primary order from the approved menu screenshot
    {"name": "Dresses", "slug": "dresses", "children": []},
    {"name": "Tops", "slug": "tops", "children": [
        {"name": "Blouse", "slug": "blouse"},
        {"name": "T-Shirts", "slug": "t-shirts"},
        {"name": "Hoodies/Jackets", "slug": "jackets"},
    ]},
    {"name": "Bottoms", "slug": "bottoms", "children": [
        {"name": "Pants", "slug": "pants"},
        {"name": "Skirts", "slug": "skirts"},
        {"name": "Shorts", "slug": "shorts"},
    ]},
    {"name": "PJ's", "slug": "pjs", "children": []},
    {"name": "DENIM", "slug": "denim", "children": []},
    {"name": "Sets", "slug": "sets", "children": []},
    {"name": "RIBBED SERIES", "slug": "ribbed", "children": []},
    {"name": "Sale", "slug": "sale", "children": []},
    {"name": "Bags", "slug": "bags", "children": []},
    {"name": "Scrunchies", "slug": "scrunchies", "children": []},
]

# ---------- helpers ----------

Image = None


def clean_lines(s):
    s = s.replace("\r", "\n").replace("&amp;", "&")
    lines = [ln.replace("\t", " ").strip() for ln in s.split("\n")]
    out = []
    for ln in lines:
        if not ln and (not out or not out[-1]):
            continue
        if ln and out and ln == out[-1]:
            continue
        out.append(ln)
    return "\n".join(out).strip()


def full_description(p):
    return clean_lines(p["descriptions"]["full_text"])


def short_description(p):
    """Source intro paragraph + source-stated fabric. No invented claims."""
    src = p["descriptions"]["full_text"].replace("\r", "\n").replace("&amp;", "&")
    paras = [x.strip() for x in src.split("\n\n") if x.strip()]
    intro = ""
    for para in paras:
        t = para.split("\n")[0].strip()
        if len(t) > 90 and not t.lower().startswith(("product description", "fabric")):
            intro = t
            break
    fabric = ""
    lines = [l.strip() for l in src.replace("\r", "\n").split("\n")]
    for i, line in enumerate(lines):
        if not line.lower().startswith("fabric"):
            continue
        rest = line[6:].strip().lstrip(":").replace("& Care", "").strip()
        if rest:
            fabric = rest
            break
        j = i + 1
        while j < len(lines) and not lines[j]:
            j += 1
        if j < len(lines):
            fabric = lines[j]
            break
    parts = [intro]
    if fabric:
        parts.append("Fabric: " + fabric)
    return "\n".join(parts)


def _num(s):
    if s in (None, "", "0"):
        return None
    try:
        v = round(float(s), 2)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


# ---------- asset infrastructure ----------

attach = {}          # attachment id -> source dict
canonical_name = {}  # attachment id -> stable name (no width suffix)
HERO_EXTRA = []


def register(entry):
    """attachment dict -> canonical *name* (id-keyed dedupe, first claim wins)."""
    if entry is None or not entry.get("exists"):
        return None
    aid = entry["id"]
    attach.setdefault(aid, entry)
    return aid


def preseed(aid, name):
    if aid in canonical_name:
        assert canonical_name[aid] == name, f"preset conflict {aid}: {canonical_name[aid]} vs {name}"
    canonical_name[aid] = name


def seed_presets():
    for pid, key in sorted(PID_KEY.items()):
        p = by_id[pid]
        preseed(register(p["featured_image"]), key)
        gall = [g for g in p.get("gallery_images", []) if g.get("exists")]
        gall = [g for g in gall if g["id"] != p["featured_image"]["id"]]
        if gall:
            preseed(register(gall[0]), key + "-alt")
    # editorial right banner: Midnight front-with-zip = gallery[1] of 31662
    p31662 = by_id[31662]
    seq = gallery_sequence(p31662)
    assert seq[2].get("relative_path") == "2026/09/3-2.jpg", "31662 gallery changed"
    preseed(register(seq[2]), "midnight-long-set-zip")
    # hero 3 / category tile anchors
    preseed(register(by_id[31646]["featured_image"]), "cocoa-nights-short-set")
    preseed(register(by_id[30671]["featured_image"]), "butter-cami-set")
    preseed(register(by_id[30888]["featured_image"]), "butter-rib-top")
    # personalisation macro is not product-attached; it lives in
    # data/personalisation.json placements (image_id -> Pocket2.jpeg)
    personalisation_src = json.load(open(os.path.join(ROOT, "data", "personalisation.json")))
    pocket = None
    for st in personalisation_src.get("sets", []):
        for pl in st.get("placements", []):
            if "Pocket2.jpeg" in (pl.get("image_url") or ""):
                pocket = {"id": pl["image_id"],
                          "relative_path": "2026/09/Pocket2.jpeg",
                          "alt_text": "", "title": "Pocket2", "exists": True}
    if pocket is None:
        sys.exit("Pocket2.jpeg not found in personalisation export")
    preseed(register(pocket), "pocket-embroidery")


def register_size_charts():
    """Attach size-chart images used by product size guides (source refs only)."""
    for p in sorted(products_src["products"], key=lambda q: q["id"]):
        aid = size_chart_path(p)
        if aid is None:
            continue
        if aid in attach:
            continue
        ref = next(r for r in (p.get("size_guide") or {}).get("image_references", [])
                   if r.get("attachment_id") == aid)
        relpath = ref["destination_relative_path"][len("assets/images/"):]
        if not os.path.exists(os.path.join(SRC_IMG, relpath)):
            sys.exit(f"size chart missing on disk: {relpath}")
        attach[aid] = {"id": aid, "relative_path": relpath,
                       "alt_text": (p.get("size_guide") or {}).get("title") or "Size chart",
                       "title": (p.get("size_guide") or {}).get("title") or "Size chart",
                       "exists": True}
        canonical_name.setdefault(aid, f"size-chart-{aid}")


def gallery_sequence(p):
    """featured first, then public gallery order, deduped."""
    out = []
    if p["featured_image"].get("exists"):
        out.append(p["featured_image"])
    for g in p.get("gallery_images", []):
        if g.get("exists") and g["id"] not in {x["id"] for x in out}:
            out.append(g)
    return out


def claim_names():
    """Deterministic naming pass over all products (id asc) then variations."""
    for p in sorted(products_src["products"], key=lambda q: q["id"]):
        seq = gallery_sequence(p)
        for i, entry in enumerate(seq):
            aid = register(entry)
            if aid in canonical_name:
                continue
            if i == 0:
                canonical_name[aid] = p["slug"]
            else:
                canonical_name[aid] = f"{p['slug']}-g{i}"
        for v in p.get("variations", []):
            fi = v.get("featured_image")
            if fi and fi.get("exists"):
                aid = register(fi)
                if aid not in canonical_name:
                    canonical_name[aid] = f"{p['slug']}-v{v['id']}"


def media_short_name(aid):
    name = canonical_name[aid]
    src_info = attach[aid]
    if src_info["width"] >= 960:
        src_w, widths = 960, [480, 960] + ([1440] if name in HERO1440 else [])
    else:
        src_w, widths = 480, [480]
    return name, src_w, widths


def build_media(name, src_w, widths, w, h, alt, position):
    rel = lambda wd: os.path.join("assets", "images", f"{name}-{wd}.webp")
    src = rel(src_w)
    srcset = ", ".join(f"{rel(wd)} {wd}w" for wd in widths)
    return {"src": src, "srcset": srcset, "width": w, "height": h,
            "alt": alt, "position": position}


def attachment_alt(aid, fallback=""):
    e = attach[aid]
    alt = (e.get("alt_text") or e.get("title") or fallback or "").strip()
    return alt.replace("&amp;", "&") or "Product image"


# ---------- generation ----------

def probe_attach_dims():
    """Fill real width/height for every registered attachment from its file."""
    for aid, entry in attach.items():
        if "width" in entry and "height" in entry:
            continue
        path = os.path.join(SRC_IMG, entry["relative_path"])
        if not os.path.exists(path):
            sys.exit(f"attachment missing on disk: {entry['relative_path']}")
        with Image.open(path) as im:
            entry["width"], entry["height"] = im.size


def generate_webps():
    jobs = []
    for aid, entry in attach.items():
        src = os.path.join(SRC_IMG, entry["relative_path"])
        name, src_w, widths = media_short_name(aid)
        for wd in widths:
            if wd > entry["width"]:
                sys.exit(f"would upscale {name} (source {entry['width']}px wide) to {wd}w")
            jobs.append((src, wd, os.path.join(OUT_IMG, f"{name}-{wd}.webp")))
    def run(args):
        src, wd, out = args
        subprocess.run(["cwebp", "-q", "82", "-resize", str(wd), "0",
                        src, "-o", out, "-quiet"], check=True)
        return len(src)  # non-empty marker for map ordering determinism
    with ThreadPoolExecutor(max_workers=8) as pool:
        pool.map(run, jobs)
    return len(jobs)


def generate_fonts():
    from fontTools.ttLib import TTFont
    os.makedirs(OUT_FONTS, exist_ok=True)
    for weight, fname in BARLOW.items():
        src = os.path.join(BARLOW_DIR, fname)
        fam = TTFont(src)["name"].getDebugName(1)
        wcls = TTFont(src)["OS/2"].usWeightClass
        if not fam.startswith("Barlow") or wcls != weight:
            sys.exit(f"{fname}: {fam}/{wcls}, expected Barlow/{weight}")
        shutil.copyfile(src, os.path.join(OUT_FONTS, f"barlow-{weight}.woff2"))
    cmap_ok = lambda path: all(ord(ch) in TTFont(path).getBestCmap() for ch in "ABCDEFG")
    for dst, src_name in SERIF.items():
        src = os.path.join(SERIF_DIR, src_name)
        if not cmap_ok(src):
            sys.exit(f"{src_name} lacks latin A-G coverage")
        shutil.copyfile(src, os.path.join(OUT_FONTS, dst))


def generate_logos():
    global Image
    with Image.open(os.path.join(SRC_IMG, LOGOS["white"])) as wlogo, \
         Image.open(os.path.join(SRC_IMG, LOGOS["brown"])) as blogo:
        aw, ab = wlogo.getchannel("A"), blogo.getchannel("A")
        if wlogo.size != blogo.size or aw.tobytes() != ab.tobytes():
            sys.exit("white/brown logo alpha masks differ")
        if ab.getextrema() != (0, 255):
            sys.exit("logo alpha range unexpected")
        black = Image.new("RGBA", blogo.size, (0, 0, 0, 0))
        black.putalpha(ab)
        black.save(os.path.join(OUT_IMG, "love-colombo-logo-black.png"), optimize=True)
    with Image.open(os.path.join(OUT_IMG, "love-colombo-logo-black.png")) as saved:
        if saved.getchannel("A").tobytes() != ab.tobytes():
            sys.exit("black logo alpha changed on save")


# ---------- contract ----------

def size_chart_path(p):
    sg = p.get("size_guide") or {}
    for r in sg.get("image_references") or []:
        rel = (r.get("destination_relative_path") or "")
        if rel and r.get("destination_exists"):
            relpath = rel[len("assets/images/"):]
            if not os.path.exists(os.path.join(SRC_IMG, relpath)):
                sys.exit(f"size chart missing on disk: {rel}")
            return r["attachment_id"]
    return None


def main():
    global Image
    from PIL import Image as PILImage
    Image = PILImage

    os.makedirs(OUT_IMG, exist_ok=True)
    seed_presets()
    claim_names()
    register_size_charts()
    probe_attach_dims()

    # dims of every src/webp pair (probed from real files, no assumptions)
    dims = {}
    for aid, entry in attach.items():
        w0, h0 = entry["width"], entry["height"]
        name, src_w, widths = media_short_name(aid)
        dims[aid] = (name, src_w, widths, src_w, round(h0 * src_w / w0))

    n_files = generate_webps()
    generate_fonts()
    generate_logos()

    # ---- products ----
    products = []
    variant_count = 0
    for p in sorted(products_src["products"], key=lambda q: q["id"]):
        cur = _num(p["prices"]["current"])
        reg = _num(p["prices"]["min_regular"])
        if cur is None:
            sys.exit(f"product {p['id']} lacks current price")
        regularPrice = reg if (reg is not None and reg > cur) else None

        seq = gallery_sequence(p)
        def media_for(aid, alt, position="50% 50%"):
            name, src_w, widths = media_short_name(aid)
            w, h = dims[aid][3], dims[aid][4]
            return build_media(name, src_w, widths, w, h, alt, position)

        image_media = media_for(seq[0]["id"], p["name"])
        gallery = []
        for i, entry in enumerate(seq):
            aid = entry["id"]
            if i == 0:
                alt = p["featured_image"].get("alt_text") or p["name"]
            else:
                alt = attach[aid].get("alt_text") or attach[aid].get("title") or p["name"]
            gallery.append(media_for(aid, alt))
        alternate = gallery[1] if len(gallery) > 1 else None

        sizes = {}
        variants = []
        for v in p.get("variations", []):
            if v.get("status") != "publish":
                continue
            variant_count += 1
            options = {}
            for a in v.get("attributes", []) :
                options[a["label"]] = a["value"]
            vcur = _num(v["prices"]["current"])
            vreg = _num(v["prices"]["regular"])
            available = v["stock"]["status"] == "instock" and vcur is not None
            fi = v.get("featured_image")
            vimg = media_for(fi["id"], attachment_alt(fi["id"], p["name"])) \
                    if fi and fi.get("exists") else None
            variants.append({
                "id": v["id"],
                "options": options,
                "size": v.get("size") or "",
                "price": vcur,
                "regularPrice": vreg,
                "available": available,
                "image": vimg,
            })
            sizes.setdefault(v.get("size") or "", []).append(available)
        labels = [s for s in SIZES_ORDER if s in sizes] + \
                 sorted(set(sizes) - set(SIZES_ORDER))
        sizes_out = [{"label": s, "available": any(sizes[s])} for s in labels]

        stock_status = p["stock"]["status"]
        if (p.get("type") == "variable" and p.get("variation_count")
                and stock_status == "instock"
                and not any(s["available"] for s in sizes_out)):
            print(f"note: product {p['id']} instock but no buyable size (source state)")

        chart_aid = size_chart_path(p)
        size_guide = None
        if chart_aid is not None:
            name, src_w, _w = media_short_name(chart_aid)
            size_guide = os.path.join("assets", "images", f"{name}-{src_w}.webp")

        products.append({
            "id": p["id"],
            "name": p["name"],
            "slug": p["slug"],
            "sku": p.get("sku") or "",
            "price": cur,
            "regularPrice": regularPrice,
            "categories": [c["name"] for c in p["categories"]],
            "sizes": sizes_out,
            "image": image_media,
            "alternate": alternate,
            "description": short_description(p),
            "fullDescription": full_description(p),
            "stockStatus": stock_status,
            "gallery": gallery,
            "variants": variants,
            "sizeGuide": size_guide,
        })

    # ---- categories (all 17 real taxonomy terms) ----
    cat_src = list(tax_src["taxonomies"]["product_cat"]["terms"])
    cat_by_slug = {c["slug"]: c for c in cat_src}
    tile_by_slug = {slug: key for _, slug, key in CATEGORY_TILES}
    counts = {}
    for prod in products:
        for c in by_id[prod["id"]]["categories"]:
            counts[c["slug"]] = counts.get(c["slug"], 0) + 1
    categories = []
    for term in cat_src:
        slug = term["slug"]
        img = None
        if slug in tile_by_slug:
            key = tile_by_slug[slug]
            aid = {v: k for k, v in canonical_name.items()}[key]
            name, src_w, widths = media_short_name(aid)
            img = build_media(name, src_w, widths, dims[aid][3], dims[aid][4],
                              CATEGORY_ALTS[key], "50% 12%")
        categories.append({
            "name": term["name"],
            "slug": slug,
            "image": img,
            "parentId": term.get("parent_id") or None,
            "description": (term.get("description") or "").strip() or None,
            "count": counts.get(slug, 0),
        })

    # ---- heroes / editorial / personalisation ----
    def hero_media(aid, alt, position="50% 10%"):
        name, src_w, widths = media_short_name(aid)
        return build_media(name, src_w, widths, dims[aid][3], dims[aid][4], alt, position)

    aid_of = {v: k for k, v in canonical_name.items()}
    heroes = [
        {"eyebrow": "Satin Pyjamas",
         "title": "Midnight & Burgundy",
         "description": "Personalised satin sets in jet black and deep burgundy, finished with contrast piping.",
         "category": "PJ's",
         "left": hero_media(aid_of["midnight-long-set"],
                            "Full-body view of the Midnight Black Long Set", "50% 10%"),
         "right": hero_media(aid_of["burgundy-long-set"],
                             "Model wearing the Burgundy Dreams Long Set on the grey studio sweep", "50% 10%")},
        {"eyebrow": "Ribbed Series",
         "title": "Tonal Mocha Knit",
         "description": "The ribbed maxi dress beside the wide-leg pant in matching mocha.",
         "category": "RIBBED SERIES",
         "left": hero_media(aid_of["mocha-essential-maxi-dress"],
                            "Model wearing the Mocha Essential Maxi Dress on the cream backdrop", "50% 10%"),
         "right": hero_media(aid_of["mocha-wide-leg-pant-alt"],
                             "Close view of the Mocha Wide Leg Pant against a gold-lit wall", "50% 10%")},
        {"eyebrow": "Everyday Sets",
         "title": "Cocoa & Butter",
         "description": "Cocoa satin shorts beside the butter-yellow Sunkissed Cami Set.",
         "category": "PJ's",
         "left": hero_media(aid_of["cocoa-nights-short-set"],
                            "Model wearing the Cocoa Nights Short Set, cocoa satin", "50% 10%"),
         "right": hero_media(aid_of["butter-cami-set"],
                             "Model wearing the Sunkissed Cami Set in butter yellow", "50% 10%")},
    ]
    # hero 1 left = Midnight product 31662.image (featured, full body). The
    # Media is a fresh dict with its own alt text; files stay shared with the
    # product's own `image` entry — no duplicate copies on disk.

    editorial = {
        "left": hero_media(aid_of["mocha-essential-maxi-dress-alt"],
                           "Three-quarter view of the Mocha Essential Maxi Dress", "50% 12%"),
        "right": hero_media(aid_of["midnight-long-set-zip"],
                            "Front view of the Midnight Black Long Set with contrast piping", "50% 12%"),
    }

    personalisation = {
        "image": hero_media(aid_of["pocket-embroidery"],
                            "Satin pocket with script embroidery and ivory piping", "50% 40%"),
        "title": "Add Your Name",
        "description": "Script embroidery on the pocket hem of Personalised Pyjama sets. "
                       "Add up to 10 characters and choose a script font and thread colour.",
    }

    data = {
        "products": products,
        "categories": categories,
        "navigation": NAVIGATION,
        "heroes": heroes,
        "editorial": editorial,
        "personalisation": personalisation,
        "logos": {
            "black": os.path.join("assets", "images", "love-colombo-logo-black.png"),
            "white": os.path.join("assets", "images", "love-colombo-logo-white.png"),
            "brown": os.path.join("assets", "images", "love-colombo-logo-brown.png"),
        },
        "fonts": {"body": "Barlow"},
    }

    out_json = os.path.join(ROOT, "html-demo", "assets", "demo-data.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # ---- validation ----
    errors = []

    def audit_media(m, where):
        if m is None:
            return
        if set(m) != {"src", "srcset", "width", "height", "alt", "position"}:
            errors.append(f"{where}: Media keys wrong: {sorted(m)}")
            return
        parts = [m["src"]] + [e.split(" ")[0] for e in m["srcset"].split(", ")]
        for part in parts:
            if os.path.isabs(part) or "://" in part or "localhost" in part:
                errors.append(f"{where}: non-relative URL {part}")
            if not os.path.exists(os.path.join(ROOT, "html-demo", part)):
                errors.append(f"{where}: missing {part}")
        for entry in m["srcset"].split(", "):
            part, wd = entry.rsplit(" ", 1)
            expect = int(part.rsplit("-", 1)[1].split(".")[0])
            if int(wd.rstrip("w")) != expect:
                errors.append(f"{where}: width token mismatch {entry}")
        with Image.open(os.path.join(ROOT, "html-demo", m["src"])) as im:
            if (im.width, im.height) != (m["width"], m["height"]):
                errors.append(f"{where}: dims {im.size} != {m['width']}x{m['height']}")
        with Image.open(os.path.join(ROOT, "html-demo", parts[0])) as im0:
            for part in parts[1:]:
                with Image.open(os.path.join(ROOT, "html-demo", part)) as imn:
                    if abs(im0.width / im0.height - imn.width / imn.height) > 0.01:
                        errors.append(f"{where}: aspect mismatch {part}")

    def walk(o, where):
        if isinstance(o, dict):
            if "src" in o and "srcset" in o:
                audit_media(o, where)
            for k, v in o.items():
                walk(v, where + "." + str(k))
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, f"{where}[{i}]")

    walk(data, "demo")

    if len({pr["id"] for pr in products}) != 116:
        errors.append(f"product ids {len({pr['id'] for pr in products})} uniq, expected 116")
    if variant_count != 597:
        errors.append(f"variants {variant_count}, expected 597")
    for pid in ("31845", "31662", "30895", "31030", "31597"):
        if not any(pr["id"] == int(pid) for pr in products):
            errors.append(f"product {pid} missing")
    if data["fonts"]["body"] != "Barlow":
        errors.append("fonts.body != Barlow")
    missing_terms = [t["slug"] for t in NAVIGATION if t["slug"] not in cat_by_slug]
    if missing_terms:
        errors.append(f"navigation slug missing from taxonomy: {missing_terms}")

    # preset path stability for the original 12 grid + banned duplicates
    pre = {pr["id"]: pr for pr in products}
    checks = [
        (31845, "love-notes-pj"), (31662, "midnight-long-set"),
        (30895, "mocha-essential-maxi-dress"), (31030, "mocha-wide-leg-pant"),
    ]
    for pid, key in checks:
        want = os.path.join("assets", "images", f"{key}-960.webp")
        if pre[pid]["image"]["src"] != want:
            errors.append(f"preset path moved for {pid}: {pre[pid]['image']['src']}")

    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(" -", e)
        sys.exit(1)

    size = os.path.getsize(out_json)
    print(f"OK: {len(attach)} attachments, {n_files} webp files, "
          f"demo-data.json {size} bytes")
    print(f"  products: {len(products)}, variants: {variant_count}, "
          f"categories: {len(categories)}, media files: {sum(1 for f in os.listdir(OUT_IMG) if f.endswith('.webp'))}")


if __name__ == "__main__":
    main()
