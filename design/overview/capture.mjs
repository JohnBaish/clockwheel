// Takes every screenshot for the baish.net overview (README.md here says how it's used).
// node capture.mjs <output folder>          — the three sites served locally by make.sh
// LIVE=1 node capture.mjs <output folder>   — the live sites (needs *.baish.net allowed)
import fs from 'node:fs';
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const OUT = process.argv[2];
const LIVE = !!process.env.LIVE;
const CM = LIVE ? 'https://clockmaker.baish.net' : 'http://localhost:4301';
const FC = LIVE ? 'https://flowcharter.baish.net' : 'http://localhost:4302';
const HC = LIVE ? 'https://hindcaster.baish.net' : 'http://localhost:4303';
const HUB = LIVE ? 'https://www.baish.net/' : 'http://localhost:4301/landing.html';
// Locally, the app's own test switch gives backtimer.baish.net's standalone presentation.
const BT = LIVE ? 'https://backtimer.baish.net/' : 'http://localhost:4301/backtimer.html?host=backtimer';
const CHROME = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const log = [];

const min = (m, s) => m * 60 + s;
const btState = { backtimerWalkthroughOff: true, backtimer: { outTime: 3600, reversed: false, items: [
  ['Station ident', min(0, 8)], ['Weather', min(1, 15)], ['Travel', min(2, 0)], ['Closing song', min(3, 42)],
  ['Interview with today’s guest', min(6, 30)], ['Trail for the evening show', min(0, 30)], ['Song', min(3, 10)],
].map(([n, d], i) => ({ id: 'bt' + i, n, d })) } };
const cmWeek = { screen: 'week', week: Object.fromEntries(['mo','tu','we','th','fr'].flatMap(d => [10, 11].map(h => [`${d}-${h}`, 'daytime-1-10']))) };

const it = (id, text, type, then = { kind: 'next' }, routes = []) => ({ id, text, type, typeChosen: true, then, routes });
const chart = { id: 'c1', name: 'Booking a table', direction: 'auto', lastEditedAt: Date.now(), items: [
  it('a', 'Start', 'terminator'),
  it('b', 'Choose a restaurant', 'process'),
  it('c', 'Ask for a table for four on Friday', 'io'),
  it('d', 'Do they have a table free at 8pm?', 'decision', { kind: 'next' }, [
    { id: 'r1', label: 'Yes', to: 'e' }, { id: 'r2', label: 'No', to: 'b' }]),
  it('e', 'Pay the deposit', 'process'),
  it('f', 'Wait for the confirmation email', 'delay'),
  it('g', 'Check the confirmation email', 'document'),
  it('h', 'Table booked', 'terminator', { kind: 'end' }),
] };
const fcState = (screen) => ({ screen, charts: { c1: chart }, chartOrder: ['c1'], openChartId: 'c1', lastEditedAt: Date.now() });

async function shot(name, device, url, { storage, before, full = true, element } = {}) {
  const ctx = await browser.newContext(device);
  if (storage) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, storage);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (before) await before(page);
  await page.waitForTimeout(600);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const file = `${OUT}/${name}.png`;
  if (element) await page.locator(element).first().screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: full });
  log.push({ name, url, errors, scrollWidth: sw, fonts: [...new Set(fonts)].join(', ') });
  await ctx.close();
}

// Hub
for (const [n, d] of [['hub-desktop', DESK], ['hub-phone', PHONE]]) await shot(n, d, HUB);

// Backtimer (standalone presentation: ?host=backtimer, as on backtimer.baish.net)
await shot('bt-first-desktop', DESK, BT);
await shot('bt-first-phone', PHONE, BT);
await shot('bt-working-desktop', DESK, BT, { storage: ['clockwheel-state-v2', JSON.stringify(btState)] });
await shot('bt-working-phone', PHONE, BT, { storage: ['clockwheel-state-v2', JSON.stringify(btState)] });
await shot('bt-explainer', DESK, BT, { storage: ['clockwheel-state-v2', JSON.stringify(btState)],
  before: async p => { await p.evaluate(() => document.querySelectorAll('.backtimer-about details').forEach(d => d.open = true)); },
  element: '.backtimer-about' });

// Clockmaker
await shot('cm-guide-desktop', DESK, `${CM}/`);
await shot('cm-guide-phone', PHONE, `${CM}/`);
await shot('cm-library-desktop', DESK, `${CM}/#lib`, { storage: ['clockwheel-state-v2', JSON.stringify({ screen: 'lib' })] });
await shot('cm-clock-desktop', DESK, `${CM}/#clock`, { storage: ['clockwheel-state-v2', JSON.stringify({ screen: 'clock' })] });
await shot('cm-clock-phone', PHONE, `${CM}/#clock`, { storage: ['clockwheel-state-v2', JSON.stringify({ screen: 'clock' })] });
await shot('cm-list-desktop', DESK, `${CM}/#list`, { storage: ['clockwheel-state-v2', JSON.stringify({ screen: 'list' })] });
await shot('cm-list-phone', PHONE, `${CM}/#list`, { storage: ['clockwheel-state-v2', JSON.stringify({ screen: 'list' })] });
await shot('cm-week-desktop', DESK, `${CM}/#week`, { storage: ['clockwheel-state-v2', JSON.stringify(cmWeek)] });
await shot('cm-categories-desktop', DESK, `${CM}/#categories`, { storage: ['clockwheel-state-v2', JSON.stringify({ screen: 'categories' })] });

// Flowcharter
await shot('fc-guide-desktop', DESK, `${FC}/`);
await shot('fc-guide-phone', PHONE, `${FC}/`);
await shot('fc-list-desktop', DESK, `${FC}/`, { storage: ['flowcharter-state-v1', JSON.stringify(fcState('list'))] });
await shot('fc-list-phone', PHONE, `${FC}/`, { storage: ['flowcharter-state-v1', JSON.stringify(fcState('list'))] });
const waitChart = async p => { await p.waitForSelector('svg[data-direction]', { timeout: 15000 }); };
await shot('fc-chart-desktop', DESK, `${FC}/`, { storage: ['flowcharter-state-v1', JSON.stringify(fcState('chart'))], before: waitChart });
await shot('fc-chart-phone', PHONE, `${FC}/`, { storage: ['flowcharter-state-v1', JSON.stringify(fcState('chart'))], before: waitChart });
await shot('fc-steps-desktop', DESK, `${FC}/`, { storage: ['flowcharter-state-v1', JSON.stringify(fcState('lib'))],
  before: async p => { await p.getByRole('button', { name: 'New chart' }).first().click(); await p.waitForTimeout(400); } });

// Hindcaster
await shot('hc-chooser-desktop', DESK, `${HC}/`);
await shot('hc-chooser-phone', PHONE, `${HC}/`);
await shot('hc-rg4-desktop', DESK, `${HC}/#postcode/RG4`);
await shot('hc-rg4-phone', PHONE, `${HC}/#postcode/RG4`);
await shot('hc-berkshire-desktop', DESK, `${HC}/#county/berkshire`);
await shot('hc-about', DESK, `${HC}/#postcode/RG4`, { element: '.about' });

await browser.close();
console.log(JSON.stringify(log, null, 1));
