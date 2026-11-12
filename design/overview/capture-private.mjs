// Screenshots of the two private sites for the baish.net overview pictures (README.md here says how it's used).
// node capture-private.mjs <output folder>
// Tenniserver and Motoracer sit behind Cloudflare Access, so they are always built from their repos and served locally
// by make.sh (Tenniserver on port 4309, Motoracer on 4310), with the real data saved in each repo at the time.
import fs from 'node:fs';
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const OUT = process.argv[2];
const TS = 'http://localhost:4309/';
const MR = 'http://localhost:4310/';
const CHROME = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' };
const dark = (d) => ({ ...d, colorScheme: 'dark' });
const log = [];

async function shot(name, device, url, { before, full = true } = {}) {
  const ctx = await browser.newContext(device);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (before) await before(page);
  await page.waitForTimeout(800);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  log.push({ name, url, errors, scrollWidth: sw, fonts: [...new Set(fonts)].join(', ') });
  await ctx.close();
}
const click = (sel) => async (p) => { await p.locator(sel).first().click(); await p.waitForTimeout(500); };

// Tenniserver (the real matches, results and rankings from its latest saved update)
await shot('ts-today-desktop', DESK, `${TS}#today`);
await shot('ts-today-phone', PHONE, `${TS}#today`);
await shot('ts-results-desktop', DESK, `${TS}#results`);
await shot('ts-year-desktop', DESK, `${TS}#calendar-year`);
await shot('ts-year-phone', PHONE, `${TS}#calendar-year`, { full: false });
await shot('ts-rankings-desktop', DESK, `${TS}#rankings`, { full: false });
for (const k of ['a', 'b', 'c']) for (const [m, dev] of [['light', PHONE], ['dark', dark(PHONE)]])
  await shot(`ts-look-${k}-${m}`, dev, `${TS}#results`, { full: false, before: click(`.seg-b[data-look="${k}"]`) });

// Motoracer (the real timetable, results and standings from its latest saved update). A first visit is asked about
// spoilers; the other pictures answer "No, show …" first.
const show = async (p) => { await p.getByRole('button', { name: /^No, show/ }).click(); await p.waitForTimeout(500); };
const then = (...fns) => async (p) => { for (const f of fns) await f(p); };
await shot('mr-ask-phone', PHONE, `${MR}#weekend`, { full: false });
await shot('mr-weekend-desktop', DESK, `${MR}#weekend`, { before: show });
await shot('mr-weekend-phone', PHONE, `${MR}#weekend`, { before: show });
await shot('mr-results-desktop', DESK, `${MR}#results`, { before: show });
await shot('mr-champs-desktop', DESK, `${MR}#champs`, { before: show });
await shot('mr-season-desktop', DESK, `${MR}#champs`, { full: false, before: then(show, click('[data-who^="d:"]')) });
await shot('mr-season-phone', PHONE, `${MR}#champs`, { full: false, before: then(show, click('[data-who^="d:"]')) });
await shot('mr-mates-desktop', DESK, `${MR}#mates`, { full: false, before: show });
await shot('mr-year-desktop', DESK, `${MR}#calendar`, { before: then(show, click('[data-calview="year"]')) });
for (const k of ['a', 'b', 'c']) for (const [m, dev] of [['light', PHONE], ['dark', dark(PHONE)]])
  await shot(`mr-look-${k}-${m}`, dev, `${MR}#weekend`, { full: false, before: then(show, click(`.lookpill button[data-look="${k}"]`)) });

await browser.close();
console.log(JSON.stringify(log, null, 1));
