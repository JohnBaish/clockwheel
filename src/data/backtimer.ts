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
  /** Display only — flips whether the screen shows items in the order
   *  above (latest thing on top, working backwards) or chronologically
   *  (earliest on top). Doesn't touch `items`' own order or how times are
   *  computed; see BacktimerScreen's `rows` vs `displayRows`. Optional
   *  because it was added after Backtimer already shipped — loadInitial()'s
   *  shallow merge means anyone with saved state from before this had no
   *  such field, so reads treat missing as `false` rather than assuming it. */
  reversed?: boolean;
}

export function seedBacktimer(): BacktimerState {
  return { outTime: 3600, items: [], reversed: false };
}

/** An out time of exactly 0 always means the top of the hour, not its
 *  literal first instant — nobody backtimes to the very start of an hour,
 *  and ":00" as a target is genuinely ambiguous between "the start" and
 *  "the end" of one (the same way a clock face doesn't distinguish them).
 *  Treating 0 as 3600 (60:00) resolves it the way anyone typing "0:00" as
 *  an out time actually means it — otherwise a 17-second item backtimed to
 *  "0:00" reported starting at -0:17 instead of 59:43. */
export function normalizeOutTime(seconds: number): number {
  return seconds === 0 ? 3600 : seconds;
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
  let end = normalizeOutTime(outTime);
  return items.map((it) => {
    const start = end - it.d;
    const resolved: BacktimedItem = { ...it, start, end };
    end = start;
    return resolved;
  });
}
