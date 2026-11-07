"""The browser-tab icon: the shiba reader (the header logo's full-moon version) redrawn
for 16-64px: a solid paper moon so it reads on light and dark tab bars, the shiba larger
with heavier lines, no hatching, and of the arc and star only the star.

    python3 design/logo/build-favicon.py   ->  public/favicon.svg
    The PNGs (public/favicon.png 64px, transparent; public/apple-touch-icon.png 180px,
    from design/logo/apple-touch-icon.svg) are headless-Chrome screenshots of these.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, '..', '..', 'public')
INK, PAPER, VIOLET = '#221D3C', '#F3F1EC', '#6B3FA0'
STAR = 'M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z'
TURBAN = 'M20 47 C15 28 31 14 50 13 C69 14 85 28 80 47 C66 41 34 41 20 47 Z'
K = 1.45  # line weight for tab sizes


def shades():
    r = [(25, 48.6, 50, 2.6)]
    for ox in (0, 26):
        for k, (a, b) in enumerate([(28, 46), (29.8, 46), (31.6, 44.8), (33.4, 43)]):
            r.append((a + ox, 51 + k * 2.3, b - a, 2.45))
    out = ''.join(f'<rect x="{x}" y="{y}" width="{w:.1f}" height="{h}" fill="{INK}"/>' for x, y, w, h in r)
    out += ''.join(f'<rect x="{x}" y="{y}" width="2.3" height="2.3" fill="{PAPER}"/>' for x, y in [(36.2, 51.6), (38.5, 53.9), (62.2, 51.6), (64.5, 53.9)])
    return out


def favicon(square_bg=None):
    w = lambda v: f'{v * K:.2f}'
    bg = f'<rect width="100" height="100" fill="{square_bg}"/>' if square_bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{bg}
  <defs>
    <mask id="ears" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect width="100" height="100" fill="white"/><path d="{TURBAN}" fill="black" stroke="black" stroke-width="{w(2.7)}"/>
    </mask>
  </defs>
  <!-- the full moon -->
  <circle cx="49" cy="53" r="44" fill="{PAPER}"/>
  <path fill="{VIOLET}" transform="translate(87 14) scale(9)" d="{STAR}"/>
  <!-- the shiba reader -->
  <g transform="translate(4.5 11.5) scale(0.89)">
    <path d="{TURBAN}" fill="{VIOLET}" opacity="0.38"/>
    <g fill="none" stroke="{INK}" stroke-linecap="round" stroke-linejoin="round">
      <g mask="url(#ears)" stroke-width="{w(2.7)}">
        <path d="M25 40 L22.5 9.5 C22.4 8 23.6 7.4 24.7 8.2 L44 24"/>
        <path d="M75 40 L77.5 9.5 C77.6 8 76.4 7.4 75.3 8.2 L56 24"/>
      </g>
      <path d="M21 47 C18 55 17.5 61 19.5 66 L15 70.5 L22.5 72 C29 81 40 87 50 87 C60 87 71 81 77.5 72 L85 70.5 L80.5 66 C82.5 61 82 55 79 47" stroke-width="{w(2.7)}"/>
      <path d="M44.5 65.5 C44.5 62.2 55.5 62.2 55.5 65.5 C55.5 69 52.7 71.4 50 71.4 C47.3 71.4 44.5 69 44.5 65.5 Z" fill="{INK}" stroke="none"/>
      <path d="M50 71.4 L50 74.6 M50 74.6 C47.4 78 43.6 78 42 75.4 M50 74.6 C52.6 78 56.4 78 58 75.4" stroke-width="{w(2.2)}"/>
      <path d="{TURBAN}" stroke-width="{w(2.7)}"/>
      <path d="M22 41 C36 35.5 64 35.5 78 41" stroke-width="{w(1.8)}"/>
    </g>
    {shades()}
    <path d="M50 22 C45.5 28 43 32.6 43 36.5 C43 40.4 46.1 43.5 50 43.5 C53.9 43.5 57 40.4 57 36.5 C57 32.6 54.5 28 50 22 Z" fill="{VIOLET}"/>
    <path d="M51.8 32.2 A4.6 4.6 0 1 0 51.8 40.6 A3.8 3.8 0 0 1 51.8 32.2 Z" fill="{PAPER}"/>
  </g>
</svg>
'''


if __name__ == '__main__':
    open(os.path.join(PUBLIC, 'favicon.svg'), 'w').write(favicon())
    # the home-screen icon: iOS fills transparency with black, so it gets the night ink behind
    open(os.path.join(HERE, 'apple-touch-icon.svg'), 'w').write(favicon('#221D3C'))
    print('wrote public/favicon.svg and design/logo/apple-touch-icon.svg')
