export const px = (n: number) => Math.round(n * 100) / 100;

/** Angle in radians for a time position (seconds into the hour); midnight/top = :00. */
export const ang = (t: number) => (t / 3600) * Math.PI * 2 - Math.PI / 2;

export function polar(t: number, r: number): [number, number] {
  const a = ang(t);
  return [r * Math.cos(a), r * Math.sin(a)];
}

export function arcPath(t0: number, span: number, ro: number, ri: number): string {
  const [ax, ay] = polar(t0, ro);
  const [bx, by] = polar(t0 + span, ro);
  const [cx, cy] = polar(t0 + span, ri);
  const [dx, dy] = polar(t0, ri);
  const lg = span > 1800 ? 1 : 0;
  return `M${px(ax)} ${px(ay)} A${ro} ${ro} 0 ${lg} 1 ${px(bx)} ${px(by)} L${px(cx)} ${px(cy)} A${ri} ${ri} 0 ${lg} 0 ${px(dx)} ${px(dy)} Z`;
}

let measureCtx: CanvasRenderingContext2D | null = null;
export function textWidth(str: string, font: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return str.length * 6; // no canvas support — rough fallback
  measureCtx.font = font;
  return measureCtx.measureText(str).width;
}

export const LABEL_FONT = '700 9.5px Figtree, "Helvetica Neue", Arial, sans-serif';

/** Wraps a callout name to at most two lines so the label column can sit close to the ring. */
export function wrap2(str: string, max: number, font: string): string[] {
  if (textWidth(str, font) <= max) return [str];
  const words = str.split(' ');
  for (let i = words.length - 1; i > 0; i--) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    if (textWidth(a, font) <= max && textWidth(b, font) <= max) return [a, b];
  }
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
}
