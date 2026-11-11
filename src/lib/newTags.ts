// The baish.net page's NEW tags (John, November 11th 2026): a site is marked new for three weeks
// from the day it goes on baish.net, and never more than three at once; when a fourth arrives, the
// oldest loses its tag first. Sites launched on the same day count in page order, the later one
// on the page as the newer. Dates are UK calendar dates, "YYYY-MM-DD".

export const NEW_DAYS = 21;
export const NEW_MAX = 3;

const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86400000);

export function newSites(sites: { id: string; launched: string }[], today: string): Set<string> {
  const now = dayNumber(today);
  const recent = sites
    .map((s, order) => ({ ...s, order, age: now - dayNumber(s.launched) }))
    .filter((s) => s.age >= 0 && s.age < NEW_DAYS)
    .sort((a, b) => a.age - b.age || b.order - a.order);
  return new Set(recent.slice(0, NEW_MAX).map((s) => s.id));
}

/** Today's date in the UK, as "YYYY-MM-DD". */
export function ukToday(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}
