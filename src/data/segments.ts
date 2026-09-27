import { D } from '../lib/time';
import type { CategoryId } from './categories';

export interface SegmentSeed {
  id: string;
  n: string;
  d: number;
  c: CategoryId;
  pin?: boolean;
  note?: boolean;
}

/** A segment with its start time (seconds into the hour) resolved from list order. */
export interface Segment extends SegmentSeed {
  t: number;
}

// The user's own breakfast hour, verbatim — 19 segments, totalling 60:00.
// Seeds the one starting clock in data/clocks.ts; hour lives on the Clock now.
export const INITIAL_SEGMENTS: SegmentSeed[] = [
  { id: 'seg-1', n: 'News', d: D(3, 0), c: 'nws', pin: true },
  { id: 'seg-2', n: 'Travel', d: D(1, 0), c: 'trv', pin: true },
  { id: 'seg-3', n: 'Song 1', d: D(3, 46), c: 'mus' },
  { id: 'seg-4', n: 'Link', d: D(2, 0), c: 'spe' },
  { id: 'seg-5', n: 'Song 2', d: D(3, 46), c: 'mus' },
  { id: 'seg-6', n: 'Item', d: D(3, 0), c: 'spe' },
  { id: 'seg-7', n: 'Song 3', d: D(3, 46), c: 'mus' },
  { id: 'seg-8', n: 'Item', d: D(5, 0), c: 'spe', note: true },
  { id: 'seg-9', n: 'Song 4', d: D(3, 46), c: 'mus' },
  { id: 'seg-10', n: 'Weather trail travel', d: D(3, 0), c: 'trv', pin: true, note: true },
  { id: 'seg-11', n: 'Song 5', d: D(3, 46), c: 'mus' },
  { id: 'seg-12', n: 'Item', d: D(5, 0), c: 'spe' },
  { id: 'seg-13', n: 'Song 6', d: D(3, 46), c: 'mus' },
  { id: 'seg-14', n: 'Respin', d: D(3, 0), c: 'img' },
  { id: 'seg-15', n: 'Song 7', d: D(3, 46), c: 'mus' },
  { id: 'seg-16', n: 'Song 8', d: D(3, 46), c: 'mus' },
  { id: 'seg-17', n: 'Link', d: D(0, 49), c: 'spe' },
  { id: 'seg-18', n: 'Song 9', d: D(3, 46), c: 'mus' },
  { id: 'seg-19', n: 'Ident', d: D(0, 17), c: 'img' },
];

/** Resolves each segment's start time from list order — this is what makes
 *  drag-to-reorder work: moving a row shifts every start time after it. */
export function withTimes(segments: SegmentSeed[]): Segment[] {
  let t = 0;
  return segments.map((s) => {
    const withT = { ...s, t };
    t += s.d;
    return withT;
  });
}
