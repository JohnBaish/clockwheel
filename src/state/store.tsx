import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SegmentSeed } from '../data/segments';
import { seedOutside, seedClocks, SEED_CLOCK_ID, CLOCK_COLORS, type Clock, type ClockId } from '../data/clocks';
import { SEED_CATEGORIES, SEED_CATEGORY_ORDER, NEXT_COLORS, type Category, type CategoryId } from '../data/categories';
import { seedBacktimer, type BacktimerState, type BacktimerItemSeed } from '../data/backtimer';
import { contrastInk } from '../lib/color';

export type Screen = 'lib' | 'clock' | 'list' | 'week' | 'summary' | 'categories' | 'backtimer';

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
  lastEditedAt: number;
}

// Bumped for the multi-clock rewrite: old saved state (a flat segments array,
// a prefilled week, 13 placeholder library clocks) is structurally
// incompatible and would crash if merged — so it's simply left behind
// under the old key rather than migrated, which also happens to be exactly
// the clean start that prompted this rewrite.
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

interface AppContextValue extends PersistedState {
  setScreen: (screen: Screen) => void;
  openClock: (id: ClockId) => void;
  createClock: () => void;
  /** Clones a clock into a new one and returns the new clock's id. */
  duplicateClock: (id: ClockId) => ClockId;
  renameClock: (id: ClockId, name: string) => void;
  setClockHour: (id: ClockId, hour: number) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  setSegmentCategory: (segmentId: string, categoryId: CategoryId) => void;
  setSegmentName: (segmentId: string, name: string) => void;
  setSegmentDuration: (segmentId: string, seconds: number) => void;
  /** Sets or clears (pass null) a segment's manually-dragged callout-label position. */
  setSegmentLabelPos: (segmentId: string, pos: { x: number; y: number } | null) => void;
  addSegment: () => void;
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
  addBacktimerItem: () => void;
  removeBacktimerItem: (id: string) => void;
  setBacktimerItemName: (id: string, name: string) => void;
  setBacktimerItemDuration: (id: string, seconds: number) => void;
  reorderBacktimerItems: (fromIndex: number, toIndex: number) => void;
  /** All persisted state, wrapped and pretty-printed for a downloadable backup file. */
  exportState: () => string;
  /** Loads a previously exported file back in. Returns null on success, or a
   *  message explaining why it was rejected — the only place this app parses
   *  data from outside itself, so it's the one place worth validating. */
  importState: (json: string) => string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private browsing, quota) — the app still
      // works for the session, it just won't survive a refresh.
    }
  }, [state]);

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
    addSegment: () => editOpenClock((s) => [...s.clocks[s.openClockId].segments, {
      id: newId('seg'), n: 'New segment', d: 60, c: s.categoryOrder[0], pin: false, note: false,
    }]),
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
        return `Can't delete ${state.categories[id]?.name ?? 'this category'} — it's still used by ${n} segment${n === 1 ? '' : 's'}.`;
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
    addBacktimerItem: () => editBacktimer((s) => [...s.backtimer.items, { id: newId('bt'), n: 'New item', d: 60 }]),
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
    exportState: () => JSON.stringify({ app: 'clockwheel', version: 2, exportedAt: new Date().toISOString(), state }, null, 2),
    importState: (json) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return "That file isn't valid JSON.";
      }
      const wrapper = parsed as Record<string, unknown>;
      if (typeof wrapper !== 'object' || wrapper === null || wrapper.app !== 'clockwheel' || typeof wrapper.state !== 'object' || wrapper.state === null) {
        return "That doesn't look like a Clockwheel export file.";
      }
      const incoming = wrapper.state as Partial<PersistedState>;
      if (
        typeof incoming.clocks !== 'object' || incoming.clocks === null ||
        !Array.isArray(incoming.clockOrder) ||
        typeof incoming.categories !== 'object' || incoming.categories === null ||
        !Array.isArray(incoming.categoryOrder)
      ) {
        return 'That file is missing data Clockwheel needs — it may be corrupted.';
      }
      setState((s) => {
        const merged: PersistedState = { ...s, ...incoming, lastEditedAt: Date.now(), screen: 'lib' };
        if (!merged.clocks[merged.openClockId]) merged.openClockId = merged.clockOrder[0] ?? s.openClockId;
        return merged;
      });
      return null;
    },
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
