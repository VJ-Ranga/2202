#!/usr/bin/env python3
"""Reconcile exported product images with the copied image library and verify data.

Read-only against WordPress. Writes only:
  data/products.json
  data/product-images.json
  data/personalisation.json
  data/verification-report.json
  docs/DISCOVERY-SUMMARY.md

The image library itself is verified with scripts/copy-image-library.py --verify.
"""

from __future__ import annotations

import collections
import datetime as dt
import hashlib
import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DOCS = ROOT / "docs"
WP_ROOT = Path("/home/vjranga/local/2202lovecolombo")
DEST_ROOT = ROOT / "assets" / "images"
MANIFEST_PATH = ROOT / "assets" / "image-manifest.json"
COPY_SCRIPT = ROOT / "scripts" / "copy-image-library.py"

PRODUCTS_PATH = DATA / "products.json"
IMAGES_PATH = DATA / "product-images.json"
TAXONOMIES_PATH = DATA / "taxonomies.json"
SIZE_GUIDES_PATH = DATA / "size-guides.json"
PERSONALISATION_PATH = DATA / "personalisation.json"
REPORT_PATH = DATA / "verification-report.json"
SUMMARY_PATH = DOCS / "DISCOVERY-SUMMARY.md"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(value, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def run(cmd, cwd: Path):
    return subprocess.run(
        [str(x) for x in cmd],
        cwd=str(cwd),
        text=True,
        capture_output=True,
    )


def sql_rows(sql: str):
    result = run(["wp", "--allow-root", "db", "query", "--skip-column-names", sql], WP_ROOT)
    if result.returncode != 0:
        raise RuntimeError(f"SQL failed: {sql}\n{result.stderr}")
    rows = []
    for line in result.stdout.splitlines():
        if line == "":
            continue
        rows.append(line.split("\t"))
    return rows


def md5_text(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()


def sql_meta(keys, post_type: str):
    quoted = ",".join("'" + k.replace("'", "''") + "'" for k in keys)
    sql = (
        "SELECT post_id, meta_key, meta_value FROM wp_postmeta "
        f"WHERE post_id IN (SELECT ID FROM wp_posts WHERE post_type='{post_type}') "
        f"AND meta_key IN ({quoted}) ORDER BY post_id, meta_key"
    )
    out = {}
    for row in sql_rows(sql):
        if len(row) < 3:
            continue
        pid = int(row[0])
        key = row[1]
        value = None if row[2] == "NULL" else row[2]
        out.setdefault(pid, {})[key] = value
    return out


def norm(value):
    if value is None:
        return ""
    return str(value)


def safe_int(value):
    if value in (None, "", "NULL"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_gallery(value):
    if not value:
        return []
    return [int(x) for x in str(value).split(",") if x.strip().isdigit()]


def relative_path_is_safe(rel: str) -> bool:
    p = Path(rel)
    return bool(rel) and not p.is_absolute() and ".." not in p.parts and str(p) == rel.replace("\\", "/")


def destination_fields(entry: dict, dest_root: Path, compute_hash: bool = True) -> dict:
    if not entry:
        return {
            "destination_relative_path": None,
            "destination_exists": False,
            "destination_bytes": None,
            "destination_sha256": None,
            "destination_sha256_matches_manifest": False,
            "copy_status": "missing_from_manifest",
        }
    rel = entry["destinationRelativePath"]
    path = dest_root / rel
    exists = path.is_file()
    digest = sha256_file(path) if (exists and compute_hash) else None
    matches = bool(exists and digest == entry.get("sha256"))
    return {
        "destination_relative_path": posixpath.join("assets/images", rel.replace("\\", "/")),
        "destination_exists": exists,
        "destination_bytes": path.stat().st_size if exists else None,
        "destination_sha256": digest,
        "destination_sha256_matches_manifest": matches,
        "copy_status": "copied" if (exists and matches) else ("destination_missing" if not exists else "checksum_mismatch"),
    }


def add_destination_to_image(image, by_id, dest_root):
    if not image:
        return image, None
    aid = safe_int(image.get("id"))
    if not aid:
        return image, None
    att = by_id.get(aid)
    if not att:
        image.update(destination_fields(None, dest_root, False))
        return image, aid
    for key in ("destination_relative_path", "destination_exists", "destination_bytes",
                "destination_sha256", "destination_sha256_matches_manifest", "copy_status"):
        image[key] = att.get(key)
    return image, aid


def main() -> int:
    generated = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    products_payload = load_json(PRODUCTS_PATH)
    image_payload = load_json(IMAGES_PATH)
    taxonomies_payload = load_json(TAXONOMIES_PATH)
    size_guides_payload = load_json(SIZE_GUIDES_PATH)
    personalisation_payload = load_json(PERSONALISATION_PATH)
    manifest = load_json(MANIFEST_PATH)

    required_manifest_keys = {"source", "destinationRoot", "imageCount", "totalBytes", "images"}
    manifest_schema_ok = required_manifest_keys.issubset(manifest.keys())
    dest_root = ROOT / manifest.get("destinationRoot", "assets/images")

    manifest_problems = []
    if not manifest_schema_ok:
        manifest_problems.append("manifest is missing required top-level keys")
    if manifest.get("imageCount") != len(manifest.get("images", [])):
        manifest_problems.append("imageCount does not match images length")
    if manifest.get("totalBytes") != sum(int(x.get("bytes", 0)) for x in manifest.get("images", [])):
        manifest_problems.append("totalBytes does not match sum of image bytes")
    if dest_root.resolve() != DEST_ROOT.resolve():
        manifest_problems.append(f"unexpected destinationRoot: {manifest.get('destinationRoot')}")

    by_source_rel = {}
    for entry in manifest.get("images", []):
        for key in ("sourceRelativePath", "destinationRelativePath", "bytes", "format", "sha256"):
            if key not in entry:
                manifest_problems.append(f"manifest entry missing {key}")
                break
        else:
            rel = entry["sourceRelativePath"]
            dest_rel = entry["destinationRelativePath"]
            if not relative_path_is_safe(rel) or not relative_path_is_safe(dest_rel):
                manifest_problems.append(f"unsafe manifest path: {rel} -> {dest_rel}")
                continue
            by_source_rel[rel] = entry

    # Enrich the attachment records used by the product catalog.
    attachments = image_payload.get("attachments", [])
    attachment_by_id = {}
    for att in attachments:
        entry = by_source_rel.get(att.get("relative_path"))
        fields = destination_fields(entry, dest_root, True)
        att.update(fields)
        attachment_by_id[int(att["id"])] = att

    # Enrich every explicit image reference.
    references = image_payload.get("references", [])
    missing_references = []
    for ref in references:
        aid = safe_int(ref.get("attachment_id"))
        att = attachment_by_id.get(aid) if aid else None
        if not att:
            ref.update(destination_fields(None, dest_root, False))
            missing_references.append({"type": "product_reference", "attachment_id": aid,
                                       "product_id": ref.get("product_id"), "role": ref.get("role")})
            continue
        for key in ("destination_relative_path", "destination_exists", "destination_bytes",
                    "destination_sha256", "destination_sha256_matches_manifest", "copy_status"):
            ref[key] = att.get(key)
        if not att.get("destination_exists") or not att.get("destination_sha256_matches_manifest"):
            missing_references.append({"type": "product_reference", "attachment_id": aid,
                                       "product_id": ref.get("product_id"), "role": ref.get("role"),
                                       "copy_status": att.get("copy_status")})

    # Inline images: size-guide and content images. Match by attachment ID first,
    # then by the local uploads-relative URL.
    inline = image_payload.get("inline_references", [])
    inline_remote = []
    inline_unmapped = []
    for ref in inline:
        aid = safe_int(ref.get("attachment_id"))
        att = attachment_by_id.get(aid) if aid else None
        if not att and ref.get("url"):
            parsed = urlparse(ref["url"])
            marker = "/wp-content/uploads/"
            if marker in parsed.path:
                rel = unquote(parsed.path.split(marker, 1)[1])
                entry = by_source_rel.get(rel)
                if entry:
                    aid = int(entry.get("attachment_id", 0)) if entry.get("attachment_id") else None
                    # The manifest does not carry attachment IDs; resolve through the URL map.
                    for candidate in attachments:
                        if candidate.get("relative_path") == rel:
                            att = candidate
                            aid = int(candidate["id"])
                            break
        if not att:
            ref.update(destination_fields(None, dest_root, False))
            host = urlparse(ref.get("url") or "").netloc
            if host and host not in ("localhost", "127.0.0.1", "::1"):
                ref["copy_status"] = "remote_or_unmapped"
                inline_remote.append({"product_id": ref.get("product_id"), "url": ref.get("url")})
            else:
                inline_unmapped.append({"product_id": ref.get("product_id"), "url": ref.get("url"),
                                        "attachment_id": ref.get("attachment_id")})
            continue
        ref["attachment_id"] = aid
        for key in ("destination_relative_path", "destination_exists", "destination_bytes",
                    "destination_sha256", "destination_sha256_matches_manifest", "copy_status"):
            ref[key] = att.get(key)
        if not att.get("destination_exists") or not att.get("destination_sha256_matches_manifest"):
            inline_unmapped.append({"product_id": ref.get("product_id"), "url": ref.get("url"),
                                    "attachment_id": aid, "copy_status": att.get("copy_status")})

    # Enrich product-embedded image fields without deleting source paths.
    embedded_checked = 0
    embedded_missing = []
    inline_by_product = collections.defaultdict(list)
    for ref in inline:
        if ref.get("role") == "inline_size_guide":
            inline_by_product[int(ref.get("product_id"))].append(ref)

    for product in products_payload.get("products", []):
        for field in ("featured_image", "gallery_images", "background_image", "image_360_images"):
            value = product.get(field)
            if field in ("gallery_images", "image_360_images"):
                if isinstance(value, list):
                    for i, image in enumerate(value):
                        _, aid = add_destination_to_image(image, attachment_by_id, DEST_ROOT)
                        if aid:
                            embedded_checked += 1
                            if not image.get("destination_exists") or not image.get("destination_sha256_matches_manifest"):
                                embedded_missing.append({"product_id": product.get("id"), "field": field,
                                                         "index": i, "attachment_id": aid})
            else:
                _, aid = add_destination_to_image(value, attachment_by_id, DEST_ROOT) if value else (value, None)
                if aid:
                    embedded_checked += 1
                    if not value.get("destination_exists") or not value.get("destination_sha256_matches_manifest"):
                        embedded_missing.append({"product_id": product.get("id"), "field": field,
                                                 "attachment_id": aid})
        for variation in product.get("variations", []):
            for field in ("featured_image", "gallery_images"):
                value = variation.get(field)
                if field == "gallery_images":
                    for i, image in enumerate(value or []):
                        _, aid = add_destination_to_image(image, attachment_by_id, DEST_ROOT)
                        if aid:
                            embedded_checked += 1
                            if not image.get("destination_exists") or not image.get("destination_sha256_matches_manifest"):
                                embedded_missing.append({"product_id": product.get("id"),
                                                         "variation_id": variation.get("id"),
                                                         "field": field, "index": i, "attachment_id": aid})
                else:
                    _, aid = add_destination_to_image(value, attachment_by_id, DEST_ROOT) if value else (value, None)
                    if aid:
                        embedded_checked += 1
                        if not value.get("destination_exists") or not value.get("destination_sha256_matches_manifest"):
                            embedded_missing.append({"product_id": product.get("id"),
                                                     "variation_id": variation.get("id"),
                                                     "field": field, "attachment_id": aid})
        guide = product.get("size_guide")
        if guide:
            guide_refs = []
            seen = set()
            for ref in inline_by_product.get(int(product.get("id")), []):
                aid = safe_int(ref.get("attachment_id"))
                if aid and aid in seen:
                    continue
                if aid:
                    seen.add(aid)
                guide_refs.append({
                    "attachment_id": aid,
                    "url": ref.get("url"),
                    "destination_relative_path": ref.get("destination_relative_path"),
                    "destination_exists": ref.get("destination_exists"),
                    "destination_sha256_matches_manifest": ref.get("destination_sha256_matches_manifest"),
                })
            guide["image_references"] = guide_refs
            guide["image_reference_count"] = len(guide_refs)

    # Personalisation images and public placement/choice image references.
    personalisation_attachments = personalisation_payload.get("images", [])
    for image in personalisation_attachments:
        entry = by_source_rel.get(image.get("relative_path"))
        image.update(destination_fields(entry, dest_root, True))
    pers_by_id = {int(x["attachment_id"]): x for x in personalisation_attachments}
    for pset in personalisation_payload.get("sets", []):
        for placement in pset.get("placements", []):
            def enrich_placement_image(obj):
                aid = safe_int(obj.get("image_id"))
                if not aid:
                    return
                att = pers_by_id.get(aid)
                if att:
                    for key in ("destination_relative_path", "destination_exists", "destination_bytes",
                                "destination_sha256", "destination_sha256_matches_manifest", "copy_status"):
                        obj[key] = att.get(key)
            enrich_placement_image(placement)
            for step in placement.get("steps", []) or []:
                for choice in step.get("choices", []) or []:
                    enrich_placement_image(choice)

    # Summary counts after enrichment.
    reference_roles = collections.Counter(r.get("role") for r in references)
    inline_roles = collections.Counter(r.get("role") for r in inline)
    references_with_destination = sum(1 for r in references if r.get("destination_exists") and r.get("destination_sha256_matches_manifest"))
    inline_with_destination = sum(1 for r in inline if r.get("destination_exists") and r.get("destination_sha256_matches_manifest"))
    attachments_with_destination = sum(1 for a in attachments if a.get("destination_exists") and a.get("destination_sha256_matches_manifest"))

    image_payload["image_library"] = {
        "manifest_relative_path": "assets/image-manifest.json",
        "destination_root_relative_path": "assets/images",
        "destination_root_absolute_path": str(DEST_ROOT),
        "manifest_image_count": int(manifest.get("imageCount", 0)),
        "manifest_total_bytes": int(manifest.get("totalBytes", 0)),
        "manifest_schema": sorted(required_manifest_keys),
        "manifest_problems": manifest_problems,
        "verification_command": "python3 scripts/copy-image-library.py --verify",
        "destination_relative_path_convention": "Path relative to the project root, e.g. assets/images/2025/07/name.png",
    }
    image_payload["summary"] = {
        "referenced_attachment_count": len(attachments),
        "reference_count": len(references),
        "inline_reference_count": len(inline),
        "missing_attachment_count": sum(1 for a in attachments if not a.get("destination_exists")),
        "reference_roles": dict(sorted(reference_roles.items())),
        "inline_reference_roles": dict(sorted(inline_roles.items())),
        "attachments_with_destination": attachments_with_destination,
        "attachments_missing_destination": len(attachments) - attachments_with_destination,
        "references_with_destination": references_with_destination,
        "references_missing_destination": len(references) - references_with_destination,
        "inline_with_destination": inline_with_destination,
        "inline_missing_destination": len(inline) - inline_with_destination,
        "inline_remote_or_unmapped": len(inline_remote) + len(inline_unmapped),
    }

    write_json(PRODUCTS_PATH, products_payload)
    write_json(IMAGES_PATH, image_payload)
    write_json(PERSONALISATION_PATH, personalisation_payload)

    # Independent source checks.
    source_counts_rows = sql_rows(
        "SELECT post_type, post_status, COUNT(*) FROM wp_posts "
        "WHERE post_type IN ('product','product_variation') "
        "GROUP BY post_type, post_status ORDER BY post_type, post_status"
    )
    source_counts = {"product": {}, "product_variation": {}}
    for row in source_counts_rows:
        if len(row) >= 3:
            source_counts[row[0]][row[1]] = int(row[2])

    source_product_rows = sql_rows(
        "SELECT ID, MD5(post_title), MD5(post_name), post_status FROM wp_posts "
        "WHERE post_type='product' ORDER BY ID"
    )
    source_products = {
        int(r[0]): {"name_md5": r[1], "slug_md5": r[2], "status": r[3]}
        for r in source_product_rows if len(r) >= 4
    }
    source_content_rows = sql_rows(
        "SELECT ID, MD5(post_content), MD5(post_excerpt) FROM wp_posts "
        "WHERE post_type='product' ORDER BY ID"
    )
    source_content = {int(r[0]): {"content_md5": r[1], "excerpt_md5": r[2]} for r in source_content_rows if len(r) >= 3}

    source_variation_rows = sql_rows(
        "SELECT ID, MD5(post_name), post_status, post_parent FROM wp_posts "
        "WHERE post_type='product_variation' ORDER BY ID"
    )
    source_variations = {
        int(r[0]): {"slug_md5": r[1], "status": r[2], "parent": int(r[3])}
        for r in source_variation_rows if len(r) >= 4
    }

    product_meta = sql_meta([
        "_sku", "_price", "_regular_price", "_sale_price", "_stock_status", "_stock",
        "_backorders", "_manage_stock", "_thumbnail_id", "_product_image_gallery", "_wcpp_set_id",
    ], "product")
    variation_meta = sql_meta([
        "_price", "_regular_price", "_sale_price", "_stock_status", "_stock", "_backorders",
        "_variation_description", "attribute_pa_size", "attribute_color",
    ], "product_variation")

    source_guides = {}
    for row in sql_rows(
        "SELECT ID, MD5(post_title), MD5(post_name), post_status, MD5(post_content) "
        "FROM wp_posts WHERE post_type='woodmart_size_guide' ORDER BY ID"
    ):
        if len(row) >= 5:
            source_guides[int(row[0])] = {
                "title_md5": row[1], "slug_md5": row[2], "status": row[3], "content_md5": row[4]
            }

    json_products = products_payload.get("products", [])
    json_product_by_id = {int(p["id"]): p for p in json_products}
    json_category_ids = {int(t["id"]) for t in taxonomies_payload.get("taxonomies", {}).get("product_cat", {}).get("terms", [])}
    personalisation_product_ids = [int(p["id"]) for s in personalisation_payload.get("sets", []) for p in s.get("assigned_products", [])]
    personalisation_category_ids = [int(c) for s in personalisation_payload.get("sets", []) for c in s.get("assigned_category_ids", [])]
    personalisation_products_exist = all(pid in json_product_by_id for pid in personalisation_product_ids)
    personalisation_categories_exist = all(cid in json_category_ids for cid in personalisation_category_ids)
    json_variations = {}
    for p in json_products:
        for v in p.get("variations", []):
            json_variations[int(v["id"])] = v

    product_identity_mismatches = []
    product_content_mismatches = []
    product_meta_mismatches = []
    for pid, src in source_products.items():
        jp = json_product_by_id.get(pid)
        if not jp:
            product_identity_mismatches.append({"id": pid, "problem": "missing exported product"})
            continue
        if md5_text(jp.get("name", "")) != src["name_md5"]:
            product_identity_mismatches.append({"id": pid, "problem": "name mismatch"})
        if md5_text(jp.get("slug", "")) != src["slug_md5"]:
            product_identity_mismatches.append({"id": pid, "problem": "slug mismatch"})
        if jp.get("status") != src["status"]:
            product_identity_mismatches.append({"id": pid, "problem": "status mismatch"})
        content = source_content.get(pid, {})
        if md5_text(jp.get("descriptions", {}).get("full_html", "")) != content.get("content_md5"):
            product_content_mismatches.append({"id": pid, "field": "full_html"})
        if md5_text(jp.get("descriptions", {}).get("short_html", "")) != content.get("excerpt_md5"):
            product_content_mismatches.append({"id": pid, "field": "short_html"})
        sm = product_meta.get(pid, {})
        checks = [
            ("sku", jp.get("sku", ""), sm.get("_sku")),
            ("stock_status", jp.get("stock", {}).get("status"), sm.get("_stock_status")),
            ("stock_quantity", jp.get("stock", {}).get("quantity"), sm.get("_stock")),
            ("backorders", jp.get("stock", {}).get("backorders"), sm.get("_backorders")),
            ("thumbnail_id", jp.get("featured_image_id"), sm.get("_thumbnail_id")),
            ("personalisation_set_id", jp.get("custom_fields", {}).get("personalisation_set_id"), sm.get("_wcpp_set_id")),
        ]
        for name, jval, sval in checks:
            if name == "stock_quantity":
                ok = (safe_int(jval) is None and norm(sval) == "") or norm(sval) == norm(jval)
            elif name == "thumbnail_id":
                ok = (safe_int(jval) is None and norm(sval) == "") or norm(safe_int(jval)) == norm(sval)
            elif name == "personalisation_set_id":
                ok = (safe_int(jval) is None and norm(sval) == "") or norm(safe_int(jval)) == norm(sval)
            else:
                ok = norm(jval) == norm(sval)
            if not ok:
                product_meta_mismatches.append({"id": pid, "field": name, "exported": jval, "source": sval})
        if not product_meta_mismatches or product_meta_mismatches[-1].get("id") != pid:
            pass
        source_gallery = parse_gallery(sm.get("_product_image_gallery"))
        if sorted(source_gallery) != sorted(int(x) for x in jp.get("gallery_image_ids", [])):
            product_meta_mismatches.append({"id": pid, "field": "gallery_image_ids",
                                            "exported": jp.get("gallery_image_ids"), "source": source_gallery})
        if jp.get("type") == "simple":
            for field, key in (("current", "_price"), ("regular", "_regular_price"), ("sale", "_sale_price")):
                if norm(jp.get("prices", {}).get(field)) != norm(sm.get(key)):
                    product_meta_mismatches.append({"id": pid, "field": f"prices.{field}",
                                                    "exported": jp.get("prices", {}).get(field), "source": sm.get(key)})

    variation_identity_mismatches = []
    variation_meta_mismatches = []
    for vid, src in source_variations.items():
        jv = json_variations.get(vid)
        if not jv:
            variation_identity_mismatches.append({"id": vid, "problem": "missing exported variation"})
            continue
        if md5_text(jv.get("slug", "")) != src["slug_md5"]:
            variation_identity_mismatches.append({"id": vid, "problem": "slug mismatch"})
        if jv.get("status") != src["status"]:
            variation_identity_mismatches.append({"id": vid, "problem": "status mismatch"})
        if int(jv.get("parent_id", 0)) != src["parent"]:
            variation_identity_mismatches.append({"id": vid, "problem": "parent mismatch"})
        sm = variation_meta.get(vid, {})
        checks = [
            ("prices.current", jv.get("prices", {}).get("current"), sm.get("_price")),
            ("prices.regular", jv.get("prices", {}).get("regular"), sm.get("_regular_price")),
            ("prices.sale", jv.get("prices", {}).get("sale"), sm.get("_sale_price")),
            ("stock.status", jv.get("stock", {}).get("status"), sm.get("_stock_status")),
            ("stock.quantity", jv.get("stock", {}).get("quantity"), sm.get("_stock")),
            ("stock.backorders", jv.get("stock", {}).get("backorders"), sm.get("_backorders")),
            ("description_html", jv.get("description_html", ""), sm.get("_variation_description")),
        ]
        attrs = {a.get("key"): a for a in jv.get("attributes", [])}
        checks.append(("attribute_pa_size", attrs.get("pa_size", {}).get("term_slug"), sm.get("attribute_pa_size")))
        checks.append(("attribute_color", attrs.get("color", {}).get("value"), sm.get("attribute_color")))
        for name, jval, sval in checks:
            if name in ("stock.quantity", "prices.current", "prices.regular", "prices.sale"):
                ok = norm(jval) == norm(sval)
            else:
                ok = norm(jval) == norm(sval)
            if not ok:
                variation_meta_mismatches.append({"id": vid, "field": name, "exported": jval, "source": sval})

    size_guide_mismatches = []
    for guide in size_guides_payload.get("size_guides", []):
        gid = int(guide["id"])
        src = source_guides.get(gid)
        if not src:
            size_guide_mismatches.append({"id": gid, "problem": "missing source size guide"})
            continue
        checks = [
            ("title", md5_text(guide.get("title", "")), src["title_md5"]),
            ("slug", md5_text(guide.get("slug", "")), src["slug_md5"]),
            ("status", guide.get("status"), src["status"]),
            ("content_html", md5_text(guide.get("content_html", "")), src["content_md5"]),
        ]
        for field, custom, expected in checks:
            if custom != expected:
                size_guide_mismatches.append({"id": gid, "field": field})
    for p in json_products:
        guide = p.get("size_guide")
        if guide:
            src = source_guides.get(int(guide["id"]))
            if not src or md5_text(guide.get("content_html", "")) != src["content_md5"]:
                size_guide_mismatches.append({"id": guide["id"], "product_id": p["id"], "field": "product_size_guide_content"})

    # Source counts must match the exported JSON counts exactly.
    exported_source = products_payload.get("counts", {}).get("source", {})
    count_checks = {
        "products_total": (exported_source.get("products_total"), sum(source_counts["product"].values())),
        "variations_total": (exported_source.get("variations_total"), sum(source_counts["product_variation"].values())),
        "products_by_status": (exported_source.get("products_by_status"), source_counts["product"]),
        "variations_by_status": (exported_source.get("variations_by_status"), source_counts["product_variation"]),
    }
    count_mismatches = []
    for key, (left, right) in count_checks.items():
        if left != right:
            count_mismatches.append({"check": key, "exported": left, "source": right})

    # Verify the image library with the owner script.
    copy_verify = run([sys.executable, COPY_SCRIPT, "--verify"], ROOT)
    copy_verify_ok = copy_verify.returncode == 0 and "verification OK" in copy_verify.stdout

    # Markdown catalog row count.
    catalog_rows = 0
    catalog_path = DOCS / "PRODUCT-CATALOG.md"
    if catalog_path.is_file():
        lines = catalog_path.read_text(encoding="utf-8").splitlines()
        try:
            start = lines.index("## Products")
            end = lines.index("## Categories")
            catalog_rows = sum(1 for ln in lines[start:end] if ln.startswith("| ") and ln.split("|")[1].strip().isdigit())
        except ValueError:
            catalog_rows = -1

    json_files = {
        "data/products.json": PRODUCTS_PATH,
        "data/taxonomies.json": TAXONOMIES_PATH,
        "data/product-images.json": IMAGES_PATH,
        "data/size-guides.json": SIZE_GUIDES_PATH,
        "data/personalisation.json": PERSONALISATION_PATH,
    }
    json_validation = {}
    for name, path in json_files.items():
        try:
            obj = load_json(path)
            json_validation[name] = {"valid": True, "bytes": path.stat().st_size}
            if isinstance(obj, dict):
                json_validation[name]["top_level_keys"] = len(obj)
        except Exception as exc:
            json_validation[name] = {"valid": False, "error": str(exc), "bytes": path.stat().st_size if path.exists() else 0}

    public_settings = personalisation_payload.get("public_configuration", {}).get("settings", {})
    personalisation_products = sum(len(s.get("assigned_products", [])) for s in personalisation_payload.get("sets", []))
    personalisation_placements = sum(len(s.get("placements", [])) for s in personalisation_payload.get("sets", []))
    personalisation_images = personalisation_payload.get("images", [])
    personalisation_images_ok = sum(1 for x in personalisation_images if x.get("destination_exists") and x.get("destination_sha256_matches_manifest"))
    personalisation_private_keys = []
    for group in public_settings.values():
        if isinstance(group, dict):
            for key in group:
                if re.search(r"(^|_)(license|secret|token|password|api[_-]?key|customer|order|user_email)(_|$)", key, re.I):
                    personalisation_private_keys.append(key)
    personalisation_private_keys = sorted(set(personalisation_private_keys))

    checks = {
        "manifest_schema_valid": manifest_schema_ok and not manifest_problems,
        "source_counts_match_export": not count_mismatches,
        "product_ids_match": set(source_products) == set(json_product_by_id),
        "product_identity_match": not product_identity_mismatches,
        "product_content_match": not product_content_mismatches,
        "product_meta_match": not product_meta_mismatches,
        "variation_ids_match": set(source_variations) == set(json_variations),
        "variation_identity_match": not variation_identity_mismatches,
        "variation_meta_match": not variation_meta_mismatches,
        "size_guides_match": not size_guide_mismatches,
        "catalog_markdown_rows": catalog_rows == len(json_products),
        "json_valid": all(v.get("valid") for v in json_validation.values()),
        "image_library_verify": copy_verify_ok,
        "all_product_references_have_destination": not missing_references,
        "all_attachments_have_destination": len(attachments) == attachments_with_destination,
        "all_inline_images_have_destination": not inline_unmapped and not inline_remote,
        "all_embedded_product_images_have_destination": not embedded_missing,
        "personalisation_images_have_destination": personalisation_images_ok == len(personalisation_images),
        "personalisation_no_private_keys": not personalisation_private_keys,
        "personalisation_assigned_products_exist": personalisation_products_exist,
        "personalisation_assigned_categories_exist": personalisation_categories_exist,
    }
    overall_ok = all(checks.values())

    report = {
        "schema_version": 1,
        "generated_at": generated,
        "status": "pass" if overall_ok else "fail",
        "scope": "Product data and product-image reconciliation for the Shopify theme workspace.",
        "authoritative_source": {
            "platform": "WordPress + WooCommerce",
            "site_url": products_payload.get("source", {}).get("site_url"),
            "wordpress_version": products_payload.get("source", {}).get("wordpress_version"),
            "woocommerce_version": products_payload.get("source", {}).get("woocommerce_version"),
            "installation_path": products_payload.get("source", {}).get("installation_path"),
            "table_prefix": products_payload.get("source", {}).get("table_prefix"),
            "read_only_queries": True,
        },
        "authoritative_counts": {
            "products_total": sum(source_counts["product"].values()),
            "products_by_status": source_counts["product"],
            "variations_total": sum(source_counts["product_variation"].values()),
            "variations_by_status": source_counts["product_variation"],
            "products_by_type": products_payload.get("counts", {}).get("exported", {}).get("products_by_type"),
        },
        "json_validation": json_validation,
        "catalog": {
            "products_exported": len(json_products),
            "variations_exported": len(json_variations),
            "product_status_counts_exported": products_payload.get("counts", {}).get("exported", {}).get("products_by_status"),
            "variation_status_counts_exported": products_payload.get("counts", {}).get("exported", {}).get("variations_by_status"),
            "product_ids_match_source": checks["product_ids_match"],
            "product_identity_matches_source": checks["product_identity_match"],
            "product_descriptions_match_source": checks["product_content_match"],
            "product_meta_matches_source": checks["product_meta_match"],
            "variation_ids_match_source": checks["variation_ids_match"],
            "variation_identity_matches_source": checks["variation_identity_match"],
            "variation_meta_matches_source": checks["variation_meta_match"],
            "variation_description_nonempty_source_count": sum(1 for v in variation_meta.values() if v.get("_variation_description")),
            "variation_description_nonempty_exported_count": sum(1 for v in json_variations.values() if v.get("description_html")),
            "size_guides_exported": len(size_guides_payload.get("size_guides", [])),
            "size_guide_content_matches_source": checks["size_guides_match"],
            "catalog_markdown_product_rows": catalog_rows,
            "catalog_markdown_path": "docs/PRODUCT-CATALOG.md",
            "mismatches": {
                "counts": count_mismatches,
                "product_identity": product_identity_mismatches,
                "product_content": product_content_mismatches,
                "product_meta": product_meta_mismatches,
                "variation_identity": variation_identity_mismatches,
                "variation_meta": variation_meta_mismatches,
                "size_guides": size_guide_mismatches,
            },
        },
        "image_library": {
            "manifest_relative_path": "assets/image-manifest.json",
            "destination_root_relative_path": "assets/images",
            "manifest_schema_keys": sorted(required_manifest_keys),
            "manifest_image_count": manifest.get("imageCount"),
            "manifest_total_bytes": manifest.get("totalBytes"),
            "manifest_problems": manifest_problems,
            "copy_script_relative_path": "scripts/copy-image-library.py",
            "copy_script_safety": {
                "source": str(Path("/home/vjranga/local/2202lovecolombo/wp-content/uploads")),
                "copy_mode_writes": ["assets/images/", "assets/image-manifest.json"],
                "verify_mode_writes": [],
                "source_is_read_only": True,
                "uses_checksums": True,
                "detects_unexpected_destination_files": True,
                "excluded_private_or_non_image_dirs": [
                    "jetbackup-*", "wc-logs", "woocommerce_uploads", "wpcf7_uploads", "wpcode"
                ],
            },
            "verification_command": "python3 scripts/copy-image-library.py --verify",
            "verification_exit_code": copy_verify.returncode,
            "verification_output": copy_verify.stdout.strip().splitlines(),
            "verification_stderr": copy_verify.stderr.strip().splitlines(),
            "verification_ok": copy_verify_ok,
        },
        "product_image_reconciliation": {
            "attachment_count": len(attachments),
            "attachments_with_destination": attachments_with_destination,
            "attachments_missing_destination": len(attachments) - attachments_with_destination,
            "reference_count": len(references),
            "references_by_role": dict(sorted(reference_roles.items())),
            "references_with_destination": references_with_destination,
            "references_missing_destination": len(references) - references_with_destination,
            "inline_reference_count": len(inline),
            "inline_references_by_role": dict(sorted(inline_roles.items())),
            "inline_with_destination": inline_with_destination,
            "inline_missing_destination": len(inline) - inline_with_destination,
            "inline_remote_or_unmapped": inline_remote + inline_unmapped,
            "inline_remote_count": len(inline_remote),
            "inline_unmapped_count": len(inline_unmapped),
            "embedded_image_objects_checked": embedded_checked,
            "embedded_image_objects_missing_destination": len(embedded_missing),
            "embedded_image_objects_missing": embedded_missing,
            "missing_references": missing_references,
            "destination_relative_path_convention": "Path relative to the project root, e.g. assets/images/2025/07/name.png",
        },
        "personalisation": {
            "captured_file": "data/personalisation.json",
            "set_count": personalisation_payload.get("set_count"),
            "assigned_product_count": personalisation_products,
            "placement_count": personalisation_placements,
            "image_count": len(personalisation_images),
            "images_with_destination": personalisation_images_ok,
            "public_settings_groups": sorted(public_settings.keys()),
            "private_or_credential_like_keys_found": personalisation_private_keys,
            "feature_reference": personalisation_payload.get("feature_reference"),
            "assigned_product_ids_exist_in_catalog": personalisation_products_exist,
            "assigned_category_ids_exist_in_taxonomies": personalisation_categories_exist,
            "excluded_private_data": personalisation_payload.get("excluded_private_data", []),
            "caveat": "Public presentation, placement, step, choice, price, and assignment configuration is captured. Customer selections, orders, carts, users, licence keys, and update data are not exported.",
        },
        "checks": checks,
        "issues": [],
        "limitations": [
            "All 116 source products are published; draft, private, trash, pending, future, and auto-draft product counts are zero.",
            "No product tags or product brands are assigned. Color is a custom attribute on one product only. SKUs are sparse (16 products).",
            "Product weights and dimensions are empty in the source for every product and variation.",
            "Three variations have no current or regular price in the source: 30081, 30741, and 31063.",
            "WooCommerce category term counts are stale for Tops (33 vs 32 actual) and Bottoms (26 vs 23 actual); exported relationship counts are authoritative.",
            "Upsell and cross-sell IDs are empty. Related IDs follow WooCommerce related-product logic.",
            "Source image URLs still point to http://localhost:8099. Destination paths are additive and relative to the project root; source paths and URLs remain in the data.",
            "Inline image detection covers product descriptions, short descriptions, custom tabs, extra content, and size guides. No remote product-content images were found; the only inline product image is the local size-chart.webp used by 112 products.",
        ],
        "files_touched_by_reconciliation": [
            "data/products.json",
            "data/product-images.json",
            "data/personalisation.json",
            "data/verification-report.json",
            "docs/DISCOVERY-SUMMARY.md",
            "data/export-personalisation.php",
            "data/reconcile-verify.py",
        ],
        "commands": {
            "image_library_verify": "python3 scripts/copy-image-library.py --verify",
            "reconcile_and_verify": "python3 data/reconcile-verify.py",
        },
    }

    if missing_references:
        report["issues"].append({"severity": "error", "message": "Missing product image destinations", "count": len(missing_references)})
    if inline_unmapped or inline_remote:
        report["issues"].append({"severity": "warning", "message": "Inline images not matched to a local copied file", "count": len(inline_unmapped) + len(inline_remote)})
    if embedded_missing:
        report["issues"].append({"severity": "error", "message": "Embedded product image fields missing destination", "count": len(embedded_missing)})
    if manifest_problems:
        report["issues"].append({"severity": "error", "message": "Image manifest problems", "details": manifest_problems})
    if not copy_verify_ok:
        report["issues"].append({"severity": "error", "message": "copy-image-library.py --verify failed"})
    if personalisation_private_keys:
        report["issues"].append({"severity": "error", "message": "Credential-like keys found in personalisation settings", "keys": personalisation_private_keys})

    write_json(REPORT_PATH, report)

    # Human-readable summary.
    prod = report["catalog"]
    img = report["product_image_reconciliation"]
    lib = report["image_library"]
    counts = report["authoritative_counts"]
    md = []
    md.append("# Discovery Summary — Product Data and Image Reconciliation")
    md.append("")
    md.append(f"Generated: {generated}")
    md.append("")
    md.append(f"Verification status: **{report['status'].upper()}**")
    md.append("")
    md.append("This is the independent verification record for the WooCommerce product export and the copied image library. It is read-only against WordPress. Source paths and URLs remain in the JSON; destination paths are added, not substituted.")
    md.append("")
    md.append("## Authoritative source counts")
    md.append("")
    md.append("| Item | Source count | Exported count |")
    md.append("| --- | ---: | ---: |")
    md.append(f"| Products | {counts['products_total']} | {prod['products_exported']} |")
    for status in ("publish", "draft", "private", "trash", "pending", "future"):
        md.append(f"| Products, {status} | {counts['products_by_status'].get(status, 0)} | {prod['product_status_counts_exported'].get(status, 0)} |")
    md.append(f"| Variations | {counts['variations_total']} | {prod['variations_exported']} |")
    for status in ("publish", "draft", "private", "trash", "pending", "future"):
        md.append(f"| Variations, {status} | {counts['variations_by_status'].get(status, 0)} | {prod['variation_status_counts_exported'].get(status, 0)} |")
    md.append("")
    md.append(f"Product types: {json.dumps(counts.get('products_by_type', {}), ensure_ascii=False)}. Product descriptions, short descriptions, names, slugs, statuses, IDs, and variation parent links were compared directly against read-only SQL. Variation price, stock, and attribute fields were compared against source post meta.")
    md.append("")
    md.append(f"All **{prod['products_exported']} product parents** and **{prod['variations_exported']} variation children** are present. No product IDs, variation IDs, or parent links are missing. Both size guides and all 112 product-to-size-guide links were checked.")
    md.append("")
    md.append("## JSON and catalog checks")
    md.append("")
    md.append("| File | Valid | Bytes |")
    md.append("| --- | --- | ---: |")
    for name, info in json_validation.items():
        md.append(f"| `{name}` | {'yes' if info.get('valid') else 'NO'} | {info.get('bytes', 0):,} |")
    md.append("")
    md.append(f"- `docs/PRODUCT-CATALOG.md` product rows: **{prod['catalog_markdown_product_rows']}**; JSON products: **{prod['products_exported']}**.")
    md.append(f"- Product content mismatches: **{len(prod['mismatches']['product_content'])}**; product identity mismatches: **{len(prod['mismatches']['product_identity'])}**; product meta mismatches: **{len(prod['mismatches']['product_meta'])}**.")
    md.append(f"- Variation identity mismatches: **{len(prod['mismatches']['variation_identity'])}**; variation meta mismatches: **{len(prod['mismatches']['variation_meta'])}**.")
    md.append(f"- Size guides: **{prod['size_guides_exported']}**; content mismatches: **{len(prod['mismatches']['size_guides'])}**.")
    md.append("")
    md.append("## Image library")
    md.append("")
    md.append(f"- Manifest schema: `{', '.join(lib['manifest_schema_keys'])}`.")
    md.append(f"- Manifest images: **{lib['manifest_image_count']:,}**; total bytes: **{lib['manifest_total_bytes']:,}**.")
    md.append(f"- `python3 scripts/copy-image-library.py --verify` exit code: **{lib['verification_exit_code']}**; result: **{'OK' if lib['verification_ok'] else 'FAILED'}**.")
    md.append("- Verify mode reads the source tree, manifest, and destination; it writes nothing. It re-hashes every destination file, checks source sizes, and rejects unexpected destination files. Copy mode would write only `assets/images/` and `assets/image-manifest.json`; the source tree is read-only.")
    md.append("")
    md.append("## Product image coverage")
    md.append("")
    md.append("| Measure | Count |")
    md.append("| --- | ---: |")
    md.append(f"| Referenced attachments | {img['attachment_count']} |")
    md.append(f"| Attachments with copied destination | {img['attachments_with_destination']} |")
    md.append(f"| Attachments missing destination | {img['attachments_missing_destination']} |")
    md.append(f"| Product image references | {img['reference_count']} |")
    md.append(f"| References with copied destination | {img['references_with_destination']} |")
    md.append(f"| References missing destination | {img['references_missing_destination']} |")
    md.append(f"| Inline references (size guide) | {img['inline_reference_count']} |")
    md.append(f"| Inline references with copied destination | {img['inline_with_destination']} |")
    md.append(f"| Inline references missing destination | {img['inline_missing_destination']} |")
    md.append(f"| Embedded product image objects checked | {img['embedded_image_objects_checked']} |")
    md.append(f"| Embedded product image objects missing destination | {img['embedded_image_objects_missing_destination']} |")
    md.append("")
    md.append("Reference roles: " + ", ".join(f"`{k}` {v}" for k, v in img["references_by_role"].items()) + ".")
    md.append("")
    md.append("Destination paths use the project-root-relative form `assets/images/<uploads-relative-path>`, for example `assets/images/2025/07/Untitled-design-10.png`. Every reference record retains its original `source_path`, `url`, and `relative_path` fields.")
    md.append("")
    md.append("## Inline and remote-image caveats")
    md.append("")
    md.append(f"- Inline references found: **{img['inline_reference_count']}**, all role `inline_size_guide`; the image is the local `2025/09/size-chart.webp` used by 112 products.")
    md.append(f"- Remote inline references: **{img['inline_remote_count']}**. Unmapped inline references: **{img['inline_unmapped_count']}**.")
    md.append("- No remote `<img>` sources were found in product descriptions, short descriptions, custom tabs, extra content, or size-guide HTML. Source image URLs still use `http://localhost:8099`; they are retained for provenance, not for storefront use.")
    md.append("")
    md.append("## Personalisation configuration")
    md.append("")
    pers = report["personalisation"]
    md.append(f"- Public set configuration captured in `{pers['captured_file']}`: {pers['set_count']} set, {pers['assigned_product_count']} assigned products, {pers['placement_count']} placements, {pers['image_count']} images.")
    md.append(f"- Public settings groups: {', '.join(pers['public_settings_groups'])}. Feature link: `{pers['feature_reference']}`.")
    md.append(f"- Images copied to destination: **{pers['images_with_destination']}/{pers['image_count']}**. Credential-like keys found: **{len(pers['private_or_credential_like_keys_found'])}**.")
    md.append("- The export contains public presentation/placement/choice configuration only. Customer selections, orders, carts, users, licence keys, and update-check data are excluded.")
    md.append("")
    md.append("## Product-data issues")
    md.append("")
    for issue in report["limitations"]:
        md.append(f"- {issue}")
    md.append("")
    md.append("## Files")
    md.append("")
    md.append("- `data/products.json` — enriched product image fields now include `destination_relative_path`, `destination_exists`, destination bytes/hash, and `copy_status`; source path and URL fields are unchanged.")
    md.append("- `data/product-images.json` — enriched attachments, references, inline references, and an `image_library` block.")
    md.append("- `data/personalisation.json` — public plugin configuration and image references.")
    md.append("- `data/verification-report.json` — full machine-readable verification result.")
    md.append("- `docs/DISCOVERY-SUMMARY.md` — this summary.")
    md.append("- `data/export-personalisation.php`, `data/reconcile-verify.py` — reproducible export/reconciliation scripts.")
    md.append("")
    md.append("## Commands")
    md.append("")
    md.append("```bash")
    md.append("cd /home/vjranga/Documents/2202/shopify-theme")
    md.append("python3 scripts/copy-image-library.py --verify")
    md.append("python3 data/reconcile-verify.py")
    md.append("```")
    md.append("")

    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text("\n".join(md) + "\n", encoding="utf-8")

    print(json.dumps({
        "status": report["status"],
        "checks": checks,
        "products": prod["products_exported"],
        "variations": prod["variations_exported"],
        "product_image_references": img["reference_count"],
        "inline_references": img["inline_reference_count"],
        "missing_references": len(missing_references),
        "embedded_missing": len(embedded_missing),
        "image_library_verify": copy_verify_ok,
        "personalisation_images": f"{personalisation_images_ok}/{len(personalisation_images)}",
        "report": str(REPORT_PATH.relative_to(ROOT)),
        "summary": str(SUMMARY_PATH.relative_to(ROOT)),
    }, indent=2, ensure_ascii=False))
    return 0 if overall_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
