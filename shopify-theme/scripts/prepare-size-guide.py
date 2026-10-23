#!/usr/bin/env python3
"""Copy verified original size chart into demo assets without recompression."""
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/images/2025/09/size-chart.webp"
DEST = ROOT / "html-demo/assets/images/size-chart-30535-1536.webp"
EXPECTED = (1536, 1024)


def dimensions(path):
    output = subprocess.check_output(["identify", "-format", "%w %h", str(path)], text=True).strip()
    return tuple(map(int, output.split()))


if not SOURCE.is_file():
    raise FileNotFoundError(SOURCE)
if dimensions(SOURCE) != EXPECTED:
    raise ValueError(f"Expected {EXPECTED[0]}x{EXPECTED[1]} source, got {dimensions(SOURCE)}")
DEST.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(SOURCE, DEST)
if dimensions(DEST) != EXPECTED:
    raise ValueError(f"Destination dimensions changed: {dimensions(DEST)}")
print(f"Copied exact {EXPECTED[0]}x{EXPECTED[1]} source to {DEST.relative_to(ROOT)}")
