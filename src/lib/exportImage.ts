import type { Segment } from '../data/segments';
import type { Category, CategoryId } from '../data/categories';
import type { Clock } from '../data/clocks';
import { clockOf, dur } from './time';
import caprasimo400 from '@fontsource/caprasimo/files/caprasimo-latin-400-normal.woff2?url';
import caprasimo400Ext from '@fontsource/caprasimo/files/caprasimo-latin-ext-400-normal.woff2?url';
import figtree600 from '@fontsource/figtree/files/figtree-latin-600-normal.woff2?url';
import figtree600Ext from '@fontsource/figtree/files/figtree-latin-ext-600-normal.woff2?url';
import figtree700 from '@fontsource/figtree/files/figtree-latin-700-normal.woff2?url';
import figtree700Ext from '@fontsource/figtree/files/figtree-latin-ext-700-normal.woff2?url';

const BG = '#f5ead8';
const INK = '#201e1d';
const MUTED = '#645c50';
const HEADING_FONT = '"Caprasimo", system-ui, sans-serif';
const BODY_FONT = '"Figtree", system-ui, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Clipboard image writes aren't universally reliable (older browsers, and
 *  Safari can be fussy about timing) — if it fails or isn't supported, fall
 *  back to a plain file download rather than silently doing nothing. */
async function deliver(blob: Blob, filename: string): Promise<'copied' | 'downloaded'> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && 'write' in navigator.clipboard) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    }
  } catch {
    // fall through to download
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png');
  });
}

// The clock face fills a couple of its own shapes via CSS custom properties
// (var(--color-bg), var(--color-neutral-700)) so it matches the app's theme.
// That works fine live on the page, but a serialized SVG rendered standalone
// (as below, to rasterize it) has no access to the page's stylesheet, so
// those var() references would silently resolve to nothing. Inlining their
// values as a <style> block at the top of the serialized SVG fixes that.
// They're always the light theme's values (organic.css), so a copy made in
// dark mode is the same light image as ever (John, 29 October 2026: Copy
// image and printing stay light).
const EXPORTED_CSS_VARS: Record<string, string> = { '--color-bg': '#f5ead8', '--color-neutral-700': '#645c50' };

// Same problem for fonts: a standalone SVG image can't see the page's web
// fonts, so without this the copied clock falls back to the device's default
// serif/sans. The font files the clock face uses (Caprasimo 400, Figtree
// 600/700, in @fontsource's latin + latin-ext subsets) are embedded inside
// the SVG as data URLs. Fetched only on the first copy, then reused.
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const CLOCK_FONTS = [
  { family: 'Caprasimo', weight: 400, range: LATIN, url: caprasimo400 },
  { family: 'Caprasimo', weight: 400, range: LATIN_EXT, url: caprasimo400Ext },
  { family: 'Figtree', weight: 600, range: LATIN, url: figtree600 },
  { family: 'Figtree', weight: 600, range: LATIN_EXT, url: figtree600Ext },
  { family: 'Figtree', weight: 700, range: LATIN, url: figtree700 },
  { family: 'Figtree', weight: 700, range: LATIN_EXT, url: figtree700Ext },
];

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let fontFaceCss: Promise<string> | null = null;
function clockFontFaces(): Promise<string> {
  fontFaceCss ??= Promise.all(CLOCK_FONTS.map(async (f) =>
    `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};unicode-range:${f.range};` +
    `src:url(${await toDataUrl(f.url)}) format('woff2');}`,
  )).then((rules) => rules.join(''))
    // If the fonts can't be fetched, still copy the image (with fallback
    // fonts, as before) — and try again next time.
    .catch(() => { fontFaceCss = null; return ''; });
  return fontFaceCss;
}

/** Rasterizes the clock face's own SVG to a PNG — the clipboard only takes
 *  raster images, not vector markup, so the SVG has to be drawn onto a
 *  canvas first. */
export async function copyClockImage(svg: SVGSVGElement, filename: string): Promise<'copied' | 'downloaded'> {
  const scale = 2;
  const vb = svg.viewBox.baseVal;
  const width = vb && vb.width ? vb.width : svg.clientWidth;
  const height = vb && vb.height ? vb.height : svg.clientHeight;

  const fonts = await clockFontFaces();
  const styleBlock = `<style>${fonts}:root{${Object.entries(EXPORTED_CSS_VARS).map(([v, value]) => `${v}:${value};`).join('')}}</style>`;
  const svgStr = new XMLSerializer().serializeToString(svg).replace(/^(<svg[^>]*>)/, `$1${styleBlock}`);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load the clock face as an image.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return deliver(await canvasToBlob(canvas), filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Column x-positions, sized the same way the List screen's own Segment
// column was — wide enough for a realistic 50-character name (the app's
// own cap) without needing to measure it specially here.
const COL_TIME = 24;
const COL_NAME = COL_TIME + 90;
const COL_CAT = COL_NAME + 440;
const COL_DUR = COL_CAT + 130;
const CANVAS_WIDTH = COL_DUR + 80 + 24;
const ROW_H = 34;
const HEADER_H = 70;

/** Hand-draws the segment list onto a canvas. There's no native "rasterize
 *  this DOM" API the way SVG has one for the clock face, so this mirrors
 *  ListScreen's own columns (time, name, category pill, duration) directly
 *  with the canvas 2D API instead. */
export async function copyListImage(
  rows: Segment[],
  clock: Clock,
  categories: Record<CategoryId, Category>,
  filename: string,
): Promise<'copied' | 'downloaded'> {
  const scale = 2;
  const height = HEADER_H + Math.max(1, rows.length) * ROW_H + 24;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = INK;
  ctx.font = `400 22px ${HEADING_FONT}`;
  ctx.fillText(`${clock.name} · ${String(clock.hour).padStart(2, '0')}:00`, 24, 36);

  ctx.font = `700 11px ${BODY_FONT}`;
  ctx.fillStyle = MUTED;
  const headerBaseline = HEADER_H - 12;
  ctx.fillText('TIME', COL_TIME, headerBaseline);
  ctx.fillText('SEGMENT', COL_NAME, headerBaseline);
  ctx.fillText('CATEGORY', COL_CAT, headerBaseline);
  ctx.fillText('DUR', COL_DUR, headerBaseline);
  ctx.strokeStyle = 'rgba(32,30,29,.15)';
  ctx.beginPath();
  ctx.moveTo(24, HEADER_H - 2);
  ctx.lineTo(CANVAS_WIDTH - 24, HEADER_H - 2);
  ctx.stroke();

  rows.forEach((s, i) => {
    const y = HEADER_H + i * ROW_H;
    const textY = y + ROW_H / 2 + 4;

    ctx.strokeStyle = 'rgba(32,30,29,.08)';
    ctx.beginPath();
    ctx.moveTo(24, y + ROW_H);
    ctx.lineTo(CANVAS_WIDTH - 24, y + ROW_H);
    ctx.stroke();

    ctx.font = `400 13px ${BODY_FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(clockOf(clock.hour, s.t), COL_TIME, textY);

    ctx.font = `600 13px ${BODY_FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(s.n, COL_NAME, textY, COL_CAT - COL_NAME - 16);

    const cat = categories[s.c];
    if (cat) {
      ctx.font = `600 11px ${BODY_FONT}`;
      const padX = 10;
      const pillH = 20;
      const pillW = ctx.measureText(cat.name).width + padX * 2;
      const pillY = y + (ROW_H - pillH) / 2;
      ctx.fillStyle = cat.color;
      roundRect(ctx, COL_CAT, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = cat.ink;
      ctx.fillText(cat.name, COL_CAT + padX, pillY + pillH / 2 + 4);
    }

    ctx.font = `400 13px ${BODY_FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(dur(s.d), COL_DUR, textY);
  });

  return deliver(await canvasToBlob(canvas), filename);
}
