// Clockwheel is one build serving two domains: the full app at
// clockwheel.baish.net, and a Backtimer-only presentation at
// backtimer.baish.net (same deployment, same code — just a different
// custom domain pointed at the same Vercel project). Which one a visitor
// gets is decided purely by hostname, checked at runtime; there's no
// separate build or routing config involved.
const BACKTIMER_HOST = 'backtimer.baish.net';

/** True when the app should present itself as a standalone Backtimer tool
 *  — hide every other screen, lock straight into Backtimer — rather than
 *  the full Clockwheel app. `?host=backtimer` is a manual override, for
 *  testing this before the real subdomain is wired up in DNS/Vercel, or
 *  from a preview deployment URL that isn't backtimer.baish.net itself. */
export function isBacktimerHost(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hostname === BACKTIMER_HOST) return true;
  return new URLSearchParams(window.location.search).get('host') === 'backtimer';
}
