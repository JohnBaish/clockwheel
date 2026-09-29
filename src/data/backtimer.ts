/** One row in the Backtimer screen: a named block of time with a duration.
 *  Order in the array IS display order — the top row is the last thing
 *  before the target out time, and each row below it is progressively
 *  earlier, which is also the order a producer naturally builds one in:
 *  start from the out time, add what comes right before it, then what
 *  comes before that. */
export interface BacktimerItemSeed {
  id: string;
  n: string;
  d: number;
}

export interface BacktimerState {
  /** The time everything counts back from, in seconds (minutes:seconds —
   *  this tool has no hour of its own, unlike a Clock). */
  outTime: number;
  items: BacktimerItemSeed[];
}

export function seedBacktimer(): BacktimerState {
  return { outTime: 0, items: [] };
}

export interface BacktimedItem extends BacktimerItemSeed {
  start: number;
  end: number;
}

/** Resolves each item's start/end time by counting backward from outTime —
 *  the mirror image of data/segments.ts's withTimes(), which counts forward
 *  from zero. A row's end is always the row above it's start (or outTime
 *  itself, for the top row); its start can go negative if the items add up
 *  to more time than there is before the out time, which is deliberately
 *  left visible rather than clamped — that's the whole point of the tool,
 *  telling you when you're overrunning. */
export function withBackTimes(items: BacktimerItemSeed[], outTime: number): BacktimedItem[] {
  let end = outTime;
  return items.map((it) => {
    const start = end - it.d;
    const resolved: BacktimedItem = { ...it, start, end };
    end = start;
    return resolved;
  });
}
