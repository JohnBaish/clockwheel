# Clockmaker — implementation status

(Renamed from Clockwheel 2026-09-30 — see the dated entry further down for
what that did and didn't touch. Historical entries throughout this file
that say "Clockwheel" are accurate records of what the app was called at
the time they were written; they're deliberately not rewritten.)

A React + TypeScript rebuild of the Organic-design broadcast clock builder
(`../project/Clock and List.dc.html` is the original Claude Design handoff
this was built from). Vite app, no backend — state lives in localStorage.

**Live preview:** https://claude.ai/code/artifact/c11281cb-2a48-41f4-83cb-e252339d2dd5
(a self-contained artifact rebuilt from `npm run build` — see "Publishing the
artifact" below. It is a separate deployment from this source tree; redeploy
it after any change the user should see.)

## Current architecture

- `src/state/store.tsx` — all app state (`AppProvider`/`useApp`), persisted to
  `localStorage` under key `clockwheel-state-v2`. Bump the version suffix again
  if you make a breaking change to the state shape — old data is dropped
  cleanly rather than merged (merging a shape change has caused real crashes
  before).
- Clocks are real, user-created objects (`src/data/clocks.ts`: `Clock = {id,
  name, color, hour, segments, lastEditedAt}`), not placeholder metadata.
  `state.clocks` + `state.clockOrder` + `state.openClockId`. Library seeds
  with exactly one real clock (the user's own Breakfast/07:00 hour).
- Categories are also real and user-editable (`src/data/categories.ts`,
  `CategoriesScreen.tsx`) — add/rename/recolour/reorder/delete, delete is
  blocked while any clock's segments still use it.
- `src/config.ts` — `PINS_ENABLED` and `NOTES_ENABLED`, both `false`. Pin
  (anchor) and per-segment-note UI were built, then hidden at the user's
  request (launch-scope decision, not abandoned) — code and data (`segment.pin`,
  `segment.note`) are intact behind these flags for a possible future re-enable.
- `src/lib/clockStats.ts` — `computeSplit` (category mix from real segments),
  `newsJunctionCount` (segments whose category is named "News",
  case-insensitive — still used by `LibraryScreen.tsx`'s per-card line), and
  `songCount` (same pattern, category named "Music" — used by
  `EditorHeader.tsx`'s tag row).
- `src/components/ClockFace.tsx` — the SVG donut. `RO = 140`, `RI = 39`
  (shrunk from 80 on 2026-09-28, in two steps, to give the ring more
  radial room and the hub less dead space — see below). Labels are drawn
  radially (like spokes — "News" at 12 o'clock reads top-to-bottom), not
  curved along the arc; the callout fit-test is capped at the ring's
  radial thickness (`RO-RI-6`), not arc length, since arc length is
  unbounded for a long segment while the ring's physical thickness isn't
  (this was a real bug, fixed — see git log). Callouts that land on the
  same shelf (both near :00 or :30, same side) are spread apart width-aware
  in `place()`, ordered by `Math.abs(turns[i][0])` (closest to the shelf's
  boundary time sits closest to the ring, on either side) — two related
  bugs fixed 2026-09-28, see below. The hub shows just the open clock's
  name and hour (e.g. "BREAKFAST" / "07:00", the hour now 18px, just a
  little bigger than the ring's own `:00`/`:15` labels at 14px) — total
  duration and balance state are deliberately not repeated here since
  they're already in EditorHeader's tag row above the face.
- `src/components/EditorHeader.tsx` — shared header for Clock+List screens:
  editable clock name and hour, balance tag, an "N songs" tag, Duplicate/Share
  link/Done.

## Recently completed (2026-09-27)

The three items parked on 2026-09-09 are done:

1. Clock hub shows the open clock's real name (uppercased), not a hardcoded
   "Breakfast" — `ClockFace.tsx`'s `buildFace()` now takes `name: string`,
   threaded from `ClockScreen.tsx` (`clock.name`).
2. The hub's total-duration and balance-state lines are removed — the hub
   now shows only name + hour; total/balance stay in EditorHeader's tag row.
3. EditorHeader's tag row shows "N songs" (via `songCount()` in
   `clockStats.ts`) instead of "N news junctions". `LibraryScreen.tsx` still
   shows news junctions on its per-card line — that wasn't in scope for this
   change and was left alone.

Also done the same day, in a follow-up round:

4. `WeekHeader.tsx`'s kicker just says "Standard week" now (dropped
   "· applies until changed").
5. `App.tsx`'s `Shell` wraps everything below `Nav` in a `max-width: 1100px,
   margin: 0 auto` container, so content doesn't stretch full-bleed on wide
   monitors.
6. Segment names are capped at 50 characters (`maxLength={50}` on the name
   `<input>` in `ListScreen.tsx`). The List screen's Segment column now has
   a fixed `width: 460` (sized by actually measuring the app's real Figtree
   font against realistic 50-char content, not guessed), and `.table`'s CSS
   no longer forces `width: 100%` — that was the one style making the table
   stretch to fill the page now that every column has a fixed width.
   (`SummaryScreen.tsx` sets its own `width: 100%` inline, so it's
   unaffected by removing it from the shared class.)

## Recently completed (2026-09-27, later same day)

7. **Print now works, scoped to Clock and List only.** `Nav.tsx`'s Print
   button only renders when `screen === 'clock' || screen === 'list'` — it
   did nothing useful anywhere else, so it's gone from Library/Week/Summary/
   Categories. Each of the two screens prints *only its own content*, per
   the user's explicit call: printing is really a "get it into a PDF"
   vehicle for producers, not primarily a paper thing, in colour, portrait.
   - Clock: `EditorHeader` is `data-noprint` (shared by both screens), and
     the category-legend row below the face is `data-noprint` too. The
     clock's outer "card" div got a `print-clock-card` class that drops its
     background/shadow/padding in print — `ClockFace` already shows the
     clock's own name+hour in its hub, so nothing else is needed to
     identify the sheet.
   - List: the toolbar (segment count + Add segment) is `data-noprint`; the
     drag-handle and delete `<td>`/`<th>` are `data-noprint`. Since the
     table itself has no name/hour anywhere, a plain `.print-only` heading
     (`{clock.name} · {hour}:00`) was added above it — `.print-only` is a
     new small CSS utility in `global.css` (opposite of `[data-noprint]`:
     hidden on screen, `display: block` only under `@media print`).
   - Verified with Playwright's `page.emulateMedia({ media: 'print' })` +
     screenshot on both screens, and confirmed the Print button's
     count is 0 on lib/week/summary/categories and 1 on clock/list.

8. **"Share link" replaced with "Copy image."** Share link only ever copied
   `window.location.href` — verified with Playwright that opening that link
   in a fresh browser lands on a different, default clock, not the one that
   was open, since nothing in the URL encodes which clock/screen it was.
   Now `EditorHeader.tsx`'s button (still shared by both screens) calls
   `copyImage()`, which branches on `screen` and calls one of two new
   functions in `src/lib/exportImage.ts`:
   - `copyClockImage(svg, filename)` — serializes the clock face's own
     `<svg id="clock-face-svg">` (id added in `ClockFace.tsx` so it can be
     found from `EditorHeader`), draws it onto an offscreen canvas at 2x
     scale, and writes the PNG to the clipboard. One real wrinkle caught
     before shipping: the SVG paints two shapes via CSS custom properties
     (`var(--color-bg)`, `var(--color-neutral-700)`) which work fine live
     on the page but silently resolve to nothing in a *serialized,
     standalone* SVG (no access to the page's stylesheet) — fixed by
     reading their live computed values and inlining a `<style>:root{...}`
     block into the serialized string before rasterizing it. Verified by
     actually reading the resulting PNG back off the clipboard in
     Playwright: without the fix the background would render broken;
     with it, the cream background and hub text render correctly.
   - `copyListImage(rows, clock, categories, filename)` — hand-draws the
     table (time/name/category-pill/duration per row, plus a
     `{clock.name} · {hour}:00` heading) directly with the canvas 2D API,
     per the user's explicit choice — there's no native "rasterize this
     DOM" API for a plain HTML table the way SVG has one for itself, so
     this mirrors `ListScreen.tsx`'s own columns rather than pulling in a
     screenshot library. Column widths reuse the same ~50-char sizing
     logic as the List screen's own Segment column.
   - Both funnel through a shared `deliver()` helper: tries
     `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`
     first, and falls back to a plain file download if the Clipboard API
     throws or isn't available (the known Safari-timing wrinkle flagged
     when this was scoped) — the button reads "Copied!" or "Downloaded"
     accordingly, reusing the same transient-status pattern the old Share
     link button used.
   - Verified end-to-end in Playwright by reading the actual clipboard
     contents back out as PNGs and visually inspecting them on both
     screens — not just checking that the code ran without throwing.

## Parked for next session — user has NOT asked for these to be done yet

Raised 2026-09-27, explicitly deferred so the user could move on to other
questions. Implement only when the user actually asks to resume this.

1. **Callouts not moving back inline when a segment shrinks — investigated
   2026-09-27, could NOT reproduce.** User's original report: make a
   segment's label big enough to force it into a callout, then shrink it
   back down to a size that should fit inline — it stayed a callout.
   Tested three ways with Playwright against a real running build, each
   testing a different reading of "make it smaller":
   1. Shorten an over-long name back down (e.g. a forced-callout title →
      "News") — correctly returned inline.
   2. Grow the segment's duration a lot while keeping an over-wide name —
      correctly *stayed* a callout, because `RADIAL_AVAIL = RO - RI - 6`
      (~54px) is a hard physical ceiling no duration can raise; this is
      the earlier arc-vs-radial fix working as intended, not a bug.
   3. Grow the duration with a name sized right at that ~54px edge —
      correctly returned inline once there was enough room.
   `buildFace()` has no persisted "is a callout" flag — it's a plain
   function re-deriving `scored`/`callouts`/`inner` from scratch on every
   call, memoized only on `[segments, hour, name, categories]` — and every
   test confirmed that recomputation is correct in both directions. Best
   guess at the original report: an edit that didn't shrink the label
   *enough* to cross back under the ~54px threshold would correctly stay a
   callout, which can look identical to "stuck" — or the user was on a
   build from before some of the same day's other fixes. Left un-"fixed"
   since nothing reproducibly wrong was found; if it recurs, get the exact
   before/after name+duration values before touching `ClockFace.tsx`.

Items 2 (Print) and the old item 3 (Copy image) are both done — see
"Recently completed" above. No items are currently parked.

## Recently completed (2026-09-28) — six fixes from real work usage

The user started using Clockwheel at work and reported six things from a
real clock they'd built. All six are done:

1. **Overlapping callout labels, fixed — then a follow-up ordering bug,
   also fixed, same day.** `ClockFace.tsx`'s `place()` assigned every
   "shelf" item (a callout near :00 or :30, which has nowhere useful to
   point sideways) the exact same `(x, y)` whenever two of them shared a
   side and top/bottom. Fixed by grouping shelf items by side+top/bottom
   and spacing each one out by the previous item's actual rendered text
   width (a fixed gap was tried first and still overlapped for unusually
   long labels). The user then reported the fixed labels were reading in
   the *wrong order* with crossing leader lines on a real clock (three
   segments — "Weather", "Trail", "Travel" — straddling :30). Root cause:
   the initial fix sorted shelf items within a group by raw `turns[i][0]`
   (signed turn x) — fine on the right side (positive x), but backwards on
   the left side (negative x), where it put the segment *furthest* from
   the :00/:30 boundary closest to the ring instead of furthest out.
   Fixed by sorting on `Math.abs(turns[i][0])` instead (closest to the
   shelf boundary = closest to the ring, regardless of which side), which
   is direction-agnostic and correct for both sides. Verified by
   reproducing the exact reported scenario (one right-side item, two
   left-side items at different distances from :30) and confirming their
   rendered x-positions land in true chronological order.
2. **Tab from Duration → next row's Segment field**, not its Duration
   field — for both an existing next row and a newly-created one (user
   confirmed both, via question). This also simplified `ListScreen.tsx`:
   the old `focusNewRowDuration` ref (which made Tab-created rows behave
   differently from button-created ones) is gone — both now just focus the
   name field.
3. **Up/Down arrow row navigation.** From the Segment or Duration field,
   ArrowUp/ArrowDown jumps to the same column on the previous/next row
   (`handleRowArrow` in `ListScreen.tsx`). Does nothing at the first/last
   row (no wraparound, no new-row creation — that's still Tab's job).
4. **Hub hour text shrunk** from 38px to 18px — "just a little bigger"
   than the ring's own `:00`/`:15`/`:30` labels (14px), per the user's ask.
5. **Hub shrunk, ring thickened** — `RI: 80 → 58`, then per a same-day
   follow-up ask ("another third of the blank space") → `39`. Ring
   thickness is now 101px, up from the original 60px (more inline-label
   room, so fewer segments need to become callouts at all — a nice side
   effect) and the blank centre is visibly smaller. Vertical hub layout
   (name/hour y-offsets) tightened to match the now-much-smaller hour
   text, rather than leaving a gap. Checked that "BREAKFAST"/"07:00" and a
   longer real name ("DAYTIME 1") both still read clearly at this size
   before settling on it.
6. **Ctrl/Cmd+C / Ctrl/Cmd+V in Schedule.** `WeekScreen.tsx` gained a
   `clipboard` state (`ClockId | null | undefined`; `undefined` = nothing
   copied yet). Copy takes the first selected cell's clock; paste assigns
   it to whatever's currently selected — reuses the existing multi-cell
   selection as-is, so pasting onto a whole day or hour-row works
   automatically, same as assigning from the library already does. Guarded
   to do nothing while focus is in a text input (so it doesn't hijack
   normal browser copy/paste), and shows a small "Copied X — Ctrl/Cmd+V to
   paste" tag in the toolbar so the copied value isn't invisible state.

All six verified with Playwright against a real running build (not just
"the code looks right") — the label-collision fix specifically needed two
attempts before the repro actually stopped overlapping.

## Library: Open/Duplicate swapped, then Open given a matching frame (2026-09-28)

`LibraryScreen.tsx`'s per-card button row: the wide, `flex: 1` box (which
used to be Duplicate) now contains **Open**, styled in Open's own
typeface (`btn-ghost` + `color: var(--color-accent-700)`) rather than
adopting the box's old bordered look. The narrower box next to it (which
used to be Open's position) now contains **Duplicate**, in its own
original `btn-secondary` look. So: box *shape/size* stayed anchored to
*position* (left = wide, right = narrow); button *label + typeface +
onClick* moved as a unit between positions. Verified both still do the
right thing (Open navigates to the Clock screen; Duplicate adds a second
card and stays on Library).

Follow-up same day: Open had no visible border (`.btn-ghost` doesn't set
one, only `.btn-secondary` does, via `border-color: var(--color-divider)`)
— user asked for Open to get the same frame Duplicate has. Added
`borderColor: 'var(--color-divider)'` directly to Open's inline style,
keeping its `btn-ghost` class and accent-coloured text exactly as-is —
only the border changed. Verified computed `border-color` is now
byte-identical between the two buttons.

## EditorHeader: clock name field now wraps + capped at 40 chars (2026-09-28)

User reported a long clock name ("Daytime 1 copy" et al) overlapping the
tag/button row above it — screenshot showed the name sitting right under
a cropped-looking header. Root cause: the name field was a plain
`<input>`, which can never wrap its value onto a second line no matter
how much CSS you throw at it — a single-line form control is a hard HTML
constraint, not a styling choice. Fixed in `EditorHeader.tsx` by:
- Swapping the name field from `<input>` to `<textarea rows={1}>` (same
  `plain-input` class, so it still looks like plain text until focused).
  `resize: none`, `overflow: hidden`, `wordBreak: 'break-word'`.
- Auto-growing its height to fit content: a `useEffect` keyed on
  `clock.name` resets `el.style.height` to `'auto'` then to
  `scrollHeight` on every change, so a short name stays one line and a
  long one grows to exactly as many lines as it needs (verified it also
  *shrinks* back down when renamed shorter again).
- Enter is intercepted (`preventDefault` + blur) so it commits the name
  rather than inserting a literal newline — same pattern as the Duration
  field.
- The name block's container got `maxWidth: 420` so wrapping actually has
  something to wrap against (a `flex: 'none'` box with no width cap would
  just keep growing wider instead of ever wrapping).
- Added `maxLength={40}` — tighter than the 50-char cap on segment names,
  since this renders at 32px (vs. List's ~14px) so the same character
  count takes up much more visual space.

**A second bug this surfaced, also fixed in `ClockFace.tsx`:** once
longer names were possible, the SVG hub's own name label (rendered at a
tiny 8px inside the now-small `RI: 39` hub circle) started overflowing
out of the hub and onto the wheel itself — the hub label was never
designed to hold more than a short name. Added `truncateHubName()`,
which measures the rendered width (canvas `measureText` plus a manual
add-back for the `.1em` letter-spacing it doesn't account for) and
binary-searches for the longest prefix + "…" that fits
`2*(RI-1) - 12` px. The header still shows the *full* (wrapped) name —
only the hub's small badge-style label gets shortened, since it was
always meant to be a small identifier, not the full title. Verified with
a 61-character typed name: capped to 40 by the field, wraps to 3 lines
in the header, and reads as "THIS IS A D…" in the hub without spilling
onto the wheel.

## Nav + List made to work on a phone (2026-09-28)

The earlier verdict on List not working on mobile named two separate root
causes; a planning discussion first (see git log for that conversation)
turned up a third, and the user weighed in on two real design decisions
before any of this was built:

0. **Nav overflow (prerequisite, affects every screen).** The nav bar's
   links, Print, and the saved-tag now live inside `.nav-panel`
   (`Nav.tsx`), which is `display: contents` above 720px (so desktop is
   byte-for-byte the same layout as before) and collapses behind a
   hamburger toggle (`.nav-menu-toggle`, from `lucide-react`'s `Menu`/`X`)
   below it (`global.css`). Clicking a link closes the menu. This alone
   fixed body-level horizontal overflow on *every* screen, not just List
   — verified `document.body.scrollWidth` exactly matches the viewport
   width at both 1400px and 390px on all six screens.
1. **List's table → a card layout below 720px.** A 5-6 column table with
   text inputs in it doesn't become mobile-friendly by shrinking — it
   stops being readable as a table. `ListScreen.tsx` now branches on
   `useIsNarrow(720)` (`src/lib/responsive.ts`) and renders either the
   original `<table>` or a `.list-cards` stack (one card per segment:
   name prominent, time/category/duration/delete beneath it) — **never
   both at once**. That matters more than it sounds: rendering both and
   hiding one with CSS would have left two sets of `<input>` elements
   fighting over the same `nameInputs.current[id]` / `durInputs.current[id]`
   ref keys, silently breaking Tab/Arrow keyboard navigation on whichever
   layout's refs lost. The category `<select>` needed no special mobile
   handling — phones already turn a plain `<select>` into their own native
   picker UI.
2. **Drag-to-reorder rebuilt on Pointer Events, handle-only.** The old
   reordering used the browser's native HTML5 drag-and-drop, which is
   mouse-only by design — it has never responded to touch on any
   touchscreen, on any site, ever; not a bug in this app. Replaced
   entirely (not just supplemented) with `useDragReorder()`
   (`src/lib/useDragReorder.ts`), a small hook built on Pointer Events
   (which unify mouse/touch/pen) and shared verbatim by both the desktop
   table's rows and the new mobile cards — one mechanism, not two. Per
   the user's own observation and explicit request: the drag only starts
   from `onPointerDown` on the grip icon specifically (`setPointerCapture`
   on that element keeps move/up events firing on it even once the
   pointer has moved well off it) — clicking/tapping into a segment's
   name or duration field to edit it can no longer be mistaken for a
   reorder gesture, on desktop or mobile alike. Verified with a real mouse
   drag (desktop table) and a dispatched touch-type `PointerEvent`
   sequence (mobile cards), plus a regression check that dragging *from
   the name field* does nothing on either layout.

Two decisions were the user's call, not assumed: reordering got the full
Pointer Events rebuild rather than simple up/down arrow buttons, and this
effort was scoped to Nav + List only — Clock/Week/Library/Summary/
Categories likely have smaller versions of the same underlying problem
(dense desktop-oriented layouts) but weren't touched. Week's 7-day grid in
particular is still cramped at phone width, though it no longer causes
page-level overflow now that Nav is fixed — worth a look whenever the
other screens' turn comes.

## Publishing the artifact (do this after any change the user should see)

```
cd app && npm run build
SCRATCH="<the session's scratchpad dir>"
{ echo '<title>Clockwheel</title>'; echo '<style>'; cat dist/assets/index-*.css; echo '</style>';
  echo '<div id="root"></div>'; echo '<script type="module">'; cat dist/assets/index-*.js; echo '</script>';
} > "$SCRATCH/clockwheel-artifact.html"
```
Then publish that file via the Artifact tool with `url:
https://claude.ai/code/artifact/c11281cb-2a48-41f4-83cb-e252339d2dd5` to
update the same link in place (omitting `url` creates a new, separate
artifact — don't do that).

## Export/Import — done (2026-09-27)

Built as a no-backend way to back up a browser's data or move it to another
device/browser, since everything still lives only in `localStorage`.
- `store.tsx`: `exportState()` wraps the full `PersistedState` as
  `{ app: 'clockwheel', version: 2, exportedAt, state }` and pretty-prints it.
  `importState(json)` is the one place in the app that parses data from
  outside itself, so it's the one place that validates: rejects invalid
  JSON, rejects anything not shaped like a Clockwheel export (checks `app`,
  and that `clocks`/`clockOrder`/`categories`/`categoryOrder` exist with the
  right basic types), then merges over current state, forces `screen: 'lib'`
  so the import is visibly obvious, and re-points `openClockId` at a real
  clock if the imported one doesn't exist. Returns an error string (same
  pattern as `deleteCategory`) rather than throwing.
- `LibraryScreen.tsx`: "Import"/"Export" buttons, top-right of the header
  (Library is the natural whole-library-not-one-clock home for this).
  Export triggers a browser download (`clockwheel-YYYY-MM-DD.json`) via a
  Blob + object URL; Import is a hidden `<input type="file">` triggered by
  the visible button. Reuses `CategoriesScreen.tsx`'s existing dismissible
  error-banner pattern for a bad import, rather than a new one.
- Verified with Playwright end-to-end: exported, changed the state further
  (renamed the clock, added another), imported the earlier export back in,
  confirmed the changes were undone — including after a full page reload,
  proving it actually persists rather than just updating in-memory state.
  Also confirmed importing garbage JSON shows the error banner and leaves
  the app fully functional rather than crashing.

## Hide 0%-usage categories from the Clock screen legend (2026-09-28)

`ClockScreen.tsx`'s percentage legend (the row of colour dots + names +
percentages under the clock face) used to list every category in
`categoryOrder`, including ones with 0% usage in the currently-open clock.
User's reasoning: categories are shared across all clocks for different
purposes, so a category being absent from *this particular* clock isn't
meaningful information — it just clutters the legend with irrelevant rows.
Fix: the `categoryOrder.map(...)` was split into a `.map()` that computes
`{ id, pct }` pairs, a `.filter(({ pct }) => pct > 0)`, then the render
`.map()` — categories at exactly 0% are dropped before rendering. `PINS_ENABLED`
pin-legend entry is unaffected (separate, unconditional block). Verified with
Playwright: added a brand-new, genuinely-unused category via the Categories
screen (confirmed it was really created — via the category count tag and by
reading each name `<input>`'s `.value`, since `input` values don't show up
in `document.body.innerText`), then confirmed it does NOT appear in the
Clock screen legend while existing in-use categories (Music, Speech, Travel,
News, Imaging) still show their correct percentages.

## Fan pole-hugging callouts by angle, not by a shared diagonal line (2026-09-28)

User's complaint, from a screenshot of their real clock: callouts near :00
or :30 (the "shelf" case in `ClockFace.tsx`'s `place()` — a segment whose
angle is too close to vertical for the normal side-column treatment to look
right) were stacked in a flat horizontal strip hugging tight to the ring,
even though there's usually a much bigger empty triangle of space further
out, between that strip and the full height the side columns reach. Asked,
in effect, for a general way to code "spend the corner space, and try not to
leave anything sitting dead-center above :00 or below :30."

First attempt (superseded, see below): walked each shelf item out along a
fixed-slope diagonal, both `x` and `y` growing together as more items shared
a shelf. That moved things into the corner, but the user's follow-up
screenshot showed two new problems it introduced: (1) with several items on
one shelf all placed along one straight line from a shared point, and their
leader-line bend points all clustering near the pole (since the segments
are close together in time), each item's line overlapped the ones before
it — the group read as one continuous chain threading through the labels
("Weather"→"Trail"→"Travel") rather than separate lines back to the ring;
(2) a lone item like "Ident" still bent from a near-vertical elbow to a
barely-offset label, reading as a line dropping onto the ring from directly
overhead rather than pointing at its segment.

Fixed by changing what varies per item, in the same `shelfGroups.forEach`
block: instead of walking along one shared line, each item gets its own
**angle** away from the pole (`a = poleSign * (Math.PI/2 - side*offset)`,
`offset` starting at `MIN_OFF` ≈ 29° and growing by each label's own arc
length at radius `TURN_R`), so a group of them genuinely fans out around
the ring rather than sitting collinear. And shelf items drop the elbow
bend entirely — one straight line runs from the segment's true position on
the ring directly to the label (`shelf[j]` branches to a single `<line>`
instead of the tip→turn→label pair column items still use) — so it always
points straight at its own segment, satisfying "parallel with :00 [or
whichever mark], pointing straight at the segment." `MIN_OFF` is what keeps
even a lone shelf item off the pole itself.

Still a heuristic, not a true whitespace-optimiser — it doesn't measure how
tall the side columns happen to be this time, and a callout's side is still
decided purely by which hemisphere its own angle falls in (never moved
across to the other side). Verified with Playwright against the same
synthetic three-way split of the seed clock's "Weather trail travel"
segment used to catch the first attempt's bug, plus a forced two-item
same-side top shelf (by shrinking "Song 8" to push it into callout
territory alongside "Ident") — cropped screenshots confirm distinct fanned
lines with no chaining in both the 3-item and 2-item cases, and Ident's
line now sits roughly level with :00 and points straight at its segment.
Not verified against the user's own live "Daytime 1"/"Daytime 2" clocks,
which this session has no access to.

**Follow-up (same day):** user's next screenshot (their real "Daytime 2"
clock) showed the angle-fan working — no more chain, no more dogleg — but
too aggressive: a 3-item bottom cluster swung as far as :40, ten real
minutes from :30, reading as if those labels belonged to a different part
of the hour than they do. Halved both knobs: `MIN_OFF` from `0.5` (~29°) to
`0.25` (~14°), and the per-item angular growth from `(w+24)/TURN_R` to
`(w+24)/(TURN_R*2)`. Re-verified with the same synthetic 3-item and 2-item
cases — labels now land much closer to their true mark while still
fanning out cleanly with no crossing or overlapping text. These two
constants are the ones to retune first if it still reads as too far or
not far enough on the user's real data.

**Verified against real data:** the user exported their actual library
(`Export` on the Library screen) and confirmed "Daytime 2" — the clock in
every screenshot above — was looking better. Loaded their export's raw
state directly into a test browser's `localStorage` and re-screenshotted
both problem spots (the bottom 3-item cluster, the "Ident" top item):
distinct fanned lines, no chaining, no dogleg, both close to their true
mark. Confirms the tuned constants above hold up on their real segment
lengths and label text, not just synthetic test data.

## Replace the seed clock/categories with the user's own "Daytime 1" (2026-09-28)

User asked: fresh browser (no `localStorage`) should default to just their
"Daytime 1" clock — no other clocks, no unused categories, empty Week.
Previously the seed was a placeholder "Breakfast" hour invented early in
this project, before real user data existed.

- `data/segments.ts`: `INITIAL_SEGMENTS` replaced wholesale with "Daytime
  1"'s actual 18 segments and durations (from the user's exported JSON),
  category ids remapped to the new short ids below. Sums to exactly 60:00,
  same as their real clock.
- `data/categories.ts`: `SEED_CATEGORIES`/`SEED_CATEGORY_ORDER` cut down to
  exactly the 5 categories Daytime 1 uses (`mus`, `trv`, `nws`, `img`, and a
  new `cnt` for their custom "Content" category) — `spe` (Speech) dropped
  since Daytime 1 never uses it. Names/colours match the user's own
  customisation verbatim, e.g. `trv` is named "Junction" now, not "Travel",
  and `nws` is pure black (`#000000`) — both are what the user actually set,
  not this file's old placeholder values.
- `data/clocks.ts`: `SEED_CLOCK_ID` changed from `breakfast-07` to
  `daytime-1-10`, `seedClocks()` returns a single "Daytime 1" clock at hour
  10 instead of "Breakfast" at hour 7.
- Week (`week: {}`) was already seeded empty in `store.tsx`'s
  `loadInitial()` — no change needed there, a fresh browser has never
  pre-assigned any clock to the week grid.

Verified with Playwright against a completely fresh `localStorage`: Library
shows exactly one clock ("Daytime 1"), Categories shows exactly 5 rows all
marked "used" (none orphaned), Week shows "0 of 83 local hours assigned",
and the Clock screen renders correctly — including the 0%-category-legend
filter (shipped earlier the same day) correctly hiding Imaging, since
Ident's 17s rounds to 0% of the hour.

## Draggable callout labels (2026-09-29)

User asked (feasibility question first, then went ahead) for the auto-placed
callout labels — the ones with leader lines, per the last several sections —
to be manually draggable, "as you can do in Excel." Scoped in advance to two
decisions: only the callout labels (not the ones that already sit inline on
the ring), and double-click to reset a dragged label back to automatic
placement.

- `data/segments.ts`: `SegmentSeed` gained an optional `labelPos?: { x, y }`
  — a manually-dragged position in the face's own SVG coordinate space
  (centred on the hub, same units `place()` already computes in). Persists
  and round-trips through localStorage/export exactly like every other
  segment field, no special-casing needed.
- `state/store.tsx`: `setSegmentLabelPos(segmentId, pos | null)`, same
  `editOpenClock` pattern as the other per-segment setters. `null` clears it.
- `components/ClockFace.tsx`:
  - `buildFace()` now takes a `LabelInteraction` object (drag id/position
    plus the four pointer-event handlers) and, inside `place()`, applies it
    as the *last* step after the normal auto-layout maths — so a manual
    override never throws off how the *other* labels in that list computed
    their own gaps/angles, it just substitutes the final `(x, y)` for the
    one label being overridden. Priority: live drag position, then a saved
    `labelPos`, then whatever the automatic layout produced.
  - Each callout's swatch dot + text is wrapped in a `<g className="callout-label">`
    with a generous invisible hit-rect behind it (the visible dot/glyphs
    alone are too small and gappy to reliably grab, especially on touch),
    carrying `onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel`
    and `onDoubleClick`. Same `setPointerCapture` technique as the List
    screen's row-reorder drag (`lib/useDragReorder.ts`) — works for mouse
    and touch alike, verified with a synthetic `pointerType: 'touch'` drag
    the same way that hook was verified.
  - The `ClockFace` component (not `buildFace`, which is a plain function
    with no access to the mounted DOM) holds the actual drag state and a
    `svgRef`, and converts pointer screen coordinates into the face's own
    SVG units via `svg.getScreenCTM().inverse()` — necessary because the
    face is drawn at a fixed internal size but displayed scaled to fit its
    container (confirmed the conversion is exact: a mid-drag bounding-box
    check tracked the mouse 1:1 in screen pixels throughout).
  - Dragging updates local state live (so the leader line visibly follows
    the pointer); the position is only written to the segment — via
    `setSegmentLabelPos` — on pointer-up, not on every pointermove.
  - `.callout-label` in `global.css`: `cursor: grab` (`grabbing` on
    `:active`), `touch-action: none` (stops touch-scroll hijacking a drag,
    same reason the List grips need it), and `user-select: none` — without
    it, double-clicking a label (the reset gesture) also triggered the
    browser's native double-click-to-select-word, leaving a visible text
    selection highlight behind after the reset.
- A dragged label's leader line always runs as one straight line from the
  segment's true ring position to wherever the label now sits — it doesn't
  try to re-introduce the elbow bend that ordinary side-column callouts use,
  regardless of which kind the segment originally was.
- Known, accepted limitation (same as Excel): dragging one label does **not**
  make other automatically-placed labels dodge it. If a manual drag now
  overlaps a different label, the fix is to drag that one too. True mutual
  collision-avoidance between manual and automatic placement was considered
  and explicitly ruled out as unnecessary scope for what this needed to do.
- Verified with Playwright: dragging visibly follows the pointer and updates
  the leader line live; the final position survives a reload (confirmed via
  the persisted `labelPos` in `localStorage`); double-click clears it back
  to automatic (confirmed `labelPos` becomes `undefined` again, and the
  rendering matches the pre-drag layout); a synthetic touch-type drag works
  identically; "Copy image" correctly captures a far-dragged label (the
  exported PNG's dimensions grow to match the expanded canvas extent, same
  mechanism as any other callout that pushes `ext.x`/`ext.y` outward).

## New screen: Backtimer (2026-09-29)

User asked for a whole new page, alongside Library/Clock/List/etc., for
backtiming — working out what time a running order's items each need to
start so the last one lands exactly on a target "out time". Explicitly
asked to be checked with questions before starting, given the size; two
real decisions got made up front rather than assumed:
- **Single tool, not a mini-library** (like Week, not like the clock
  Library) — one Backtimer, not several named/saved ones.
- **"Add item" appends to the bottom of the display**, which is also the
  *earliest* row (see below on ordering) — matching how a producer actually
  builds one: start from the out time, add what comes right before it, then
  what comes before that, each new row landing further down as you go
  further back in time. (The alternative — new rows joining the top — was
  offered too, but this is what was picked.)

**Data model** (`data/backtimer.ts`, new file):
- `BacktimerItemSeed { id, n, d }` — same shape as `SegmentSeed`, minus a
  category (not needed here).
- `BacktimerState { outTime, items }` — `outTime` is seconds, minutes:seconds
  only, no hour (this tool isn't tied to any clock's hour).
- **Order in `items` IS display order** — deliberately not reversed at
  render time. `items[0]` is the top row, the last thing before `outTime`;
  each row after it is progressively earlier. This is the opposite
  convention from `data/segments.ts` (where array order is chronological and
  the Clock face/List both read it forward) — worth remembering if the two
  ever need to interact.
- `withBackTimes(items, outTime)` computes each row's start/end by counting
  *backward*: the mirror image of `withTimes()`'s forward cumulative sum.
  A row's `end` is always the row above's `start` (or `outTime`, for the top
  row). Deliberately not clamped at zero — a row's `start` can go negative,
  which is the actual point of the tool (it's telling you you're overrunning
  and by how much), so `lib/time.ts` gained `signedDur()` (`dur()` itself
  mishandles negative seconds, since JS's `%` keeps the dividend's sign).

**Store** (`state/store.tsx`): `backtimer: BacktimerState` added to
`PersistedState` (defaults via `seedBacktimer()` — an old export/localStorage
without this key just falls back to it via the existing `{...defaults,
...parsed}` merge, no migration needed, same pattern as every other field
added this way this session). A new `editBacktimer()` helper mirrors
`editOpenClock()` but writes directly into `state.backtimer` rather than a
specific clock's segments, since Backtimer isn't `openClockId`-scoped. Six
new actions (`setBacktimerOutTime`, `addBacktimerItem`,
`removeBacktimerItem`, `setBacktimerItemName`, `setBacktimerItemDuration`,
`reorderBacktimerItems`) — same shape as the equivalent segment actions.

**Screen** (`screens/BacktimerScreen.tsx`, new file): built by closely
mirroring `ListScreen.tsx` — same duration-parsing/editing pattern, same
Tab-to-next-row and arrow-key row navigation, same `useIsNarrow(720)` split
between a desktop `<table>` and mobile `.list-cards`, same
`useDragReorder()` for drag-to-reorder (unmodified — it doesn't care what
the rows represent, just their count and a reorder callback), same
`data-noprint`/`.print-only` wiring. Differences: no category column (not
needed), an editable "Out time" field in the header instead of a fixed
clock hour, a "Starts" time column instead of List's "Time" (computed via
`withBackTimes`, shown via `signedDur()`, styled in the accent colour when
negative), and a header tag that explicitly calls out an overrunning bottom
row ("starts -3:00 — before the top of the hour") rather than leaving a
lone minus sign to be noticed on its own.

**Nav/routing**: `Screen` union gained `'backtimer'`; added to `Nav.tsx`'s
`LINKS` (last, per the request) and to the Print-button visibility check
(alongside clock/list); `App.tsx` renders `<BacktimerScreen />` for it,
with no `EditorHeader` (that's clock-name/hour chrome that doesn't apply
here) — Backtimer's own header lives inside the screen component itself.

Verified with Playwright: correct backward maths on desktop (a 3-item
sequence out at 29:30 landing on exactly the expected start times);
negative-overage styling and header warning when items exceed the out
time; drag-to-reorder on both a real mouse sequence (desktop table) and a
synthetic touch-type pointer sequence (mobile cards) — note the touch test
needed real delays between dispatched pointer events, not one synchronous
burst, or React never gets a chance to re-render between them and every
`onPointerMove` reads a stale (pre-drag) closure and no-ops, which cost
some debugging time but was a test-script issue, not an app bug; everything
persists across a reload; and importing the user's own pre-Backtimer export
doesn't crash, it just falls back to the seeded empty Backtimer as designed.

## backtimer.baish.net — same build, Backtimer-only presentation (2026-09-29)

User asked about a separate subdomain that shows only Backtimer, none of
the clock functions. Talked through the options first (this was an
advisory conversation before any code): a genuinely separate app/deployment
would mean real ongoing maintenance (keeping shared bits like drag-reorder
and duration parsing in sync across two codebases), for very little benefit
at this app's size — so went with the cheap version instead: **one build,
one Vercel deployment, a second custom domain pointed at the same project**,
with the app deciding what to show based on which hostname it was loaded
from. No new deployment, no routing library, no server-side config at all.

- `lib/hostMode.ts` (new file): `isBacktimerHost()` — true when
  `window.location.hostname === 'backtimer.baish.net'`, or when the page
  was loaded with `?host=backtimer` (a manual override for testing this
  locally/in preview URLs before the real subdomain exists in DNS — this is
  how it was verified in this session, since the sandbox obviously can't
  resolve the real subdomain).
- `state/store.tsx`'s `loadInitial()`: on that host, always forces
  `screen: 'backtimer'`, overriding whatever screen a previous visit to
  that origin happened to save — so there's no stored state that could put
  a Backtimer-only visitor on a Clockwheel screen.
- `components/Nav.tsx`: on that host, the links list is empty (no link to
  "the only page there is" — the brand text already says which app this
  is), the "New clock" button doesn't render, the brand reads "Backtimer"
  instead of "Clockwheel", and `document.title` is set to "Backtimer". The
  Print button (still shown, Backtimer supports printing same as List)
  picks up the `margin-left: auto` that "New clock" used to provide, so it
  still sits at the right edge without an empty gap.
- Nothing else needed changing — `App.tsx`'s screen switch, `EditorHeader`,
  and every other screen are simply unreachable on this host, since Nav is
  the only way to navigate and nothing on the Backtimer screen itself calls
  `setScreen`/`openClock`. Confirmed nothing else in the codebase calls
  those either, outside Nav and EditorHeader's "Done" button (which only
  renders on the clock/list screens, which can never be reached here).
- **Data is automatically separate, not shared** — `backtimer.baish.net`
  and `clockwheel.baish.net` are different origins, so they get different
  `localStorage`. This wasn't extra work, just a consequence of how the
  web works, and it's the right behaviour here: Backtimer was built as a
  standalone tool with no reference to any clock's data in the first place.
- **What's still needed, outside this repo/session**: the user adds
  `backtimer.baish.net` as a domain on the Vercel project that already
  serves `clockwheel.baish.net`, and adds whatever DNS record Vercel's
  dashboard then asks for (almost always a CNAME to `cname.vercel-dns.com`
  for a subdomain, but Vercel should be treated as the source of truth for
  the exact value) at wherever `baish.net`'s DNS is managed. Until that's
  done, `?host=backtimer` on the existing `clockwheel.baish.net` domain is
  the only way to see this mode live.

Verified with Playwright: normal domain (no query override) renders
completely unchanged, desktop and mobile, full nav intact — the
`?host=backtimer` override affects nothing unless explicitly present.
`?host=backtimer` mode: correct title, correct brand text, zero nav links,
no "New clock" button, Print button correctly right-aligned, Backtimer
screen loads directly with no flash of any other screen; mobile hamburger
menu (with the reduced set of collapsed items — just Print and the saved
tag) still opens/closes correctly.

## Fix: backtiming to "0:00" gave a negative start instead of 59:43 (2026-09-29)

User's real bug report: backtiming a 17-second item to an out time of
"0:00" showed a start of roughly -0:17, when the actually-wanted answer was
59:43 — i.e. "0:00" as an out time should mean the top of the hour, the
same instant a broadcast clock calls both "00:00" and "60:00", not the
literal first instant of the hour (backtiming a positive-duration item to
the literal start of an hour is nonsensical — everything before it goes
negative immediately).

Two layered causes, found in order:
1. **The real fix**: `data/backtimer.ts` gained `normalizeOutTime(seconds)`
   — `0` becomes `3600`. `withBackTimes()` now normalizes internally
   (so the maths is always right no matter what's stored), and so does
   `BacktimerScreen.tsx`'s displayed/edited out-time value (so the field
   never shows a misleading "0:00" that doesn't match what's actually being
   calculated). `seedBacktimer()`'s default was also changed from `0` to
   `3600`, so a brand-new Backtimer already reads "60:00" rather than
   silently meaning the same thing while displaying "0:00".
2. **A second, independent bug this uncovered**: typing "0:00" into the out
   time field wasn't even reaching `normalizeOutTime()`'s `=== 0` check,
   because `lib/time.ts`'s shared `parseDur()` clamps *every* parsed value
   to a minimum of 1 second — correct for an item's duration (a segment
   can't be zero-length) but wrong for the out time, where 0 is meaningful
   input, not a degenerate one. `parseDur` was refactored to share its
   regex logic with a new `parseOutTime()` (via a private `parseMmSs(input,
   min)`) that allows exactly 0; `BacktimerScreen.tsx`'s `commitOutTime`
   now uses `parseOutTime`, item durations still use `parseDur` unchanged.
   Without this second fix, typing "0:00" silently became 1 second (not 0,
   not 3600), which is why the very first attempt at the "real fix" above
   still failed in testing until this was found.

Verified with Playwright: the user's exact scenario (out time typed as
"0:00", one 17-second item) now shows the out-time field reading "60:00"
and the item starting at 59:43. Regression-checked: a normal non-zero out
time (29:30) still computes correctly and unaffected by the 0-handling;
deliberately overrunning a small non-zero out time (1:00) still correctly
shows a negative start rather than being swallowed by the new
normalization (which only ever triggers on a literal 0); an item's own
duration typed as "0:00" still clamps to "0:01" as before, confirming
`parseDur` itself (used for item durations) wasn't changed in behaviour.

## Follow-up: wrap rows that cross the hour boundary onto the clock face, don't go negative (2026-09-29)

Same day, next real usage bug: with out time 10:00 and four items totalling
15:00, the two that fall before :00 were showing raw negative deltas
(-1:38, -5:00). User's ask: those items are still real, they're just in
the hour before this one — a producer backtiming to :10 with 15 minutes of
material expects the earlier items to read as clock positions in the
*previous* hour (58:22, 55:00), the same way the "0:00 means the top of the
hour" fix treated :00 as a wrap point rather than a wall.

- `lib/time.ts`: new `wrapHour(seconds)` — `((seconds % 3600) + 3600) %
  3600`, i.e. wherever that moment actually sits on a 60-minute dial,
  regardless of sign or magnitude. Replaces `signedDur()` in
  `BacktimerScreen.tsx` entirely (no longer used anywhere, kept in
  `lib/time.ts` in case something else wants a literal signed delta later,
  but nothing currently does).
- `BacktimerScreen.tsx`: every displayed start time — the per-row "Starts"
  column/card value, and the header's overage tag — now shows
  `dur(wrapHour(it.start))` instead of the raw signed value. The
  **underlying raw `start` from `withBackTimes()` is unchanged** and still
  goes negative internally; that's deliberately kept as the source of truth
  for *detecting* a boundary crossing (`it.start < 0`), which still drives
  the accent-colour styling on that row and whether the header warning
  shows at all — only the number shown to the user changed, not the
  underlying maths or the "something crossed the hour" signal.
- Worth knowing: this wraps onto *a* 60-minute dial, not a specific
  calendar hour — Backtimer has no hour-of-day concept (per the original
  design), so overrunning by more than a full 60 minutes would wrap back
  round rather than distinguish "one hour early" from "two hours early".
  Not addressed; a real scenario that overruns by more than an hour is rare
  and arguably a sign something else needs fixing first.

Verified with Playwright, the user's exact scenario (out 10:00; items
0:17, 2:10, 9:11, 3:22): now reads 9:43, 7:33, 58:22, 55:00 — matching
exactly what was asked for — with the last two rows still flagged in
accent colour and the header reading "starts 55:00 — in the hour before
this one". Also checked the same crossing on the mobile card layout, and
re-confirmed a non-crossing case (a smaller items list against the same
10:00 out time) still displays plainly with no accent colour, i.e. the
wrap logic is invisible until it's actually needed.

## Per-domain link previews for backtimer.baish.net (2026-09-29)

User's real-world report: sharing the `backtimer.baish.net` link in a chat
app shows a preview card titled "Clockwheel" with no image. Cause: a link
preview ("unfurl") is built by the sharing app's own crawler reading
`<meta>` tags straight out of the static HTML — it never runs JavaScript,
so `Nav.tsx`'s `document.title = 'Backtimer'` (client-side, JS-driven) was
invisible to it; the crawler only ever saw the one hardcoded `<title>` and
zero `og:image` tag that `index.html` shipped with from the start.

Fixing this needed something the *hostname-based runtime check*
(`lib/hostMode.ts`) can't reach, because a crawler's plain HTTP GET never
executes that check — the two domains needed to actually receive different
static HTML. Kept the "one build, one deployment" principle from the
original backtimer.baish.net work by using Vite's native multi-page-app
support plus a Vercel host-based rewrite, rather than a second build or a
runtime Edge Function:

- `og-clockwheel.png` / `og-backtimer.png` (new, `public/`): 1200×630
  preview images, generated by rendering a small standalone HTML/SVG
  template (matching the app's real palette — `--color-bg` `#f5ead8`,
  `--color-surface` `#ebddc5`, `--color-accent` `#c67139`, Caprasimo
  heading font — not the generic default favicon, which is an unrelated
  placeholder graphic) and screenshotting it with Playwright. Not built by
  the app itself; these are static assets checked into `public/`.
- `backtimer.html` (new, repo root, sibling to `index.html`): a second HTML
  entry point, identical to `index.html` except its `<title>`,
  `og:*`/`twitter:*` tags, and `og:image` point at "Backtimer" and
  `og-backtimer.png`. Both load the exact same `src/main.tsx` — which app
  actually renders (Clockwheel UI vs Backtimer-only UI) is still entirely
  `lib/hostMode.ts`'s runtime hostname check, same as before; this only
  fixes what a non-JS crawler sees before that check ever runs.
- `vite.config.ts`: `build.rollupOptions.input` now lists both HTML files,
  Vite's standard multi-page-app mechanism. Confirmed both entries share
  one output JS bundle and one CSS file (Vite dedupes the shared
  `src/main.tsx` import automatically) — so this doesn't double the
  app's actual code, just adds one small extra HTML shell. Note for future
  publishes: the output bundle's filenames changed from `index-*.{js,css}`
  to `main-*.{js,css}` (Rollup names chunks after the input's key, and the
  input now has two explicitly-named keys instead of one implicit one) —
  the artifact-publishing steps in this file's own instructions need that
  glob updated accordingly.
- `vercel.json` (new): a single `rewrites` rule — when the request's `host`
  header is `backtimer.baish.net`, serve `/backtimer.html` instead of
  `/index.html` for the root path. Everything else (the shared JS/CSS,
  `favicon.svg`, both `og-*.png` files) is untouched by this rule and still
  served as plain static files regardless of host, since the rewrite's
  `source` only matches `/` exactly.

Verified with Playwright: built output has both HTML files each referencing
the identical shared JS/CSS filenames; loading `backtimer.html` directly
(the same file Vercel's rewrite will serve on that domain) renders the full
working Backtimer-only app exactly as `index.html?host=backtimer` already
did, confirms its `og:title`/`og:image` tags read "Backtimer" /
`og-backtimer.png` without needing any JS to run, and confirms
`og-backtimer.png` itself actually loads (200, `image/png`) rather than
just being a correctly-worded but broken reference; re-checked `index.html`
on its own is completely unaffected (still "Clockwheel", still all 7 nav
links). Not verified: the actual rendered preview card in a real chat app,
since that depends on `backtimer.baish.net`'s DNS/Vercel domain setup
(still pending, per the earlier backtimer.baish.net section) and on each
platform's own crawler, which this session can't invoke directly — worth
the user checking once the domain + this deploy are both live (some apps,
notably iMessage, cache a link's preview the first time it's sent to a
given conversation, so a stale "Clockwheel" card seen before this shipped
may need a fresh conversation/link to pick up the fix, not just a resend).

## Follow-up: Clockwheel's link-preview wording (2026-09-29)

Small wording tweak: the Clockwheel description said "clockwheels" — user
asked for "clocks" instead, to stop echoing the product's own name back
inside its own description. Changed in three places in `index.html`
(`meta[name=description]`, `og:description`, `twitter:description`) from
"Build broadcast radio clockwheels and print-ready hour clocks." to "Build
broadcast radio clocks, ready to print for any hour." — and regenerated
`public/og-clockwheel.png`, since the tagline is baked into that image as
rendered text, not read from the meta tag. Backtimer's copy was
user-confirmed already good and untouched.

Also worth logging: right after shipping the per-domain preview fix, the
user reported still seeing the old "Clockwheel" card when sharing the
`backtimer.baish.net` link. Couldn't verify server-side myself — this
session's sandbox has no outbound network access at all (confirmed by
trying to fetch both the live site and Vercel's own docs, both blocked at
the egress proxy, not application-level) — so there's no way to `curl` the
live HTML or otherwise confirm from here whether `vercel.json`'s rewrite is
actually matching in production. Best guess, not confirmed: this is the
link-preview caching behaviour already flagged when this was first built —
iMessage and similar caches a URL's preview card server-side (Apple's
servers, not the device) the first time it's shared, independent of
whatever the site serves afterwards, so a `backtimer.baish.net` link sent
before this fix shipped could keep showing the stale card indefinitely
regardless of resends. Asked the user to test with the link in a context
it's never been sent in before, to isolate "still actually broken" from
"just an old cached card" — outcome not yet known as of this entry.

## Follow-up: vercel.json's host-based rewrite doesn't fire for "/" — trying Edge Middleware instead (2026-09-29, unresolved)

The per-domain link-preview fix above didn't actually work once deployed —
user confirmed on a second, different phone (ruling out per-device or
Apple-side caching — iMessage's "typing a link" preview is generated live
by whichever phone is composing, not from a shared server cache, so two
fresh phones agreeing means the live server is genuinely still returning
Clockwheel's tags for `backtimer.baish.net`, not that something's cached).

Diagnosed step by step, since this session still has no outbound network
access and can't just fetch the live site to check directly:
- Confirmed the deploy that added `backtimer.html`/`vercel.json` (and every
  one since) shows "Ready" in Vercel's dashboard — not a failed build.
- Asked the user to visit `backtimer.baish.net/backtimer.html` and
  `clockwheel.baish.net/backtimer.html` directly (typed URLs, not shared
  links). Both loaded correctly and both tabs read "Backtimer" — proving
  the file itself is present and correct in the deployment, on both
  domains, when addressed by its real name.
- That isolates the fault to exactly one thing: **`vercel.json`'s
  `rewrites` rule for `source: "/"` never fires**, even though the
  destination file it points to is right there and working. Best
  explanation (not independently verified against Vercel's docs, since
  those are equally unreachable from here): a request for the literal path
  `/` already matches a real file — `index.html` — via Vercel's own default
  "serve the file that exists" behavior for static deployments, and that
  resolution likely happens before, or instead of, evaluating a custom
  `has`-conditioned rewrite. A rewrite conditioned on Host might work fine
  for a path that *wouldn't* otherwise resolve to anything, but `/` isn't
  that case.
- Correction to this file's own earlier (wrong) diagnostic: the fact that
  the *app itself* has always behaved correctly on `backtimer.baish.net`
  (locked to the Backtimer screen) was never actually evidence that the
  right HTML file was being served — `index.html` and `backtimer.html`
  both boot the identical JS bundle, which does its own independent
  `window.location.hostname` check (`lib/hostMode.ts`) regardless of which
  of the two static shells loaded it. That check would look identical
  either way, so it couldn't have told us anything about which file the
  rewrite was actually choosing.

**Attempted fix (unverified — needs the user to check after this
deploys):** `middleware.ts`, new file at the project root. Vercel Edge
Middleware runs on every matching request *before* static files are
resolved at all, which should sidestep the precedence problem a
declarative rewrite apparently has for `/`. Deliberately written using
only standard `Request`/`Response`/`fetch` — no `@vercel/edge` or
`next/server` import — because this is a plain Vite project (not Next.js),
and this session couldn't verify the exact non-Next helper API
(`rewrite()`/`next()` equivalents) against live documentation while
offline. Instead, on a `backtimer.baish.net` request it just `fetch()`es
this same deployment's own `/backtimer.html` and returns that `Response`
directly — using nothing beyond web standards should make it more likely
to actually behave as written, at the cost of being less idiomatic than
whatever Vercel's own helpers would offer. `config.matcher: '/'` scopes it
to just the root path, leaving asset requests untouched. The existing
`vercel.json` rewrite was left in place rather than removed — harmless if
unused, and no reason to touch it while this is still unverified.
`middleware.ts` sits outside `src/`, so it's not picked up by either
tsconfig (`tsconfig.app.json` only includes `src`, `tsconfig.node.json`
only `vite.config.ts`) — confirmed `npm run build`/`npm run lint` are
unaffected by its presence.

**Not yet confirmed working.** Next step is the user checking
`backtimer.baish.net/` again (a fresh/never-sent link, same test as
before) once this deploys. If Middleware *also* doesn't fix it, the
likely next things to try, roughly in order: (1) an actual `redirect`
(not rewrite) in `vercel.json` with the same `has: host` condition — a
much simpler, more battle-tested mechanism, at the cost of visibly
changing the URL to include `/backtimer.html`; (2) revisiting whether
`@vercel/edge`'s real (not guessed) rewrite helper behaves differently
than a raw `fetch()` pass-through; (3) asking the user to check Vercel's
own deployment logs for `middleware.ts` specifically (Vercel's dashboard
shows whether Middleware compiled and is actually attached to a
deployment, which would immediately confirm or rule out a syntax/detection
problem this session has no way to see from here).

## backtimer.baish.net link preview, round 2: middleware regressed to *no* preview (2026-09-29)

After the `middleware.ts` fix above was deployed, the user reported a
*different* symptom on a never-before-shared link: no preview card at all,
rather than the previous wrong-but-readable "Clockwheel" one.

Diagnosis (not independently confirmed — no live network access this
session, as usual — but a known footgun for exactly this pattern):
`return fetch(...)` handed back the upstream `Response` object completely
unchanged, including headers like `content-encoding`,
`content-length`/`transfer-encoding` that described the *original* fetch.
Vercel's edge re-serving that same Response under a different outer
request can mismatch those headers against the actual bytes, corrupting or
truncating the body. A crawler that gets a broken body finds no readable
`<meta>` tags at all — which fits "no preview," as opposed to a body that
loads fine but just has the wrong tags in it (the earlier symptom, from
before middleware existed, when the real static `index.html` was being
served untouched).

Fix: read the upstream response out as text and construct a fresh
`Response` with only the header it actually needs
(`content-type: text/html; charset=utf-8`), instead of forwarding the
original `Response` object. Same `fetch('/backtimer.html', ...)` call,
just no longer passing its headers through wholesale.

**Still not confirmed working** — next step is the user testing a
never-shared `backtimer.baish.net` link again once this redeploys. If this
still doesn't produce the right preview, the fallback list from the entry
above still applies (actual `redirect` instead of rewrite/middleware being
the most likely next thing to try).

## Other known backlog (not urgent, not asked for — just context)

- Per-anchor over/under (the fuller "over by 2:30 before the 07:29 anchor"
  version from the original brief) was explicitly dropped along with pins.
- Library's Duplicate stays on Library after cloning; EditorHeader's
  Duplicate jumps straight into editing the copy — deliberate, different
  contexts.
- Change history / per-segment notes / a real multi-user Share link are all
  out of scope per earlier discussion (no backend).

## Four small usability fixes (2026-09-29)

- **Library export filename now includes the time, not just the date.**
  `LibraryScreen.tsx`'s `handleExport` used
  `clockwheel-${new Date().toISOString().slice(0, 10)}.json` — two exports
  in the same day collided/overwrote each other. Now builds a local-time
  (not UTC — a filename is for the person reading it off their own wall
  clock) `YYYY-MM-DD-HHmm` stamp inline with a small `pad()` helper, no new
  dependency needed for one call site.
- **Week screen: double-clicking an assigned cell opens that clock in
  Clock mode.** Added `onDoubleClick={() => { if (id) openClock(id); }}`
  to the grid cell — `openClock` already sets both `openClockId` and
  `screen: 'clock'` in one store action (existing), so no new store code
  needed.
- **Week screen: the grid cells now show the assigned clock's name**, not
  just its colour swatch. Each cell got a `<span>` with
  `whiteSpace: nowrap; overflow: hidden; textOverflow: ellipsis`, sized to
  the cell — long names truncate with `…` rather than overflowing into
  neighbouring cells (verified visually at a realistic ~134px cell width).
  Text colour uses the existing `contrastInk()` helper (already used for
  category pills) so it reads against whichever of the rotating
  `CLOCK_COLORS` that clock has, instead of hardcoding one text colour that
  might not contrast against every swatch.
- **Library: clicking a clock's name opens it**, same as the existing
  "Open" button — just an `onClick={() => openClock(id)}` plus a
  `.library-clock-name:hover` CSS rule (accent colour + underline) so it
  reads as clickable, following the same hover-affordance pattern already
  used for `.week-pick-label`/`.week-toggle-local`/`.week-picker-row`.

All four verified end-to-end with a scripted Playwright pass against a
production build (`vite preview`) rather than just a type-check: assigned
a clock to a Week cell, confirmed the cell showed its name, double-clicked
it and confirmed the Clock screen opened with that clock's name in the
header field, clicked a Library card's name and confirmed the same, and
captured the actual downloaded filename from a real Export click
(`clockwheel-2026-09-29-1837.json`). Also renamed a clock to a
50-character string and screenshotted the resulting Week cell to confirm
the ellipsis truncation looks right rather than just trusting the CSS.

## Seed clock renamed "Daytime 1" → "Example" (2026-09-30)

`data/clocks.ts`'s `seedClocks()` — the one clock a brand-new browser
starts with, since `loadInitial()` in `state/store.tsx` only calls it when
`localStorage` has no saved state at all — is now named `"Example"`
instead of `"Daytime 1"`. Existing users (anyone with saved state already)
are unaffected; this only changes what a first-time visitor sees. Verified
with a fresh (no localStorage) Playwright page load against a production
build, confirming the Library card reads "Example".

## New Guide screen, placeholder text (2026-09-30)

John wants an intro screen for Clockwheel explaining how to use it,
written in his own words — this adds the screen and its plumbing with
clearly-labelled placeholder copy, ready for his text to replace it later.

- `src/screens/GuideScreen.tsx` (new): a `.card`-based page — kicker
  ("Start here") + `<h2>How to use Clockwheel</h2>`, an intro paragraph,
  then one `<h3>`/paragraph pair per existing tab (Library, Clock, List,
  Week, Summary, Categories), all currently reading "Placeholder — …". A
  `Go to Library` primary button at the end calls `setScreen('lib')`. Not
  meant to be the final shape — John may want to restructure once he's
  actually writing, this is a reasonable starting layout, not a spec.
- `state/store.tsx`: `Screen` type gained `'guide'` (added first in the
  union, matches its nav position). `loadInitial()` now special-cases the
  *no-`localStorage`-at-all* branch to return `screen: 'guide'` instead of
  the regular `defaults.screen` ('lib') — everywhere else (existing state,
  parse errors, backtimer pinning) is untouched. This piggybacks on the
  exact same "is this a first-ever visit" check the Example-clock seeding
  already relies on, so the two stay in sync for free: once someone
  navigates anywhere, `screen` gets persisted like the rest of the state,
  so this only ever fires once per browser — after that, Guide is still
  reachable, just not automatic.
- `components/Nav.tsx`: added `{ screen: 'guide', label: 'Guide' }` as the
  *first* entry in `LINKS`, ahead of Library. Nothing else needed for the
  "not on backtimer.baish.net" requirement — `Nav` already reduces `links`
  to `[]` on `isBacktimerHost()`, so a new `LINKS` entry is automatically
  excluded there with no extra flag.
- `src/App.tsx`: added the `GuideScreen` import and
  `{screen === 'guide' && <GuideScreen />}` alongside the other screens.

Verified end-to-end with Playwright against a production build: a fresh
browser on the Clockwheel domain lands on Guide with a working "Go to
Library" button; reloading afterward stays on Library (doesn't re-show
Guide); the Guide nav link still opens it on demand; and a fresh browser
on `?host=backtimer` (same host-mode check `backtimer.baish.net` uses) has
no Guide link and never renders the Guide screen at all.

**Not done yet — waiting on John:** the actual wording. He's writing it
himself in a separate doc and will share it here; next step is swapping
the `SECTIONS` placeholder content (and the intro paragraph) for his real
text, and adjusting the section structure/headings if his version doesn't
map one-to-one onto the six tabs.

## Nav reordered to Library, Categories, List, Clock, Week, Summary, Backtimer, Guide (2026-09-30)

John's requested reading order. Guide confirmed to go last, after checking
where it had been placed (first, ahead of Library) before making the
change. Purely a reorder of `Nav.tsx`'s `LINKS` array — no other logic
depends on that array's order. In particular, the auto-land-on-Guide
behaviour for a first-ever visit (`loadInitial()` in `state/store.tsx`)
is driven by a separate check, not by `LINKS` position, so it still fires
correctly with Guide moved to the end — verified with a fresh-localStorage
Playwright load after the reorder.

## Fonts self-hosted instead of loaded from Google's CDN (2026-09-30)

Follow-up to a UK GDPR/PECR conversation with John (not code — just
discussing what the app does with data before he opens it up to other
users). One concrete finding from actually checking the code: `organic.css`
was loading Caprasimo and Figtree live from `fonts.googleapis.com`, which
means every visitor's browser contacted Google directly on every page
load, handing over their IP address with no way to know it was happening.
This is a well-known specific gotcha in this space (a German court ruled
on exactly this pattern in 2022) and is trivial to remove entirely rather
than reason about.

Fixed by switching to `@fontsource/caprasimo` and `@fontsource/figtree`
(new `dependencies`), which ship the actual font files and bundle them at
build time instead of fetching them live. `organic.css`'s `@import url(...)` of
Google's CSS2 endpoint became four `@import` lines pulling in exactly the
weights the old URL asked for (Caprasimo 400; Figtree 400/600/700) —
`@fontsource/<font>/<weight>.css`. Vite resolves these like any other
node_modules CSS import and inlines the referenced `.woff2`/`.woff` files
as hashed assets under `dist/assets/`, so the built site is fully
self-contained.

Verified with Playwright against a production build: zero requests to any
non-localhost origin on page load (previously this would have shown
`fonts.googleapis.com`/`fonts.gstatic.com`), and `document.fonts` reports
both Caprasimo 400 and Figtree 400 as `status: "loaded"` from local
(200-status, localhost) `.woff2` files — confirmed visually too, headings
still render in Caprasimo. No visual change, same weights as before.

## Backtimer: legal/contact footer + a Clear button (2026-09-30)

Backtimer is being circulated to trial users before Clockwheel is, so
John wanted its "nothing is sent anywhere, here's who to contact" notice
in place first — Clockwheel's equivalent is going into the Guide screen's
text, which he's writing separately, and can wait.

- `state/store.tsx`: new `resetBacktimer` action —
  `setEdited((s) => ({ ...s, backtimer: seedBacktimer() }))` — wipes the
  out time back to 60:00 and empties the item list. Unlike every other
  destructive action in this app (`removeSegment`, `removeBacktimerItem`,
  `deleteCategory`, …), which all act without a confirmation prompt, this
  one is guarded by a `window.confirm()` in `BacktimerScreen.tsx`
  (`handleClear`) — the first `window.confirm` anywhere in the codebase.
  Justified because there's no library of saved Backtimers to fall back
  on the way there is for clocks: this wipes the *only* copy of whatever
  someone's typed in, so it's meaningfully more destructive than anything
  else a stray click could do here.
- A "Clear" button sits top-right, next to the existing "Add item" button.
- A footer notice, exact wording as given, sits below the table/cards
  (marked `data-noprint="1"` — it's not part of the printed schedule):
  "Thanks for visiting. Backtimer is a free-to-use personal project by
  John Baish. It is not supported by the BBC. Nothing you type here is
  sent anywhere; your data is only saved in your own browser and you can
  clear it at any time. Contact: backtimer@baish.net." The words "clear
  it" are a `<button>` styled as inline underlined text (not a separate
  component — just enough CSS reset to look like a text link) calling the
  same `handleClear`, so both entry points share one confirm-then-reset
  path. The email address is deliberately plain text, not a `mailto:`
  link, per John's instruction.
- Because `BacktimerScreen` is the exact same component regardless of
  which domain rendered it (`App.tsx` just checks `screen === 'backtimer'`
  — see `lib/hostMode.ts` for how the domain-specific bits elsewhere in
  the app work), this footer needed no host-conditional logic at all to
  appear on both `backtimer.baish.net` and Clockwheel's own Backtimer tab.

Verified with Playwright: the exact notice text renders in both contexts;
no `mailto:` link exists anywhere on the page; clicking Clear (or "clear
it") after dismissing the confirm leaves the item list untouched; accepting
it resets to 0 items / 60:00 out time.

## Backtimer: copy tweaks, footer spacing, and a Reverse (display order) button (2026-09-30)

Follow-up round after John actually saw the footer live.

- Empty-state copy (both the mobile-card and desktop-table branches) is now
  "No items yet — check and change your out time above, then add the name
  and duration of the items before it, working backwards." — replacing
  "add the last thing before your out time first."
- Footer: dropped the opening "Thanks for visiting." (John's own call,
  after seeing it live — read as implying he had something to gain from
  visits) and gave it noticeably more breathing room above the divider
  (`marginTop` 'var(--space-6)' → a flat `64` — "a few lines," not the
  existing spacing scale's next step up, which would have been too small
  a jump from --space-6's 26.4px to --space-8's 35.2px).
- **New Reverse button** (`toggleBacktimerReversed` in `store.tsx`,
  persisted as `backtimer.reversed`), sitting on its own centered row
  between the list and the footer — deliberately not grouped with
  Add item/Clear, since it's a view preference rather than a data-editing
  action. Only rendered when there's at least one row (nothing to flip
  otherwise).
  - `reversed` is **display-only** — it never touches `items`' stored
    order or how times are calculated. `BacktimerScreen` now computes
    `computed = withBackTimes(seed, outTime)` (the one true order,
    latest-thing-first) and derives `rows = reversed ? [...computed].reverse() : computed`
    for everything that renders. The "starts in the hour before this one"
    warning stays anchored to `computed`'s last element specifically —
    that's about the underlying data (which item is genuinely earliest),
    not about which end of the list is currently on top, so it must NOT
    read from the flipped `rows`.
  - The one place a flip isn't free: drag-reorder. `useDragReorder` always
    works in on-screen row positions and calls back with those same
    positions; when `reversed`, visual position `i` is the mirror of the
    real array index (`rows.length - 1 - i`), so `commitReorder` in
    `BacktimerScreen.tsx` translates both the `from` and `to` index through
    that mirror before calling `reorderBacktimerItems`. Verified by name:
    added Item A/B/C in that order (so array order is A,B,C — "Add item"
    still always appends), reversed the display (confirmed C,B,A on
    screen), dragged the top row to the bottom (confirmed B,A,C — i.e. C
    moved to the end while B/A's relative order held), then un-reversed
    and confirmed the underlying array is genuinely now C,A,B — the
    mirror-image of what the reversed view showed post-drag, proving the
    translation, not just the display, was correct.
  - "Add item" / Tab-past-the-last-row-adds-a-new-one deliberately keep
    their existing meaning ("append the next-earliest item to the real
    array") regardless of `reversed` — not reinterpreted as "append at
    whichever end is on screen." The new row's input still autofocuses
    (existing behaviour, unchanged), and focusing an off-screen input
    scrolls it into view regardless of which end of a reversed list it
    lands on, so this doesn't strand anyone typing.
  - `reversed` is optional on the `BacktimerState` type
    (`reversed?: boolean`) rather than required, because it was added
    after Backtimer already had real persisted users — `loadInitial()`'s
    shallow `{...defaults, ...parsed}` merge doesn't backfill new fields
    on an already-saved nested object like `backtimer`, so existing saved
    state has no such key at all. Every read treats a missing value as
    `false` (`!!backtimer.reversed`) rather than assuming the field exists.
  - `resetBacktimer()`/Clear already resets to `seedBacktimer()` wholesale,
    which now includes `reversed: false` — confirmed Clear also un-reverses
    as part of wiping everything else back to its starting state.
  - New `IconArrowUpDown` in `lib/icons.tsx` (lucide-react's
    `ArrowUpDown`), following the file's existing `withStroke` pattern.

All of the above verified end-to-end with Playwright against a production
build, in both the desktop-table and mobile-card (narrow) layouts.

## Renamed Clockwheel → Clockmaker (2026-09-30)

John's reasoning: "Clockwheel" looks less like a wheel now that the UI has
moved on, some people may only ever use the List layout (not the circular
Clock face the old name evoked), and a word ending "-er" reads as a
"doing" word — a maker's tool, not a noun for the object it produces.

**What actually changed** (all cosmetic, user-facing text only):
`Nav.tsx`'s brand span, `index.html`'s `<title>`/`og:title`/`twitter:title`,
`GuideScreen.tsx`'s placeholder heading and intro paragraph, two
`importState` error messages in `store.tsx`, and a handful of code
comments (`hostMode.ts`, `vite.config.ts`, `Nav.tsx`, `store.tsx`) for
accuracy. `LibraryScreen.tsx`'s export button now downloads
`clockmaker-YYYY-MM-DD-HHmm.json` instead of `clockwheel-...json` — purely
the filename a browser saves, which nothing in the app ever reads back, so
changing it has zero effect on whether any file (old or new) imports.

**What deliberately did NOT change, and why** — this was the actual point
of thinking it through before touching anything:
- **`STORAGE_KEY = 'clockwheel-state-v2'`** (`store.tsx`) — the
  `localStorage` key everything is actually saved under. Never shown to
  anyone. Changing it would make `loadInitial()` find nothing under the
  new key and treat every existing user (including John, mid-project) as
  brand new — not deleting their old data, just silently never looking at
  it again. Left exactly as-is, permanently; a comment now says so
  explicitly at the declaration, so nobody "fixes" this later by mistake.
- **`app: 'clockwheel'`** — the tag stamped into every exported backup
  JSON's wrapper object, and checked on import
  (`wrapper.app !== 'clockwheel'`). Also never shown to anyone. Left as the
  literal string `'clockwheel'` on both the write side (`exportState`) and
  the read side (`importState`'s check) — so every backup, from before this
  rename, after it, or in the gap between renaming the code and someone
  actually re-exporting, is stamped and read identically. Only the
  *human-readable* wording around that check changed ("Clockmaker export
  file" instead of "Clockwheel export file").
- **The domain.** `clockwheel.baish.net` is unchanged — John's doing the
  DNS side separately, in his own time, and it wasn't this session's place
  to guess a new domain name or pre-emptively point anything at a domain
  that doesn't exist yet (that would just break the thing it was meant to
  fix). So: `og:url` and `og:image` in `index.html` still read
  `https://clockwheel.baish.net/...` — deliberate, commented in place — and
  the actual link-preview image `public/og-clockwheel.png` was
  regenerated in place (same filename, same URL) with "Clockmaker" in the
  artwork instead of "Clockwheel", so the *currently live* domain shows
  correct-looking branding immediately, without waiting on DNS. Follow-up
  once the new domain exists: update `og:url`/`og:image` to match it (and
  probably rename the image file at that point, since nothing will still
  depend on the old path).
- **The GitHub repo name** (`JohnBaish/clockwheel`) and whatever Vercel
  calls the project internally — recommended against renaming either.
  Neither is ever visible to an end user; renaming a GitHub repo mid-flight
  risks Vercel's git integration needing to be reconnected for no visible
  benefit. Treated the same as `STORAGE_KEY` — an internal codename that's
  fine to permanently outlive the product's current display name.

**One expected side effect during the gap before DNS moves:** visiting
`clockwheel.baish.net` now shows a site titled/branded "Clockmaker" — the
domain and the displayed name won't match until John's DNS work is done.
Flagged to him in advance; not a bug.

Not touched: Backtimer's own branding (`backtimer.html`'s tags, its
footer text, `BACKTIMER_HOST` in `hostMode.ts`) — already fully
independent of the word "Clockwheel"/"Clockmaker" either way, confirmed
by the original audit before making any change.

## Time columns get a permanent "read-only" chip (2026-09-30)

John noticed List's Time column and Backtimer's Starts column looked the
same as the genuinely editable Dur column, because `.table tbody tr:hover`
lights up the whole row's background — hovering a Time value drew a pale
box that looked exactly like an invitation to click, even though nothing
happens if you do. His own proposed fix: make that pale box permanent for
Time specifically (not row-triggered), darkening further only on direct
hover, so it reads as a static value rather than an editable one at a
glance — the opposite state to `.plain-input`, which shows nothing until
you're about to interact with it.

Implemented pretty much exactly as he described: new `.time-chip` class
(`global.css`) — `background: var(--color-neutral-100)`, pill-shaped,
`:hover` steps to `var(--color-neutral-200)`. No `cursor: pointer` — there's
nothing to click, so the cursor staying the default arrow matters as much
as the visual treatment. Wrapped around the computed time value specifically
(not the whole `<td>`) in all four places it appears: `ListScreen.tsx`'s
desktop table Time column and narrow-card time span, and the equivalent
pair in `BacktimerScreen.tsx`'s Starts column. Existing conditional
styling (bold+dark for a pinned segment in List, accent color for a
Backtimer item that's rolled into the hour before) moved from the `<td>`
onto the new `<span>` — same logic, just now colouring the chip's text
rather than a bare `<td>`.

## baish.net root domain: a simple 3-link landing page (2026-09-30)

John wants people who wander to bare `baish.net` out of curiosity (rather
than a specific subdomain) to land somewhere useful instead of the old
Blogspot default it currently resolves to. Asked for a simple page, in
keeping with Clockmaker's look, linking to Backtimer, Clockmaker (even
though that subdomain doesn't exist yet — deliberate, per John), and his
blog.

**New files:**
- `landing.html` (project root, sibling to `index.html`/`backtimer.html`) —
  three whole-card links (`.card.link-card`), each with a title and one
  line of description. Not built on the React app at all — no `#root` div,
  no app-mounting script. Its OG/meta tags point at `https://baish.net/`
  directly (unlike Clockmaker's og:url during its own rename — baish.net
  *already* resolves somewhere today, John's just repointing it, so unlike
  a subdomain that doesn't exist at all yet, this URL will be correct the
  moment his DNS change lands, not before and not in some broken interim).
- `src/landing.ts` — the entry script `landing.html`'s `<script type="module">`
  points at. Only imports `organic.css`/`global.css` — deliberately not
  `main.tsx` — so the fonts/colors/`.card` styling match the rest of the
  site without pulling in React or any app code. Confirmed in the build
  output: `landing.html` loads a ~0.7kB CSS-import shim, not the ~260kB
  React bundle `index.html`/`backtimer.html` load.
- New `.link-card` class (`global.css`): `.card` (organic.css) plus a
  link-specific hover/focus state (accent border + faint accent tint) —
  built on the existing card styling rather than a bespoke one, and this
  is the one place in the app where that hover *should* imply "click me",
  unlike the time-chip above.

**Routing (extends the same pattern `backtimer.baish.net` already uses):**
- `vite.config.ts`: added `landing.html` as a third `rollupOptions.input`
  entry, so it gets built as its own real file Vercel/middleware can serve.
- `middleware.ts`: refactored the inline backtimer-specific logic into a
  shared `serveStatic(path, request)` helper (fetches this deployment's own
  static file and rebuilds the Response with just the header it needs —
  same header-corruption fix from the backtimer.baish.net saga, now shared
  rather than duplicated), then added
  `if (host === 'baish.net' || host === 'www.baish.net') return serveStatic('/landing.html', request)`
  alongside the existing backtimer branch. `www.` handled defensively even
  though nothing points there yet — costs nothing, and someone typing the
  www. prefix out of habit shouldn't hit a different result than someone
  who doesn't.

**What this session could and couldn't verify:** `landing.html` itself
(content, links, hover state) was checked directly with Playwright against
a production build — screenshots taken, all three links and their exact
href targets confirmed, `.link-card` hover state confirmed. What could
NOT be verified here: the actual host-based routing in production, since
`vite preview` doesn't run Vercel Edge Middleware at all — that only
executes on Vercel's real infrastructure. Confidence here rests on this
being the identical pattern already proven working for
`backtimer.baish.net` in production (same session, see the link-preview
saga above), applied to one more host string.

**Left for John — advice given, not yet actioned:**
1. **Same Vercel project, not a new one.** A Vercel project already serves
   multiple custom domains simultaneously (`clockwheel.baish.net` and
   `backtimer.baish.net` both point at this one project today) — adding
   `baish.net` as a third custom domain on the *same* project is the same
   action John's already done twice, not a new kind of setup.
2. **The exact DNS record is Vercel's to give, not this session's to
   guess.** A subdomain (`backtimer.baish.net`) usually wants a CNAME; an
   apex/root domain (`baish.net` itself, no subdomain) technically can't
   have one — Vercel's own domain-settings page will show the specific
   record type and value it wants once John adds `baish.net` there. Not
   asserted here from memory, since this session has no live access to
   confirm today's exact value and a wrong guess would be worse than no
   answer.
3. **`www.baish.net`** — code already handles it (see above); John would
   still need to add it as a domain in Vercel/DNS too if he wants it to
   actually resolve, same as the bare domain.

**Follow-up (2026-09-30):** John gave the blog URL —
`https://jbaish.blogspot.com/` — confirming the guess above about Blogspot
custom-domain mappings; swapped in for the `"#"` placeholder. He also
asked to flip the header's visual hierarchy: `<h1>` (heavy Caprasimo) is
now "baish.net" (lowercase, matches how he writes the domain elsewhere),
and `.card-kicker` (small, muted, accent-coloured, already
`text-transform: uppercase` in CSS) now holds "John Baish" — written in
mixed case in the markup since the CSS transforms it to caps regardless,
so the source stays a normal name rather than a hardcoded shout. This page
is now feature-complete on the code side; only John's DNS/Vercel-domain
step remains before it's actually reachable.

## clockmaker.baish.net is live — link-preview tags follow-up (2026-09-30)

John's DNS work landed: `clockmaker.baish.net` now resolves (confirmed via
the CNAME already visible in his DNS panel screenshot, matching
`backtimer`/`clockwheel`'s target, plus his own confirmation it's working).
This was the deferred half of the Clockwheel → Clockmaker rename — at the
time, `index.html`'s `og:url`/`og:image` were deliberately left pointing at
`clockwheel.baish.net` since the new domain didn't exist yet.

- `public/og-clockwheel.png` → renamed to `public/og-clockmaker.png` (`git mv`,
  history preserved) — same image, just the filename catching up now that
  there's a stable domain to serve it from.
- `index.html`: `og:image`/`twitter:image` now
  `https://clockmaker.baish.net/og-clockmaker.png`; `og:url` now
  `https://clockmaker.baish.net/`. Comment above them rewritten — no longer
  explaining a deferred TODO, just stating where they point and why.
- `hostMode.ts`'s top comment updated similarly: was written assuming only
  `clockwheel.baish.net` existed; now notes both domains resolve to the
  same project (`clockwheel.baish.net` wasn't removed — John didn't ask for
  that, and its DNS record is still in place per his own screenshot — it's
  just no longer the primary/branded one).

Not touched: `clockwheel.baish.net` itself keeps working (nothing in this
app treats it specially either way — both it and `clockmaker.baish.net`
fall through to the same "else" branch in `hostMode.ts`/`middleware.ts`
that serves the normal app). Whether to eventually retire that domain is
John's call, not something this session assumed.

## Time-chip follow-up, round 2: it was actually meant for Dur, not Starts/Time (2026-09-30)

John reported not seeing the read-only chip change at all, even after a
hard refresh. Investigation confirmed the code was genuinely live (checked
both this working tree and the GitHub-connected one Vercel deploys from,
rebuilt fresh, measured computed styles in a real browser) — the design
just wasn't what he'd actually meant. Two clarifying rounds:

1. First clarification: he wanted the *box* on Dur (the editable column),
   not Starts/Time — reversed from the initial read of his original
   message. Started applying `.time-chip` (pale permanent pill) to Dur
   inputs too.
2. Second clarification, before that above work was even committed: not
   `.time-chip`'s look at all — he doesn't want Dur *permanently* looking
   like Starts/Time's shaded pill. He wants Dur's *current hover state*
   (the border `.plain-input:hover` already shows) to become its
   *permanent* resting look, and then hovering to go one step further —
   either matching the existing editing/focus look, or a darker version of
   the new resting state, whichever reads better. Chose the latter: reusing
   the focus look for mere hover would blur the distinction between "about
   to click" and "now actually editing," which is worth keeping legible.

**What actually shipped:** new `.outlined-input` class (`global.css`),
applied alongside `.plain-input` on all four Dur inputs (List desktop +
narrow, Backtimer desktop + narrow) — NOT a new standalone class, a
modifier compounded onto `.plain-input` specifically so it doesn't touch
`.plain-input` itself, which is shared by segment/item name fields, the
clock name field, and Backtimer's out-time field — none of which were
asked for or should look any different.
```
.plain-input.outlined-input { border-color: var(--color-neutral-300); }
.plain-input.outlined-input:hover { border-color: var(--color-neutral-500); }
.plain-input.outlined-input:focus-visible { border-color: var(--color-accent); background: var(--color-surface); }
```
Three-step progression: resting (light border, what used to be hover-only)
→ hover (darker border) → focus/editing (accent border + filled
background, unchanged from before).

**A real bug caught by actually testing, not just eyeballing a
screenshot:** the first version omitted that third `:focus-visible` line,
relying on the existing single-class `.plain-input:focus-visible` rule
inherited from above. That rule has lower specificity (one class) than
`.plain-input.outlined-input:hover` (two classes) — and clicking a field
with a mouse leaves the cursor *hovering over it while it's also focused*,
which is the normal way anyone edits Dur. Measuring the actual computed
`border-color` in a headless browser (not just looking at a screenshot)
caught that the darker hover border was silently winning over the accent
focus border in exactly that everyday case — the "now editing" cue would
have almost never actually appeared. Fixed by repeating the
`:focus-visible` rule at matching specificity, declared after `:hover`, so
it wins the tie when both pseudo-classes are true simultaneously. Re-verified
after the fix: hovering shows the darker border, and clicking to edit
(mouse still resting on the field) correctly shows the accent border +
fill, not the hover state bleeding through.

Starts/Time's `.time-chip` was left completely untouched throughout this —
John was explicit that only Dur needed fixing, and that Starts/Time would
be revisited separately afterward if needed at all.
