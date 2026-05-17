#!/usr/bin/env python3
"""Generate PWA icons and Open Graph image for Ghost Protocol."""

from PIL import Image, ImageDraw, ImageFont
import os
import math

PUBLIC = os.path.join(os.path.dirname(__file__), '..', 'public')

# ── Colors ──────────────────────────────────────────────
BG    = (8, 8, 10)        # #08080A
ACCENT = (255, 60, 95)    # #FF3C5F
WHITE = (255, 255, 255)
MUTED = (120, 113, 127)   # #78717F

def create_rounded_rect(draw, size, radius, fill):
    """Draw a rounded rectangle."""
    w, h = size
    draw.rounded_rectangle([(0, 0), (w-1, h-1)], radius=radius, fill=fill)

def draw_ghost(draw, cx, cy, size, color):
    """Draw a stylized ghost shape (bold minimal)."""
    s = size
    # Body: rounded shape
    body = [
        (cx - s*0.4, cy - s*0.15),  # top left
        (cx - s*0.45, cy - s*0.45), # upper left
        (cx - s*0.3, cy - s*0.7),   # head left
        (cx, cy - s*0.8),           # top center
        (cx + s*0.3, cy - s*0.7),   # head right
        (cx + s*0.45, cy - s*0.45), # upper right
        (cx + s*0.4, cy - s*0.15),  # top right
        (cx + s*0.45, cy + s*0.3),  # side right
        (cx + s*0.35, cy + s*0.15), # wave 1
        (cx + s*0.15, cy + s*0.45), # wave 2
        (cx, cy + s*0.2),           # wave valley
        (cx - s*0.15, cy + s*0.45), # wave 3
        (cx - s*0.35, cy + s*0.15), # wave 4
        (cx - s*0.45, cy + s*0.3),  # side left
    ]
    draw.polygon(body, fill=color)
    
    # Eyes
    eye_r = s * 0.08
    draw.ellipse([(cx - s*0.14 - eye_r, cy - s*0.4 - eye_r), 
                  (cx - s*0.14 + eye_r, cy - s*0.4 + eye_r)], fill=BG)
    draw.ellipse([(cx + s*0.14 - eye_r, cy - s*0.4 - eye_r), 
                  (cx + s*0.14 + eye_r, cy - s*0.4 + eye_r)], fill=BG)

def draw_ghost_small(draw, cx, cy, size, color):
    """Simpler ghost for smaller icons."""
    s = size
    # Simpler body
    body = [
        (cx - s*0.3, cy - s*0.55),
        (cx - s*0.2, cy - s*0.7),
        (cx, cy - s*0.8),
        (cx + s*0.2, cy - s*0.7),
        (cx + s*0.3, cy - s*0.55),
        (cx + s*0.35, cy + s*0.3),
        (cx + s*0.2, cy + s*0.15),
        (cx + s*0.05, cy + s*0.45),
        (cx - s*0.05, cy + s*0.45),
        (cx - s*0.2, cy + s*0.15),
        (cx - s*0.35, cy + s*0.3),
    ]
    draw.polygon(body, fill=color)
    # Eyes
    eye_r = max(1, int(s * 0.07))
    draw.ellipse([(cx - s*0.1 - eye_r, cy - s*0.35 - eye_r), 
                  (cx - s*0.1 + eye_r, cy - s*0.35 + eye_r)], fill=BG)
    draw.ellipse([(cx + s*0.1 - eye_r, cy - s*0.35 - eye_r), 
                  (cx + s*0.1 + eye_r, cy - s*0.35 + eye_r)], fill=BG)

def make_icon(size, filename):
    """Generate a square app icon."""
    img = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(img)
    
    if size >= 192:
        draw_ghost(draw, size/2, size/2, size * 0.55, ACCENT)
    else:
        draw_ghost_small(draw, size/2, size/2, size * 0.55, ACCENT)
    
    path = os.path.join(PUBLIC, filename)
    img.save(path, 'PNG')
    print(f'  ✓ {filename} ({size}x{size})')
    return img

def make_og_image():
    """Generate Open Graph image (1200x630)."""
    w, h = 1200, 630
    img = Image.new('RGBA', (w, h), BG)
    draw = ImageDraw.Draw(img)
    
    # Subtle grain-like dots for texture
    import random
    random.seed(42)
    for _ in range(2000):
        x = random.randint(0, w-1)
        y = random.randint(0, h-1)
        alpha = random.randint(3, 12)
        c = (255, 255, 255, alpha)
        img.putpixel((x, y), c)
    
    draw = ImageDraw.Draw(img)
    
    # Ghost on the left
    ghost_cx = 240
    ghost_cy = 315
    draw_ghost(draw, ghost_cx, ghost_cy, 180, ACCENT)
    
    # Try to load Unbounded font, fallback to default
    title_font = None
    subtitle_font = None
    try:
        # Common Linux font paths
        for fp in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
                    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
            if os.path.exists(fp):
                title_font = ImageFont.truetype(fp, 64)
                subtitle_font = ImageFont.truetype(fp, 28)
                break
    except Exception:
        pass
    
    if title_font is None:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Title
    title = "Ghost Protocol"
    draw.text((420, 200), title, fill=WHITE, font=title_font)
    
    # Subtitle
    subtitle = "Non sei l'unico."
    draw.text((420, 280), subtitle, fill=ACCENT, font=subtitle_font)
    
    # Tagline
    tagline = "Scopri quante persone hanno vissuto\nesattamente quello che stai vivendo."
    tag_font = None
    try:
        for fp in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                    '/usr/share/fonts/TTF/DejaVuSans.ttf']:
            if os.path.exists(fp):
                tag_font = ImageFont.truetype(fp, 22)
                break
    except Exception:
        pass
    if tag_font is None:
        tag_font = ImageFont.load_default()
    
    y = 350
    for line in tagline.split('\n'):
        draw.text((420, y), line, fill=MUTED, font=tag_font)
        y += 32
    
    # URL at bottom
    small_font = None
    try:
        for fp in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                    '/usr/share/fonts/TTF/DejaVuSans.ttf']:
            if os.path.exists(fp):
                small_font = ImageFont.truetype(fp, 20)
                break
    except Exception:
        pass
    
    url_text = "ghost-protocol.app"
    if small_font:
        draw.text((420, 520), url_text, fill=(255,255,255,100), font=small_font)
    
    path = os.path.join(PUBLIC, 'og-default.png')
    img.save(path, 'PNG')
    print(f'  ✓ og-default.png ({w}x{h})')

def make_favicon_ico():
    """Generate favicon.ico from the 48x48 icon."""
    png_path = os.path.join(PUBLIC, 'icon-48.png')
    ico_path = os.path.join(PUBLIC, 'favicon.ico')
    
    img = Image.open(png_path)
    img.save(ico_path, 'ICO', sizes=[(48, 48)])
    print(f'  ✓ favicon.ico')

if __name__ == '__main__':
    print('🔮 Generating Ghost Protocol icons…\n')
    
    # PWA icons
    make_icon(512, 'icon-512.png')
    make_icon(192, 'icon-192.png')
    make_icon(180, 'apple-touch-icon.png')
    make_icon(48,  'icon-48.png')
    
    # Favicon
    make_favicon_ico()
    
    # OG image
    make_og_image()
    
    print('\n✅ All icons generated in public/')
