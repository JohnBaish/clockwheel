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
- `src/components/ClockFace.tsx` — the SVG donut. Labels are drawn radially
  (like spokes — "News" at 12 o'clock reads top-to-bottom), not curved along
  the arc; the callout fit-test is capped at the ring's radial thickness
  (`RO-RI-6`), not arc length, since arc length is unbounded for a long
  segment while the ring's physical thickness isn't (this was a real bug,
  fixed — see git log). The hub shows just the open clock's name and hour
  (e.g. "BREAKFAST" / "07:00") — total duration and balance state are
  deliberately not repeated here since they're already in EditorHeader's tag
  row above the face.
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

## Parked for next session — user has NOT asked for these to be done yet

Raised 2026-09-27, explicitly deferred so the user could move on to other
questions. Implement only when the user actually asks to resume this.

1. **Callouts don't move back inside the ring when a segment shrinks.**
   User's report: make a segment's label big enough to force it into a
   callout (outside the ring, with a leader line), then shrink the segment
   back down to a size that should fit inline again — it stays a callout.
   Worth a careful look before assuming the fix: `ClockFace.tsx`'s
   `buildFace()` recomputes `scored`/`callouts`/`inner` from scratch on
   every call (it's a plain function, memoized only on
   `[segments, hour, name, categories]` via `useMemo` in the `ClockFace`
   component) — there's no persisted "this segment is a callout" flag, so on
   the surface it looks like membership should already be fully re-derived
   each render. That means either the repro involves something not yet
   understood (stale memo dependency, a specific ordering of edits, MAX_CALLOUTS
   interaction, etc.), or there's a real bug in how `ratio`/`avail` get
   recomputed. Reproduce it first, in the running app, before touching code.
Item 2 (Print) is now done — see "Recently completed" below.

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

## Requested, deferred to a future session

- **Export/import.** A button to download the current state as a JSON file,
  and one to load a JSON file back in — a manual, no-backend way for a user
  to back up their work or move it between devices, since everything today
  lives only in that browser's `localStorage`. Discussed 2026-09-27 as a
  stepping stone before any real accounts/backend; user explicitly asked to
  park it for later, not build now.

## Other known backlog (not urgent, not asked for — just context)

- Per-anchor over/under (the fuller "over by 2:30 before the 07:29 anchor"
  version from the original brief) was explicitly dropped along with pins.
- Library's Duplicate stays on Library after cloning; EditorHeader's
  Duplicate jumps straight into editing the copy — deliberate, different
  contexts.
- Change history / per-segment notes / a real multi-user Share link are all
  out of scope per earlier discussion (no backend).
