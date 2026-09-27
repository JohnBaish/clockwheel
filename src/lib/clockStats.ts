import type { SegmentSeed } from '../data/segments';
import type { CategoryId } from '../data/categories';
import type { Split } from './color';

/** Category mix as whole-number percentages of total duration — derived from
 *  a clock's real segments rather than authored placeholder figures. */
export function computeSplit(segments: SegmentSeed[], categoryOrder: CategoryId[]): Split {
  const total = segments.reduce((a, s) => a + s.d, 0);
  if (total === 0) return {};
  const split: Split = {};
  categoryOrder.forEach((id) => {
    const secs = segments.filter((s) => s.c === id).reduce((a, s) => a + s.d, 0);
    if (secs > 0) split[id] = Math.round((secs / total) * 100);
  });
  return split;
}

/** A "news junction" is a segment in the category named News (case-insensitive) —
 *  counted from real content rather than a hand-authored figure. */
export function newsJunctionCount(segments: SegmentSeed[], categories: Record<CategoryId, { name: string }>): number {
  return segments.filter((s) => categories[s.c]?.name.trim().toLowerCase() === 'news').length;
}

/** A "song" is a segment in the category named Music (case-insensitive) —
 *  same pattern as newsJunctionCount, just a different category name. */
export function songCount(segments: SegmentSeed[], categories: Record<CategoryId, { name: string }>): number {
  return segments.filter((s) => categories[s.c]?.name.trim().toLowerCase() === 'music').length;
}
