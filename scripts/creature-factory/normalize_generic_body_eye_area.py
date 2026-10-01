from pathlib import Path
from collections import deque
import base64
import io
import re

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CANON = ROOT / "assets" / "creatures-canonical" / "v0"
B64_RE = re.compile(r'(href="data:image/png;base64,)([^"]+)(")')
GENERIC = {
    "adventurous", "collaborative", "comfort-seeking", "control", "direct",
    "even-keeled", "hands-off", "idealistic", "independent", "indirect",
    "letItPlayOut", "planner", "practical", "protective", "spontaneous",
}

def decode(path):
    text = path.read_text()
    match = B64_RE.search(text)
    if not match:
        raise ValueError(f"No embedded PNG: {path}")
    image = Image.open(io.BytesIO(base64.b64decode(match.group(2)))).convert("RGBA")
    return text, np.array(image)

def practical_socket_mask():
    _, rgba = decode(CANON / "practical" / "practical-body-canonical-v0.svg")
    alpha = rgba[:, :, 3]
    mask = np.zeros(alpha.shape, np.uint8)
    rois = [(500,280,760,570,632,409), (840,280,1100,570,966,409)]
    for x0,y0,x1,y1,sx,sy in rois:
        transparent = alpha[y0:y1, x0:x1] < 10
        seen = np.zeros_like(transparent, bool)
        q = deque([(sy-y0, sx-x0)])
        seen[sy-y0, sx-x0] = True

        while q:
            y, x = q.popleft()
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < transparent.shape[0] and 0 <= xx < transparent.shape[1]:
                    if transparent[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True
                        q.append((yy, xx))
        mask[y0:y1, x0:x1][seen] = 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (81,81))
    return cv2.dilate(mask, kernel, iterations=1)

def find_body(name):
    matches = list(CANON.glob(f"*/{name}-body-canonical-v0.svg"))
    matches += list((CANON / "_body-only").glob(f"*/{name}-body-canonical-v0.svg"))
    if len(matches) != 1:
        raise ValueError(f"Expected one canonical body for {name}, got {matches}")
    return matches[0]

def normalize(path, mask):
    text, rgba = decode(path)
    alpha = rgba[:, :, 3]
    rgb = rgba[:, :, :3].copy()
    sample = rgb[250:700, 650:950][alpha[250:700, 650:950] > 80]
    fill = np.median(sample, axis=0).astype(np.uint8)
    rgb[alpha < 20] = fill
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    filled = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)
    rgba[:, :, :3] = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB)
    rgba[:, :, 3][mask > 0] = 255
    out = Image.fromarray(rgba)
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    path.write_text(B64_RE.sub(lambda m: m.group(1)+encoded+m.group(3), text, count=1))

def main():
    mask = practical_socket_mask()
    for name in sorted(GENERIC):
        path = find_body(name)
        normalize(path, mask)
        print(f"normalized {path.relative_to(ROOT)}")
    print(f"normalized {len(GENERIC)} generic canonical bodies")

if __name__ == "__main__":
    main()
