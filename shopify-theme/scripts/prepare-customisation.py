#!/usr/bin/env python3
"""Build public customisation data and owned image derivatives.

Reads only the checked-in public export and source-owned WordPress uploads.
Writes only html-demo/assets/customisation-data.json and customisation-* images.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


PRODUCT_IDS = [31597, 31630, 31638, 31646, 31654, 31662]
SOURCE_ISSUES = [
    "Pocket colour Navy uses source value #e7e5d6; value retained without correction.",
]


def load_export(root: Path) -> dict[str, Any]:
    with (root / "data/personalisation.json").open(encoding="utf-8") as handle:
        return json.load(handle)


def source_path(root: Path, image: dict[str, Any]) -> Path:
    path = Path(image["source_path"])
    if not path.is_absolute():
        path = root.parent.parent / path
    return path


def asset_path(filename: str) -> str:
    return f"assets/images/{filename}"


def make_derivative(source: Path, destination: Path, *, max_width: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=86, method=6)


def build_config(root: Path) -> dict[str, Any]:
    export = load_export(root)
    set_data = export["sets"][0]
    design = export["public_configuration"]["settings"]["design"]
    behaviour = export["public_configuration"]["settings"]["behaviour"]
    assigned_ids = [item["id"] for item in set_data["assigned_products"]]
    if assigned_ids != PRODUCT_IDS:
        raise ValueError(f"Eligible product IDs changed: {assigned_ids}")
    with (root / "data/products.json").open(encoding="utf-8") as handle:
        product_ids = {item["id"] for item in json.load(handle)["products"]}
    if not set(PRODUCT_IDS).issubset(product_ids):
        raise ValueError("Eligible product ID missing from products.json")
    placements = []

    for index, placement in enumerate(set_data["placements"]):
        image = export["images"][0 if index == 0 else 3]
        image_name = "customisation-pocket-hem.webp" if index == 0 else "customisation-pocket.webp"
        steps = placement["steps"]
        font_step = next(step for step in steps if step["name"] == "Select Font")
        color_step = next(step for step in steps if step["type"] == "color")
        fonts = [
            {
                "id": choice["id"],
                "label": choice["name"],
                "previewImage": asset_path(
                    "customisation-font-freestyle-script.webp"
                    if choice["name"] == "Freestyle Script"
                    else "customisation-font-edwardian-script-itc.webp"
                ),
            }
            for choice in font_step["choices"]
        ]
        colors = [
            {"id": choice["id"], "label": choice["name"], "value": choice["color"]}
            for choice in color_step["choices"]
        ]
        placements.append(
            {
                "id": placement["id"],
                "label": placement["name"],
                "image": asset_path(image_name),
                "fonts": fonts,
                "colors": colors,
                "steps": [
                    {
                        "id": step["id"],
                        "label": step["name"],
                        "type": step["type"],
                        "maxLength": step.get("max_chars"),
                        "required": step["type"] == "text" or bool(step.get("choices")),
                    }
                    for step in steps
                ],
            }
        )

    return {
        "eligibleProductIds": PRODUCT_IDS,
        "feePerUnit": int(float(set_data["price"])),
        "maxLength": 10,
        "placements": placements,
        "nonReturnable": False,
        "proofMessage": behaviour["success_message"],
        "sourceIssues": SOURCE_ISSUES,
        "setId": set_data["id"],
        "setName": set_data["name"],
        "feeType": set_data["price_type"],
        "flow": {
            "placementLayout": "list",
            "stepFlow": "stacked",
            "progress": "bar",
            "allowSecondPlacement": True,
            "secondPlacementFee": 0,
            "secondPlacementFeeBasis": "source set fee applies once per unit, not once per placement",
        },
        "button": {
            "label": design["btn_text"],
            "placement": design["btn_placement"],
            "style": design["btn_style"],
            "animation": design["btn_animation"],
            "fullWidth": bool(design["btn_full_width"]),
        },
        "panel": {
            "side": design["slide_from"],
            "widthPx": design["panel_width"],
            "mobileBreakpointPx": design["mobile_bp"],
            "background": design["panel_bg"],
            "radiusPx": design["panel_radius"],
            "overlay": {
                "color": design["overlay_color"],
                "opacityPercent": design["overlay_opacity"],
                "blurPxWhenOpen": 4,
            },
            "animationMs": design["anim_speed"],
            "headerTitle": design["header_title"],
            "titleColor": design["title_color"],
            "contentPaddingPx": design["panel_content_pad"],
            "progress": {
                "show": bool(design["progress_show"]),
                "style": design["progress_style"],
                "color": design["progress_color"],
            },
            "placementLayout": design["placement_layout"],
            "cardLayout": design["card_layout"],
            "cardBorder": design["card_border"],
            "cardSelected": design["card_selected"],
        },
        "messages": {
            "back": design["back_text"],
            "next": design["next_text"],
            "continue": "Continue",
            "addToBag": design["addbag_text"],
            "close": "Close",
            "confirmClose": "You'll lose your personalisation choices. Are you sure?",
            "confirmYes": "Yes, close",
            "confirmNo": "Keep editing",
            "errorGeneric": "Something went wrong. Please try again.",
            "yourChoices": "Your Choices",
            "choosePlacement": "Choose placement",
            "choosePlacementHeading": "Where would you like it?",
            "review": "Review",
            "addAnother": "Add another placement",
            "edit": "Edit",
            "remove": "Remove",
            "stepN": "Step %d",
            "selectVariation": "Please choose the product options (e.g. size) before personalising.",
            "addedToBag": "Added to your bag!",
            "viewCart": "View Cart",
            "checkout": "Checkout",
            "continueShopping": "Continue Shopping",
            "feeLabel": "Personalisation fee",
            "freeLabel": design["free_label"],
            "adding": "Adding...",
            "successNote": behaviour["success_message"],
        },
        "selection": {
            "initialPhase": "select",
            "minimumPlacements": 1,
            "maximumPlacements": 2,
            "placementRequired": True,
            "stepsRequired": True,
            "fontAndColourDefault": False,
            "secondPlacementOptional": True,
            "placementsUnique": True,
            "reviewEditable": True,
            "reviewRemovable": True,
            "clientTextEmptyCheck": "empty-string",
            "serverTextSanitizer": "sanitize_text_field",
        },
        "integration": {
            "variationRequiredForVariableProducts": True,
            "buttonHook": "woocommerce_after_add_to_cart_form",
            "serverResolvesChoiceNamesAndPrices": True,
            "cartLineStoresPersonalisation": True,
            "feeAppliedByServerPriceCalculator": True,
        },
        "currency": "LKR",
        "source": {
            "platform": export["source"]["platform"],
            "plugin": export["source"]["plugin_slug"],
            "pluginVersion": export["source"]["plugin_version"],
            "readOnly": True,
        },
    }


def prepare_images(root: Path) -> list[str]:
    export = load_export(root)
    images = export["images"]
    mappings = [
        (images[0], "customisation-pocket-hem.webp", 960),
        (images[3], "customisation-pocket.webp", 960),
        (images[1], "customisation-font-freestyle-script.webp", 512),
        (images[2], "customisation-font-edwardian-script-itc.webp", 512),
    ]
    written = []
    for image, filename, max_width in mappings:
        source = source_path(root, image)
        if not source.is_file():
            raise FileNotFoundError(source)
        destination = root / "html-demo/assets/images" / filename
        make_derivative(source, destination, max_width=max_width)
        written.append(f"assets/images/{filename}")
    return written


def write_output(root: Path) -> dict[str, Any]:
    output = build_config(root)
    prepare_images(root)
    output_path = root / "html-demo/assets/customisation-data.json"
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    output = write_output(args.root)
    print(json.dumps({"products": len(output["eligibleProductIds"]), "placements": len(output["placements"]), "images": 4}, indent=2))


if __name__ == "__main__":
    main()
