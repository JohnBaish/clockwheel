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

// The user's own "Daytime 1" hour, verbatim — 18 segments, totalling 60:00.
// Seeds the one starting clock in data/clocks.ts; hour lives on the Clock now.
export const INITIAL_SEGMENTS: SegmentSeed[] = [
  { id: 'seg-1', n: 'News', d: D(3, 20), c: 'nws' },
  { id: 'seg-2', n: 'Travel', d: D(0, 40), c: 'trv' },
  { id: 'seg-3', n: 'Song 1', d: D(3, 45), c: 'mus' },
  { id: 'seg-4', n: 'Tease next item', d: D(0, 10), c: 'cnt' },
  { id: 'seg-5', n: 'Song 2', d: D(3, 45), c: 'mus' },
  { id: 'seg-6', n: 'Item', d: D(5, 10), c: 'cnt' },
  { id: 'seg-7', n: 'Song 3', d: D(3, 45), c: 'mus' },
  { id: 'seg-8', n: 'Item', d: D(5, 10), c: 'cnt' },
  { id: 'seg-9', n: 'Song 4', d: D(3, 45), c: 'mus' },
  { id: 'seg-10', n: 'Weather / Trail / Travel', d: D(2, 23), c: 'trv' },
  { id: 'seg-11', n: 'Song 5', d: D(3, 45), c: 'mus' },
  { id: 'seg-12', n: 'Item', d: D(5, 10), c: 'cnt' },
  { id: 'seg-13', n: 'Song 6', d: D(3, 45), c: 'mus' },
  { id: 'seg-14', n: 'Item', d: D(5, 40), c: 'cnt' },
  { id: 'seg-15', n: 'Song 7', d: D(3, 45), c: 'mus' },
  { id: 'seg-16', n: 'Audio / story', d: D(2, 0), c: 'cnt' },
  { id: 'seg-17', n: 'Song 8', d: D(3, 45), c: 'mus' },
  { id: 'seg-18', n: 'Ident', d: D(0, 17), c: 'img' },
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
