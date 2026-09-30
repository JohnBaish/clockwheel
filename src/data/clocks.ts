import { INITIAL_SEGMENTS, type SegmentSeed } from './segments';
import { DAYS, type DayId } from './days';

export type ClockId = string;

export interface Clock {
  id: ClockId;
  name: string;
  color: string;
  hour: number;
  segments: SegmentSeed[];
  lastEditedAt: number;
}

// A rotation of colours spaced by lightness as well as hue (same principle
// as the category palette) so clocks stay visually distinct as the library
// grows, without needing a colour picker for every new clock.
export const CLOCK_COLORS = [
  '#d67f48', '#7a8a5e', '#b5643f', '#9aa87f', '#a4522c', '#566b4a',
  '#e8b087', '#dfe0c4', '#f2dcbe', '#cfc6b2', '#9c4a34', '#f0c9a0', '#b9c79c', '#8c6f5c',
];

/** week-grid cell key, e.g. "mo-6" for Monday 06:00. */
export const cellKey = (day: DayId, hour: number) => `${day}-${hour}`;

const DEFAULT_LOCAL: Record<DayId, [number, number]> = {
  mo: [6, 18], tu: [6, 18], we: [6, 19], th: [6, 18],
  fr: [6, 20], sa: [7, 18], su: [7, 16],
};

export function seedOutside(): Record<string, true> {
  const o: Record<string, true> = {};
  DAYS.forEach(([d]) => {
    const [a, b] = DEFAULT_LOCAL[d];
    for (let i = 0; i < 24; i++) if (i < a || i >= b) o[cellKey(d, i)] = true;
  });
  return o;
}

// The library used to ship with 14 clocks, 13 of which were colour and
// percentage placeholders with no real segments behind them. Those are
// gone — the library now only ever holds clocks someone actually built.
// The one real clock (the user's own "Daytime 1" hour, renamed "Example" so
// a first-time visitor understands what it's there for) stays as a starting
// example; the week grid starts with nothing assigned.
export const SEED_CLOCK_ID: ClockId = 'daytime-1-10';

export function seedClocks(): Record<ClockId, Clock> {
  return {
    [SEED_CLOCK_ID]: {
      id: SEED_CLOCK_ID,
      name: 'Example',
      color: CLOCK_COLORS[1],
      hour: 10,
      segments: INITIAL_SEGMENTS,
      lastEditedAt: Date.now(),
    },
  };
}
