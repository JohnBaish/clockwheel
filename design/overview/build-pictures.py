# Writes pictures.html, the pictures half of the baish.net overview (README.md here), from the pictures in img/.
# python3 -I build-pictures.py
# The captions name things that change (dates, figures, the time the pictures were taken): check every one against its
# picture after a new capture. The style is copied from the October 2026 overview's look.
import os
HERE = os.path.dirname(os.path.abspath(__file__))
TAKEN = 'Sunday November 1st 2026'
TAKEN_AT = 'about 2.30pm'

STYLE = """
@font-face { font-family: Caprasimo; font-weight: 400; src: url('../../node_modules/@fontsource/caprasimo/files/caprasimo-latin-400-normal.woff2'); }
@font-face { font-family: Figtree; font-weight: 400; src: url('../../node_modules/@fontsource/figtree/files/figtree-latin-400-normal.woff2'); }
@font-face { font-family: Figtree; font-weight: 600; src: url('../../node_modules/@fontsource/figtree/files/figtree-latin-600-normal.woff2'); }
@font-face { font-family: Figtree; font-weight: 700; src: url('../../node_modules/@fontsource/figtree/files/figtree-latin-700-normal.woff2'); }
@page { size: A4; margin: 0; }
:root { --bg:#f5ead8; --surface:#ebddc5; --ink:#201e1d; --accent:#c67139; --accent7:#8c491a; --muted:#645c50; --line:rgba(32,30,29,.16); }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; }
body { font: 400 9.6pt/1.45 Figtree, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 13mm 14mm 12mm; position: relative; overflow: hidden; break-after: page; background: #fff; }
.page:last-child { break-after: auto; }
.folio { position: absolute; bottom: 6mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 1.5mm; }
h1, h2, h3 { font-family: Caprasimo, serif; font-weight: 400; margin: 0; }
h1 { font-size: 30pt; line-height: 1.1; }
h2 { font-size: 19pt; line-height: 1.15; margin-bottom: 1mm; }
h3 { font-size: 11.5pt; margin: 3.2mm 0 1mm; }
.kicker { font-size: 7.5pt; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 1.5mm; }
.lede { font-size: 10.5pt; color: var(--muted); margin: 1mm 0 2mm; }
p { margin: 0 0 1.6mm; }
ul { margin: 0 0 1.6mm; padding-left: 4.5mm; }
li { margin: 0 0 .6mm; }
b, strong { font-weight: 700; }
.box { background: var(--bg); border-radius: 3mm; padding: 3mm 4mm; margin: 2mm 0; }
.box h3 { margin-top: 0; }
table { border-collapse: collapse; width: 100%; margin: 1mm 0 2mm; }
th { text-align: left; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 600; border-bottom: 1px solid var(--line); padding: 1mm 1.5mm; }
td { border-bottom: 1px solid var(--line); padding: 1mm 1.5mm; vertical-align: top; font-size: 10pt; }
.fav { display: inline-flex; align-items: center; gap: 2mm; margin-right: 4mm; font-size: 8pt; }
.fav img { width: 9mm; height: 9mm; }
figure { margin: 0 0 3mm; }
figure img { display: block; width: 100%; border: 1px solid var(--line); border-radius: 1.5mm; }
figcaption { font-size: 8pt; color: var(--muted); margin-top: 1.2mm; line-height: 1.35; }
figcaption b { color: var(--ink); }
.strips { display: flex; gap: 2.5mm; align-items: flex-start; }
.strips img { border: 1px solid var(--line); border-radius: 1.5mm; display: block; }
.row { display: flex; gap: 5mm; align-items: flex-start; }
.note { font-size: 8pt; color: var(--muted); }
.sample { display: inline-block; font-size: 6.8pt; letter-spacing: .08em; text-transform: uppercase; background: #ffe1d0; color: #643312; border-radius: 99px; padding: 0 1.8mm; font-weight: 700; }
.real { background: #e1eecc; color: #3d472b; }
"""

SITES = [('baish', 'baish.net (hub)'), ('backtimer', 'Backtimer'), ('clockmaker', 'Clockmaker'), ('flowcharter', 'Flowcharter'),
         ('hindcaster', 'Hindcaster'), ('lightreader', 'Lightreader'), ('refueller', 'Refueller')]

pages, toc, count = [], [], [0]


def badge(tag):
    return {'sample': '<span class="sample">sample</span> ', 'real': '<span class="sample real">real</span> '}.get(tag, '')


def fig(src, cap, style='', tag=''):
    count[0] += 1
    return f'<figure style="{style}"><img src="img/{src}"><figcaption><b>Fig {count[0]}.</b> {badge(tag)}{cap}</figcaption></figure>'


def strips(names, w, cap, style='', tag=''):
    count[0] += 1
    imgs = ''.join(f'<img src="img/{x}" style="width:{w}mm">' for x in names)
    return (f'<div style="{style}"><div class="strips">{imgs}</div><p class="note" style="margin-top:1.2mm">'
            f'<b style="color:var(--ink)">Fig {count[0]}.</b> {badge(tag)}{cap}</p></div>')


def page(kicker, body, folio):
    pages.append(f'<section class="page">\n  <div class="kicker">{kicker}</div>\n{body}\n'
                 f'  <div class="folio"><span>baish.net pictures · {folio}</span><span>{{PAGE}}</span></div>\n</section>')


def section(name):
    toc.append((name, len(pages) + 2))


section('baish.net (hub)')
page('baish.net · the hub', '<div class="row">'
     + fig('hub-desktop.jpg', 'The hub on a computer (1440px). Six tools in alphabetical order, then John\'s blog.', 'flex:0 0 125mm')
     + fig('hub-phone.jpg', 'The hub on a phone (390px), first screen.', 'flex:0 0 46mm') + '</div>', 'Hub')

section('Backtimer')
page('Backtimer · a running order, and a first visit',
     fig('bt-working-desktop.jpg', 'A running order to the news at 60:00 (1440px): seven items totalling 17:15, from "Station ident" '
         '(starts 59:52) back to "Song" (42:45).', '', 'sample')
     + '<div class="row">' + fig('bt-first-desktop.jpg', 'A first visit: the getting-started walkthrough, step 1 of 4, under the empty list.', 'flex:0 0 116mm')
     + strips(['bt-working-phone-s1.jpg', 'bt-working-phone-s2.jpg'], 29, 'The running order on a phone (full page, two strips, read left to right).',
              'flex:0 0 62mm', 'sample') + '</div>', 'Backtimer')

section('Clockmaker')
page('Clockmaker · the Example clock',
     fig('cm-clock-desktop.jpg', 'The Clock screen (1440px): the built-in Example clock for 10:00, 18 segments adding up to exactly 60:00 '
         '("balanced", 8 songs), with callouts for the short items.')
     + '<div class="row">' + fig('cm-clock-phone.jpg', 'The same clock on a phone (first screen).', 'flex:0 0 46mm')
     + fig('cm-list-desktop.jpg', 'The Example clock as a List: times worked out from 10:00, category pills, durations in outlined boxes.', 'flex:1')
     + '</div>', 'Clockmaker')
page('Clockmaker · Week and the Guide',
     fig('cm-week-desktop.jpg', 'Week ("Schedule"), with the Example clock given to 10:00 and 11:00 on weekdays; hatched cells are inactive hours.',
         'width:150mm', 'sample')
     + fig('cm-guide-desktop.jpg', 'The Guide, shown on a first visit: John\'s own text, a section per screen, and "About Clockmaker".', 'width:100mm'),
     'Clockmaker')

section('Flowcharter')
page('Flowcharter · a chart from a short list', '<div class="row"><div style="flex:1">'
     + fig('fc-chart-desktop.jpg', '"Booking a table" drawn from an eight-row list (1440px). Automatic chose Down; the question\'s "No" loops back.',
           '', 'sample')
     + '<div class="row">' + fig('fc-list-desktop.jpg', 'The list behind it: text, shape and where each row goes.', 'flex:1', 'sample')
     + fig('fc-steps-desktop.jpg', '"New chart": step by step on cards, or a blank list.', 'flex:1') + '</div></div>'
     + '<div style="flex:0 0 40mm">' + fig('fc-chart-phone.jpg', 'The chart on a phone (full page).', '', 'sample') + '</div></div>',
     'Flowcharter')

section('Hindcaster')
page('Hindcaster · results for a postcode (1 of 2)',
     fig('hc-rg4-desktop-part1.jpg', 'Postcode district RG4 (Caversham, Reading), Saturday October 31st, final update at 9.30am on November 1st '
         '(1440px, top half): the Summary, the three stations chosen round the postcode, and the nearest rain gauges.', 'width:170mm', 'real'),
     'Hindcaster')
page('Hindcaster · results for a postcode (2 of 2)',
     fig('hc-rg4-desktop-part2.jpg', 'RG4, bottom half: "Compared with a year ago", "About these figures" and the footer.', 'width:170mm', 'real'),
     'Hindcaster')
page('Hindcaster · on a phone', strips([f'hc-rg4-phone-s{i}.jpg' for i in range(1, 5)], 42,
                                       'RG4 on a phone (full page, four strips, read left to right).', '', 'real'), 'Hindcaster')
page('Hindcaster · choosing a place, and a county',
     fig('hc-chooser-desktop.jpg', 'The chooser a first-time visitor sees: postcode, county or region, or all of England.', 'width:130mm')
     + strips(['hc-county-desktop-s1.jpg', 'hc-county-desktop-s2.jpg'], 89,
              'Berkshire, an area view (1440px, two strips): highest, middle and lowest for each measure, then rainfall across the county.',
              '', 'real'), 'Hindcaster')

section('Lightreader')
page('Lightreader · a postcode, today (1 of 2)',
     fig('lr-rg4-desktop-part1.jpg', 'RG4 (Caversham) at 14:29 on Sunday November 1st (1440px, top half): today\'s sunrise and sunset, the next '
         '24 hours as a ribbon of light, then sentence cards (Today, This fortnight, Looking back, Looking ahead and more).', 'width:165mm', 'real'),
     'Lightreader')
page('Lightreader · a postcode, through the year (2 of 2)',
     fig('lr-rg4-desktop-part2.jpg', 'RG4, bottom half: Compare, "The year in light" (each day\'s light across a year), Pace of change, Day by day, '
         '"About these figures" and the footer.', 'width:165mm', 'real'), 'Lightreader')
page('Lightreader · on a phone, and a first visit',
     strips([f'lr-rg4-phone-s{i}.jpg' for i in range(1, 5)], 42,
            'RG4 on a phone (full page, four strips): on a phone the ribbon runs downwards, with true night folded.', '', 'real')
     + fig('lr-first-desktop.jpg', 'A first visit, before a postcode is chosen.', 'width:110mm;margin-top:3mm'), 'Lightreader')

section('Refueller')
page('Refueller · eight stations near a postcode (1 of 2)',
     fig('rf-rg4-desktop-part1.jpg', 'RG4 (Caversham), prices from the 10.15am collection on Sunday November 1st (1440px, top half): the eight '
         'nearest stations with unleaded and diesel prices, how long each price has stood, where it sits among the eight, and opening hours.',
         'width:170mm', 'real'), 'Refueller')
page('Refueller · the wider picture and the journey planner (2 of 2)',
     fig('rf-rg4-desktop-part2.jpg', 'RG4, bottom half: "The wider picture" (average prices for these stations, RG postcodes and Great Britain), '
         'the journey planner, "About these figures" and the footer.', 'width:170mm', 'real'), 'Refueller')
page('Refueller · on a phone', '<div class="row">'
     + strips([f'rf-rg4-phone-s{i}.jpg' for i in range(1, 5)], 33, 'RG4 on a phone (full page, four strips): one card per station.',
              'flex:0 0 141mm', 'real')
     + '<div style="flex:1">' + fig('rf-calc-phone.jpg', '"Worth driving here?" open on a phone: is a cheaper station worth the extra miles?',
                                    '', 'real') + '</div></div>', 'Refueller')
page('Refueller · a journey, and a first visit',
     fig('rf-journey-desktop-part1.jpg', 'Wokingham to Horsham (1440px, top half): the route described in a sentence, the cheapest stations close '
         'to it in the order you\'d reach them, and the cheapest near each end.', 'width:150mm', 'real')
     + fig('rf-start-desktop.jpg', 'A first visit: the postcode or place box, and the journey planner below.', 'width:110mm'), 'Refueller')

section('Dark mode')
count[0] += 1
dark = [('hub', 'the hub'), ('bt', 'Backtimer'), ('cm', 'Clockmaker'), ('fc', 'Flowcharter'), ('hc', 'Hindcaster'), ('lr', 'Lightreader'),
        ('rf', 'Refueller')]
cells = ''.join(f'<figure style="flex:0 0 41mm;margin:0"><img src="img/dark-{k}.jpg"><figcaption>{label}</figcaption></figure>' for k, label in dark)
page('Dark mode on every site',
     '<h2>Dark mode</h2><p class="lede">Since October 29th every site has a dark mode that follows the phone or computer\'s own setting until '
     'the visitor uses the switch at the top right. Each site\'s main screen on a phone, with the device set to dark.</p>'
     f'<div class="row" style="flex-wrap:wrap;gap:4mm">{cells}</div><p class="note" style="margin-top:2mm"><b style="color:var(--ink)">'
     f'Fig {count[0]}.</b> The same pages as in the light pictures, first screen only.</p>', 'Dark mode')

section('Icons and link previews')
favs = ''.join(f'<span class="fav"><img src="img/fav-{k}.svg">{name}</span>' for k, name in SITES)
ogs = ''.join(f'<figure style="flex:0 0 80mm;margin:0 0 1mm"><img src="img/og-{k}.png"><figcaption>{name}</figcaption></figure>' for k, name in SITES)
page('Icons and link previews',
     '<h2>Icons and link previews</h2><p class="lede">Each site\'s favicon (the icon in a browser tab) and the picture shown when its address '
     f'is shared, as served by the live sites.</p><div class="row" style="flex-wrap:wrap;margin:2mm 0 4mm">{favs}</div>'
     f'<div class="row" style="flex-wrap:wrap;gap:3mm 6mm">{ogs}</div>', 'Icons')

# The cover, last, so the page numbers are known.
ranges = []
for i, (name, first) in enumerate(toc):
    last = toc[i + 1][1] - 1 if i + 1 < len(toc) else len(pages) + 1
    ranges.append((name, str(first) if first == last else f'{first}–{last}'))
rows = ''.join(f'<tr><td><b>{name}</b></td><td>{p}</td></tr>' for name, p in ranges)
favrow = ''.join(f'<span class="fav"><img src="img/fav-{k}.svg">{name.split(" ")[0]}</span>' for k, name in SITES)
cover = f'''<section class="page">
  <div class="kicker">Pictures · {TAKEN}</div>
  <h1>baish.net in pictures</h1>
  <p class="lede" style="font-size:13pt">Screenshots of John Baish's seven sites, on a computer and on a phone. The words (what each site is for,
  how it works, how it's built and where it stands) are in the companion text file, <b>baish-net-overview.md</b>.</p>
  <div class="row" style="margin:3mm 0 4mm;flex-wrap:wrap">{favrow}</div>
  <table><tr><th>Section</th><th>Pages</th></tr>{rows}</table>
  <div class="box">
    <h3>How the pictures were made</h3>
    <ul>
      <li><b>From the live sites</b>, on {TAKEN} at {TAKEN_AT}, in Chromium.</li>
      <li><b>Sizes:</b> computer at 1440px wide; phone at 390px wide with touch. Very tall pages are cut into halves (one per page) or into
      strips shown side by side, read left to right.</li>
      <li><b>Content:</b> pictures marked <span class="sample">sample</span> use content typed in for the picture (a running order, a week, a
      flowchart). Clockmaker's clock is its built-in Example. Pictures marked <span class="sample real">real</span> show the sites' real
      figures at the time: Hindcaster's final update for Saturday October 31st, Lightreader's times for Caversham (RG4), and Refueller's
      prices from the 10.15am collection.</li>
      <li><b>Checks:</b> no page errors and no sideways scrolling on any picture, and the brand fonts loaded every time.</li>
      <li><b>Light mode</b> throughout, apart from the dark-mode page near the end.</li>
    </ul>
  </div>
  <div class="folio"><span>baish.net pictures</span><span>1</span></div>
</section>'''

body = '\n'.join([cover] + [p.replace('{PAGE}', str(i + 2)) for i, p in enumerate(pages)])
html = f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>baish.net in pictures</title>
<!-- The pictures half of the baish.net overview (README.md here). Made by build-pictures.py: edit that, not this file. -->
<style>{STYLE}</style>
</head>
<body>
{body}
</body>
</html>
'''
open(os.path.join(HERE, 'pictures.html'), 'w').write(html)
print(f'{len(pages) + 1} pages, {count[0]} figures')
