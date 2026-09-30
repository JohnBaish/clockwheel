// Clockmaker (renamed from Clockwheel 2026-09-30; clockmaker.baish.net went
// live the same day, alongside the older clockwheel.baish.net, which still
// resolves to the same project) is one build serving multiple domains: the
// full app at clockmaker.baish.net/clockwheel.baish.net, and a
// Backtimer-only presentation at backtimer.baish.net (same deployment,
// same code — just different custom domains pointed at the same Vercel
// project). Which presentation a visitor gets is decided purely by
// hostname, checked at runtime; there's no separate build or routing
// config involved.
const BACKTIMER_HOST = 'backtimer.baish.net';

/** True when the app should present itself as a standalone Backtimer tool
 *  — hide every other screen, lock straight into Backtimer — rather than
 *  the full Clockmaker app. `?host=backtimer` is a manual override, for
 *  testing this before the real subdomain is wired up in DNS/Vercel, or
 *  from a preview deployment URL that isn't backtimer.baish.net itself. */
export function isBacktimerHost(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hostname === BACKTIMER_HOST) return true;
  return new URLSearchParams(window.location.search).get('host') === 'backtimer';
}
