/** Seconds from a minutes/seconds pair. */
export const D = (m: number, s: number) => m * 60 + s;

/** Clock-time string for a given hour, e.g. hour=7, secondsIntoHour=1744 -> "07:29:04".
 *  Rolls over into following hours (and past midnight) if secondsIntoHour exceeds an
 *  hour — an over-length segment list can push later rows past :60:00. */
export function clockOf(hour: number, secondsIntoHour: number): string {
  const totalMinutes = Math.floor(secondsIntoHour / 60);
  const h = (hour + Math.floor(totalMinutes / 60)) % 24;
  const m = totalMinutes % 60;
  const s = secondsIntoHour % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** m:ss, unpadded minutes — used for elastic durations, e.g. "3:46". */
export function dur(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Same as dur(), but handles negative input (e.g. "-2:30") — dur() alone
 *  mishandles negatives, since JS's % keeps the dividend's sign. Used by
 *  Backtimer, where a start time before the out time is meaningful, not
 *  an error. */
export function signedDur(seconds: number): string {
  return seconds < 0 ? `-${dur(-seconds)}` : dur(seconds);
}

/** HH:00 — used for week-grid hour labels. */
export const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

function parseMmSs(input: string, min: number): number | null {
  const trimmed = input.trim();
  const withColon = trimmed.match(/^(\d+):([0-5]?\d)$/);
  if (withColon) return Math.max(min, +withColon[1] * 60 + +withColon[2]);
  const secondsOnly = trimmed.match(/^\d+$/);
  if (secondsOnly) return Math.max(min, +trimmed);
  return null;
}

/** Parses a duration typed as "m:ss" or plain seconds. Returns null if unusable,
 *  clamps to a minimum of 1 second so a segment never collapses to nothing. */
export function parseDur(input: string): number | null {
  return parseMmSs(input, 1);
}

/** Same as parseDur(), but allows exactly 0 — for a target time-of-day-style
 *  value (Backtimer's out time) rather than a duration, where 0 is
 *  meaningful rather than degenerate. parseDur's clamp-to-1 meant typing
 *  "0:00" as an out time silently became 1 second, not 0, so it never even
 *  reached normalizeOutTime()'s "0 means the top of the hour" handling —
 *  the actual bug behind a 17-second item backtimed to "0:00" reporting a
 *  start of -0:17ish instead of 59:43. */
export function parseOutTime(input: string): number | null {
  return parseMmSs(input, 0);
}

export interface HourBalance {
  state: 'balanced' | 'over' | 'under';
  label: string;
}

/** The hour must total exactly 60 minutes — this makes it obvious when it doesn't. */
export function hourBalance(totalSeconds: number): HourBalance {
  const diff = totalSeconds - 3600;
  if (diff === 0) return { state: 'balanced', label: 'balanced' };
  if (diff > 0) return { state: 'over', label: `over by ${dur(diff)}` };
  return { state: 'under', label: `under by ${dur(-diff)}` };
}

/** "just now" / "5 min ago" / "3 hr ago" / "9 Sep" — for a last-edited timestamp. */
export function relativeTime(fromMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(fromMs).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
