# baish.net: an overview of John Baish's sites

*Written on Sunday November 1st 2026, as background for discussing themes and ideas in other chats. The pictures are in the
companion PDF, "baish.net in pictures" (`baish-net-pictures-2026-11-01.pdf`), made the same day from the live sites.*

## How to read this

- **Seven live sites:** the hub at www.baish.net and six free tools: Backtimer, Clockmaker, Flowcharter, Hindcaster,
  Lightreader and Refueller. Each tool has its own section below, in the same order: what it's for, what it does, how it
  looks, how it's built, where it stands, and what's open.
- **Two more are being built** (not live yet): Riverwatcher and Storykeeper (see "Under way", near the end).
- **Sources:** each project's own notes (`CLAUDE.md`, `SPEC.md`, `PLAN.md`), the shared `HOUSE-STYLE.md`, John's project
  tracker, the October 22nd 2026 overview, and the live sites themselves. Colours and version numbers come from the code.
  For Flowcharter and Hindcaster, this session couldn't open their repos, so their sections come from the October overview,
  the tracker's current entries and the live sites.
- **Labelled observations:** anything that is Claude's own observation rather than something John has written down says so.

## At a glance

- **baish.net (hub)**, www.baish.net: free browser tools by John Baish, plus his old blog.
- **Backtimer**, backtimer.baish.net: "Work out exactly when each item needs to start to hit your out-time." Live since late
  September 2026.
- **Clockmaker**, clockmaker.baish.net: "Display a broadcast hour in a circular layout." Live since late September; open to
  others since early October.
- **Flowcharter**, flowcharter.baish.net: "Create a flowchart from a list, or build it step by step." Live since October
  15th.
- **Hindcaster**, hindcaster.baish.net: "Look back at yesterday's weather anywhere in England." Live for all of England
  since October 20th.
- **Lightreader**, lightreader.baish.net: "Sunrise, sunset and light-based facts for English places you choose." Live
  since October 28th.
- **Refueller**, refueller.baish.net: "Petrol and diesel prices near you, and the cheapest on your journey." Live since
  October 31st; on the hub since November 1st.

The quoted lines are each tool's own card on the hub.

---

## baish.net, the hub

**Address:** www.baish.net (the bare baish.net redirects there). Search title: "baish.net – free browser tools by John
Baish". Search description: "Free browser tools by John Baish: radio clocks, backtiming, flowcharts, yesterday's weather,
sunrise and sunset times, and fuel prices."

**Purpose and audience.** A front door for anyone who arrives at the domain rather than at a particular tool. Before
September 30th 2026 the bare domain went to John's old Blogspot blog.

**What it does.**
- Seven whole-card links, the tools in alphabetical order (Backtimer, Clockmaker, Flowcharter, Hindcaster, Lightreader,
  Refueller), then **John's Blog** (jbaish.blogspot.com: "Daily blog entries from 2006 to 2010, featuring small tech and
  retail innovations and fun things, all of them outdated now but archived for nostalgia and curiosity value.").
- Its own favicon (a lowercase "b") and link-preview picture ("baish.net — John Baish's websites").
- Search basics: title, description, canonical address, robots.txt and sitemap; one Google Search Console property covers
  the whole domain.
- Dark mode, like every site (since October 29th).
- John's standing rule: when a tool is added or changed, the hub's card, title and description are updated to match.

**How it looks.** The shared style (see "What the sites have in common"): a cream page, one centred column of rounded cards
with a terracotta hover tint, card titles in Caprasimo, descriptions in Figtree, a small "JOHN BAISH" kicker over the
"baish.net" heading.

**How it's built.** It lives in the `JohnBaish/clockwheel` repo as `landing.html`, a third entry point in the same Vite build
and Vercel project as Clockmaker and Backtimer. It is deliberately not a React app: it loads only the shared styles and the
visit-statistics script. A small Vercel Edge Middleware serves it for baish.net and www.baish.net, and gives each of that
project's domains its own robots.txt and sitemap.

**Where it stands.** Live and indexed. **Open:** making the "www." form of each tool's address work (for example
www.backtimer.baish.net doesn't load yet; it needs a DNS record and a redirect for each tool, no code); whether to retire the
old address clockwheel.baish.net (still works; its canonical points to Clockmaker).

*Observation:* the hub describes every tool in one line, without saying who each is for or grouping them. With seven tools
now, of which three (Backtimer, Clockmaker, and in part Hindcaster) were made with broadcasters in mind and four for anyone,
that is a possible theme for discussion.

---

## Backtimer

**Address:** backtimer.baish.net, and also a tab inside Clockmaker. Search title: "Backtimer – free backtiming calculator for
radio and TV".

**Purpose and audience.** Radio and TV producers and presenters who need a run of items to finish exactly on time, usually
the news at the top of the hour. You set the **out-time** and list the items before it with their durations; Backtimer works
backwards and shows when each must start. It began on September 29th 2026 as a Clockmaker screen and got its own address
the same day, because people were to try it before Clockmaker.

**What it does.**
- Out-time in minutes and seconds; "0:00" means the top of the hour and shows as 60:00.
- Items are listed latest first (the one just before the out-time at the top); each new item goes below, earlier. Start
  times are worked out live; anything before :00 reads as a time in the previous hour (for example 58:22), in terracotta,
  with a note in the header.
- **Reverse** shows the list earliest first without changing it. Drag a grip to reorder (mouse and touch).
- Total running time; Print; Clear (asks first); Import and Export of a small backup file (standalone site only).
- A four-card **first-visit walkthrough** that collects the out-time and first item, so people end with a working row.
- Phone-friendly typing: a digits keypad with "." turned into ":", "3:" read as 3:00, a full-width Add item button.
- A folded explainer ("What is backtiming?", "How do I use Backtimer?") for first-time visitors and search.
- Warns, and stops saving, if another browser tab has changed the list. Dark mode.

**How it looks.** One screen, so no menu: the bar says "Backtimer" with a "saved … ago" tag and the light/dark switch. A
table on a computer (Starts · Item · Dur); cards on a phone. Durations sit in outlined boxes so they read as editable; start
times are plain, as they're worked out. Its favicon is Clockmaker's clock reversed out (a solid terracotta disc), so the two
read as a pair.

**How it's built.** The same code as Clockmaker (`JohnBaish/clockwheel`, public): Vite, React, TypeScript, Lucide icons,
self-hosted fonts. Its own HTML page, `backtimer.html`, for its title, preview picture and favicon. One Vercel project serves
Clockmaker, Backtimer and the hub; the app checks the address and shows only Backtimer on backtimer.baish.net, so that
site's saved list is separate from Clockmaker's Backtimer tab. Work is saved only in the browser.

**Where it stands.** Live and static: nothing planned ("Awaited" in the tracker). Left alone after review: an overrun of more
than an hour wraps round the dial; the phone toolbar wraps to three lines. Not checked on a real iPhone: the keyboard.

---

## Clockmaker

**Address:** clockmaker.baish.net (called Clockwheel until September 30th 2026; that old address still works). Search title:
"Clockmaker – free radio hot clock & format clock maker".

**Purpose and audience.** Radio producers and programmers who plan the shape of a broadcast hour: the order and length of
songs, news, travel, idents and features, known as a **format clock** (also "hot clock", American; broadcast clock;
clockwheel). It was rebuilt in React from a Claude Design prototype, and John has used it at work since late September.

**What it does.**
- **Library** of clocks (open, duplicate, delete, rename), with Export and Import of the whole library as a backup.
- **List:** segments with name, category and duration; times worked out from the hour; keyboard-first (Tab, arrow keys);
  drag to reorder; a "balanced" tag when the hour adds up to 60:00, and a song count.
- **Clock:** the hour drawn as a ring, labels on the slices or as callouts with leader lines (callouts can be dragged); a
  percentage key by category.
- **Week** ("Schedule"): clocks assigned to hours of the week, hours marked active or inactive, copy and paste, tap to select
  on phones.
- **Summary** of all clocks; **Categories** to add, rename, recolour and reorder.
- **Backtimer** as a tab, and a **Guide** in John's own words, shown on a first visit.
- Print (Clock, List, Backtimer, Guide) and Copy image (the clock as a picture, brand fonts embedded).
- Each screen has its own address (#clock, #week …), so the phone's Back stays in the tool; a "safety net" shows a message
  rather than a blank page if a screen fails; a two-tab warning. Dark mode.

**How it looks.** The fullest form of the shared style; this repo holds the master copy. A nav bar with a terracotta "New
clock" button and eight links (a menu button on phones); small uppercase terracotta kickers over Caprasimo headings;
text-style action buttons top right (Print, Duplicate, Copy image, Done); the clock on a large rounded card. The Example
clock's category colours: Music `#ccdbb2`, Junction `#d67f48`, News `#000000`, Imaging `#ffe1d0`, Content `#b0a6d6`. Clock
times are 24-hour ("10:00"), a deliberate exception that suits broadcasting. Favicon: a clock at 10:10.

**How it's built.** `JohnBaish/clockwheel` (public, no licence on purpose): Vite 8, React 19, TypeScript 6, Lucide icons, fonts
self-hosted, oxlint, and `npm run check` (plain-script checks of the sums). No server: work is saved in the browser (key
`clockwheel-state-v2`, never to be renamed). Hosted on Vercel from `main`, with anonymous visit statistics.

**Where it stands.** Live. **Next (tracker):** review and improve the switch between Clock and List, possibly including the
List's title. **Left alone after the October 17th review:** some phone buttons 34–36px tall (the house rule is 44px); small
clock-face labels on phones; an hour over 60:00 draws over its own start; some deletes don't ask first; Week isn't
keyboard-friendly. **Hidden or parked:** pins (anchors) and per-segment notes, built then hidden behind switches;
per-anchor over/under timings; change history and real shareable links (would need a server). A "clear everything" button
was decided against.

*Observation:* Clockmaker is the family's origin. The shared design, house style, favicon and preview-picture recipes,
review procedure and much shared code (phone helpers, drag-to-reorder, the two-tab warning) were worked out here first.

---

## Flowcharter

**Address:** flowcharter.baish.net. Search title: "Flowcharter – free flowchart maker from a simple list". Started October
15th 2026.

**Purpose and audience.** Anyone who needs to show a fairly simple process as a flowchart (a few steps to a couple of dozen,
with the odd question and loop) without dragging boxes about. You type the steps as a list, or answer questions on cards,
and Flowcharter draws the chart to the usual conventions, based on John's guide *Flowchart Symbols: A Simple Guide*. Its
examples (booking a restaurant table) are deliberately general.

**What it does.**
- **List:** one row per step; the shape is guessed from the words (a "?" makes a question; "Start" and "End" words make a
  start or end) and can be chosen; questions have two to six answers, each with where it goes (including "+ New step");
  loops; a flag on steps nothing leads to; Undo after a delete.
- **Chart:** drawn automatically, with right-angled lines, answers on the lines, and a key of the shapes used. Direction
  Automatic (down or across, whichever fits) or chosen. Click a box or answer to change its words.
- **Step by step:** conversational cards ("What happens next?") that build the chart as you go, with the chart beside them;
  Back really undoes; switch to the List at any time.
- Library with Export and Import; Print (the paper turns to suit the chart); Copy image; Full screen for wide charts on
  phones; a Guide on a first visit; two-tab warning; Back stays in the tool; safety net. Dark mode.

**How it looks.** The shared style, with a nav bar of a terracotta "New chart" button and two links (Library, Guide) and a
List | Chart pair of tabs. The chart has its own palette: seven pale fills, each with an ink outline and ink text (at least
10:1 contrast, so a black-and-white print still reads): Start/End `#d8e6bd`, Action `#d2def2`, Question `#f4dd8e`, Data
in/out `#e4d3f0`, Standard routine `#bfe3e1`, Document `#f3cfd6`, Delay `#f7cba9`. Favicon: an ink box, a line and a
terracotta dot.

**How it's built.** `JohnBaish/flowcharter` (public): the same stack as Clockmaker plus **elkjs** (the Eclipse layout engine,
loaded only when a chart is drawn); text measured in the real font to size each shape; the list rules as plain functions
with automatic checks run on ten test charts. Saved in the browser (key `flowcharter-state-v1`); its own Vercel project.

**Where it stands.** Live and static (nothing planned). Search Console done (October 29th). **Open:** John plans to rewrite
the Guide before a wider ("semi-public") release; three review points left alone. **Parked:** moving boxes by hand. **Not
now:** swimlanes, share links, automatic connector pairs for long lines. Not checked on a real iPhone: pinch-zoom in Full
screen.

---

## Hindcaster

**Address:** hindcaster.baish.net. Search title: "Hindcaster – yesterday's weather in England". Started October 17th 2026.

**Purpose and audience.** Broadcast people who need reliable figures for yesterday and last night to read on air, and
weather enthusiasts: "what was the weather yesterday?" for anywhere in England. The Met Office's free feed keeps only 48
hours, so Hindcaster collects and keeps the readings itself. (A "hindcast" is really a forecasting term; the name plays on
"forecaster".)

**What it does.**
- **Choose a place** by postcode district, ceremonial county, region or all of England; the last choice is remembered on the
  device and kept after "#" in the address, so it never reaches a server.
- **Summary** in plain sentences: the day's and night's weather, highs and lows, rain spells, wind and gusts.
- **Weather stations** (Met Office): hourly high 9am to 9pm, wind, daytime weather and the night's low 9pm to 9am; three
  stations round a postcode, or highest, middle and lowest for an area.
- **Rainfall** (Environment Agency gauges), midnight to midnight: the nearest gauges for a postcode, or the spread for an
  area.
- **Compared with a year ago:** high, low and rain against the same places over a fortnight a year earlier, with small strip
  charts.
- **Three updates a day:** about 5.50am (early; the night marked incomplete), 9.30am (final) and 9.30pm (the day so far).
- "About these figures", print rules, clock-change notes, and checks on implausible gauge readings. Dark mode.

**How it looks.** The shared style applied to a reading page: a place bar with Change, a date heading, a Summary card, then
sections each ending in a small grey source line; tables on a computer, label-and-value cards on a phone. Chart colours:
this year `#c67139`, a year ago `#474238`, rain bars `#ffc6a5`. Favicon: a terracotta sun behind an ink cloud.

**How it's built.** `JohnBaish/hindcaster`, **private** (it stores another organisation's raw readings). The page: Vite,
React, TypeScript. A **collector** runs in GitHub Actions three times a day, started by cron-job.org (GitHub's own schedule
proved late), and commits the readings and each update to the repo; every commit makes Vercel rebuild the site. Sources: Met
Office Weather DataHub (free plan, capped below its daily limit), Environment Agency real-time rainfall (gauges checked
against the EA's quality-checked totals, re-checked monthly), MIDAS Open and the EA Hydrology archive for last year, and
Ordnance Survey open data for places. Each credited word for word, with "not connected with or endorsed by" the Met Office or
the Environment Agency. The Met Office key is a GitHub secret.

**Where it stands.** Live. **Next (tracker):** John decides what to do with 44 Met Office stations found in Scotland, Wales
and Northern Ireland; on November 2nd, check the first automatic monthly gauge re-check; by December 25th, a NOAA stand-in
for last year's temperatures until MIDAS Open publishes 2026; on January 16th 2027, renew the cron-job.org GitHub token or
the morning updates stop; reword "The night isn't over" for summer mornings. **Open:** weather for the rest of the UK;
Scotland's rain (SEPA's licence to ask about); no open rain source for Northern Ireland; whether the 9pm reading tips a day
towards "sunny"; some quirky gauge names ("near City of London"). **Parked:** Canada (a probe ran; notes on an unmerged
branch); true daily highs and lows; records; a page per county; a paid Google search-ads trial (set up and paused before any
ad ran; no Google tag on the site, so no visitor data goes to Google).

---

## Lightreader

**Address:** lightreader.baish.net. Search title: "Lightreader – sunrise, sunset and twilight times in England". Search
description: "Free sunrise, sunset and twilight times for any postcode in England: today, through the year, and compared
with dates or places you choose." Spec drafted with John on October 27th 2026; live October 28th.

**Purpose and audience.** Anyone curious about daylight where they live: when the light comes and goes today, how it is
changing, and how it compares with other dates and places. The opening line: "Check when the light comes and goes anywhere
in England, today and through the year, in UK local time."

**What it does.**
- **The top card:** today's sunrise and sunset; after sunset, today's sunset and tomorrow's sunrise; once dark, tomorrow's
  sunrise and sunset.
- **The next 24 hours** as a ribbon of light, to scale, with five kinds of light (daylight, half-light, dark, very dark, true
  night) and "Now 14:29 Light (2h 8m left)". Across the page on a computer; downwards on a phone, with long true night
  folded ("tap to extend").
- **Sentence cards**, arranged automatically on a computer: Today, This fortnight, Looking back (records), Looking ahead
  (thresholds, the shortest and longest days, the next equinox), Darkness, Across the UK (sunset and daylight at the ends of
  a short list of big places), and Direction of sunrise and sunset ("between Bracknell and Wokingham (near Bagshot)").
- **"Is it light at…?":** up to six chosen times, each with a year strip and two sentences ("Half-light lasts past 17:30 from
  February 2nd.").
- **Compare:** another date ("Christmas", "14/7", "last Friday") or place (a postcode, or a big place by name), with paired
  ribbons and sentences; saved as chips.
- **The year in light:** each day's light across a year, drag or tap a day for its times; **Pace of change** (daylight
  gained or lost each day); **Day by day** month tables, printable.
- "About these figures" and the footer appear once a postcode is chosen. Dark mode.

**How it looks.** The shared style plus five light colours used everywhere a kind of light is shown: daylight `#f2cf86`,
half-light `#d98e57`, dark `#7b6577`, very dark `#463c55`, true night `#24212f` (with their own dark-mode versions). Times
are 24-hour ("06:48"), an agreed exception to the house style. Favicon: a terracotta half sun on an ink horizon.

**How it's built.** `JohnBaish/lightreader` (public): Vite, React, TypeScript. Every figure is worked out on the visitor's
device with **Astronomy Engine** (2.1.19, MIT licence), in a background worker so the page shows at once; dates typed into
Compare are read with **chrono-node** (2.10.3). Postcode districts (2,210 in England) and places come from Ordnance Survey's
Open Names. Checked against the spec's examples and against MET Norway's published times for all of 2027 (within a few seconds;
Lightreader rounds to the nearest minute where MET Norway drops the seconds, so it often shows a minute later). Nothing typed is sent anywhere; the postcode and chosen times are kept on the device.

**Where it stands.** Live. **Next (tracker):** John decides whether to add text for people searching to the opening page (a
short folded "what it is" section, or a shorter "About these figures"). **Parked:** Scotland, Wales and Northern Ireland; a
24-hour clock face; the night's length on the computer ribbon; using Lightreader's sunrise sums for Hindcaster's summer
wording. Not checked: a real phone's speed (the sums take about a second in a browser here).

---

## Refueller

**Address:** refueller.baish.net. Search title: "Refueller – fuel prices near you". Search description: "Free petrol and
diesel prices near any postcode or place in Great Britain, and the cheapest along your journey. From the Government's Fuel
Finder service." Started October 23rd 2026; live October 31st; on the hub November 1st.

**Purpose and audience.** Drivers who want the cheapest unleaded or diesel near them or on a journey. Prices come from the
Government's Fuel Finder service, to which petrol stations must report their prices.

**What it does.**
- **The eight nearest stations** to a postcode (full or first half) or a town, village or suburb (with suggestions as you
  type), in Great Britain: unleaded (E10) and diesel prices, "Cheapest" marked, how long each price has stood ("Same price
  for 3 days", blue after 45 days), a small chart of where each price sits among the eight, today's opening hours, and
  "Closed until …" for closed stations.
- **Notes the data needs:** an "Unusual price" note (more than 30p from the middle price in Great Britain, except the higher
  prices usual in the Highlands and Islands and the Isles of Scilly), "Opening hours look wrong" (12-hour slips such as 6pm
  for 6am), "Members only" for Costco, and a "Report a wrong price" link to Fuel Finder.
- **Worth driving here?** For a cheaper station: is it worth the extra miles, from your spend and miles per gallon, using
  road distances worked out in advance from Ordnance Survey's map of every road.
- **Price history:** a station's price over 14 days against the average of the eight, from Refueller's own record (Fuel
  Finder keeps no history).
- **The wider picture:** average unleaded and diesel prices for these eight, the postcode area and Great Britain, building
  up to 30 days.
- **Find cheaper fuel near the route:** From, an optional Via and To (places or postcodes); the route worked out on the
  device from Ordnance Survey's main roads and described in a sentence ("via the M25 and Dorking"); the cheapest stations
  within about two miles of it that add no more than three miles and about six minutes, in the order you'd reach them, plus
  the cheapest near each end for comparison.
- "About these figures", print rules, dark mode.

**How it looks.** The shared style; a table on a computer and label-and-value cards on a phone. Its own colours: the graph's
terracotta `#c05a14` (this station) and grey `#5f5a52` (the average), a slate blue `#3f5f8a` for notes (so orange means only
"Cheapest"), and a blue `#2a64a8` for the postcode area's line. Favicon: an ink fuel pump with a terracotta hose.

**How it's built.** `JohnBaish/refueller` (public). Fuel Finder only answers UK addresses, so the **collector is an AWS
Lambda function in London**, run at 10.15am and 4.15pm UK time by AWS's scheduler; it commits the trimmed station and price
files to the repo through GitHub's API, and a GitHub workflow then rebuilds the price history and averages. Each commit makes
Vercel rebuild the site. The page (Vite, React, TypeScript) loads a small index, then only the postcode areas it needs;
postcode, place and road data come from Ordnance Survey's open data. Nothing a visitor types leaves the page. The Fuel Finder
keys live only in AWS and GitHub secrets.

**Where it stands.** Live and static (nothing planned). A full review ("fresh look") on November 1st was followed by every
fix John chose. **Dates to remember:** renew the collector's GitHub key by January 28th 2027; upgrade the AWS account before
its free plan ends in late April 2027. **Open:** the "Unusual price" rule (30p) is provisional. **Ideas for later:** more
fuels, a map, filters (motorway services, 24 hours), Northern Ireland, county or region pages for search, and bringing back
"Find stations near this one" (built, then hidden).

---

## Under way (not live yet)

- **Riverwatcher:** a free tool for river levels in England from open Environment Agency data, looking close to Hindcaster.
  You enter a postcode and it offers the nearest river gauges; its main purpose is comparison with recent weeks and longer
  history. Being built (the collector is running).
- **Storykeeper:** a private website for the Baish family's stories (a page per person, a friendly family tree, places). Not
  a public baish.net tool.
- Also in the tracker: an Instagram carousel promoting the tools to friends, many of whom work or have worked in radio
  (paused), and the private tracker website itself.

---

## What the sites have in common

**One family, written down.** `HOUSE-STYLE.md` (master copy in the clockwheel repo, copied into each project) describes the
look and the ways of working. Its own opening: these are "models, not laws", a basic structure "we can vary depending on the
task and mood". Rule of thumb: copy, don't reinvent.

**Colour.** Page cream `#f5ead8`, surface `#ebddc5`, ink `#201e1d`, terracotta accent `#c67139`, dark terracotta `#8c491a`,
muted text `#645c50`, olive (rare) `#7a8a5e`, dividers in ink at 16%. Each tool may add a palette on top (Clockmaker's
categories, Flowcharter's shapes, Hindcaster's and Refueller's charts, Lightreader's five kinds of light).

**Dark mode on every site** (since October 29th): a warm dark grey page (`#2a2723`, from Hindcaster's agreed set),
following the device's own light or dark setting until the visitor uses the switch at the top right; only a choice that
differs from the device is remembered. Printing is always light. Text is drawn a little finer in dark mode on Macs.

**Type.** Caprasimo (one weight) for headings and buttons, never bold or italic. Figtree for text, with even-width figures in
columns of numbers. Both self-hosted, never from Google Fonts, so visitors' addresses aren't sent to Google.

**Shape and layout.** Soft rounded cards and soft shadows; a nav bar in the surface colour; small uppercase terracotta
kickers above Caprasimo headings; text-style action buttons; a small grey footer notice.

**Phones as a first-class case.** No sideways scrolling; tables become cards; 16px text in boxes (or iPhones zoom in); 44px
tap targets; keyboards that open inside the tap; visible buttons where a computer would use Tab or Shift; Back staying inside
the tool.

**Icons and previews.** Favicons hand-drawn on one recipe (a disc, a terracotta ring or fill, simple ink and terracotta
shapes), checked at a real 16px. Link-preview pictures 1200×630 on one template: an illustration on the left, the name in
Caprasimo, a tagline in Figtree.

**Technology and hosting.** Vite, React and TypeScript, the same versions everywhere; no accounts; GitHub, deployed by Vercel
from `main`, each tool on its own baish.net address; anonymous Vercel visit statistics (no cookies). Automatic plain-script
checks where the rules matter, and a "safety net" so a fault never shows a blank page. Two tools collect public data on a
timetable: Hindcaster (GitHub Actions, started by cron-job.org) and Refueller (an AWS function in London, as its source only
answers UK addresses). Everything is kept free to run.

**Search.** For each tool: a title, a description starting "Free …", a canonical address, robots.txt, a sitemap, some
visible explanation for first-time visitors, and "More free tools at www.baish.net." in the footer; one Search Console
property for the whole domain; the hub updated whenever a tool is added.

## Principles written down

**Privacy as a core value.** "Not sending data is a core value of every tool" (John). Nothing a person types or chooses goes
to a server: postcodes, places and choices are worked out in the browser or kept after "#" in the address; work is saved in
the person's own browser, with Export and Import for backups. The wording says only what's true ("We collect anonymous
visit statistics (no cookies, no personal data)…"). Storage keys are never renamed once live. Other people's data: read the
licence and copy the attribution word for word.

**Voice and identity.** Each tool is "a free-to-use personal project by John Baish", with one contact address,
workshop@baish.net. British spelling and plain English; John decides all wording. Standing rules: "less than" and "more
than", not "under" and "over"; no sentence ending in a preposition; dates month first with an ordinal ("Sunday November 1st
2026"); "12 to 15°C"; times as "9.30am" (Clockmaker and Lightreader keep 24-hour times); numbers one to nine as words in
sentences, 10 and above as digits; halves rounded away from zero.

**Help built in.** Each tool explains itself to a first-time visitor: Guide screens (Clockmaker, Flowcharter), a walkthrough
and explainer (Backtimer), "About these figures" (Hindcaster, Lightreader, Refueller).

**Ways of working.** Agree before building; show rendered options (A, B, C) on a computer and a phone; questions in numbered
batches. A spec and a staged plan for each new tool; every stage on a branch; merge to `main` only when John says (notes
excepted). Check in a real browser at computer and phone sizes, and say what couldn't be checked (often a real iPhone).
Never stand in made-up figures for real ones; log mistakes openly; a dated log entry for every change. The "fresh look": a
full, numbered review of a tool, delivered as a phone-friendly PDF, changing nothing until John chooses. A project tracker
records where every project stands.

## Possible themes for discussion

*Claude's observations from the notes, not written down by John:*

1. **Two audiences.** Backtimer and Clockmaker are broadcasting tools, and Hindcaster began with broadcasters in mind;
   Flowcharter, Lightreader and Refueller are for anyone. The hub doesn't yet say so.
2. **Two kinds of tool.** Editors that keep your work in the browser (Backtimer, Clockmaker, Flowcharter), and readers of
   public data (Hindcaster, Lightreader, Refueller, and soon Riverwatcher). The readers brought timetabled collectors,
   secrets, data licences and attribution into the family; Lightreader is the exception, working everything out from
   astronomy.
3. **"Place" as a common thread.** Hindcaster, Lightreader, Refueller and Riverwatcher all start from a postcode, share
   Ordnance Survey's postcode and place data, and keep the choice on the device. A shared way of choosing a place could be a
   theme.
4. **Comparison as a common thread.** A year ago (Hindcaster), other dates and places (Lightreader), nearby stations and
   averages (Refueller), recent weeks and history (Riverwatcher).
5. **Recurring conventions:** list and picture views of the same thing (Clockmaker, Flowcharter), step-through cards
   (Backtimer, Flowcharter), plain-English sentence summaries (Hindcaster, Lightreader, Refueller's route), Print and Copy
   image.
