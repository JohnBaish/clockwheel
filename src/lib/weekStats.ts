import { DAYS } from '../data/days';
import { cellKey, type ClockId } from '../data/clocks';

/** Every day/hour cell that counts as "local" (i.e. not marked non-local). */
export function localKeys(outside: Record<string, true>): string[] {
  const keys: string[] = [];
  DAYS.forEach(([d]) => {
    for (let i = 0; i < 24; i++) {
      const k = cellKey(d, i);
      if (!outside[k]) keys.push(k);
    }
  });
  return keys;
}

export function computeWeekStats(week: Record<string, ClockId>, outside: Record<string, true>) {
  const keys = localKeys(outside);
  const assigned = keys.filter((k) => week[k]).length;
  const slots = keys.length;
  return { assigned, slots, gaps: slots - assigned };
}
