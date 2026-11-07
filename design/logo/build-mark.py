"""The Mayanov logo: the shiba reader reduced to a mark (a dozen ink lines, the
crescent jewel the only colour), and its lockups with the wordmark.

    python3 design/logo/build-mark.py
"""
import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, '..', '..', 'public', 'fonts')
OUT = os.path.join(HERE, 'mark')
os.makedirs(OUT, exist_ok=True)

LIGHT = dict(ink='#221D3C', accent='#6B3FA0', jewel_cut='#F3F1EC', bg='#F3F1EC', tarot='#6B3FA0', wash=0.26, turban_wash=0.35)
DARK = dict(ink='#F3F1EC', accent='#C9B8E8', jewel_cut='#221D3C', bg='#221D3C', tarot='#C9B8E8', wash=0.22, turban_wash=0.3)

TURBAN = 'M20 47 C15 28 31 14 50 13 C69 14 85 28 80 47 C66 41 34 41 20 47 Z'
SPARK = 'M0,-1 C0.06,-0.3 0.3,-0.06 1,0 C0.3,0.06 0.06,0.3 0,1 C-0.06,0.3 -0.3,0.06 -1,0 C-0.3,-0.06 -0.06,-0.3 0,-1 Z'


def head(c, shades=False, uid='m'):
    """the shiba's head in a 100-unit box, in pencil line."""
    ink, acc = c['ink'], c['accent']
    eyes = f'''
    <path d="M30 53.5 C34 52 39 51.6 43 52.6 M57 52.6 C61 51.6 66 52 70 53.5" stroke-width="2.7"/>
    <path d="M32.5 54 A4.6 4.6 0 0 0 41.6 54 Z M58.4 54 A4.6 4.6 0 0 0 67.5 54 Z" fill="{ink}" stroke="none"/>'''
    if shades:
        # deal-with-it: a bar and two stepped lenses on a 2.5-unit pixel grid, glints cut out
        u = 2.3
        rects = [(25, 48.6, 50, 2.6)]
        glints = []
        for ox in (0, 26):
            for k, (a, b) in enumerate([(28, 46), (29.8, 46), (31.6, 44.8), (33.4, 43)]):
                rects.append((a + ox, 51 + k * u, b - a, u + 0.15))
            glints += [(36.2 + ox, 51.6), (38.5 + ox, 53.9)]
        eyes = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{ink}" stroke="none"/>' for x, y, w, h in rects)
        eyes += ''.join(f'<rect x="{x}" y="{y}" width="2.3" height="2.3" fill="{c["bg"]}" stroke="none"/>'
                        for x, y in glints)
    return f'''
  <defs>
    <mask id="{uid}-ears" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect width="100" height="100" fill="white"/><path d="{TURBAN}" fill="black" stroke="black" stroke-width="2.7"/>
    </mask>
    <clipPath id="{uid}-turban"><path d="{TURBAN}"/></clipPath>
  </defs>
  <!-- the turban's wash, painted before the pencil -->
  <path d="{TURBAN}" fill="{acc}" opacity="{c['turban_wash']}" filter="url(#{uid}-wc)"/>
  <g filter="url(#{uid}-pencil)" fill="none" stroke="{ink}" stroke-linecap="round" stroke-linejoin="round">
    <!-- ears, rising out from behind the turban -->
    <g mask="url(#{uid}-ears)" stroke-width="2.7">
      <path d="M25 40 L22.5 9.5 C22.4 8 23.6 7.4 24.7 8.2 L44 24"/>
      <path d="M75 40 L77.5 9.5 C77.6 8 76.4 7.4 75.3 8.2 L56 24"/>
      <path d="M27.5 31 L26 15 L37 24 M72.5 31 L74 15 L63 24" stroke-width="1.8"/>
    </g>
    <!-- face: broad at the cheeks, a fluff-notch each side, tapering to the muzzle -->
    <path d="M21 47 C18 55 17.5 61 19.5 66 L15 70.5 L22.5 72 C29 81 40 87 50 87 C60 87 71 81 77.5 72 L85 70.5 L80.5 66 C82.5 61 82 55 79 47" stroke-width="2.7"/>
    <!-- the shiba's eyebrow dots -->
    <ellipse cx="35.5" cy="47.8" rx="2.2" ry="1.4" fill="{ink}" stroke="none"/>
    <ellipse cx="64.5" cy="47.8" rx="2.2" ry="1.4" fill="{ink}" stroke="none"/>
    {'' if shades else eyes}
    <!-- nose and mouth -->
    <path d="M44.5 65.5 C44.5 62.2 55.5 62.2 55.5 65.5 C55.5 69 52.7 71.4 50 71.4 C47.3 71.4 44.5 69 44.5 65.5 Z" fill="{ink}" stroke="none"/>
    <path d="M50 71.4 L50 74.6 M50 74.6 C47.4 78 43.6 78 42 75.4 M50 74.6 C52.6 78 56.4 78 58 75.4" stroke-width="2.2"/>
    <!-- turban: dome, one wrap sweeping over, the brim -->
    <path d="{TURBAN}" stroke-width="2.7"/>
    <path d="M23.5 33 C37 23 60 20.5 77.5 30" stroke-width="1.8"/>
    <path d="M22 41 C36 35.5 64 35.5 78 41" stroke-width="1.8"/>
    <path clip-path="url(#{uid}-turban)" stroke-width="0.8" opacity="0.55" d="{' '.join(f'M{60 + k * 3.4} 50 L{78 + k * 3.4} 14' for k in range(9))}"/>
  </g>
  {eyes if shades else ''}
  <!-- the jewel: a violet drop with the crescent and sparkle cut from it -->
  <path d="M50 24 C46 29.5 43.6 33.6 43.6 37 C43.6 40.6 46.4 43.4 50 43.4 C53.6 43.4 56.4 40.6 56.4 37 C56.4 33.6 54 29.5 50 24 Z" fill="{acc}"/>
  <path d="M51.6 33.2 A4.3 4.3 0 1 0 51.6 41 A3.5 3.5 0 0 1 51.6 33.2 Z" fill="{c['jewel_cut']}"/>
  <path transform="translate(53.3 33.4) scale(1.9)" fill="{c['jewel_cut']}" d="{SPARK}"/>'''


def mark(c, shades=False, uid='m'):
    """LogoMark's composition: a watercolour moon, a pencil arc round it, the star at its
    open end, and the shiba reader drawn in pencil where the handwritten M was."""
    tone = c['accent']
    a = c['wash']
    return f'''
  <defs>
    <filter id="{uid}-wc" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="9"/>
      <feGaussianBlur stdDeviation="0.9"/>
    </filter>
    <!-- the site's pencil (#pencil-icon, index.html) -->
    <filter id="{uid}-pencil" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="5" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="0.8" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves="2" seed="6" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="ga"/>
      <feComposite in="d" in2="ga" operator="in"/>
    </filter>
  </defs>
  <g filter="url(#{uid}-wc)" fill="{tone}">
    <circle cx="48" cy="52" r="38" opacity="{a}"/>
    <circle cx="56" cy="47" r="30" opacity="{a * 0.6:.3f}"/>
  </g>
  <path d="M70 14 A43 43 0 1 0 82 78" fill="none" stroke="{tone}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
  <path fill="{tone}" transform="translate(80 18) scale(8)" d="{SPARK}"/>
  <g transform="translate(11 18.5) scale(0.74)">{head(c, shades, uid)}</g>'''


def font_css():
    def face(file, style):
        b = base64.b64encode(open(os.path.join(FONTS, file), 'rb').read()).decode()
        return f"@font-face{{font-family:Alegreya;font-style:{style};font-weight:400 900;src:url(data:font/woff2;base64,{b}) format('woff2')}}"
    return face('alegreya-latin.woff2', 'normal') + face('alegreya-italic-latin.woff2', 'italic')


CSS = font_css()


def wordmark(c, x, y, size, anchor='start'):
    return f'''<text x="{x}" y="{y}" text-anchor="{anchor}" style="font: 500 {size}px Alegreya, Georgia, serif; letter-spacing: 0.01em" fill="{c['ink']}">Mayanov <tspan style="font-style: italic" fill="{c['tarot']}">Tarot</tspan></text>'''


def svg(vb, body, bg=None, fonts=False):
    style = f'<style>{CSS}</style>' if fonts else ''
    back = f'<rect x="{vb.split()[0]}" y="{vb.split()[1]}" width="{vb.split()[2]}" height="{vb.split()[3]}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{style}{back}{body}\n</svg>\n'


def write(name, text):
    open(os.path.join(OUT, name), 'w').write(text)


for tone, c in (('', LIGHT), ('-dark', DARK)):
    for sh in (False, True):
        tag = '-shades' if sh else ''
        # mark alone (transparent)
        write(f'mark{tag}{tone}.svg', svg('4 4 92 92', mark(c, sh)))
        # horizontal lockup: mark + wordmark on one line
        write(f'lockup-horizontal{tag}{tone}.svg',
              svg('0 0 430 100', mark(c, sh) + wordmark(c, 108, 66, 46), fonts=True))
        # stacked lockup: mark above, wordmark centred
        write(f'lockup-stacked{tag}{tone}.svg',
              svg('0 0 300 190', f'<g transform="translate(90 0) scale(1.2)">{mark(c, sh)}</g>' + wordmark(c, 150, 168, 40, 'middle'), fonts=True))
        # app / profile icon: mark on its ground, in a circle-safe square
        write(f'icon{tag}{tone}.svg',
              svg('-14 -10 128 128', mark(c, sh), bg=c['bg']))
print('wrote', len(os.listdir(OUT)), 'files to', OUT)
