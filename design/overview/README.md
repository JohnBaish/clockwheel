# The baish.net overview

A description of every baish.net site, the hub and each tool, for John to share with Claude in other chats when discussing
themes and ideas. It's for reading, not testing. Since November 1st 2026 it comes in two parts (John chose this, option C):

- **`baish-net-overview.md`: the words.** What each site is for, what it does, how it looks (with hex colours), how it's
  built and hosted, where it stands, what's open, then what the sites have in common, the principles written down, and a
  short list of possible themes (Claude's observations, labelled as such). Small and plain, so a chat reads it quickly;
  attach it to a chat or add it to a Claude Project. Written by hand.
- **`baish-net-pictures-<date>.pdf`: the pictures.** Screenshots of every site on a computer (1440px) and a phone (390px
  with touch), a dark-mode page, and every favicon and link-preview picture, then the two private sites (Tenniserver and
  Motoracer) with their six looks. About 37 A4 pages and 13 MB. Made by a script.

The first version (October 22nd 2026) was a single 24-page PDF with words and pictures together; it's in git history
(`baish-net-overview-2026-10-22.pdf`, `overview.html`).

**Update both whenever a new tool goes live** (HOUSE-STYLE §16), and whenever a tool changes enough that the overview
would mislead.

## Files

| File | What it does |
|---|---|
| `baish-net-overview.md` | The words. Edit by hand. |
| `make.sh` | Makes the pictures: takes the screenshots, prepares them, writes `pictures.html` and the PDF. |
| `capture.mjs` | The screenshots (Playwright), including the sample content typed into each tool, and the dark-mode set. |
| `capture-private.mjs` | The private sites' screenshots, always from local builds (they're behind a sign-in), with the real data saved in each repo. |
| `prep.py` | Cuts very tall pages into halves or strips, makes phone pictures a little lighter, saves JPEGs in `img/` (not kept in git). |
| `build-pictures.py` | Lays out the pages and writes the captions into `pictures.html`. Edit this, not `pictures.html`. |
| `pdf.mjs` | Makes the PDF, and reports any page where something spills off, any missing picture or unloaded font. |

## Updating it (Claude's steps)

1. **Allow the live sites.** John adds `baish.net` and its subdomains to the environment's Allowed domains (the cloud
   environment's settings, Network access). Check with `curl -s -o /dev/null -w "%{http_code}" https://www.baish.net/`.
2. **A new tool:** add its screenshots to `capture.mjs` (its address, a realistic working state, a dark-mode picture), its
   favicon and preview picture to `make.sh`, its splitting to `prep.py` if its pages are tall, and its pages, contents line
   and favicon to `build-pictures.py` (`SITES`, and a `section(...)` with its `page(...)` calls). In
   `baish-net-overview.md`, a section like the others, its line in "At a glance", and its place in "What the sites have in
   common" and the themes.
3. From the clockwheel folder, run `LIVE=1 bash design/overview/make.sh`. (Without `LIVE=1` it builds each site from its
   `main` and serves it locally; that needs every repo checked out beside clockwheel with `npm ci` done, and the cover's "How
   the pictures were made" box must then say so.)
4. **Captions name things that change** (the date and time taken, Hindcaster's day, Lightreader's "Now" time, Refueller's
   collection): set `TAKEN` and `TAKEN_AT` in `build-pictures.py`, check every caption against its new picture, then rerun
   `python3 -I design/overview/build-pictures.py` and `node design/overview/pdf.mjs …` (no need to retake the pictures).
5. Read the words again against the current notes (`HOUSE-STYLE.md`, each repo's `CLAUDE.md`, `SPEC.md`, `PLAN.md`, and the
   project tracker in `JohnBaish/baish.net-directory`), and update statuses, dates and the date at the top.
6. Look at every page of the PDF. Delete the old PDF, keep the new one, and send both files to John.

**The private sites** (Tenniserver, Motoracer) are behind Cloudflare Access, so `make.sh` always builds them from their repos
(checked out beside clockwheel, `npm ci` done) and serves them locally, even with `LIVE=1`. Their captions name the update shown
and the date (`PRIVATE_TAKEN` in `build-pictures.py`); check them against the new pictures too.

**November 12th 2026:** the private sites were added without retaking the public ones (`baish.net` wasn't allowed in that
session's environment). The PDF was put together from the November 11th PDF's pages 2 to 30, with a new cover and the seven
new pages from `build-pictures.py`; the next full run of `make.sh` makes it all in one go.

## Known limits

- Pictures with real figures show whatever is current when they're taken.
- Local builds can't reproduce what only Vercel does: the hub and Backtimer are reached by `landing.html` and
  `?host=backtimer` instead of their own addresses, and the visit-statistics script is missing (harmless).
