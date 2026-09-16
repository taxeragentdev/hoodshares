#!/usr/bin/env python3
"""Flatten HoodPass and the sealed pack into NFT-ready PNGs (no UI chrome)."""

from __future__ import annotations

import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "scripts" / "fonts"
OUT_DIR = ROOT / "public" / "nft"
IMAGES = ROOT / "public" / "images"

ACID = (204, 255, 0, 255)
WHITE = (255, 255, 255, 255)
WHITE_70 = (255, 255, 255, 178)
WHITE_45 = (255, 255, 255, 115)
BLACK = (0, 0, 0, 255)

FONTS = {
    "SpaceGrotesk-Bold.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.ttf",
    "SpaceGrotesk-Medium.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.ttf",
    "JetBrainsMono-Regular.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.ttf",
}


def ensure_fonts() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in FONTS.items():
        dest = FONT_DIR / name
        if dest.exists() and dest.stat().st_size > 1000:
            continue
        req = urllib.request.Request(url, headers={"User-Agent": "HoodShares/1.0"})
        with urllib.request.urlopen(req, timeout=60) as response:
            dest.write_bytes(response.read())


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / name), size)


def round_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[float, float],
    typeface: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking: float,
    anchor: str = "lt",
) -> float:
    widths = [typeface.getlength(ch) for ch in text]
    total = sum(widths) + tracking * max(len(text) - 1, 0)
    x, y = xy
    if "m" in anchor:
        x -= total / 2
    elif "r" in anchor:
        x -= total
    cursor = x
    for ch, w in zip(text, widths):
        draw.text((cursor, y), ch, font=typeface, fill=fill, anchor="lt")
        cursor += w + tracking
    return total


def brand_mark(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 32
    stroke = max(2, int(2.2 * s))
    draw.rounded_rectangle(
        (3.5 * s, 6 * s, 28.5 * s, 26 * s),
        radius=int(4 * s),
        outline=ACID[:3],
        width=stroke,
    )
    pts = [(9 * s, 20.5 * s), (14 * s, 15 * s), (18 * s, 18.5 * s), (23.5 * s, 11.5 * s)]
    draw.line(pts, fill=ACID[:3], width=stroke, joint="curve")
    r = 2.4 * s
    draw.ellipse((23.5 * s - r, 11.5 * s - r, 23.5 * s + r, 11.5 * s + r), fill=ACID[:3])
    return img


def brand_badge(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 512
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(96 * s), fill=(5, 5, 5, 255))
    stroke = max(4, int(35.2 * s))
    draw.rounded_rectangle(
        (56 * s, 96 * s, 456 * s, 416 * s),
        radius=int(64 * s),
        outline=ACID[:3],
        width=stroke,
    )
    pts = [(144 * s, 328 * s), (224 * s, 240 * s), (288 * s, 296 * s), (376 * s, 184 * s)]
    draw.line(pts, fill=ACID[:3], width=max(4, int(38.4 * s)), joint="curve")
    r = 38.4 * s
    draw.ellipse((376 * s - r, 184 * s - r, 376 * s + r, 184 * s + r), fill=ACID[:3])
    return img


def render_hoodpass() -> Image.Image:
    plate = Image.open(IMAGES / "hoodshares-pass-plate.png").convert("RGB")
    w, h = 2160, 2880
    plate = plate.resize((w, h), Image.Resampling.LANCZOS)

    card = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    card.paste(plate, (0, 0))

    shine = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shine_draw = ImageDraw.Draw(shine)
    shine_draw.ellipse((int(w * 0.12), int(h * -0.08), int(w * 0.78), int(h * 0.42)), fill=(204, 255, 0, 38))
    shine = shine.filter(ImageFilter.GaussianBlur(90))
    card = Image.alpha_composite(card, shine)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    pad = int(w * 0.07)
    inner = 36
    outer = 22
    draw.rounded_rectangle(
        (outer, outer, w - 1 - outer, h - 1 - outer),
        radius=76,
        outline=(255, 255, 255, 28),
        width=4,
    )
    draw.rounded_rectangle(
        (inner, inner, w - 1 - inner, h - 1 - inner),
        radius=64,
        outline=(204, 255, 0, 64),
        width=5,
    )

    mono = font("JetBrainsMono-Regular.ttf", 34)
    display = font("SpaceGrotesk-Bold.ttf", 72)
    title = font("SpaceGrotesk-Bold.ttf", 168)
    medium = font("SpaceGrotesk-Medium.ttf", 36)
    tiny = font("JetBrainsMono-Regular.ttf", 30)

    draw_tracked(draw, "SEASON 01", (pad, pad + 18), mono, ACID, 10)
    draw.text((pad, pad + 78), "Hood", font=display, fill=WHITE)
    hood_w = display.getlength("Hood")
    draw.text((pad + hood_w, pad + 78), "Shares", font=display, fill=ACID)

    mark = brand_mark(108)
    overlay.alpha_composite(mark, (w - pad - 108, pad + 18))

    bottom = h - pad - 40
    serial_y = bottom - 18
    copy_y = serial_y - 118
    title_y = copy_y - 188
    admit_y = title_y - 58

    draw_tracked(draw, "ADMIT ONE", (pad, admit_y), medium, WHITE_70, 9)
    draw.text((pad, title_y), "Hood", font=title, fill=WHITE)
    title_w = title.getlength("Hood")
    draw.text((pad + title_w, title_y), "Pass", font=title, fill=ACID)

    copy = "One pass. Packs, Daily Lineup, the board.\nHold it to play."
    draw.multiline_text((pad, copy_y), copy, font=medium, fill=WHITE_70, spacing=10)

    draw_tracked(draw, "ROBINHOOD CHAIN", (pad, serial_y), tiny, WHITE_45, 8)

    card = Image.alpha_composite(card, overlay)
    mask = round_mask((w, h), 112)
    card.putalpha(mask)
    return card


def foil_overlay(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((int(w * 0.05), int(h * -0.08), int(w * 0.62), int(h * 0.28)), fill=(255, 255, 255, 28))
    return img.filter(ImageFilter.GaussianBlur(56))


def render_hoodpack() -> Image.Image:
    src = Image.open(IMAGES / "hoodshares-booster-pack.png").convert("RGBA")
    scale = 4
    w, h = src.size[0] * scale, src.size[1] * scale
    pack = src.resize((w, h), Image.Resampling.LANCZOS)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    badge = brand_badge(640)
    bx = (w - badge.width) // 2
    by = int(h * 0.28)
    overlay.alpha_composite(badge, (bx, by))

    display = font("SpaceGrotesk-Bold.ttf", 118)
    mono = font("JetBrainsMono-Regular.ttf", 36)
    name_y = by + badge.height + 48
    hood = "Hood"
    shares = "Shares"
    hood_w = display.getlength(hood)
    shares_w = display.getlength(shares)
    total = hood_w + shares_w
    x = (w - total) / 2
    draw.text((x, name_y), hood, font=display, fill=WHITE)
    draw.text((x + hood_w, name_y), shares, font=display, fill=ACID)
    draw_tracked(draw, "5 STOCK CARDS", (w / 2, name_y + 148), mono, (255, 255, 255, 200), 10, anchor="mt")

    foil = foil_overlay((w, h))
    pack = Image.alpha_composite(pack, foil)
    pack = Image.alpha_composite(pack, overlay)
    return pack


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)
    print(f"wrote {path} {image.size} {image.mode}")


def main() -> None:
    ensure_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pass_img = render_hoodpass()
    pack_img = render_hoodpack()
    save_png(pass_img, OUT_DIR / "hoodpass.png")
    save_png(pack_img, OUT_DIR / "hoodpack.png")
    save_png(pass_img, IMAGES / "hoodpass.png")
    save_png(pack_img, IMAGES / "hoodpack.png")


if __name__ == "__main__":
    main()
