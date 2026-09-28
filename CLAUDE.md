# Clockwheel — implementation status

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
## Other known backlog (not urgent, not asked for — just context)

- Per-anchor over/under (the fuller "over by 2:30 before the 07:29 anchor"
  version from the original brief) was explicitly dropped along with pins.
- Library's Duplicate stays on Library after cloning; EditorHeader's
  Duplicate jumps straight into editing the copy — deliberate, different
  contexts.
- Change history / per-segment notes / a real multi-user Share link are all
  out of scope per earlier discussion (no backend).
