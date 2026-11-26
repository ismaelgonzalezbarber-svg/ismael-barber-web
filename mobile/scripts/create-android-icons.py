from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ANDROID = ROOT / "mobile" / "android" / "app" / "src" / "main" / "res"
SOURCE = ROOT / "logo-ismael.png"

if not SOURCE.exists():
    raise SystemExit(f"No se encuentra el logotipo oficial: {SOURCE}")

logo = Image.open(SOURCE).convert("RGBA")

def make_canvas(size, transparent=False, inset=0.16):
    bg = (0, 0, 0, 0) if transparent else (13, 13, 13, 255)
    canvas = Image.new("RGBA", (size, size), bg)
    max_side = int(size * (1 - inset * 2))
    mark = logo.copy()
    mark.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - mark.width)//2, (size - mark.height)//2))
    return canvas

# Iconos clásicos compatibles con la mayoría de lanzadores Android.
for density, size in {
    "mdpi": 48, "hdpi": 72, "xhdpi": 96,
    "xxhdpi": 144, "xxxhdpi": 192
}.items():
    folder = ANDROID / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    make_canvas(size, inset=0.12).save(folder / "ic_launcher.png")
    make_canvas(size, inset=0.12).save(folder / "ic_launcher_round.png")

# Icono adaptativo: fondo negro y logotipo centrado dentro del área segura.
for density, size in {
    "mdpi": 108, "hdpi": 162, "xhdpi": 216,
    "xxhdpi": 324, "xxxhdpi": 432
}.items():
    folder = ANDROID / f"mipmap-{density}"
    make_canvas(size, transparent=True, inset=0.25).save(folder / "ic_launcher_foreground.png")

(ANDROID / "values").mkdir(parents=True, exist_ok=True)
(ANDROID / "values" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\\n'
    '<resources><color name="ic_launcher_background">#0D0D0D</color></resources>\\n',
    encoding="utf-8"
)
(ANDROID / "mipmap-anydpi-v26").mkdir(parents=True, exist_ok=True)
(ANDROID / "mipmap-anydpi-v26" / "ic_launcher.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\\n'
    '  <background android:drawable="@color/ic_launcher_background"/>\\n'
    '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\\n'
    '</adaptive-icon>\\n',
    encoding="utf-8"
)

# Imagen de bienvenida para el recurso splash que genera Capacitor.
drawable = ANDROID / "drawable"
drawable.mkdir(parents=True, exist_ok=True)
splash = Image.new("RGBA", (1200, 1200), (13, 13, 13, 255))
mark = logo.copy()
mark.thumbnail((760, 760), Image.Resampling.LANCZOS)
splash.alpha_composite(mark, ((1200-mark.width)//2, (1200-mark.height)//2))
splash.save(drawable / "splash.png")

print("Iconos Android y pantalla de bienvenida creados con logo-ismael.png")
