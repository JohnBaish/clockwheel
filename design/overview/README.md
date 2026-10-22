# The baish.net overview PDF

A single PDF describing every baish.net site — the hub and each tool — for John
to share with Claude in other chats when discussing themes and ideas. It's for
reading, not testing. First made on 2026-10-22
(`baish-net-overview-2026-10-22.pdf`, 24 pages, about 6 MB).

**Update it whenever a new tool goes live** (HOUSE-STYLE §16), and whenever a
tool changes enough that the overview would mislead.

## What's in it

- A cover page: contents, and how the screenshots were made.
- For each site: a written page (purpose and audience, main features, design
  system with hex colours, tech and hosting, status, known issues and ideas),
  then screenshots at 1440px and at 390px with touch, full page, each with a
  caption. Each tool is shown in a realistic working state, with its help
  screens. Very tall phone pages are split into strips side by side.
- Two closing pages: what the sites have in common, the principles written in
  `HOUSE-STYLE.md`, and a short list of possible themes (Claude's
  observations, labelled as such).
- Limits John set: under about 25 pages and 20 MB.

## Files

| File | What it does |
|---|---|
| `overview.html` | The document itself: all the words and captions, laid out as A4 pages. Edit this. |
| `make.sh` | Does everything: builds the sites, takes the screenshots, prepares them, writes the PDF. |
| `capture.mjs` | The screenshots (Playwright), including the sample content typed into each tool. |
| `prep.py` | Splits very tall screenshots into strips; saves JPEGs in `img/` (not kept in git). |
| `pdf.mjs` | Makes the PDF, and stops to report any page where something spills off, any missing picture or unloaded font. |

## Updating it (Claude's steps)

1. Have all the tool repos checked out side by side (`clockwheel`,
   `flowcharter`, `hindcaster`, any new one) on an up-to-date `main`, each with
   `npm ci` done.
2. **A new tool:** add its screenshots to `capture.mjs` (its address, a
   realistic working state, any help screen), its favicon and preview image to
   `make.sh`, and to `overview.html` a written page and screenshot pages like
   the others, a row in the cover's contents table, and its place on the two
   closing pages. Add its card to the hub page's description.
3. Run `bash design/overview/make.sh` from the clockwheel folder.
   - **Live sites (preferred):** if John has added `baish.net` and its
     subdomains to the environment's Allowed domains, run
     `LIVE=1 bash design/overview/make.sh` and change the cover's "How the
     screenshots were made" box to say the live sites were used.
   - **Otherwise** it builds each site from its `main` (what Vercel deploys)
     and serves it locally; the cover says so.
4. Read the written pages again against the current notes (`HOUSE-STYLE.md`,
   each repo's `CLAUDE.md`, `SPEC.md`, `PLAN.md`) and update statuses, dates,
   counts, page numbers in the contents table and the date on the cover.
   **Captions name things that change** (Hindcaster's day and figures, commit
   numbers): re-check every one against its new screenshot.
5. Look at every page of the PDF. Then delete the old PDF and keep the new one,
   named `baish-net-overview-<date>.pdf`, and send it to John.

## Known limits

- Hindcaster's figures are whichever update is current when the screenshots
  are taken.
- Local builds can't reproduce what only Vercel does: the hub and Backtimer
  are reached by `landing.html` and `?host=backtimer` instead of their own
  addresses, and Vercel's visit-statistics script is missing (harmless).
