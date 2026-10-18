import type { Screen } from '../state/store';
import { isBacktimerHost } from './hostMode';

// Each Clockmaker screen has its own address (…/#week etc.), so a phone's
// Back gesture (or the browser's Back button) returns to the previous screen
// instead of leaving the site. Standalone Backtimer has only one screen, so
// its address is left alone.
const SCREENS: Screen[] = ['guide', 'lib', 'clock', 'list', 'week', 'summary', 'categories', 'backtimer'];

/** The screen named in the address (e.g. "#week"), if it's a real one. */
export function screenFromHash(): Screen | null {
  if (typeof window === 'undefined' || isBacktimerHost()) return null;
  const name = window.location.hash.slice(1) as Screen;
  return SCREENS.includes(name) ? name : null;
}
