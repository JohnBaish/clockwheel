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
// live docs (no outbound network access while this was written).
export const config = { matcher: '/' };

// Fetches this same deployment's own static file and rebuilds a fresh
// Response with only the header it actually needs, rather than returning
// the upstream fetch's Response object unchanged. An earlier version did
// the latter for backtimer.html and it carried over content-encoding/
// content-length/transfer-encoding headers that described the *original*
// fetch — Vercel's edge re-serving that same Response under a different
// request produced a corrupted/truncated body (no link preview at all,
// since crawlers found no readable <meta> tags). Rebuilding it plain
// avoids that; shared here since landing.html needs the same treatment.
async function serveStatic(path: string, request: Request): Promise<Response> {
  const upstream = await fetch(new URL(path, request.url));
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export default async function middleware(request: Request) {
  const host = request.headers.get('host') ?? '';
  if (host === 'backtimer.baish.net') return serveStatic('/backtimer.html', request);
  // www.baish.net included defensively — nothing currently points there,
  // but it costs nothing to handle the same as the bare domain in case a
  // visitor (or an old bookmark/link) types the www. prefix out of habit.
  if (host === 'baish.net' || host === 'www.baish.net') return serveStatic('/landing.html', request);
  // Anything else (clockwheel.baish.net, this session's own preview
  // deployments, etc.) falls through to Vercel's normal handling —
  // returning nothing/undefined here is what "don't intercept this
  // request" means for Vercel Edge Middleware.
}
