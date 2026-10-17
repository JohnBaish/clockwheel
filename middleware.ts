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
export const config = { matcher: ['/', '/robots.txt', '/sitemap.xml'] };

// Search engines (2026-10-17): every domain shares one public/ folder, so a
// static robots.txt or sitemap.xml would be the same file on all of them.
// Instead each host gets its own, naming its one main (canonical) address —
// the same one in that page's <link rel="canonical">. clockwheel.baish.net
// (Clockmaker's old name) gets a robots.txt but no sitemap: it's a second
// door to Clockmaker, and its canonical tag already points at clockmaker.
const MAIN_ADDRESS: Record<string, string> = {
  'clockmaker.baish.net': 'https://clockmaker.baish.net/',
  'backtimer.baish.net': 'https://backtimer.baish.net/',
  'baish.net': 'https://www.baish.net/',
  'www.baish.net': 'https://www.baish.net/',
};

function plain(body: string, contentType: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

function robotsTxt(host: string): string {
  const main = MAIN_ADDRESS[host];
  return `User-agent: *\nAllow: /\n${main ? `\nSitemap: ${main}sitemap.xml\n` : ''}`;
}

function sitemapXml(main: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${main}</loc></url>
</urlset>
`;
}

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
  const path = new URL(request.url).pathname;
  const known = host in MAIN_ADDRESS || host === 'clockwheel.baish.net';
  if (path === '/robots.txt') {
    // Unknown hosts (Vercel preview addresses) fall through: no file there.
    if (known) return plain(robotsTxt(host), 'text/plain; charset=utf-8');
    return;
  }
  if (path === '/sitemap.xml') {
    const main = MAIN_ADDRESS[host];
    if (main) return plain(sitemapXml(main), 'application/xml; charset=utf-8');
    return;
  }
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
