"""Pencil moon for the loader: cream pencil on dark paper, made from public/moon.jpg.
Graphite only deposits on the paper tooth, shading is smudged, outlines are loose
contours of the maria. Writes A/B/C variants + night.png; the loader uses C.
Usage: python3 scripts/sketch_moon.py public/moon.jpg <out_dir>, then convert to webp
(C.png -> public/moon-sketch.webp, night.png -> public/moon-night.webp)."""
import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
N, SS = 448, 3
W = N * SS
CREAM = (243, 241, 236)
rng = random.Random(11)
nrng = np.random.default_rng(11)

photo = Image.open(SRC).convert('L')
c = photo.width * (1 - 1 / 1.06) / 2
photo = photo.crop((c, c, photo.width - c, photo.height - c)).resize((W, W), Image.LANCZOS)
yy, xx = np.mgrid[0:W, 0:W].astype(np.float32)
cx = cy = W / 2
R = W * 0.465
rr = np.hypot(xx - cx, yy - cy)
disk = np.clip((R - rr) / (SS * 2), 0, 1)


def blur(a, r):
    return np.asarray(Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def tone(r):
    L = np.asarray(photo.filter(ImageFilter.GaussianBlur(r)), np.float32) / 255
    lo, hi = np.percentile(L[disk > 0.9], [3, 99])
    return np.clip((L - lo) / (hi - lo), 0, 1) * disk


def noise(scale, seed):
    g = np.random.default_rng(seed).random((max(2, int(W / scale)),) * 2).astype(np.float32)
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((W, W), Image.BICUBIC), np.float32) / 255


# paper tooth: fine grain, slightly streaky, plus a broader unevenness
tooth = 0.55 * noise(SS * 1.2, 1) + 0.3 * np.asarray(Image.fromarray((noise(SS * 1.0, 2) * 255).astype(np.uint8)).resize((W, W // 3)).resize((W, W)), np.float32) / 255 + 0.15 * noise(SS * 20, 3)


def deposit(a, hardness=1.0):
    """graphite catches the peaks of the tooth first; heavier pressure fills the valleys"""
    a = np.clip(a, 0, 1)
    t = tooth + a * 0.9 - 0.55
    return np.clip(a * np.clip(t * 2.4 * hardness + 0.25, 0, 1), 0, 1)


def displace(a, amp, scale, seed):
    """hand wobble: shift every pixel by a smooth random field"""
    dx = (noise(scale, seed) - 0.5) * 2 * amp
    dy = (noise(scale, seed + 1) - 0.5) * 2 * amp
    xi = np.clip((xx + dx).astype(int), 0, W - 1)
    yi = np.clip((yy + dy).astype(int), 0, W - 1)
    return a[yi, xi]


def strokes(T, angle, spacing, thresh, length, width, amax, ajit=9):
    layer = Image.new('L', (W, W), 0)
    d = ImageDraw.Draw(layer)
    a0 = math.radians(angle)
    px, py = -math.sin(a0), math.cos(a0)
    span = W * 1.45
    s = -span / 2
    while s < span / 2:
        t = -span / 2 + rng.uniform(0, length)
        while t < span / 2:
            a = a0 + math.radians(rng.uniform(-ajit, ajit))
            ux, uy = math.cos(a), math.sin(a)
            Ls = length * rng.uniform(0.6, 1.3)
            off = s + rng.uniform(-0.3, 0.3) * spacing
            x0 = cx + px * off + math.cos(a0) * t
            y0 = cy + py * off + math.sin(a0) * t
            mx, my = int(np.clip(x0 + ux * Ls / 2, 0, W - 1)), int(np.clip(y0 + uy * Ls / 2, 0, W - 1))
            if disk[my, mx] > 0.3 and T[my, mx] > thresh:
                k = 8
                bend = rng.uniform(-1, 1) * Ls * 0.06
                pts = [(x0 + ux * Ls * f - uy * bend * math.sin(math.pi * f),
                        y0 + uy * Ls * f + ux * bend * math.sin(math.pi * f)) for f in (i / k for i in range(k + 1))]
                for i in range(k):
                    f = (i + 0.5) / k
                    qx, qy = int(np.clip(pts[i][0], 0, W - 1)), int(np.clip(pts[i][1], 0, W - 1))
                    v = (T[qy, qx] - thresh) / (1 - thresh)
                    if v <= 0:
                        continue
                    p = math.sin(math.pi * f) ** 0.7  # pressure: lifts at both ends
                    al = int(255 * amax * p * min(1, v * 1.5) * disk[qy, qx])
                    if al > 2:
                        d.line([pts[i], pts[i + 1]], fill=al, width=int(width))
            t += Ls + rng.uniform(0.1, 0.5) * length
        s += spacing
    return np.asarray(layer, np.float32) / 255


def contours(T, levels, width):
    out = np.zeros((W, W), np.float32)
    for lev, amp in levels:
        m = (T > lev).astype(np.float32)
        e = np.zeros_like(m)
        e[1:, :] += np.abs(m[1:, :] - m[:-1, :])
        e[:, 1:] += np.abs(m[:, 1:] - m[:, :-1])
        e = blur(np.clip(e, 0, 1), width) * 3.2
        # break the line now and then, like a pencil lifting
        e *= np.clip(noise(SS * 40, int(lev * 100)) * 2.2 - 0.35, 0, 1)
        out = np.maximum(out, np.clip(e, 0, 1) * amp)
    return out * disk


def rim(passes, amax, width):
    layer = Image.new('L', (W, W), 0)
    d = ImageDraw.Draw(layer)
    for p in range(passes):
        r0 = R * rng.uniform(0.99, 1.008)
        ox, oy = rng.uniform(-1, 1) * SS * 2, rng.uniform(-1, 1) * SS * 2
        start, arc = rng.uniform(0, 360), rng.uniform(200, 330) if p else 372
        steps = 260
        for k in range(steps):
            f = k / steps
            a0 = math.radians(start + arc * f)
            a1 = math.radians(start + arc * (k + 1) / steps)
            r_ = r0 + math.sin(f * 9 + p * 2) * SS * 1.2
            al = int(255 * amax * (0.55 if p else 1) * (0.55 + 0.45 * math.sin(math.pi * f) ** 0.4))
            d.line([(cx + ox + r_ * math.cos(a0), cy + oy + r_ * math.sin(a0)),
                    (cx + ox + r_ * math.cos(a1), cy + oy + r_ * math.sin(a1))], fill=al, width=int(width))
    return np.asarray(layer, np.float32) / 255


def screen(*ls):
    o = np.zeros((W, W), np.float32)
    for l in ls:
        o = 1 - (1 - o) * (1 - np.clip(l, 0, 1))
    return o


def save(a, name):
    img = Image.new('RGBA', (W, W), CREAM + (0,))
    img.putalpha(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)))
    img.resize((N, N), Image.LANCZOS).save(f'{OUT}/{name}.png')


T = tone(SS * 3)
Ts = tone(SS * 9)  # simplified shapes for contours
limb = np.clip(1 - (rr / R) ** 6, 0, 1)

shade = screen(
    blur(T, SS * 6) * 0.42 * (0.7 + 0.3 * limb),              # smudged with a finger
    blur(strokes(T, -48, SS * 4.5, 0.12, SS * 30, SS * 2.4, 0.55), SS * 0.7),
    blur(strokes(T, -40, SS * 5.5, 0.55, SS * 24, SS * 2.2, 0.5), SS * 0.7),
)
lines = displace(screen(contours(Ts, [(0.32, 0.75), (0.58, 0.55)], SS * 0.9), rim(3, 0.95, SS * 1.8)), SS * 2.2, SS * 30, 7)

A = deposit(screen(shade, rim(2, 0.8, SS * 1.6)))
B = deposit(screen(lines, blur(strokes(T, -48, SS * 6, 0.6, SS * 22, SS * 2, 0.45), SS * 0.6)), 1.2)
C = deposit(screen(shade * 0.8, lines * 0.9))
save(A, 'A'); save(B, 'B'); save(C, 'C')

# night side: the same paper, lightly scumbled, with a faint rim
night = deposit(screen(blur(strokes(np.full((W, W), 0.5, np.float32) * disk, -48, SS * 6, 0.1, SS * 34, SS * 2.2, 0.22), SS * 0.8),
                       displace(rim(2, 0.45, SS * 1.6), SS * 2, SS * 30, 9)))
save(night, 'night')
print('ok')
