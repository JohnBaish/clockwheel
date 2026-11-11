# Splits very tall screenshots and saves everything as JPEGs in img/ for the pictures PDF.
# python3 -I prep.py <screenshots folder> <img folder>
#   strips: tall phone pages cut into N strips shown side by side (name-s1.jpg, -s2.jpg …)
#   parts:  tall computer pages cut into N pieces shown one per page (name-part1.jpg …)
import sys, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
strips = {'bt-working-phone': 2, 'hc-rg4-phone': 4, 'hc-county-desktop': 2,
          'lr-rg4-phone': 4, 'rf-rg4-phone': 4, 'rw-rg4-phone': 4,
          'nr-rg4-phone': 4, 'rd-rg14-phone': 4}
parts = {'hc-rg4-desktop': 2, 'lr-rg4-desktop': 2, 'rf-rg4-desktop': 2, 'rf-journey-desktop': 2,
         'rw-rg4-desktop': 2, 'rw-county-desktop': 2,
         'nr-rg4-desktop': 2, 'rd-rg14-desktop': 2, 'rd-council-desktop': 2}
OVERLAP = 30
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'):
        continue
    n = f[:-4]
    im = Image.open(os.path.join(src, f)).convert('RGB')
    if im.size[0] == 780:  # phone pictures, drawn at twice the size: three-quarters is plenty for print
        im = im.resize((585, round(im.size[1] * 0.75)), Image.LANCZOS)
    w, h = im.size
    k = strips.get(n) or parts.get(n) or 1
    if k == 1:
        im.save(f'{out}/{n}.jpg', quality=76, optimize=True)
        continue
    step = -(-h // k)
    suffix = '-s' if n in strips else '-part'
    for i in range(k):
        a = max(0, i * step - (OVERLAP if i else 0))
        b = min(h, (i + 1) * step)
        im.crop((0, a, w, b)).save(f'{out}/{n}{suffix}{i + 1}.jpg', quality=76, optimize=True)
