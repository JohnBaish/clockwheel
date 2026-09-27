export type CategoryId = string;

export interface Category {
  name: string;
  color: string;
  ink: string;
}

// Seed data for the initial five categories, inferred from the user's
// breakfast hour. Ids are stable foreign keys (referenced from segments and
// library-clock splits) — renaming a category never changes its id.
export const SEED_CATEGORIES: Record<CategoryId, Category> = {
  mus: { name: 'Music', color: '#ccdbb2', ink: '#272e1b' },
  spe: { name: 'Speech', color: '#d67f48', ink: '#402310' },
  trv: { name: 'Travel', color: '#728157', ink: '#f0fae1' },
  nws: { name: 'News', color: '#2e2b25', ink: '#f9f4ed' },
  img: { name: 'Imaging', color: '#ffe1d0', ink: '#643312' },
};

export const SEED_CATEGORY_ORDER: CategoryId[] = ['mus', 'spe', 'trv', 'nws', 'img'];

// A handful of next-up swatches for new categories, spaced by lightness as
// well as hue (same principle as the seeded five) so a freshly-added
// category is already legible before anyone picks its colour.
export const NEXT_COLORS = ['#a3b8c9', '#c9a8d6', '#e0c34a', '#8fb99a', '#d68f9e', '#b0a6d6'];
