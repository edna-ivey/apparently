"""Pixel-level companion to validate-canonical-assets.ts.

The TS validator checks structural/registration properties (viewBox, canvas size, filename
convention, embedded-PNG presence). Node has no PNG pixel decoder in this repo's dependencies,
so this script covers what that one explicitly can't: per-pixel transparency, blank-artwork
detection, and canvas-bounds/clipping checks -- using PIL, already used throughout this session.

Run after validate-canonical-assets.ts. Exits non-zero if anything fails.
"""
import base64
import os
import re
import sys

from PIL import Image
import numpy as np

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CANONICAL_ROOT = os.path.join(REPO_ROOT, "assets/creatures-canonical/v0")
CANVAS = (1600, 1800)


def find_svgs(root):
    for dirpath, _dirnames, filenames in os.walk(root):
        for name in filenames:
            if name.endswith(".svg"):
                yield os.path.join(dirpath, name)


def load_png(svg_path):
    with open(svg_path, "r") as f:
        content = f.read()
    m = re.search(r'href="data:image/png;base64,([^"]+)"', content)
    if not m:
        return None
    return Image.open(__import__("io").BytesIO(base64.b64decode(m.group(1)))).convert("RGBA")


def validate(svg_path):
    rel = os.path.relpath(svg_path, REPO_ROOT)
    checks = {}
    img = load_png(svg_path)
    if img is None:
        return rel, {"has_decodable_png": False}, False

    checks["has_decodable_png"] = True
    checks["canvas_size_matches"] = img.size == CANVAS

    arr = np.array(img)
    alpha = arr[:, :, 3]
    opaque = alpha > 10

    # Not blank: must have a meaningful amount of actual artwork, not just a stray pixel.
    opaque_fraction = opaque.sum() / opaque.size
    checks["not_blank"] = opaque_fraction > 0.01

    # No accidental white matte: corners of the canvas (outside any plausible artwork) must be
    # transparent, not opaque white/cream (a common artifact of a flattened export).
    h, w = alpha.shape
    corner_alpha = [alpha[0, 0], alpha[0, w - 1], alpha[h - 1, 0], alpha[h - 1, w - 1]]
    checks["corners_transparent"] = all(a < 10 for a in corner_alpha)

    # Bounds/clipping: opaque content must not touch the canvas edge on a side it wasn't
    # deliberately registered to touch. We can't know per-part intent generically here, so this
    # flags edge-touching content for the caller to cross-reference against the known,
    # documented exceptions (e.g. thickSkinned ears sit ~1px from the top by design after the
    # ear-clamp refinement) rather than silently failing on every legitimate near-edge case.
    ys, xs = np.where(opaque)
    if len(xs) == 0:
        checks["bounds_note"] = "blank"
    else:
        touches_top = ys.min() <= 0
        touches_bottom = ys.max() >= h - 1
        touches_left = xs.min() <= 0
        touches_right = xs.max() >= w - 1
        checks["edge_touch"] = {
            "top": bool(touches_top), "bottom": bool(touches_bottom),
            "left": bool(touches_left), "right": bool(touches_right),
        }

    ok = checks.get("has_decodable_png") and checks.get("canvas_size_matches") and checks.get("not_blank") and checks.get("corners_transparent")
    return rel, checks, ok


def main():
    files = sorted(find_svgs(CANONICAL_ROOT))
    results = [validate(f) for f in files]
    failing = [r for r in results if not r[2]]
    edge_touching = [r for r in results if isinstance(r[1].get("edge_touch"), dict) and any(r[1]["edge_touch"].values())]

    print(f"Validated {len(results)} canonical v0 files (pixel-level).")
    print(f"Pass: {len(results) - len(failing)}  Fail: {len(failing)}")

    if failing:
        print("\nFAILURES:")
        for rel, checks, _ in failing:
            print(f"  {rel}: {checks}")

    if edge_touching:
        print(f"\nEdge-touching content ({len(edge_touching)} files -- review each; touching an edge is not")
        print("automatically a failure (e.g. a trait's art may be deliberately full-bleed), but every one")
        print("should be a deliberate registration outcome, not a surprise):")
        for rel, checks, _ in edge_touching:
            sides = [s for s, v in checks["edge_touch"].items() if v]
            print(f"  {rel}: touches {', '.join(sides)}")

    sys.exit(1 if failing else 0)


if __name__ == "__main__":
    main()
