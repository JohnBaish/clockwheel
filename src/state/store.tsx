import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SegmentSeed } from '../data/segments';
import { seedOutside, seedClocks, SEED_CLOCK_ID, CLOCK_COLORS, type Clock, type ClockId } from '../data/clocks';
import { SEED_CATEGORIES, SEED_CATEGORY_ORDER, NEXT_COLORS, type Category, type CategoryId } from '../data/categories';
import { seedBacktimer, type BacktimerState, type BacktimerItemSeed } from '../data/backtimer';
import { contrastInk } from '../lib/color';
import { isBacktimerHost } from '../lib/hostMode';
import { screenFromHash } from '../lib/screenHash';
import { savedCopyDiffers } from '../lib/staleCopy';
import { countOf } from '../lib/words';

export type Screen = 'guide' | 'lib' | 'clock' | 'list' | 'week' | 'summary' | 'categories' | 'backtimer';

interface PersistedState {
  screen: Screen;
  clocks: Record<ClockId, Clock>;
  clockOrder: ClockId[];
  openClockId: ClockId;
  week: Record<string, ClockId>;
  outside: Record<string, true>;
  sumSel: ClockId;
  categories: Record<CategoryId, Category>;
  categoryOrder: CategoryId[];
  backtimer: BacktimerState;
  /** Set by the walkthrough's "Don't show this again" tickbox. Kept outside
   *  `backtimer` on purpose, so Clear (which resets `backtimer`) can't undo it. */
  backtimerWalkthroughOff?: boolean;
  lastEditedAt: number;
}

// Bumped for the multi-clock rewrite: old saved state (a flat segments array,
// a prefilled week, 13 placeholder library clocks) is structurally
// incompatible and would crash if merged — so it's simply left behind
// under the old key rather than migrated, which also happens to be exactly
// the clean start that prompted this rewrite.
//
// Deliberately NOT renamed to match the app's Clockwheel → Clockmaker rename
// (2026-09-30) — this key is never shown to anyone, and changing it would
// make loadInitial() below find nothing and treat every existing user as
// brand new, silently orphaning all their real saved data under the old
// key. An internal identifier outliving a product's display name is normal
// and intentional, not a bug to "fix" later.
const STORAGE_KEY = 'clockwheel-state-v2';

function newId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** True if any clock's segments still reference this category. */
function categoryInUse(id: CategoryId, clocks: Record<ClockId, Clock>): boolean {
  return Object.values(clocks).some((clock) => clock.segments.some((s) => s.c === id));
}

function categoryUsageCountFor(id: CategoryId, clocks: Record<ClockId, Clock>): number {
  return Object.values(clocks).reduce((n, clock) => n + clock.segments.filter((s) => s.c === id).length, 0);
}

function loadInitial(): PersistedState {
  const clocks = seedClocks();
  const defaults: PersistedState = {
    screen: 'lib',
    clocks,
    clockOrder: [SEED_CLOCK_ID],
    openClockId: SEED_CLOCK_ID,
    week: {},
    outside: seedOutside(),
    sumSel: SEED_CLOCK_ID,
    categories: SEED_CATEGORIES,
    categoryOrder: SEED_CATEGORY_ORDER,
    backtimer: seedBacktimer(),
    lastEditedAt: Date.now(),
  };
  // On the Backtimer-only domain, always land on (and stay pinned to) the
  // Backtimer screen — overriding whatever screen a previous visit to this
  // origin happened to save, so there's no way to end up looking at a
  // Clockmaker screen that Nav has hidden the links to.
  // Otherwise, an address naming a screen (…/#week) opens that screen.
  const fromHash = screenFromHash();
  const pin = (result: PersistedState): PersistedState =>
    isBacktimerHost() ? { ...result, screen: 'backtimer' } : fromHash ? { ...result, screen: fromHash } : result;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // A truly first-ever visit (nothing saved yet) lands on the Guide
    // instead of the Library, so someone new sees it before diving in.
    // Once they navigate anywhere, `screen` gets persisted like everything
    // else, so this only ever fires the once.
    if (!raw) return pin({ ...defaults, screen: 'guide' });
    const parsed = JSON.parse(raw);
    return pin({ ...defaults, ...parsed });
  } catch {
    return pin(defaults);
  }
}

interface AppContextValue extends PersistedState {
  /** True once another tab has saved different work. This tab then stops saving
   *  (otherwise it would overwrite the newer copy) until the page is reloaded. */
  changedElsewhere: boolean;
  setScreen: (screen: Screen) => void;
  openClock: (id: ClockId) => void;
  createClock: () => void;
  /** Clones a clock into a new one and returns the new clock's id. */
  duplicateClock: (id: ClockId) => ClockId;
  /** Deletes a clock entirely, clearing any Week assignments that pointed to it. */
  removeClock: (id: ClockId) => void;
  renameClock: (id: ClockId, name: string) => void;
  setClockHour: (id: ClockId, hour: number) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  setSegmentCategory: (segmentId: string, categoryId: CategoryId) => void;
  setSegmentName: (segmentId: string, name: string) => void;
  setSegmentDuration: (segmentId: string, seconds: number) => void;
  /** Sets or clears (pass null) a segment's manually-dragged callout-label position. */
  setSegmentLabelPos: (segmentId: string, pos: { x: number; y: number } | null) => void;
  /** Appends a segment and returns its id. */
  addSegment: () => string;
  removeSegment: (segmentId: string) => void;
  assign: (keys: string[], id: ClockId | null) => void;
  markLocal: (keys: string[], local: boolean) => void;
  setSumSel: (id: ClockId) => void;
  addCategory: (name: string) => void;
  renameCategory: (id: CategoryId, name: string) => void;
  recolorCategory: (id: CategoryId, color: string) => void;
  reorderCategory: (fromIndex: number, toIndex: number) => void;
  /** Returns null on success, or a message explaining why it refused. */
  deleteCategory: (id: CategoryId) => string | null;
  categoryUsageCount: (id: CategoryId) => number;
  setBacktimerOutTime: (seconds: number) => void;
  /** Appends an item and returns its id. */
  addBacktimerItem: () => string;
  /** Appends an item with the given name and returns its id. */
  insertBacktimerItem: (name: string) => string;
  removeBacktimerItem: (id: string) => void;
  setBacktimerItemName: (id: string, name: string) => void;
  setBacktimerItemDuration: (id: string, seconds: number) => void;
  reorderBacktimerItems: (fromIndex: number, toIndex: number) => void;
  /** Wipes the Backtimer back to its starting state (60:00 out time, no items). */
  resetBacktimer: () => void;
  /** Flips between backwards (latest thing on top) and chronological (earliest on top) display. */
  toggleBacktimerReversed: () => void;
  setBacktimerWalkthroughOff: (off: boolean) => void;
  /** Just the Backtimer (out-time, items, Reverse), for the standalone
   *  Backtimer's own Export — a separate, smaller file from exportState(). */
  exportBacktimer: () => string;
  /** Loads a Backtimer export back in, replacing only the Backtimer. Same
   *  contract as importState: null on success (or if `confirm` says no),
   *  otherwise a message saying why the file was rejected. */
  importBacktimer: (json: string, confirm?: () => boolean) => string | null;
  /** All persisted state, wrapped and pretty-printed for a downloadable backup file. */
  exportState: () => string;
  /** Loads a previously exported file back in. Returns null on success, or a
   *  message explaining why it was rejected — the only place this app parses
   *  data from outside itself, so it's the one place worth validating.
   *  `confirm` is asked only once the file has passed validation, so nobody
   *  is asked to approve a file that would be rejected anyway; returning
   *  false cancels with nothing changed (and no message). */
  importState: (json: string, confirm?: () => boolean) => string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitial);

  // Another tab changing the saved work (browsers send this event only for
  // *other* tabs' saves). From then on this tab keeps its hands off storage.
  const [changedElsewhere, setChangedElsewhere] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (savedCopyDiffers(e.newValue, stateRef.current)) setChangedElsewhere(true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (changedElsewhere) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private browsing, quota) — the app still
      // works for the session, it just won't survive a refresh.
    }
  }, [state, changedElsewhere]);

  // Content edits stamp lastEditedAt for the nav's "saved ... ago" readout;
  // pure navigation (setScreen, setSumSel, openClock) doesn't count as an edit.
  const setEdited = (updater: (s: PersistedState) => PersistedState) =>
    setState((s) => ({ ...updater(s), lastEditedAt: Date.now() }));

  // Segment edits touch both the app-wide lastEditedAt (above) and the open
  // clock's own lastEditedAt (its "Last changed" in Library/Summary).
  const editOpenClock = (updater: (s: PersistedState) => SegmentSeed[]) =>
    setEdited((s) => {
      const clock = s.clocks[s.openClockId];
      if (!clock) return s;
      const updated: Clock = { ...clock, segments: updater(s), lastEditedAt: Date.now() };
      return { ...s, clocks: { ...s.clocks, [s.openClockId]: updated } };
    });

  // Backtimer isn't tied to any one clock — it's a single standalone tool,
  // like Week — so its edits just replace its own slice of state directly.
  const editBacktimer = (updater: (s: PersistedState) => BacktimerItemSeed[]) =>
    setEdited((s) => ({ ...s, backtimer: { ...s.backtimer, items: updater(s) } }));

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    changedElsewhere,
    setScreen: (screen) => setState((s) => ({ ...s, screen })),
    openClock: (id) => setState((s) => ({ ...s, openClockId: id, screen: 'clock' })),
    createClock: () => setEdited((s) => {
      const id = newId('clock');
      const clock: Clock = {
        id, name: 'New clock', color: CLOCK_COLORS[s.clockOrder.length % CLOCK_COLORS.length],
        hour: 7, segments: [], lastEditedAt: Date.now(),
      };
      return {
        ...s, clocks: { ...s.clocks, [id]: clock }, clockOrder: [...s.clockOrder, id],
        openClockId: id, screen: 'list',
      };
    }),
    duplicateClock: (id) => {
      const newClockId = newId('clock');
      setEdited((s) => {
        const source = s.clocks[id];
        if (!source) return s;
        const clock: Clock = {
          ...source, id: newClockId, name: `${source.name} copy`,
          color: CLOCK_COLORS[s.clockOrder.length % CLOCK_COLORS.length],
          segments: source.segments.map((seg) => ({ ...seg, id: newId('seg') })),
          lastEditedAt: Date.now(),
        };
        return { ...s, clocks: { ...s.clocks, [newClockId]: clock }, clockOrder: [...s.clockOrder, newClockId] };
      });
      return newClockId;
    },
    removeClock: (id) => setEdited((s) => {
      const clocks = { ...s.clocks };
      delete clocks[id];
      const clockOrder = s.clockOrder.filter((c) => c !== id);
      const week = { ...s.week };
      Object.keys(week).forEach((k) => { if (week[k] === id) delete week[k]; });
      const openClockId = s.openClockId === id ? (clockOrder[0] ?? s.openClockId) : s.openClockId;
      const sumSel = s.sumSel === id ? (clockOrder[0] ?? s.sumSel) : s.sumSel;
      return { ...s, clocks, clockOrder, week, openClockId, sumSel };
    }),
    renameClock: (id, name) => setEdited((s) => ({
      ...s, clocks: { ...s.clocks, [id]: { ...s.clocks[id], name, lastEditedAt: Date.now() } },
    })),
    setClockHour: (id, hour) => setEdited((s) => ({
      ...s, clocks: { ...s.clocks, [id]: { ...s.clocks[id], hour, lastEditedAt: Date.now() } },
    })),
    reorderSegments: (fromIndex, toIndex) => editOpenClock((s) => {
      const segments = [...s.clocks[s.openClockId].segments];
      const [moved] = segments.splice(fromIndex, 1);
      segments.splice(toIndex, 0, moved);
      return segments;
    }),
    setSegmentCategory: (segmentId, categoryId) => editOpenClock((s) =>
      s.clocks[s.openClockId].segments.map((seg) => (seg.id === segmentId ? { ...seg, c: categoryId } : seg))
    ),
    setSegmentName: (segmentId, name) => editOpenClock((s) =>
      s.clocks[s.openClockId].segments.map((seg) => (seg.id === segmentId ? { ...seg, n: name } : seg))
    ),
    setSegmentDuration: (segmentId, seconds) => editOpenClock((s) =>
      s.clocks[s.openClockId].segments.map((seg) => (seg.id === segmentId ? { ...seg, d: seconds } : seg))
    ),
    setSegmentLabelPos: (segmentId, pos) => editOpenClock((s) =>
      s.clocks[s.openClockId].segments.map((seg) =>
        seg.id === segmentId ? { ...seg, labelPos: pos ?? undefined } : seg
      )
    ),
    addSegment: () => {
      const id = newId('seg');
      editOpenClock((s) => [...s.clocks[s.openClockId].segments, {
        id, n: 'New segment', d: 60, c: s.categoryOrder[0], pin: false, note: false,
      }]);
      return id;
    },
    removeSegment: (segmentId) => editOpenClock((s) =>
      s.clocks[s.openClockId].segments.filter((seg) => seg.id !== segmentId)
    ),
    assign: (keys, id) => setEdited((s) => {
      const week = { ...s.week };
      const outside = { ...s.outside };
      keys.forEach((k) => {
        if (id) { week[k] = id; delete outside[k]; }
        else delete week[k];
      });
      return { ...s, week, outside };
    }),
    markLocal: (keys, local) => setEdited((s) => {
      const outside = { ...s.outside };
      const week = { ...s.week };
      keys.forEach((k) => {
        if (local) delete outside[k];
        else { outside[k] = true; delete week[k]; }
      });
      return { ...s, outside, week };
    }),
    setSumSel: (id) => setState((s) => ({ ...s, sumSel: id })),
    addCategory: (name) => setEdited((s) => {
      const id = newId('cat');
      const color = NEXT_COLORS[s.categoryOrder.length % NEXT_COLORS.length];
      const categories = { ...s.categories, [id]: { name, color, ink: contrastInk(color) } };
      return { ...s, categories, categoryOrder: [...s.categoryOrder, id] };
    }),
    renameCategory: (id, name) => setEdited((s) => ({
      ...s,
      categories: { ...s.categories, [id]: { ...s.categories[id], name } },
    })),
    recolorCategory: (id, color) => setEdited((s) => ({
      ...s,
      categories: { ...s.categories, [id]: { ...s.categories[id], color, ink: contrastInk(color) } },
    })),
    reorderCategory: (fromIndex, toIndex) => setEdited((s) => {
      const categoryOrder = [...s.categoryOrder];
      const [moved] = categoryOrder.splice(fromIndex, 1);
      categoryOrder.splice(toIndex, 0, moved);
      return { ...s, categoryOrder };
    }),
    deleteCategory: (id) => {
      if (categoryInUse(id, state.clocks)) {
        const n = categoryUsageCountFor(id, state.clocks);
        return `Can't delete ${state.categories[id]?.name ?? 'this category'} — it's still used by ${countOf(n, 'segment')}.`;
      }
      setEdited((s) => {
        const categories = { ...s.categories };
        delete categories[id];
        return { ...s, categories, categoryOrder: s.categoryOrder.filter((c) => c !== id) };
      });
      return null;
    },
    categoryUsageCount: (id) => categoryUsageCountFor(id, state.clocks),
    setBacktimerOutTime: (seconds) => setEdited((s) => ({ ...s, backtimer: { ...s.backtimer, outTime: seconds } })),
    addBacktimerItem: () => {
      const id = newId('bt');
      editBacktimer((s) => [...s.backtimer.items, { id, n: 'New item', d: 60 }]);
      return id;
    },
    insertBacktimerItem: (name) => {
      const id = newId('bt');
      editBacktimer((s) => [...s.backtimer.items, { id, n: name, d: 60 }]);
      return id;
    },
    removeBacktimerItem: (id) => editBacktimer((s) => s.backtimer.items.filter((it) => it.id !== id)),
    setBacktimerItemName: (id, name) => editBacktimer((s) =>
      s.backtimer.items.map((it) => (it.id === id ? { ...it, n: name } : it))
    ),
    setBacktimerItemDuration: (id, seconds) => editBacktimer((s) =>
      s.backtimer.items.map((it) => (it.id === id ? { ...it, d: seconds } : it))
    ),
    reorderBacktimerItems: (fromIndex, toIndex) => editBacktimer((s) => {
      const items = [...s.backtimer.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return items;
    }),
    resetBacktimer: () => setEdited((s) => ({ ...s, backtimer: seedBacktimer() })),
    toggleBacktimerReversed: () => setEdited((s) => ({ ...s, backtimer: { ...s.backtimer, reversed: !s.backtimer.reversed } })),
    setBacktimerWalkthroughOff: (off) => setEdited((s) => ({ ...s, backtimerWalkthroughOff: off })),
    exportState: () => JSON.stringify({ app: 'clockwheel', version: 2, exportedAt: new Date().toISOString(), state }, null, 2),
    // Tagged 'backtimer', not 'clockwheel', so each Import can tell the two
    // kinds of file apart and say which one someone has picked.
    exportBacktimer: () => JSON.stringify({ app: 'backtimer', version: 1, exportedAt: new Date().toISOString(), backtimer: state.backtimer }, null, 2),
    importBacktimer: (json, confirm) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return "That file isn't valid JSON.";
      }
      const wrapper = parsed as Record<string, unknown>;
      if (typeof wrapper === 'object' && wrapper !== null && wrapper.app === 'clockwheel') {
        return 'That’s a Clockmaker export file. Import it in Clockmaker instead.';
      }
      if (typeof wrapper !== 'object' || wrapper === null || wrapper.app !== 'backtimer' || typeof wrapper.backtimer !== 'object' || wrapper.backtimer === null) {
        return "That doesn't look like a Backtimer export file.";
      }
      const incoming = wrapper.backtimer as Record<string, unknown>;
      const items = incoming.items;
      const validTime = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
      if (
        !validTime(incoming.outTime) || incoming.outTime > 3600 ||
        !Array.isArray(items) ||
        !items.every((it) => typeof it === 'object' && it !== null && typeof it.n === 'string' && validTime(it.d))
      ) {
        return 'That file is missing data Backtimer needs — it may be corrupted.';
      }
      if (confirm && !confirm()) return null;
      const backtimer: BacktimerState = {
        outTime: incoming.outTime,
        // Fresh ids, so nothing in the file can clash with or depend on them.
        items: items.map((it: { n: string; d: number }) => ({ id: newId('bt'), n: it.n.slice(0, 50), d: Math.round(it.d) })),
        reversed: incoming.reversed === true,
      };
      setEdited((s) => ({ ...s, backtimer }));
      return null;
    },
    importState: (json, confirm) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return "That file isn't valid JSON.";
      }
      // wrapper.app is checked against the literal string 'clockwheel', not
      // 'clockmaker' — that's the file format's own internal tag, unrelated
      // to the app's current display name, so every export (before or after
      // the 2026-09-30 rename) is stamped and read the same way. Changing
      // this would make older backups (and, until every user has re-exported,
      // most backups for a long while) unreadable for no real benefit, since
      // nobody ever sees this raw string.
      const wrapper = parsed as Record<string, unknown>;
      if (typeof wrapper === 'object' && wrapper !== null && wrapper.app === 'backtimer') {
        return 'That’s a Backtimer export file. Import it at backtimer.baish.net instead.';
      }
      if (typeof wrapper !== 'object' || wrapper === null || wrapper.app !== 'clockwheel' || typeof wrapper.state !== 'object' || wrapper.state === null) {
        return "That doesn't look like a Clockmaker export file.";
      }
      const incoming = wrapper.state as Partial<PersistedState>;
      if (
        typeof incoming.clocks !== 'object' || incoming.clocks === null ||
        !Array.isArray(incoming.clockOrder) ||
        typeof incoming.categories !== 'object' || incoming.categories === null ||
        !Array.isArray(incoming.categoryOrder)
      ) {
        return 'That file is missing data Clockmaker needs — it may be corrupted.';
      }
      // Beyond the overall shape, check that everything the screens look up
      // actually exists (fresh look 6.4): a hand-edited file naming a missing
      // clock or category would otherwise import, then blank the page.
      {
        const cats = incoming.categories as Record<string, unknown>;
        const clocks = incoming.clocks as Record<string, unknown>;
        const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
        const catsOk = (incoming.categoryOrder as unknown[]).every((id) =>
          typeof id === 'string' && isObj(cats[id]) && typeof cats[id].name === 'string' && typeof cats[id].color === 'string')
          && Object.values(cats).every((c) => isObj(c) && typeof c.name === 'string' && typeof c.color === 'string');
        const clocksOk = (incoming.clockOrder as unknown[]).every((id) => typeof id === 'string' && isObj(clocks[id]))
          && Object.values(clocks).every((c) =>
            isObj(c) && typeof c.name === 'string' && typeof c.hour === 'number' && Array.isArray(c.segments)
            && c.segments.every((seg: unknown) => isObj(seg) && typeof seg.n === 'string' && typeof seg.d === 'number'
              && typeof seg.c === 'string' && isObj(cats[seg.c])));
        const week = incoming.week;
        const weekOk = week === undefined || (isObj(week) && Object.values(week).every((id) => typeof id === 'string' && isObj(clocks[id])));
        if (!catsOk || !clocksOk || !weekOk) return 'That file is missing data Clockmaker needs — it may be corrupted.';
      }
      if (confirm && !confirm()) return null;
      setState((s) => {
        const merged: PersistedState = { ...s, ...incoming, lastEditedAt: Date.now(), screen: 'lib' };
        if (!merged.clocks[merged.openClockId]) merged.openClockId = merged.clockOrder[0] ?? s.openClockId;
        if (!merged.clocks[merged.sumSel]) merged.sumSel = merged.clockOrder[0] ?? s.sumSel;
        // Older files may lack a category's text colour; work it out as the app does.
        merged.categories = Object.fromEntries(Object.entries(merged.categories).map(([id, c]) =>
          [id, c.ink ? c : { ...c, ink: contrastInk(c.color) }]));
        return merged;
      });
      return null;
    },
  }), [state, changedElsewhere]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
