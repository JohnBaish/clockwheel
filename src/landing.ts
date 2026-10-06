// Entry point for landing.html (the baish.net root-domain page) — imports
// just the design-system CSS (fonts, colors, .card styles) so the page
// matches Clockmaker/Backtimer's look without pulling in React or any of
// the app itself. See landing.html and middleware.ts for how this gets
// served on baish.net specifically.
import './styles/organic.css';
import './styles/global.css';
import { inject } from '@vercel/analytics';

// Non-React analytics entry point, since this page deliberately doesn't
// load React — see main.tsx for the <Analytics /> component used there.
inject();
