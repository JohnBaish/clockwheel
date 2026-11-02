// Takes every screenshot for the baish.net overview pictures (README.md here says how it's used).
// LIVE=1 node capture.mjs <output folder>   — the live sites (needs *.baish.net allowed; preferred)
// node capture.mjs <output folder>          — the five repos built and served locally by make.sh
import fs from 'node:fs';
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const OUT = process.argv[2];
const LIVE = !!process.env.LIVE;
const CM = LIVE ? 'https://clockmaker.baish.net' : 'http://localhost:4301';
const FC = LIVE ? 'https://flowcharter.baish.net' : 'http://localhost:4302';
const HC = LIVE ? 'https://hindcaster.baish.net' : 'http://localhost:4303';
const LR = LIVE ? 'https://lightreader.baish.net' : 'http://localhost:4304';
const RF = LIVE ? 'https://refueller.baish.net' : 'http://localhost:4305';
const RW = LIVE ? 'https://riverwatcher.baish.net' : 'http://localhost:4306';
const HUB = LIVE ? 'https://www.baish.net/' : 'http://localhost:4301/landing.html';
// Locally, the app's own test switch gives backtimer.baish.net's standalone presentation.
const BT = LIVE ? 'https://backtimer.baish.net/' : 'http://localhost:4301/backtimer.html?host=backtimer';
const CHROME = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' };
const dark = (d) => ({ ...d, colorScheme: 'dark' });
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

async function shot(name, device, url, { storage, before, full = true, element, wait } = {}) {
  const ctx = await browser.newContext(device);
  if (storage) await ctx.addInitScript((pairs) => { if (!sessionStorage.getItem('seeded')) { for (const [k, v] of pairs) localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, Array.isArray(storage[0]) ? storage : [storage]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (wait) await page.waitForSelector(wait, { timeout: 30000 });
  if (before) await before(page);
  await page.waitForTimeout(800);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const file = `${OUT}/${name}.png`;
  if (element) await page.locator(element).first().screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: full });
  log.push({ name, url, errors, scrollWidth: sw, fonts: [...new Set(fonts)].join(', ') });
  await ctx.close();
}

// Hub
await shot('hub-desktop', DESK, HUB);
await shot('hub-phone', PHONE, HUB);

// Backtimer (standalone presentation, as on backtimer.baish.net)
const btSeed = ['clockwheel-state-v2', JSON.stringify(btState)];
await shot('bt-first-desktop', DESK, BT);
await shot('bt-working-desktop', DESK, BT, { storage: btSeed });
await shot('bt-working-phone', PHONE, BT, { storage: btSeed });

// Clockmaker
const cm = (screen) => ['clockwheel-state-v2', JSON.stringify({ screen })];
await shot('cm-clock-desktop', DESK, `${CM}/#clock`, { storage: cm('clock') });
await shot('cm-clock-phone', PHONE, `${CM}/#clock`, { storage: cm('clock') });
await shot('cm-list-desktop', DESK, `${CM}/#list`, { storage: cm('list') });
await shot('cm-week-desktop', DESK, `${CM}/#week`, { storage: ['clockwheel-state-v2', JSON.stringify(cmWeek)] });
await shot('cm-guide-desktop', DESK, `${CM}/`);

// Flowcharter
const fc = (screen) => ['flowcharter-state-v1', JSON.stringify(fcState(screen))];
const waitChart = 'svg[data-direction]';
await shot('fc-chart-desktop', DESK, `${FC}/`, { storage: fc('chart'), wait: waitChart });
await shot('fc-chart-phone', PHONE, `${FC}/`, { storage: fc('chart'), wait: waitChart });
await shot('fc-list-desktop', DESK, `${FC}/`, { storage: fc('list') });
await shot('fc-steps-desktop', DESK, `${FC}/`, { storage: fc('lib'),
  before: async p => { await p.getByRole('button', { name: 'New chart' }).first().click(); await p.waitForTimeout(400); } });

// Hindcaster (real figures: whichever update is current)
await shot('hc-chooser-desktop', DESK, `${HC}/`);
await shot('hc-rg4-desktop', DESK, `${HC}/#postcode/RG4`);
await shot('hc-rg4-phone', PHONE, `${HC}/#postcode/RG4`);
await shot('hc-county-desktop', DESK, `${HC}/#county/berkshire`);

// Lightreader (real figures for the moment the picture is taken)
const lr = ['lightreader.postcode', 'RG4'];
await shot('lr-first-desktop', DESK, `${LR}/`);
await shot('lr-rg4-desktop', DESK, `${LR}/`, { storage: lr, wait: '.group' });
await shot('lr-rg4-phone', PHONE, `${LR}/`, { storage: lr, wait: '.group' });

// Refueller (real prices from the latest collection)
await shot('rf-start-desktop', DESK, `${RF}/`);
await shot('rf-rg4-desktop', DESK, `${RF}/#RG4`, { wait: '.results-head' });
await shot('rf-rg4-phone', PHONE, `${RF}/#RG4`, { wait: '.results-head' });
await shot('rf-calc-phone', PHONE, `${RF}/#RG4`, { wait: '.results-head', full: false,
  before: async p => { await p.getByRole('button', { name: 'Worth driving here?' }).first().tap(); await p.waitForSelector('.calc'); await p.waitForTimeout(1200); } });
await shot('rf-journey-desktop', DESK, `${RF}/#route/@Wokingham/@Horsham`, { wait: '.results-head' });

// Riverwatcher (real river levels from the latest hourly collection)
await shot('rw-chooser-desktop', DESK, `${RW}/#choose`);
await shot('rw-rg4-desktop', DESK, `${RW}/#postcode/RG4`, { wait: '#detail' });
await shot('rw-rg4-phone', PHONE, `${RW}/#postcode/RG4`, { wait: '#detail' });
await shot('rw-county-desktop', DESK, `${RW}/#county/berkshire`, { wait: '#detail' });
await shot('rw-england-desktop', DESK, `${RW}/#england`, { wait: '#detail', full: false });

// Dark mode: each tool's main screen on a phone, following the device's setting
await shot('dark-hub', dark(PHONE), HUB, { full: false });
await shot('dark-bt', dark(PHONE), BT, { storage: btSeed, full: false });
await shot('dark-cm', dark(PHONE), `${CM}/#clock`, { storage: cm('clock'), full: false });
await shot('dark-fc', dark(PHONE), `${FC}/`, { storage: fc('chart'), wait: waitChart, full: false });
await shot('dark-hc', dark(PHONE), `${HC}/#postcode/RG4`, { full: false });
await shot('dark-lr', dark(PHONE), `${LR}/`, { storage: lr, wait: '.group', full: false });
await shot('dark-rf', dark(PHONE), `${RF}/#RG4`, { wait: '.results-head', full: false });
await shot('dark-rw', dark(PHONE), `${RW}/#postcode/RG4`, { wait: '#detail', full: false });

await browser.close();
console.log(JSON.stringify(log, null, 1));
