# Writes pictures.html, the pictures half of the baish.net overview (README.md here), from the pictures in img/.
# python3 -I build-pictures.py
# The captions name things that change (dates, figures, the time the pictures were taken): check every one against its
# picture after a new capture. The style is copied from the October 2026 overview's look.
import os
HERE = os.path.dirname(os.path.abspath(__file__))
TAKEN = 'Wednesday November 11th 2026'
TAKEN_AT = 'about 11.30am'

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
         ('hindcaster', 'Hindcaster'), ('lightreader', 'Lightreader'), ('nightreader', 'Nightreader'), ('refueller', 'Refueller'),
         ('riverwatcher', 'Riverwatcher'), ('roadteller', 'Roadteller')]

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
     + fig('hub-desktop.jpg', 'The hub on a computer (1440px), redesigned on November 11th: nine tools in three coloured panels, '
         '"The sky and weather", "Near you" and "Producing and planning", each with the drawing from its link-preview picture, '
         'NEW on the two newest, and John\'s blog in the footer.', 'flex:0 0 125mm')
     + fig('hub-phone.jpg', 'The hub on a phone (390px, full page): one column, small icons.', 'flex:0 0 46mm') + '</div>', 'Hub')

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
     fig('hc-rg4-desktop-part1.jpg', 'Postcode district RG4 (Caversham, Reading), Tuesday November 10th, from Wednesday\'s final update at 9.30am '
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
     fig('lr-rg4-desktop-part1.jpg', 'RG4 (Caversham) at 11:29 on Wednesday November 11th (1440px, top half): today\'s sunrise and sunset, the next '
         '24 hours as a ribbon of light, then sentence cards (Today, This fortnight, Looking back, Looking ahead and more).', 'width:165mm', 'real'),
     'Lightreader')
page('Lightreader · a postcode, through the year (2 of 2)',
     fig('lr-rg4-desktop-part2.jpg', 'RG4, bottom half: Compare, "The year in light" (each day\'s light across a year), Pace of change, Day by day, '
         '"About these figures" and the footer.', 'width:165mm', 'real'), 'Lightreader')
page('Lightreader · on a phone, and a first visit',
     strips([f'lr-rg4-phone-s{i}.jpg' for i in range(1, 5)], 42,
            'RG4 on a phone (full page, four strips): on a phone the ribbon runs downwards, with true night folded.', '', 'real')
     + fig('lr-first-desktop.jpg', 'A first visit, before a postcode is chosen.', 'width:110mm;margin-top:3mm'), 'Lightreader')

section('Nightreader')
page('Nightreader · tonight\'s sky (1 of 2)',
     fig('nr-rg4-desktop-part1.jpg', 'RG4 (Caversham), tonight, Wednesday November 11th into Thursday (1440px, top half): 11h 4m of Moon-free '
         'true night, from 18:16 to 05:20, beside the Moon at its true phase; "The sky tonight" (the heights of the Moon and planets through '
         'the night); and "Where and when to look", the view south with real stars and the towns along the horizon. Dark for everyone, its '
         'own look.', 'width:140mm', 'real'), 'Nightreader')
page('Nightreader · the year in darkness (2 of 2)',
     fig('nr-rg4-desktop-part2.jpg', 'RG4, bottom half: "The year in darkness" (every night for a year, with moonlight as pale slanting bands), '
         '"Looking ahead" (meteor showers, the Moon\'s phases, eclipses), "About these figures" and the footer.', 'width:140mm', 'real'),
     'Nightreader')
page('Nightreader · on a phone, and a first visit',
     strips([f'nr-rg4-phone-s{i}.jpg' for i in range(1, 5)], 42,
            'RG4 on a phone (full page, four strips, read left to right).', '', 'real')
     + fig('nr-first-desktop.jpg', 'A first visit, before a postcode is chosen.', 'width:110mm;margin-top:3mm'), 'Nightreader')

section('Refueller')
page('Refueller · eight stations near a postcode (1 of 2)',
     fig('rf-rg4-desktop-part1.jpg', 'RG4 (Caversham), prices from the 10.15am collection on Wednesday November 11th (1440px, top half): the eight '
         'nearest stations with unleaded and diesel prices, how long each price has stood, where it sits among the eight, and opening hours.',
         'width:170mm', 'real'), 'Refueller')
page('Refueller · the wider picture and the journey planner (2 of 2)',
     fig('rf-rg4-desktop-part2.jpg', 'RG4, bottom half: "The wider picture" (average prices for these eight, their council area, county, region and country, and Great Britain, each with a fact), '
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

section('Riverwatcher')
page('Riverwatcher · river levels near a postcode (1 of 2)',
     fig('rw-rg4-desktop-part1.jpg', 'RG4 (Caversham), levels updated at 11.10am on Wednesday November 11th (1440px, top half): the summary river '
         'by river, then the nearest gauges grouped by river and listed upstream to downstream, the nearest (Reading) open in detail '
         'just below it, with its chart against the bands for the time of year, a year ago and its record.', 'width:170mm', 'real'), 'Riverwatcher')
page('Riverwatcher · river levels near a postcode (2 of 2)',
     fig('rw-rg4-desktop-part2.jpg', 'RG4, bottom half: the Kennet and the Loddon (the Loddon at Twyford added as the nearest free-flowing '
         'gauge), then "About these figures" and the footer.', 'width:170mm', 'real'), 'Riverwatcher')
page('Riverwatcher · on a phone', strips([f'rw-rg4-phone-s{i}.jpg' for i in range(1, 5)], 42,
                                         'RG4 on a phone (full page, four strips, read left to right).', '', 'real'), 'Riverwatcher')
page('Riverwatcher · choosing a place, a county and England',
     '<div class="row">' + fig('rw-chooser-desktop.jpg', 'The chooser: a postcode, a county or region, or all of England.', 'flex:1')
     + fig('rw-england-desktop.jpg', 'England (first screen): the summary count and the most unusual high and low gauges, ranked by how long '
           'since each was last this high or low.', 'flex:1', 'real') + '</div>'
     + fig('rw-county-desktop-part1.jpg', 'Berkshire (1440px, top half): the summary, the most unusual gauges, and every gauge in the county '
           'folded away.', 'width:150mm', 'real'), 'Riverwatcher')

section('Roadteller')
page('Roadteller · a circle round a postcode (1 of 2)',
     fig('rd-rg14-desktop-part1.jpg', 'A mile round the middle of RG14 (Newbury), injury collisions from 2021 to 2025 (1440px, top half): 129 '
         'collisions and 146 people hurt, beside West Berkshire\'s rate on its A-roads and motorways (one for every 14.0 million miles '
         'driven, about a third of Great Britain\'s); "Better or worse than before?" against Great Britain since 2000; who was hurt; and '
         'when.', 'width:150mm', 'real'), 'Roadteller')
page('Roadteller · where, and which roads (2 of 2)',
     fig('rd-rg14-desktop-part2.jpg', 'RG14, bottom half: "Where they happened", a map of 250-metre squares shaded by count; the main roads '
         'through the circle, each with its rate; "About these figures" and the footer.', 'width:150mm', 'real'), 'Roadteller')
page('Roadteller · on a phone, and a first visit',
     strips([f'rd-rg14-phone-s{i}.jpg' for i in range(1, 5)], 42,
            'RG14 on a phone (full page, four strips, read left to right).', '', 'real')
     + fig('rd-start-desktop.jpg', 'A first visit: a postcode or place, or a council area.', 'width:110mm;margin-top:3mm'), 'Roadteller')
page('Roadteller · a council area',
     strips(['rd-council-desktop-part1.jpg', 'rd-council-desktop-part2.jpg'], 89,
            'West Berkshire (1440px, two strips): its rate on A-roads and motorways against Great Britain and South East England, '
            '"Allowing for the mix of roads", the trend, who and when, a map in one-kilometre squares, and its roads.', '', 'real'),
     'Roadteller')

section('Dark mode')
count[0] += 1
dark = [('hub', 'the hub'), ('bt', 'Backtimer'), ('cm', 'Clockmaker'), ('fc', 'Flowcharter'), ('hc', 'Hindcaster'), ('lr', 'Lightreader'),
        ('nr', 'Nightreader (always dark)'), ('rf', 'Refueller'), ('rw', 'Riverwatcher'), ('rd', 'Roadteller')]
cells = ''.join(f'<figure style="flex:0 0 33mm;margin:0"><img src="img/dark-{k}.jpg"><figcaption>{label}</figcaption></figure>' for k, label in dark)
page('Dark mode on every site',
     '<h2>Dark mode</h2><p class="lede">Since October 29th every site has a dark mode that follows the phone or computer\'s own setting until '
     'the visitor uses the switch at the top right. Each site\'s main screen on a phone, with the device set to dark.</p>'
     f'<div class="row" style="flex-wrap:wrap;gap:4mm">{cells}</div><p class="note" style="margin-top:2mm"><b style="color:var(--ink)">'
     f'Fig {count[0]}.</b> The same pages as in the light pictures, first screen only.</p>', 'Dark mode')

section('Icons and link previews')
favs = ''.join(f'<span class="fav"><img src="img/fav-{k}.svg">{name}</span>' for k, name in SITES)
ogs = ''.join(f'<figure style="flex:0 0 56mm;margin:0 0 1mm"><img src="img/og-{k}.png"><figcaption>{name}</figcaption></figure>' for k, name in SITES)
page('Icons and link previews',
     '<h2>Icons and link previews</h2><p class="lede">Each site\'s favicon (the icon in a browser tab) and the picture shown when its address '
     f'is shared, as served by the live sites.</p><div class="row" style="flex-wrap:wrap;margin:2mm 0 4mm">{favs}</div>'
     f'<div class="row" style="flex-wrap:wrap;gap:3mm 6mm">{ogs}</div>', 'Icons')

# The private sites: behind Cloudflare Access, so built from their repos and photographed locally (capture-private.mjs).
PRIVATE = [('tenniserver', 'Tenniserver'), ('motoracer', 'Motoracer')]
PRIVATE_TAKEN = 'Thursday November 12th 2026'
COVER_DATE = 'November 11th and 12th 2026'  # the cover's kicker: the dates the pictures were taken


def looks(pre, names, cap):
    count[0] += 1
    cells = ''.join(f'<figure style="flex:0 0 40mm;margin:0"><img src="img/{pre}-look-{k}-{m}.jpg"><figcaption>{n}, {m}</figcaption></figure>'
                    for k, n in names for m in ('light', 'dark'))
    return (f'<div class="row" style="flex-wrap:wrap;gap:3mm 6mm">{cells}</div><p class="note" style="margin-top:1.5mm">'
            f'<b style="color:var(--ink)">Fig {count[0]}.</b> {cap}</p>')


section('Tenniserver (private)')
page('Tenniserver · a private site · Today and Results', '<div class="row">'
     + fig('ts-today-desktop.jpg', 'Today, Thursday November 12th, from the 10am update (1440px): the WTA Finals at Indian Wells, two group '
           'matches in UK time, each tournament in its surface\'s colour (Court look, light).', 'flex:0 0 125mm', 'real')
     + fig('ts-today-phone.jpg', 'Today on a phone (first screen).', 'flex:0 0 46mm', 'real') + '</div>'
     + fig('ts-results-desktop.jpg', 'Results, the last two days: the WTA Finals group matches on Wednesday and Tuesday, the winner marked with '
           'a ball and the sets she won filled in.', 'width:150mm', 'real'), 'Tenniserver')
page('Tenniserver · the calendar and the rankings', '<div class="row">'
     + fig('ts-year-desktop.jpg', 'The calendar\'s year view (1440px): every event from now to the end of 2027, a line per month, coloured by '
           'type; men\'s 1000s and 500s in the full colour, women\'s paler, a week with both split; the upright line is today. List and '
           'Month views sit beside it.', 'flex:0 0 125mm', 'real')
     + fig('ts-year-phone.jpg', 'The year view on a phone (first screen).', 'flex:0 0 46mm', 'real') + '</div>'
     + fig('ts-rankings-desktop.jpg', 'Rankings (first screen): the WTA top 50 published on Monday November 9th, with country, points and '
           'movement; Men and By surname are one tap away.', 'width:115mm', 'real'), 'Tenniserver')
page('Tenniserver · the six looks',
     '<h2>Six looks</h2><p class="lede">Three looks, each light and dark, chosen with the three icons and the "… look" label in the header; '
     'each phone remembers its own choice. Results on a phone, first screen.</p>'
     + looks('ts', [('a', 'Court'), ('b', 'Order of play'), ('c', 'Clubhouse')],
             'Court (surface colours, pale boxes in light mode), Order of play (like a printed order of play) and Clubhouse (soft cards, lilac).')
     + '<div class="row" style="margin-top:4mm;align-items:center"><span class="fav"><img src="img/fav-tenniserver.svg">Tab icon</span>'
     + '<figure style="flex:0 0 56mm;margin:0"><img src="img/og-tenniserver.png"><figcaption>Link-preview picture</figcaption></figure></div>',
     'Tenniserver')

section('Motoracer (private)')
page('Motoracer · a private site · the spoiler question and Next race', '<div class="row">'
     + fig('mr-ask-phone.jpg', 'A first visit on Thursday November 12th: São Paulo\'s qualifying and race have happened, so the phone is asked '
           'before anything else shows.', 'flex:0 0 46mm', 'real')
     + fig('mr-weekend-desktop.jpg', 'Next race, after "No, show both" (1440px, Timing screen look, light): Las Vegas, its sessions in UK time '
           '(all overnight), the circuit since 2023 (its outline traced from car positions, 1st of 21 for overtaking, a safety car in one of '
           'its three races), and the last race.', 'flex:0 0 125mm', 'real') + '</div><div class="row">'
     + strips(['mr-weekend-phone-s1.jpg', 'mr-weekend-phone-s2.jpg'], 38, 'Next race on a phone (full page, two strips).', 'flex:0 0 80mm', 'real')
     + fig('mr-results-desktop.jpg', 'Results: the São Paulo Grand Prix in full, with grid, places gained or lost, gap and points; '
           'practice and qualifying a tap away.', 'flex:1', 'real') + '</div>', 'Motoracer')
page('Motoracer · the championships', '<div class="row">'
     + fig('mr-champs-desktop.jpg', 'Championships after round 20 of 23 (1440px): drivers and teams, with movement, poles, podiums, wins and '
           'points, every heading sortable, and the title line ("Kimi Antonelli can no longer be caught").', 'flex:0 0 105mm', 'real')
     + '<div style="flex:1">'
     + fig('mr-season-desktop.jpg', 'Tap a driver for their season race by race: Antonelli\'s grid, finish, places gained or lost and points '
           '(S where a sprint\'s points are included).', '', 'real')
     + fig('mr-season-phone.jpg', 'The same on a phone, rising from the bottom.', 'width:46mm', 'real') + '</div></div>', 'Motoracer')
page('Motoracer · the calendar and team-mates',
     fig('mr-year-desktop.jpg', 'The calendar\'s year view for 2026, coloured by overtaking: each circuit ranked by real passes in its races '
         'since 2023, in four groups (it can also be coloured by UK time of day, or by sprint weekends).', 'width:140mm', 'real')
     + fig('mr-mates-desktop.jpg', 'Team-mates (first screen): who qualified ahead, who finished ahead, and points, team by team, the first '
           'driver solid in the team colour and the second pale.', 'width:140mm', 'real'), 'Motoracer')
page('Motoracer · the six looks',
     '<h2>Six looks</h2><p class="lede">Three looks, each light and dark, chosen as in Tenniserver; each phone remembers its own. Next race on '
     'a phone, first screen.</p>'
     + looks('mr', [('a', 'Timing screen'), ('b', 'Race programme'), ('c', 'Grid')],
             'Timing screen, Race programme (like a printed race-day programme) and Grid (bold, with tinted boxes).')
     + '<div class="row" style="margin-top:4mm;align-items:center"><span class="fav"><img src="img/fav-motoracer.svg">Tab icon '
       '(the start lights)</span><span class="note">No link-preview picture.</span></div>', 'Motoracer')

# The cover, last, so the page numbers are known.
ranges = []
for i, (name, first) in enumerate(toc):
    last = toc[i + 1][1] - 1 if i + 1 < len(toc) else len(pages) + 1
    ranges.append((name, str(first) if first == last else f'{first}–{last}'))
rows = ''.join(f'<tr><td><b>{name}</b></td><td>{p}</td></tr>' for name, p in ranges)
favrow = ''.join(f'<span class="fav"><img src="img/fav-{k}.svg">{name.split(" ")[0]}</span>' for k, name in SITES + PRIVATE)
cover = f'''<section class="page">
  <div class="kicker">Pictures · {COVER_DATE}</div>
  <h1>baish.net in pictures</h1>
  <p class="lede" style="font-size:13pt">Screenshots of John Baish's ten public sites and his two private
  ones, on a computer and on a phone. The words (what each site is for,
  how it works, how it's built and where it stands) are in the companion text file, <b>baish-net-overview.md</b>.</p>
  <div class="row" style="margin:3mm 0 4mm;flex-wrap:wrap">{favrow}</div>
  <table><tr><th>Section</th><th>Pages</th></tr>{rows}</table>
  <div class="box">
    <h3>How the pictures were made</h3>
    <ul>
      <li><b>The public sites</b>, from the live sites on {TAKEN} at {TAKEN_AT}, in Chromium.</li>
      <li><b>Sizes:</b> computer at 1440px wide; phone at 390px wide with touch. Very tall pages are cut into halves (one per page) or into
      strips shown side by side, read left to right.</li>
      <li><b>Content:</b> pictures marked <span class="sample">sample</span> use content typed in for the picture (a running order, a week, a
      flowchart). Clockmaker's clock is its built-in Example. Pictures marked <span class="sample real">real</span> show the sites' real
      figures at the time: Hindcaster's final update for Tuesday November 10th, Lightreader's and Nightreader's times for Caversham
      (RG4), Refueller's prices from the 10.15am collection, Riverwatcher's levels from the 11.10am update, and Roadteller's collision
      figures for 2021 to 2025.</li>
      <li><b>Tenniserver and Motoracer</b> (private, behind a sign-in): built from their repos on {PRIVATE_TAKEN}, with the real
      data saved there (Tenniserver's 10am update; Motoracer's of 5.50pm on November 11th).</li>
      <li><b>Checks:</b> no page errors and no sideways scrolling on any picture, and the brand fonts loaded every time.</li>
      <li><b>Light mode</b> throughout, apart from the dark-mode page and the private sites' dark looks.</li>
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
