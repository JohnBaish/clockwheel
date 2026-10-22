// Turns overview.html into the PDF, checking fonts, pictures and that nothing spills off a page.
// node pdf.mjs <path to overview.html> <path to output .pdf>
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs');
const CHROME = '/opt/pw-browsers/chromium';
const [src, out] = process.argv.slice(2);
const b = await chromium.launch({ ...(fs.existsSync(CHROME) ? { executablePath: CHROME } : {}), args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.goto('file://' + src, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
const info = await p.evaluate(() => ({
  fonts: [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.style + ': ' + f.status),
  broken: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
  overflow: [...document.querySelectorAll('.page')].map((pg, i) => {
    const r = pg.getBoundingClientRect(); const folio = pg.querySelector('.folio');
    const limit = folio ? folio.getBoundingClientRect().top : r.bottom;
    let max = 0; pg.querySelectorAll(':scope > *:not(.folio)').forEach(c => { max = Math.max(max, c.getBoundingClientRect().bottom); });
    return max > limit + 1 ? `page ${i + 1} overflows by ${Math.round(max - limit)}px` : null; }).filter(Boolean),
  pages: document.querySelectorAll('.page').length }));
console.log(JSON.stringify(info, null, 1));
await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
