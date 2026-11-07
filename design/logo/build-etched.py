"""Builds the etched tarot-card logo: the shiba reader drawn like an old engraved
tarot card, in ink line and hatching on paper, with violet only on the jewel.

    python3 design/logo/build-etched.py   ->  mayanov-reader.svg, mayanov-reader-shades.svg
"""
import base64, math, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, '..', '..', 'public', 'fonts')
INK, PAPER, VIOLET = '#221D3C', '#F3F1EC', '#6B3FA0'
rnd = random.Random(7)

W, H = 300, 500
PIC = (22, 66, 256, 360)          # picture window inside the frame: x, y, w, h


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def lines(fam, n, jitter=0.6):
    """n hand-ruled lines from a family fam(i) -> list of points; each a little uneven."""
    out = []
    for i in range(n):
        pts = fam(i)
        if not pts:
            continue
        d = 'M' + ' L'.join(f'{f(x + rnd.uniform(-jitter, jitter))} {f(y + rnd.uniform(-jitter, jitter))}' for x, y in pts)
        out.append(d)
    return ' '.join(out)


def hatch(angle, spacing, box=(0, 0, 400, 420), steps=2):
    """parallel straight hatching at `angle` degrees covering box, each line slightly wavy."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    R = math.hypot(x1 - x0, y1 - y0) / 2 + 4
    a = math.radians(angle)
    dx, dy = math.cos(a), math.sin(a)
    nx, ny = -dy, dx
    n = int(2 * R / spacing)

    def fam(i):
        o = -R + i * spacing
        return [(cx + nx * o + dx * t, cy + ny * o + dy * t) for t in [-R + 2 * R * k / steps for k in range(steps + 1)]]
    return lines(fam, n, jitter=0.35)


# ---------------------------------------------------------------- the head, in its own frame
# (the same face as the watercolour shiba, drawn in a 400-unit box, placed with HEAD_T)
HEAD = 'M116 162 C92 192 86 232 104 264 C122 294 162 318 200 320 C238 318 278 294 296 264 C314 232 308 192 284 162 Z'
TURBAN = 'M94 190 C78 128 122 70 200 66 C278 70 322 128 306 190 C262 168 138 168 94 190 Z'
EARS = 'M118 150 L99 66 C98 60 103 58 107 61 L170 112 Z M282 150 L301 66 C302 60 297 58 293 61 L230 112 Z'
MUZZLE = 'M164 232 C150 262 162 300 200 304 C238 300 250 262 236 232 C226 224 174 224 164 232 Z'
S = 0.72
HEAD_T = f'translate({f(150 - 200 * S)} {f(80 - 58 * S)}) scale({S})'   # ears' tips at y≈80

# turban wraps: curves sweeping up and over, one family between each pair of folds
def turban_contours():
    def fam(i):
        y = 60 + i * 4.6
        bow = 46 + 10 * math.sin(i * 0.31)
        return [(70 + 30 * k, y + 0.42 * 30 * k - bow * math.sin(math.pi * k / 8)) for k in range(9)]
    return lines(fam, 36, 0.5)


def fur_strokes():
    """short fur flicks around the edge of the pale markings, pointing outward."""
    out = []
    for cx, cy, rx, ry, a0, a1, n in [
        (200, 266, 40, 40, 200, 340, 16),   # round the muzzle
        (128, 282, 36, 32, 150, 330, 10),   # left cheek patch
        (272, 282, 36, 32, 210, 30 + 360, 10),
    ]:
        for k in range(n):
            t = math.radians(a0 + (a1 - a0) * (k + rnd.random() * 0.5) / n)
            x, y = cx + rx * math.cos(t), cy + ry * math.sin(t)
            L = rnd.uniform(5, 9)
            out.append(f'M{f(x)} {f(y)} l{f(math.cos(t) * L)} {f(math.sin(t) * L)}')
    return ' '.join(out)


def head_svg(shades):
    tan_hatch = hatch(-48, 3.6, (80, 120, 320, 330), 3)
    shadow_hatch = hatch(38, 4.0, (80, 150, 320, 330), 3)
    fold_hatch = hatch(-12, 3.0, (80, 168, 320, 190), 3)
    ear_hatch = hatch(70, 3.0, (90, 55, 310, 160), 2)
    turban = turban_contours()
    turban_shadow = hatch(62, 3.4, (80, 60, 320, 195), 3)
    s = f'''
  <g transform="{HEAD_T}">
    <defs>
      <clipPath id="cHead"><path d="{HEAD}"/></clipPath>
      <clipPath id="cTurban"><path d="{TURBAN}"/></clipPath>
      <clipPath id="cEars"><path d="{EARS}"/></clipPath>
      <mask id="mTan" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
        <rect width="400" height="400" fill="white"/>
        <path d="{MUZZLE}" fill="black"/>
        <ellipse cx="128" cy="284" rx="34" ry="30" fill="black"/><ellipse cx="272" cy="284" rx="34" ry="30" fill="black"/>
        <ellipse cx="160" cy="194" rx="9" ry="6" fill="black" transform="rotate(-12 160 194)"/>
        <ellipse cx="240" cy="194" rx="9" ry="6" fill="black" transform="rotate(12 240 194)"/>
      </mask>
      <mask id="mShadow" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
        <rect width="400" height="400" fill="black"/>
        <!-- where the light doesn't reach: under the brim, the outer cheeks, under the jaw -->
        <path d="M90 180 C150 200 250 200 310 180 L310 214 C250 226 150 226 90 214 Z" fill="white"/>
        <ellipse cx="94" cy="236" rx="22" ry="54" fill="white"/><ellipse cx="306" cy="236" rx="22" ry="54" fill="white"/>
        <ellipse cx="200" cy="330" rx="110" ry="22" fill="white"/>
      </mask>
      <mask id="mTurbanShade" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
        <rect width="400" height="400" fill="black"/>
        <ellipse cx="300" cy="150" rx="60" ry="70" fill="white"/><ellipse cx="110" cy="170" rx="34" ry="30" fill="white"/>
      </mask>
    </defs>

    <!-- ears first, then paper for head and turban over them (the rays stop at the figure) -->
    <path d="{EARS}" fill="{PAPER}"/>
    <g clip-path="url(#cEars)" stroke="{INK}" stroke-width="0.8"><path d="{ear_hatch}"/><path d="{hatch(-30, 3.0, (90, 55, 310, 160), 2)}"/></g>
    <path d="M118 128 L109 84 L146 110 M282 128 L291 84 L254 110" stroke="{INK}" stroke-width="1.1"/>
    <path d="M118 128 L109 84 L146 110 Z M282 128 L291 84 L254 110 Z" fill="{PAPER}"/>
    <path d="M116 152 L99 66 C98 60 103 58 107 61 L170 112" stroke="{INK}" stroke-width="2.2"/>
    <path d="M284 152 L301 66 C302 60 297 58 293 61 L230 112" stroke="{INK}" stroke-width="2.2"/>
    <path d="{HEAD}" fill="{PAPER}"/><path d="{TURBAN}" fill="{PAPER}"/>

    <!-- coat: one tone of hatching on the tan, crossed where it falls into shadow -->
    <g clip-path="url(#cHead)" stroke="{INK}">
      <g mask="url(#mTan)">
        <path d="{tan_hatch}" stroke-width="0.7"/>
        <g mask="url(#mShadow)" stroke-width="0.65"><path d="{shadow_hatch}"/></g>
        <path d="{fold_hatch}" stroke-width="0.65"/>
      </g>
      <path d="{MUZZLE}" stroke-width="0.9" stroke-dasharray="3 2.5"/>
      <path d="{fur_strokes()}" stroke-width="0.9"/>
    </g>
    <path d="{HEAD[:-2]}" stroke="{INK}" stroke-width="2.3"/>
    <path d="M104 264 C96 270 95 278 100 283 M110 278 C103 285 104 292 110 295 M296 264 C304 270 305 278 300 283 M290 278 C297 285 296 292 290 295" stroke="{INK}" stroke-width="1.3"/>

    <!-- face: the eye whites cleared of hatching -->
    <path d="M142 213 C152 209 166 208 178 211 C176 225 150 225 142 213 Z M222 211 C234 208 248 209 258 213 C250 225 224 225 222 211 Z" fill="{PAPER}"/>
    <g stroke="{INK}">
      <path d="M142 213 C152 209 166 208 178 211" stroke-width="2.6"/>
      <path d="M145 213 C150 223 170 225 176 212" stroke-width="1.4"/>
      <path d="M222 211 C234 208 248 209 258 213" stroke-width="2.6"/>
      <path d="M224 212 C230 225 250 223 255 213" stroke-width="1.4"/>
    </g>
    <path d="M151 214 C151 219 157 221 160 217 C161 215 160 213 159 213 Z M229 214 C229 219 235 221 238 217 C239 215 238 213 237 213 Z" fill="{INK}"/>
    <path d="M185 247 C185 240 215 240 215 247 C215 255 207 261 200 261 C193 261 185 255 185 247 Z" fill="{INK}"/>
    <path d="M193 245 C196 243 200 243 202 244" stroke="{PAPER}" stroke-width="1.6"/>
    <path d="M200 261 L200 271 M200 271 C194 281 184 280 180 274 M200 271 C206 281 216 280 220 274" stroke="{INK}" stroke-width="1.7"/>
    {shades_svg() if shades else ''}

    <!-- turban: contour lines that follow the wrap, crossed on its shadowed side, a dark brim -->
    <g clip-path="url(#cTurban)" stroke="{INK}">
      <path d="{turban}" stroke-width="0.8"/>
      <g mask="url(#mTurbanShade)" stroke-width="0.7"><path d="{turban_shadow}"/></g>
      <path d="M96 150 C140 96 230 82 300 110 M100 172 C150 116 240 104 306 140 M118 96 C170 118 250 132 304 166 M150 74 C200 92 262 110 300 128" stroke-width="1.6"/>
      <path d="{hatch(-3, 2.2, (80, 150, 320, 195), 4)}" stroke-width="0.8" clip-path="url(#cBrim)"/>
    </g>
    <clipPath id="cBrim"><path d="M94 190 C138 168 262 168 306 190 L304 168 C262 150 138 150 96 168 Z"/></clipPath>
    <path d="M98 170 C138 152 262 152 302 170" stroke="{INK}" stroke-width="1.4"/>
    <path d="{TURBAN}" stroke="{INK}" stroke-width="2.3"/>

    <!-- the jewel: the crescent and sparkle, the one touch of colour -->
    <path d="M200 116 C188 132 182 146 182 157 C182 168 190 176 200 176 C210 176 218 168 218 157 C218 146 212 132 200 116 Z" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>
    <path d="M205 146 A12 12 0 1 0 205 168 A10 10 0 0 1 205 146 Z" fill="{VIOLET}"/>
    <path transform="translate(209 144) scale(5.2)" fill="{VIOLET}" d="M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z"/>
    <path d="M200 124 L200 130 M200 182 L200 188" stroke="{INK}" stroke-width="1"/>
  </g>'''
    return s


def shades_svg():
    """the deal-with-it shades, engraved: stepped outline, densely cross-hatched, glints left bare."""
    def lens(dx):
        steps = [(132, 192), (138, 192), (144, 188), (150, 182)]
        pts = [(128 + dx if dx == 0 else 208, 198)]
        p = f'M{132 + dx} 206'
        for i, (a, b) in enumerate(steps):
            y = 206 + i * 7
            p += f' L{a + dx} {y} L{a + dx} {y + 7}'
        p += f' L{steps[-1][1] + dx} {206 + 28}'
        for i, (a, b) in reversed(list(enumerate(steps))):
            y = 206 + i * 7
            p += f' L{b + dx} {y + 7} L{b + dx} {y}'
        return p + ' Z'
    shape = f'M128 198 L274 198 L274 206 L128 206 Z {lens(0)} {lens(80)}'
    glints = 'M152 210 h7 v7 h7 v7 h-7 v-7 h-7 Z M232 210 h7 v7 h7 v7 h-7 v-7 h-7 Z'
    return f'''
    <clipPath id="cShades"><path d="{shape}"/></clipPath>
    <path d="{shape}" fill="{PAPER}"/>
    <g clip-path="url(#cShades)" stroke="{INK}" stroke-width="1.1">
      <path d="{hatch(-45, 2.0, (120, 190, 280, 240), 2)}"/>
      <path d="{hatch(45, 2.0, (120, 190, 280, 240), 2)}"/>
      <path d="{hatch(0, 2.4, (120, 190, 280, 240), 2)}"/>
    </g>
    <path d="{glints}" fill="{PAPER}"/>
    <path d="{shape}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="miter"/>'''


# ---------------------------------------------------------------- the rest of the card (final units)
def rays():
    cx, cy = 150, 150
    out = []
    for k in range(96):
        a = 2 * math.pi * k / 96
        r0 = 70 if k % 2 else 64
        r1 = 400 if k % 2 == 0 else rnd.uniform(130, 190)
        out.append(f'M{f(cx + r0 * math.cos(a))} {f(cy + r0 * math.sin(a))} L{f(cx + r1 * math.cos(a))} {f(cy + r1 * math.sin(a))}')
    return ' '.join(out)


ROBE = 'M18 430 C20 364 46 324 92 306 L106 298 L150 354 L194 298 L208 306 C254 324 280 364 282 430 Z'
RUFF = 'M106 298 C104 284 122 262 150 262 C178 262 196 284 194 298 L150 354 Z'


def robe_svg():
    def folds_fam(i):
        # long folds falling from the shoulders, spreading toward the hem
        x0 = [66, 84, 100, 200, 216, 234][i]
        x1 = [40, 70, 98, 204, 232, 262][i]
        return [(x0, 318), (x0 + (x1 - x0) * 0.5 + (4 if i % 2 else -4), 372), (x1, 432)]
    folds = lines(folds_fam, 6, 0.4)
    def flank(i):
        # contour hatching round each shoulder, shading the outer flanks
        t = i * 4.2
        return [(18 + t * 0.2, 432), (24 + t * 0.6, 372), (50 + t * 0.8, 330 + t * 0.15), (92 + t * 0.5, 312 + t * 0.2)]
    left = lines(flank, 14, 0.4)
    right = ' '.join(lines(lambda i, k=k: [(300 - x, y) for x, y in flank(i)], 14, 0.4) for k in [0])
    stars = []
    for x, y, r in [(58, 396, 4.2), (238, 374, 4.6), (250, 414, 3.2), (78, 356, 3)]:
        stars.append(f'<path transform="translate({x} {y}) scale({r})" fill="{PAPER}" stroke="{INK}" stroke-width="{f(0.9 / r)}" d="M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z"/>')
    ruff = []
    for row, (y0, half, n) in enumerate([(290, 40, 10), (306, 30, 8), (322, 19, 5), (336, 9, 3)]):
        for k in range(n):
            x = 150 - half + 2 * half * (k + 0.5) / n + rnd.uniform(-1.2, 1.2)
            y = y0 + rnd.uniform(-2, 2) + abs(x - 150) * 0.12
            ruff.append(f'M{f(x)} {f(y - 4)} q{f(rnd.uniform(-2, 2))} {f(4)} {f(rnd.uniform(-1.5, 1.5) + (x - 150) * 0.05)} {f(rnd.uniform(6, 9))}')
    return f'''
  <clipPath id="cRobe"><path d="{ROBE}"/></clipPath>
  <path d="{ROBE}" fill="{PAPER}"/>
  <g clip-path="url(#cRobe)" stroke="{INK}">
    <path d="{hatch(84, 4.4, (10, 290, 290, 440), 3)}" stroke-width="0.45"/>
    <path d="{left} {right}" stroke-width="0.7"/>
    <path d="{folds}" stroke-width="1.1"/>
  </g>
  {''.join(stars)}
  <path d="{ROBE[:-2]}" stroke="{INK}" stroke-width="1.6"/>
  <path d="{RUFF}" fill="{PAPER}"/>
  <path d="{' '.join(ruff)}" stroke="{INK}" stroke-width="0.8"/>
  <path d="M106 298 L150 354 L194 298" stroke="{INK}" stroke-width="1.5"/>
  <path d="M100 302 L150 362 L200 302" stroke="{INK}" stroke-width="0.7"/>'''


def cards_svg():
    pivot = (112, 410)
    designs = [
        # sparkle, sun, constellation, crescent — the brand's marks, engraved small
        '<path transform="translate(0 -46) scale(8)" fill="{ink}" d="M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z"/>',
        '<circle cx="0" cy="-46" r="6" stroke="{ink}" stroke-width="0.9"/><path d="M0 -58 L0 -55 M0 -37 L0 -34 M-12 -46 L-9 -46 M9 -46 L12 -46 M-8.5 -54.5 L-6.5 -52.5 M8.5 -54.5 L6.5 -52.5 M-8.5 -37.5 L-6.5 -39.5 M8.5 -37.5 L6.5 -39.5" stroke="{ink}" stroke-width="0.9"/>',
        '<path d="M-8 -58 L4 -50 L-3 -40 L8 -32" stroke="{ink}" stroke-width="0.6"/><circle cx="-8" cy="-58" r="1.4" fill="{ink}"/><circle cx="4" cy="-50" r="1" fill="{ink}"/><circle cx="-3" cy="-40" r="1.7" fill="{ink}"/><circle cx="8" cy="-32" r="1.1" fill="{ink}"/>',
        '<path d="M3 -55 A10 10 0 1 0 3 -37 A8.2 8.2 0 0 1 3 -55 Z" fill="{ink}"/>',
    ]
    g = [f'<g transform="translate({pivot[0]} {pivot[1]})">']
    for ang, d in zip((-34, -14, 6, 26), designs):
        g.append(f'''<g transform="rotate({ang})">
      <rect x="-23" y="-84" width="46" height="76" rx="3" fill="{PAPER}" stroke="{INK}" stroke-width="1.3"/>
      <rect x="-19" y="-80" width="38" height="68" rx="1.5" stroke="{INK}" stroke-width="0.5"/>
      {d.format(ink=INK)}</g>''')
    g.append('</g>')
    paw = 'M88 414 C84 398 94 386 109 385 C125 384 136 394 136 409 C136 425 126 434 110 434 C97 434 90 426 88 414 Z'
    g.append(f'''
  <clipPath id="cPaw"><path d="{paw}"/></clipPath>
  <path d="{paw}" fill="{PAPER}"/>
  <g clip-path="url(#cPaw)" stroke="{INK}" stroke-width="0.6"><path d="{hatch(-48, 2.6, (80, 380, 140, 440), 2)}"/></g>
  <path d="{paw}" stroke="{INK}" stroke-width="1.5"/>
  <path d="M100 388 C102 394 102 399 99 404 M114 386 C116 393 116 399 113 405 M127 391 C127 397 125 402 122 406" stroke="{INK}" stroke-width="1.1"/>''')
    return '\n  '.join(g)


def frame_svg(font_css):
    x, y, w, h = PIC
    return f'''
  <style>{font_css}
    .num {{ font: 600 17px Alegreya, Georgia, serif; letter-spacing: 3px; fill: {INK}; }}
    .ttl {{ font: 500 23px Alegreya, Georgia, serif; letter-spacing: 1.5px; fill: {INK}; }}
    .ttl tspan.v {{ font-style: italic; fill: {VIOLET}; }}
  </style>
  <rect x="5" y="5" width="290" height="490" rx="12" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>
  <rect x="12" y="12" width="276" height="476" rx="7" stroke="{INK}" stroke-width="0.7"/>
  <text class="num" x="150" y="50" text-anchor="middle">XXII</text>
  <path d="M96 44 L120 44 M180 44 L204 44" stroke="{INK}" stroke-width="0.7"/>
  <rect x="{x}" y="{y}" width="{w}" height="{h}" stroke="{INK}" stroke-width="1.3"/>
  <text class="ttl" x="150" y="463" text-anchor="middle">The <tspan class="v">Reader</tspan></text>'''


def font_css():
    def face(file, style):
        b = base64.b64encode(open(os.path.join(FONTS, file), 'rb').read()).decode()
        return f"@font-face{{font-family:Alegreya;font-style:{style};font-weight:400 900;src:url(data:font/woff2;base64,{b}) format('woff2')}}"
    return face('alegreya-latin.woff2', 'normal') + face('alegreya-italic-latin.woff2', 'italic')


def build(shades):
    x, y, w, h = PIC
    css = font_css()
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <title>Mayanov Tarot — XXII, The Reader</title>
  <defs>
    <!-- a hand's unevenness on every engraved line (no grain: ink, not graphite) -->
    <filter id="hand" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5"/>
      <feDisplacementMap in="SourceGraphic" scale="1.1" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <clipPath id="cPic"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>
  </defs>
  {frame_svg(css)}
  <g filter="url(#hand)">
    <g clip-path="url(#cPic)">
      <path d="{rays()}" stroke="{INK}" stroke-width="0.45"/>
      <!-- a few stars in the rays -->
      {''.join(f'<path transform="translate({sx} {sy}) scale({sr})" fill="{PAPER}" stroke="{INK}" stroke-width="{f(1 / sr)}" d="M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z"/>' for sx, sy, sr in [(46, 96, 7), (252, 110, 5.5), (40, 210, 4.5), (262, 232, 6.5), (70, 150, 3)])}
      {robe_svg()}
      {head_svg(shades)}
      {cards_svg()}
    </g>
  </g>
</svg>
'''


if __name__ == '__main__':
    for name, sh in (('mayanov-reader.svg', False), ('mayanov-reader-shades.svg', True)):
        rnd.seed(7)
        open(os.path.join(HERE, name), 'w').write(build(sh))
        print('wrote', name)
