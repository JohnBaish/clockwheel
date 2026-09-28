export type CategoryId = string;

export interface Category {
  name: string;
  color: string;
  ink: string;
}

// Seed data for the initial categories, matching exactly what's used in the
// "Daytime 1" starting clock (data/segments.ts) — including the user's own
// naming/colour choices (e.g. "Junction" rather than "Travel"). Ids are
// stable foreign keys (referenced from segments and library-clock splits) —
// renaming a category never changes its id.
export const SEED_CATEGORIES: Record<CategoryId, Category> = {
  mus: { name: 'Music', color: '#ccdbb2', ink: '#272e1b' },
  trv: { name: 'Junction', color: '#d67f48', ink: '#f9f4ed' },
  nws: { name: 'News', color: '#000000', ink: '#f9f4ed' },
  img: { name: 'Imaging', color: '#ffe1d0', ink: '#643312' },
  cnt: { name: 'Content', color: '#b0a6d6', ink: '#f9f4ed' },
};

export const SEED_CATEGORY_ORDER: CategoryId[] = ['mus', 'trv', 'nws', 'img', 'cnt'];

// A handful of next-up swatches for new categories, spaced by lightness as
// well as hue (same principle as the seeded five) so a freshly-added
// category is already legible before anyone picks its colour.
export const NEXT_COLORS = ['#a3b8c9', '#c9a8d6', '#e0c34a', '#8fb99a', '#d68f9e', '#b0a6d6'];
