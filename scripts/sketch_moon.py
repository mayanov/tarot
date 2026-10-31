"""Render public/moon.jpg as a light-pencil drawing for the loader (a dark sky), plus a
sparse hatched night-side texture. Writes RGBA PNGs; convert to webp for public/.
Usage: python3 scripts/sketch_moon.py public/moon.jpg <out_dir>"""
import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT_DIR = sys.argv[1], sys.argv[2]
N = 448            # output size
SS = 3             # supersampling
W = N * SS
PENCIL = (241, 232, 244)
rng = random.Random(7)
nrng = np.random.default_rng(7)

photo = Image.open(SRC).convert('L')
# the loader shows the photo at object-cover scale(1.06): crop to match
c = photo.width * (1 - 1 / 1.06) / 2
photo = photo.crop((c, c, photo.width - c, photo.height - c)).resize((W, W), Image.LANCZOS)
L = np.asarray(photo.filter(ImageFilter.GaussianBlur(SS * 2)), dtype=np.float32) / 255.0

yy, xx = np.mgrid[0:W, 0:W]
cx = cy = W / 2
R = W * 0.47
rr = np.hypot(xx - cx, yy - cy)
disk = np.clip((R - rr) / (SS * 3), 0, 1)

# tone to draw: brightness of the moon, stretched; a gentle limb darkening
lo, hi = np.percentile(L[disk > 0.9], [3, 99])
T = np.clip((L - lo) / (hi - lo), 0, 1) ** 0.9
T *= disk * (0.78 + 0.22 * np.clip(1 - (rr / R) ** 4, 0, 1))


def sample(x, y):
    xi, yi = int(min(max(x, 0), W - 1)), int(min(max(y, 0), W - 1))
    return T[yi, xi], disk[yi, xi]


def hatch_layer(angle_deg, spacing, thresh, length, width, alpha_max, jitter=0.35):
    """One direction of strokes. Strokes only where tone > thresh, stronger with tone."""
    layer = Image.new('L', (W, W), 0)
    d = ImageDraw.Draw(layer)
    a = math.radians(angle_deg)
    ux, uy = math.cos(a), math.sin(a)          # stroke direction
    px, py = -uy, ux                            # across the strokes
    span = int(W * 1.5)
    s = -span / 2
    while s < span / 2:
        # walk along this hatch line, laying short strokes with small gaps
        t = -span / 2 + rng.uniform(0, length)
        off = s + rng.uniform(-spacing * jitter, spacing * jitter)
        while t < span / 2:
            L_ = length * rng.uniform(0.55, 1.25)
            x0 = cx + px * off + ux * t
            y0 = cy + py * off + uy * t
            mid_tone, inside = sample(x0 + ux * L_ / 2, y0 + uy * L_ / 2)
            if inside > 0.5 and mid_tone > thresh:
                strength = min(1.0, (mid_tone - thresh) / (1 - thresh) * 1.6)
                bend = rng.uniform(-1, 1) * spacing * 0.2
                segs = 6
                pts = []
                for k in range(segs + 1):
                    f = k / segs
                    b = bend * math.sin(math.pi * f)
                    pts.append((x0 + ux * L_ * f + px * b, y0 + uy * L_ * f + py * b))
                for k in range(segs):
                    f = (k + 0.5) / segs
                    taper = math.sin(math.pi * f) ** 0.6     # pressure: light at the ends
                    tone_here, ins = sample(*pts[k])
                    local = min(1.0, max(0.0, (tone_here - thresh) / (1 - thresh) * 1.6))
                    al = int(255 * alpha_max * taper * (0.4 * strength + 0.6 * local) * ins)
                    if al > 2:
                        d.line([pts[k], pts[k + 1]], fill=al, width=max(1, int(width * (0.7 + 0.5 * local))))
            t += L_ + rng.uniform(0.15, 0.6) * length
        s += spacing
    return np.asarray(layer, dtype=np.float32) / 255.0


def screen(*layers):
    out = np.zeros((W, W), np.float32)
    for l in layers:
        out = 1 - (1 - out) * (1 - l)
    return out


def rim(alpha_max, passes=3, width=SS * 1.1):
    layer = Image.new('L', (W, W), 0)
    d = ImageDraw.Draw(layer)
    for p in range(passes):
        r0 = R * rng.uniform(0.992, 1.006)
        ox, oy = rng.uniform(-1, 1) * SS * 1.5, rng.uniform(-1, 1) * SS * 1.5
        start = rng.uniform(0, 360)
        arc = rng.uniform(250, 340)               # loose, never quite closed
        steps = 220
        for k in range(steps):
            f0, f1 = k / steps, (k + 1) / steps
            a0 = math.radians(start + arc * f0)
            a1 = math.radians(start + arc * f1)
            wob = math.sin(f0 * 11 + p) * SS * 0.8
            r_ = r0 + wob
            taper = math.sin(math.pi * f0) ** 0.5
            al = int(255 * alpha_max * taper * (0.75 if p else 1))
            d.line([(cx + ox + r_ * math.cos(a0), cy + oy + r_ * math.sin(a0)),
                    (cx + ox + r_ * math.cos(a1), cy + oy + r_ * math.sin(a1))], fill=al, width=int(width))
    return np.asarray(layer, dtype=np.float32) / 255.0


def grain(a):
    # graphite tooth: the paper breaks strokes up a little
    g = nrng.random((W // 2, W // 2)).astype(np.float32)
    g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((W, W), Image.BILINEAR), np.float32) / 255
    return a * (0.62 + 0.38 * g)


def save(alpha, name):
    img = Image.new('RGBA', (W, W), PENCIL + (0,))
    img.putalpha(Image.fromarray(np.clip(alpha * 255, 0, 255).astype(np.uint8)))
    img = img.resize((N, N), Image.LANCZOS)
    img.save(f'{OUT_DIR}/{name}', optimize=True)


# ---- the lit moon: soft graphite base + three hatching passes + a loose rim ----
smudge = np.asarray(Image.fromarray((T * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SS * 5)), np.float32) / 255
lit = screen(
    smudge * 0.3,
    hatch_layer(-38, SS * 3.4, 0.06, SS * 42, SS * 0.9, 0.78, jitter=0.18),
    hatch_layer(42, SS * 4.2, 0.45, SS * 30, SS * 0.85, 0.6, jitter=0.2),
    hatch_layer(-62, SS * 5.0, 0.74, SS * 22, SS * 0.8, 0.55, jitter=0.2),
    rim(0.85),
)
save(grain(lit), 'moon-sketch.png')

# ---- the night side: a light, even hatch + its own faint rim ----
T[:] = 0.5 * disk
night = screen(hatch_layer(-38, SS * 5.6, 0.1, SS * 40, SS * 0.8, 0.26, jitter=0.18), rim(0.42, passes=2))
save(grain(night), 'moon-night.png')
print('ok')
