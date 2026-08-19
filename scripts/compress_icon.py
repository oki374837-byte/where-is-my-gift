from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/worldquest-ar-icon.png')
output_dir = Path('/home/ubuntu/worldquest-ar/assets/images')
img = Image.open(source).convert('RGBA')
for name, size in {
    'icon.png': 512,
    'splash-icon.png': 512,
    'favicon.png': 256,
    'android-icon-foreground.png': 512,
}.items():
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(output_dir / name, format='PNG', optimize=True, compress_level=9)
