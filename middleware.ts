// Runs on Vercel's edge for every request this project serves, before any
// static file is resolved — this is what vercel.json's plain `rewrites`
// couldn't manage: a request for "/" already matches a real file
// (index.html) by Vercel's own default "serve the file that exists"
// behavior, so a declarative rewrite conditioned on the Host header never
// got a chance to run for that exact path. Middleware runs first,
// unconditionally, so it can override that.
//
// Deliberately built from nothing but standard Request/Response/fetch —
// no @vercel/edge or next/server import — since this is a plain Vite
// project, not Next.js, and those helper libraries' exact APIs for a
// non-Next project weren't something this session could verify against
// live docs (no outbound network access while this was written). Fetching
// this same deployment's own /backtimer.html and returning that Response
// directly is the most standards-based way to hand back different content
// for the same "/" request, so it should hold up regardless of the exact
// conveniences a Vercel-specific helper might otherwise offer.
export const config = { matcher: '/' };

export default async function middleware(request: Request) {
  const host = request.headers.get('host') ?? '';
  if (host === 'backtimer.baish.net') {
    return fetch(new URL('/backtimer.html', request.url));
  }
  // Anything else (clockwheel.baish.net, this session's own preview
  // deployments, etc.) falls through to Vercel's normal handling —
  // returning nothing/undefined here is what "don't intercept this
  // request" means for Vercel Edge Middleware.
}
