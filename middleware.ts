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

export default async function middleware(request: Request) {
  const host = request.headers.get('host') ?? '';
  if (host === 'backtimer.baish.net') {
    const upstream = await fetch(new URL('/backtimer.html', request.url));
    // Read the body out and rebuild a fresh Response with only the header
    // it actually needs. An earlier version of this middleware returned
    // `upstream` directly, carrying over its content-encoding/
    // content-length/transfer-encoding headers unchanged — those describe
    // the original fetch, not this response, and Vercel's edge re-serving
    // that same Response object under a different request produced a
    // corrupted/truncated body (no link preview at all, since crawlers
    // found no readable <meta> tags). Rebuilding it plain avoids that.
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  // Anything else (clockwheel.baish.net, this session's own preview
  // deployments, etc.) falls through to Vercel's normal handling —
  // returning nothing/undefined here is what "don't intercept this
  // request" means for Vercel Edge Middleware.
}
