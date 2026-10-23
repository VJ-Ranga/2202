#!/usr/bin/env python3
"""Copy public image assets from restored WordPress uploads into Shopify theme.

Read-only against the WordPress source. Copies real image files only,
preserving relative paths beneath assets/images/, and writes a checksum
manifest (assets/image-manifest.json).

Usage:
    python3 scripts/copy-image-library.py            # copy + manifest + verify
    python3 scripts/copy-image-library.py --verify   # verify existing copy only
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

SOURCE = Path("/home/vjranga/local/2202lovecolombo/wp-content/uploads")
THEME_ROOT = Path("/home/vjranga/Documents/2202/shopify-theme")
DEST_ROOT = THEME_ROOT / "assets" / "images"
MANIFEST_PATH = THEME_ROOT / "assets" / "image-manifest.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
              ".svg", ".ico", ".bmp", ".tif", ".tiff"}

YEAR_DIR = re.compile(r"^\d{4}$")
MONTH_DIR = re.compile(r"^(0[1-9]|1[0-2])$")

# Directories under uploads that are never a public media library.
EXCLUDED_DIRS = {
    "elementor": "plugin-generated CSS/fonts, not media library images",
    "facebook_for_woocommerce": "plugin CSV/HTML export cache, not images",
    "fonts": "font files (woff2), not images",
    "jetbackup-1a129969caae": "backup/snapshot data, private system content",
    "rank-math": "SEO XML sitemaps, not images",
    "wc-logs": "WooCommerce logs, private system content",
    "woocommerce_uploads": "private WooCommerce uploads (protected dir)",
    "woodmart": "theme google-fonts cache (woff2/css), not images",
    "wpcf7_uploads": "contact-form private uploads, not public media",
    "wpcode": "snippet cache (html/json), not images",
}

# Non-image files found inside otherwise-included date folders.
EXCLUDED_FILE_NOTES = {
    ".css": "theme-generated CSS (xts-*), not an image",
    ".zip": "archive, not an image",
    ".mp4": "video, not an image (kept out of image library)",
    ".log": "logs, private system content",
    ".html": "system/protected page, not an image",
    ".htaccess": "server config, not an image",
}

CHUNK = 1024 * 1024


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(CHUNK), b""):
            h.update(block)
    return h.hexdigest()


def is_date_path(rel: Path) -> bool:
    parts = rel.parts
    return (len(parts) >= 3 and YEAR_DIR.match(parts[0])
            and MONTH_DIR.match(parts[1]))


def select(source: Path) -> tuple[list[tuple[Path, str]], dict[str, list[str]]]:
    """Return (selected, excluded) with paths relative to SOURCE."""
    selected: list[tuple[Path, str]] = []
    excluded: dict[str, list[str]] = {k: [] for k in EXCLUDED_DIRS}
    excluded["non-image files"] = []
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(source)
        top = rel.parts[0]
        if len(rel.parts) > 1 and top in EXCLUDED_DIRS:
            excluded[top].append(str(rel))
            continue
        if path.suffix.lower() not in IMAGE_EXTS:
            excluded["non-image files"].append(str(rel))
            continue
        # Root-level images (woocommerce placeholders) and YYYY/MM media folders.
        if len(rel.parts) == 1 or is_date_path(rel):
            selected.append((path, str(rel)))
        else:
            excluded.setdefault("other image paths", []).append(str(rel))
    return selected, excluded


def copy_all(selected: list[tuple[Path, str]]) -> list[dict]:
    entries: list[dict] = []
    for src, rel in selected:
        dest = DEST_ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        entries.append({
            "sourceRelativePath": rel,
            "destinationRelativePath": rel,
            "bytes": dest.stat().st_size,
            "format": src.suffix.lower().lstrip("."),
            "sha256": sha256(dest),
        })
    return entries


def verify(selected: list[tuple[Path, str]], entries: list[dict]) -> dict:
    problems: list[str] = []
    src_map = {rel: src for src, rel in selected}
    if len(entries) != len(selected):
        problems.append(f"manifest count {len(entries)} != selected count {len(selected)}")
    for entry in entries:
        rel = entry["sourceRelativePath"]
        dest = DEST_ROOT / entry["destinationRelativePath"]
        src = src_map.get(rel)
        if src is None:
            problems.append(f"manifest entry has no selected source: {rel}")
            continue
        if not dest.is_file():
            problems.append(f"missing destination: {rel}")
            continue
        if dest.stat().st_size != entry["bytes"]:
            problems.append(f"size mismatch: {rel}")
        if sha256(dest) != entry["sha256"]:
            problems.append(f"checksum mismatch: {rel}")
        if src.stat().st_size != entry["bytes"]:
            problems.append(f"source size drift (source modified?): {rel}")
    # Destination must contain no extra files beyond the manifest.
    manifest_dests = {e["destinationRelativePath"] for e in entries}
    if DEST_ROOT.is_dir():
        for p in DEST_ROOT.rglob("*"):
            if p.is_file():
                rel = str(p.relative_to(DEST_ROOT))
                if rel not in manifest_dests:
                    problems.append(f"unexpected file in destination: {rel}")
    return {
        "selectedCount": len(selected),
        "manifestCount": len(entries),
        "destinationCount": sum(1 for p in DEST_ROOT.rglob("*") if p.is_file())
        if DEST_ROOT.is_dir() else 0,
        "problems": problems,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true",
                        help="verify existing copy/manifest without copying")
    args = parser.parse_args()

    if not SOURCE.is_dir():
        print(f"ERROR: source not found: {SOURCE}", file=sys.stderr)
        return 2

    selected, excluded = select(SOURCE)
    print(f"selected images: {len(selected)}")

    if args.verify:
        entries = json.loads(MANIFEST_PATH.read_text())["images"]
    else:
        entries = copy_all(selected)
        MANIFEST_PATH.write_text(json.dumps(
            {
                "source": str(SOURCE),
                "destinationRoot": "assets/images",
                "imageCount": len(entries),
                "totalBytes": sum(e["bytes"] for e in entries),
                "images": entries,
            },
            indent=2,
        ) + "\n")
        print(f"manifest written: {MANIFEST_PATH}")

    report = verify(selected, entries)
    print(json.dumps({k: v for k, v in report.items() if k != "problems"}, indent=2))
    for note, paths in sorted(excluded.items()):
        if paths:
            print(f"excluded [{note}]: {len(paths)} files")
    if report["problems"]:
        print("PROBLEMS:", file=sys.stderr)
        for p in report["problems"]:
            print(f"  - {p}", file=sys.stderr)
        return 1
    print("verification OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
