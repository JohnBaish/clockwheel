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
- `src/components/ClockFace.tsx` — the SVG donut. `RO = 140`, `RI = 58`
  (shrunk from 80 on 2026-09-28 to give the ring more radial room and the
  hub less dead space — see below). Labels are drawn radially (like spokes
  — "News" at 12 o'clock reads top-to-bottom), not curved along the arc;
  the callout fit-test is capped at the ring's radial thickness (`RO-RI-6`),
  not arc length, since arc length is unbounded for a long segment while
  the ring's physical thickness isn't (this was a real bug, fixed — see git
  log). Callouts that land on the same shelf (both near :00 or :30, same
  side) are spread apart width-aware in `place()` so they can't overlap —
  also fixed 2026-09-28, see below. The hub shows just the open clock's
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

1. **Overlapping callout labels, fixed.** `ClockFace.tsx`'s `place()`
   assigned every "shelf" item (a callout near :00 or :30, which has nowhere
   useful to point sideways) the exact same `(x, y)` whenever two of them
   shared a side and top/bottom — confirmed by reproducing it with two
   deliberately long-named segments placed either side of :30. Fixed by
   grouping shelf items by side+top/bottom, ordering them to match their
   real position on the ring, and spacing each one out by the previous
   item's actual rendered text width (not a fixed gap — a fixed gap was
   tried first and still overlapped for unusually long labels).
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
5. **Hub shrunk, ring thickened** — `RI: 80 → 58`. Ring thickness goes
   60px → 82px (more inline-label room, so fewer segments need to become
   callouts at all — a nice side effect) and the blank centre is visibly
   smaller. Vertical hub layout (name/hour y-offsets) tightened to match
   the now-much-smaller hour text, rather than leaving a gap.
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

## Other known backlog (not urgent, not asked for — just context)

- Per-anchor over/under (the fuller "over by 2:30 before the 07:29 anchor"
  version from the original brief) was explicitly dropped along with pins.
- Library's Duplicate stays on Library after cloning; EditorHeader's
  Duplicate jumps straight into editing the copy — deliberate, different
  contexts.
- Change history / per-segment notes / a real multi-user Share link are all
  out of scope per earlier discussion (no backend).
