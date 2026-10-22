# Splits very tall screenshots into strips and saves them as JPEGs in img/.
# python3 -I prep.py <screenshots folder> <img folder>
import sys, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
# name -> (number of strips, crop range or None)
spec = {
 'hc-rg4-phone': 3, 'fc-guide-phone': 2, 'cm-guide-phone': 2, 'cm-list-phone': 2,
 'hc-berkshire-desktop': 2, 'fc-list-phone': 2,
}
crops = {'hc-rg4-desktop': [(0, 1400), (1400, 2797)]}
for f in sorted(os.listdir(src)):
    n = f[:-4]; im = Image.open(os.path.join(src, f)).convert('RGB')
    w, h = im.size
    if n in crops:
        for i, (a, b) in enumerate(crops[n]):
            im.crop((0, a, w, b)).save(f'{out}/{n}-part{i+1}.jpg', quality=84, optimize=True)
    k = spec.get(n, 1)
    if k == 1:
        im.save(f'{out}/{n}.jpg', quality=84, optimize=True); continue
    step = -(-h // k); ov = 40
    for i in range(k):
        a = max(0, i*step - (ov if i else 0)); b = min(h, (i+1)*step)
        im.crop((0, a, w, b)).save(f'{out}/{n}-s{i+1}.jpg', quality=84, optimize=True)
