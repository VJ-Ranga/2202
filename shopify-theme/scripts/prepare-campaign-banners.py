#!/usr/bin/env python3
"""Prepare source-owned campaign banners for Studio homepage slider."""
from pathlib import Path
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/images/2026/03"
OUT = ROOT / "html-demo/assets/images/campaign"
OUT.mkdir(parents=True, exist_ok=True)

slides = [
    {
        "id": "ribbed-edit",
        "title": "The Ribbed Edit",
        "collection": "ribbed",
        "alt": "The Ribbed Edit campaign showing five models in ribbed clothing",
        "desktop": "WEB-BANNER-PC-3.png",
        "mobile": "WEB-BANNER-MOBILE-2.png",
    },
    {
        "id": "sleep-in-style",
        "title": "Sleep In Style",
        "collection": "pjs",
        "alt": "Sleep In Style campaign showing a model in pink printed pyjamas",
        "desktop": "WEB-BANNER-PC-2-1.jpg",
        "mobile": "WEB-BANNER-MOBILE.jpg",
    },
    {
        "id": "satin-scrunchies",
        "title": "Satin Scrunchies",
        "collection": "scrunchies",
        "alt": "Satin Scrunchies campaign showing colourful satin scrunchies",
        "desktop": "WEB-BANNER-PC-1920-X-700.png",
        "mobile": None,
    },
]

def identify(path):
    out = subprocess.check_output(["identify", "-format", "%w %h", str(path)], text=True).strip().split()
    return int(out[0]), int(out[1])

def variants(src_name, key, widths):
    src = SOURCE / src_name
    if not src.exists():
        raise FileNotFoundError(src)
    source_w, source_h = identify(src)
    result = {}
    for width in widths:
        if width > source_w:
            raise ValueError(f"Refusing upscale: {src} {source_w}px -> {width}px")
        out_name = f"{key}-{width}.webp"
        out = OUT / out_name
        subprocess.run(["cwebp", "-quiet", "-q", "84", "-resize", str(width), "0", str(src), "-o", str(out)], check=True)
        w, h = identify(out)
        result[str(width)] = {"src": f"assets/images/campaign/{out_name}", "width": w, "height": h}
    return {"source": f"assets/images/2026/03/{src_name}", "sourceWidth": source_w, "sourceHeight": source_h, "variants": result}

manifest = []
for slide in slides:
    desktop = variants(slide["desktop"], slide["id"] + "-desktop", [960, 1440, 1920])
    mobile = variants(slide["mobile"], slide["id"] + "-mobile", [480, 768, 1000]) if slide["mobile"] else None
    manifest.append({**{k: slide[k] for k in ("id", "title", "collection", "alt")}, "desktop": desktop, "mobile": mobile})

(ROOT / "html-demo/assets/campaign-banners.json").write_text(json.dumps({"version": 1, "slides": manifest}, indent=2) + "\n")
print(f"Prepared {len(manifest)} campaign slides in {OUT}")
