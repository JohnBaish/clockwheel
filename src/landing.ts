// Entry point for landing.html (the baish.net root-domain page) — imports
// just the design-system CSS (fonts, colors, .card styles) so the page
// matches Clockmaker/Backtimer's look without pulling in React or any of
// the app itself. See landing.html and middleware.ts for how this gets
// served on baish.net specifically.
import './styles/organic.css';
import './styles/global.css';
import { inject } from '@vercel/analytics';
import { isDark, onThemeChange, setDark, switchMarkup } from './lib/theme';
import { newSites, ukToday } from './lib/newTags';

// Non-React analytics entry point, since this page deliberately doesn't
// load React — see main.tsx for the <Analytics /> component used there.
inject();

// The dark mode switch, at the top right of the page (HOUSE-STYLE §2), without React: the same
// rule and markup as the apps' switch (src/lib/theme.ts).

const sw = document.createElement('button');
sw.type = 'button';
sw.className = 'theme-switch landing-switch';
sw.setAttribute('role', 'switch');
sw.setAttribute('aria-label', 'Dark mode');
const draw = () => {
  sw.setAttribute('aria-checked', String(isDark()));
  sw.innerHTML = switchMarkup(isDark());
};
sw.addEventListener('click', () => setDark(!isDark()));
onThemeChange(draw);
draw();
document.body.prepend(sw);

// NEW tags (src/lib/newTags.ts): sites carry the day they went on baish.net in data-launched;
// sites from before the rule (November 11th 2026) carry none and are never marked new.
const rows = [...document.querySelectorAll<HTMLElement>('.hub-row[data-launched]')];
const marked = newSites(rows.map((r) => ({ id: r.dataset.site ?? '', launched: r.dataset.launched ?? '' })), ukToday());
for (const r of rows) {
  const tag = r.querySelector<HTMLElement>('.hub-new');
  if (tag) tag.hidden = !marked.has(r.dataset.site ?? '');
}
