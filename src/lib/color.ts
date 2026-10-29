import type { Category, CategoryId } from '../data/categories';

export type Split = Partial<Record<CategoryId, number>>;

/** The live set of categories, in display order — threaded through from app state
 *  since categories are user-editable rather than a fixed list. */
export interface CategorySet {
  byId: Record<CategoryId, Category>;
  order: CategoryId[];
}

/** sRGB relative luminance of a "#rrggbb" (or "#rgb") colour, 0 for black to 1 for white. */
export function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Black or white ink, whichever reads better against a given swatch colour —
 *  so a freshly-chosen category colour is always legible without asking the
 *  user to also pick a text colour. Uses the sRGB relative-luminance formula. */
export function contrastInk(hex: string): string {
  return luminance(hex) > 0.45 ? '#201e1d' : '#f9f4ed';
}

/** True for a colour darker than the dark-mode page (#2a2723), which an outline alone
 *  wouldn't show against it (News's black): global.css then keeps the pill's fill. */
export function darkerThanDarkPage(hex: string): boolean {
  return luminance(hex) < luminance('#2a2723');
}

/** A horizontal stacked-percentage gradient for a category split, e.g. the mix bar. */
export function splitBg(split: Split, cats: CategorySet): string {
  let at = 0;
  const stops = cats.order.filter((c) => split[c]).map((c) => {
    const a = at;
    const b = at + (split[c] ?? 0);
    at = b;
    return `${cats.byId[c].color} ${a}% ${b}%`;
  });
  return `linear-gradient(90deg,${stops.join(',')})`;
}

/** A conic-gradient donut thumbnail for a category split. */
export function wheelBg(split: Split, cats: CategorySet): string {
  let at = 0;
  const stops = cats.order.filter((c) => split[c]).map((c) => {
    const a = at;
    const b = at + (split[c] ?? 0);
    at = b;
    return `${cats.byId[c].color} ${a * 3.6}deg ${b * 3.6}deg`;
  });
  return `conic-gradient(from 0deg,${stops.join(',')})`;
}

/** "Music 62% · Speech 20% · Travel 7%" — the top three categories by share. */
export function mixLine(split: Split, cats: CategorySet): string {
  return cats.order
    .filter((c) => split[c])
    .sort((a, b) => (split[b] ?? 0) - (split[a] ?? 0))
    .slice(0, 3)
    .map((c) => `${cats.byId[c].name} ${split[c]}%`)
    .join(' · ');
}
