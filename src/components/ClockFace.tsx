import { useMemo, type ReactNode } from 'react';
import type { Segment } from '../data/segments';
import type { Category, CategoryId } from '../data/categories';
import { ang, polar, arcPath, px, textWidth, wrap2, LABEL_FONT } from '../lib/geometry';
import { PINS_ENABLED } from '../config';

const RO = 140;
const RI = 58;
const TURN_R = RO + 38;

interface ScoredSegment extends Segment {
  i: number;
  avail: number;
  w: number;
  ratio: number;
}

interface Extent { x: number; y: number }

// A segment's angular midpoint in [0, 360) degrees. An over-length hour can
// push t past 3600s, so this must wrap — otherwise left/right callout
// placement and label orientation break for anything past the top of hour.
const degOf = (s: { t: number; d: number }) => (((s.t + s.d / 2) / 3600) * 360) % 360;

// Faithful port of the design prototype's face() renderer: segments that
// don't fit their own arc get pulled out to a callout with a leader line,
// placed and de-collided dynamically from measured text — not by hand.
function buildFace(segments: Segment[], hour: number, name: string, categories: Record<CategoryId, Category>) {
  const arcMid = (RO + RI) / 2;
  const ext: Extent = { x: RO + 46, y: RO + 46 };

  // Labels sit radially (like spokes, e.g. "News" at the top reads top-to-bottom),
  // not curved along the arc — so the real ceiling on how much text fits is the
  // ring's fixed radial thickness, not the segment's arc length. Arc length
  // tracks that closely enough for ordinary short segments that it's never
  // mattered, but it grows without bound as duration grows, so an unusually
  // long segment can wildly overstate how much room it actually has. Capping
  // "avail" at the ring's thickness fixes that without changing anything for
  // segments in the normal range (their arc length is already below the cap).
  const RADIAL_AVAIL = RO - RI - 6;
  const scored: ScoredSegment[] = segments.map((s, i) => {
    const arcAvail = (s.d / 3600) * 2 * Math.PI * (RO - 14) - 4;
    const avail = Math.min(arcAvail, RADIAL_AVAIL);
    const w = textWidth(s.n, LABEL_FONT);
    return { ...s, i, avail, w, ratio: w / Math.max(1, avail) };
  });

  let callouts = scored.filter((s) => s.ratio > 1);
  const MAX_CALLOUTS = 6;
  if (callouts.length > MAX_CALLOUTS) {
    callouts = [...callouts].sort((a, b) => b.ratio - a.ratio).slice(0, MAX_CALLOUTS);
  }
  const outIds = new Set(callouts.map((s) => s.i));
  const inner = scored.filter((s) => !outIds.has(s.i));

  const k: ReactNode[] = [
    <circle key="bg" cx={0} cy={0} r={RO + 1} fill="var(--color-bg)" />,
  ];

  segments.forEach((s, i) => {
    k.push(
      <path key={`a${i}`} d={arcPath(s.t, s.d, RO, RI)} fill={categories[s.c].color} stroke="var(--color-bg)" strokeWidth={1.4} />
    );
  });

  // minute ticks: every minute, five-minute marks longer, quarters heaviest
  for (let m = 0; m < 60; m++) {
    const q = m % 15 === 0;
    const five = m % 5 === 0;
    const [x1, y1] = polar(m * 60, RO + 4);
    const [x2, y2] = polar(m * 60, RO + (q ? 16 : five ? 11 : 5));
    k.push(
      <line
        key={`t${m}`} x1={px(x1)} y1={px(y1)} x2={px(x2)} y2={px(y2)}
        stroke={q ? '#201e1d' : five ? 'rgba(32,30,29,.55)' : 'rgba(32,30,29,.26)'}
        strokeWidth={q ? 2.6 : five ? 1.6 : 1} strokeLinecap="round"
      />
    );
  }

  // anchor spokes + pin dots — hidden behind PINS_ENABLED for now, kept for a future re-enable
  if (PINS_ENABLED) {
    segments.forEach((s, i) => {
      if (!s.pin) return;
      const [x1, y1] = polar(s.t, RI - 3);
      const [x2, y2] = polar(s.t, RO + 9);
      k.push(<line key={`sp${i}`} x1={px(x1)} y1={px(y1)} x2={px(x2)} y2={px(y2)} stroke="#201e1d" strokeWidth={2.6} strokeLinecap="round" />);
      const [cx, cy] = polar(s.t, RO + 21);
      k.push(<circle key={`ph${i}`} cx={px(cx)} cy={px(cy)} r={7} fill="var(--color-bg)" />);
      k.push(<circle key={`pd${i}`} cx={px(cx)} cy={px(cy)} r={5} fill="#201e1d" />);
    });
  }

  // labels that fit, set along the arc
  inner.forEach((s) => {
    const deg = degOf(s);
    const flip = deg > 180 ? 90 : -90;
    k.push(
      <text
        key={`il${s.i}`} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(${px(deg)}) translate(0,-${arcMid}) rotate(${flip})`}
        fill={categories[s.c].ink}
        style={{ fontFamily: 'Figtree,sans-serif', fontWeight: 700, fontSize: '9.5px', letterSpacing: '.02em' }}
      >
        {s.n}
      </text>
    );
  });

  // labels that don't fit, set outside with a leader line
  const right = callouts
    .filter((s) => degOf(s) < 180)
    .sort((a, b) => (a.t + a.d / 2) - (b.t + b.d / 2));
  const left = callouts
    .filter((s) => degOf(s) >= 180)
    .sort((a, b) => (b.t + b.d / 2) - (a.t + a.d / 2));

  const place = (list: ScoredSegment[], side: 1 | -1) => {
    const n = list.length;
    if (!n) return;
    const rows = list.map((s) => wrap2(s.n, 62, LABEL_FONT));
    const COL = TURN_R * 0.92;
    const SHELF = TURN_R + 26;
    const angs = list.map((s) => ang(s.t + s.d / 2));
    const turns = angs.map((a) => [Math.cos(a) * TURN_R, Math.sin(a) * TURN_R] as [number, number]);
    // A segment sitting at the very top or bottom of the hour has nowhere useful to
    // point sideways, so its label goes on a shelf just above or below the ring and
    // gets a short steep leader. Everything else keeps to a side column at the
    // height its own segment points at, which is what stops leaders crossing.
    const shelf = angs.map((a) => Math.abs(Math.sin(a)) > 0.95);
    const ys = turns.map((t, i) => (shelf[i] ? Math.sign(t[1]) * SHELF : t[1]));
    const xs = turns.map((_t, i) => (shelf[i] ? side * 52 : side * COL));
    const col: number[] = [];
    list.forEach((_s, i) => { if (!shelf[i]) col.push(i); });
    const gapAt = (i: number, p: number) => (rows[i].length > 1 || rows[p].length > 1 ? 22 : 15);
    for (let q = 1; q < col.length; q++) {
      const i = col[q], p = col[q - 1];
      if (ys[i] - ys[p] < gapAt(i, p)) ys[i] = ys[p] + gapAt(i, p);
    }
    // Two segments can both sit near :00 or near :30 and land on the same shelf
    // (same side, same top/bottom) — previously they got the exact same (x,y)
    // and overlapped outright. Space them out along the shelf, ordered to match
    // their real position on the ring, the same way the column items are spaced.
    const shelfGroups = new Map<number, number[]>();
    list.forEach((_s, i) => {
      if (!shelf[i]) return;
      const key = Math.sign(ys[i]) || 1;
      if (!shelfGroups.has(key)) shelfGroups.set(key, []);
      shelfGroups.get(key)!.push(i);
    });
    shelfGroups.forEach((idxs) => {
      idxs.sort((a, b) => turns[a][0] - turns[b][0]);
      let cursor = 52;
      idxs.forEach((i) => {
        xs[i] = side * cursor;
        const w = Math.max(...rows[i].map((ln) => textWidth(ln, LABEL_FONT)));
        cursor += w + 24;
      });
    });
    list.forEach((s, j) => {
      const mid = s.t + s.d / 2;
      const [bx, by] = turns[j];
      const ex = xs[j], ey = ys[j];
      const [tipx, tipy] = polar(mid, RO + 2);
      k.push(<circle key={`cd${s.i}`} cx={px(tipx)} cy={px(tipy)} r={2.2} fill="rgba(32,30,29,.55)" />);
      k.push(
        <line key={`ct${s.i}`} x1={px(tipx)} y1={px(tipy)} x2={px(bx)} y2={px(by)}
          stroke="rgba(32,30,29,.34)" strokeWidth={1.2} strokeLinecap="round" strokeDasharray="1.5 3" />
      );
      k.push(
        <line key={`cl${s.i}`} x1={px(bx)} y1={px(by)} x2={px(ex)} y2={px(ey)}
          stroke="rgba(32,30,29,.28)" strokeWidth={1.2} strokeLinecap="round" />
      );
      const anchor = side > 0 ? 'start' : 'end';
      k.push(
        <circle key={`cs${s.i}`} cx={px(ex + side * 5)} cy={px(ey)} r={3.6} fill={categories[s.c].color} stroke="rgba(32,30,29,.14)" strokeWidth={1} />
      );
      const lines = rows[j];
      const tx = px(ex + side * 13);
      k.push(
        <text
          key={`cn${s.i}`} x={tx} y={px(ey - (lines.length > 1 ? 5 : 0))}
          dominantBaseline="middle" textAnchor={anchor} fill="var(--color-neutral-700)"
          style={{ fontFamily: 'Figtree,sans-serif', fontWeight: 600, fontSize: '9.5px', letterSpacing: '.02em' }}
        >
          {lines.map((ln, q) => <tspan key={q} x={tx} dy={q ? 11 : 0}>{ln}</tspan>)}
        </text>
      );
      const w = Math.max(...lines.map((ln) => textWidth(ln, LABEL_FONT)));
      ext.x = Math.max(ext.x, Math.abs(ex) + 13 + w);
      ext.y = Math.max(ext.y, Math.abs(ey) + (lines.length > 1 ? 16 : 6));
    });
  };
  place(right, 1);
  place(left, -1);

  // minute labels last, with a ground-coloured halo, so leaders never obscure them
  for (let m = 0; m < 60; m += 5) {
    const q = m % 15 === 0;
    const [x, y] = polar(m * 60, RO + (q ? 32 : 29));
    k.push(
      <text
        key={`ml${m}`} x={px(x)} y={px(y)} textAnchor="middle" dominantBaseline="middle"
        fill={q ? '#201e1d' : 'var(--color-neutral-700)'}
        style={{
          stroke: 'var(--color-bg)', strokeWidth: 3.4, paintOrder: 'stroke',
          ...(q
            ? { fontFamily: 'Caprasimo,serif', fontSize: '14px' }
            : { fontFamily: 'Figtree,sans-serif', fontWeight: 700, fontSize: '10.5px', letterSpacing: '.02em' }),
        }}
      >
        {':' + String(m).padStart(2, '0')}
      </text>
    );
  }

  // hub — just the clock's name and its hour; total/balance live in EditorHeader's
  // tag row above the face, so repeating them here would just be noise.
  k.push(<circle key="in" cx={0} cy={0} r={RI - 1} fill="var(--color-bg)" />);
  k.push(
    <text key="h1" x={0} y={-9} textAnchor="middle" fill="var(--color-neutral-700)"
      style={{ fontFamily: 'Figtree,sans-serif', fontWeight: 700, fontSize: '8px', letterSpacing: '.1em' }}>
      {name.toUpperCase()}
    </text>
  );
  k.push(
    <text key="h2" x={0} y={9} textAnchor="middle" fill="#201e1d"
      style={{ fontFamily: 'Caprasimo,serif', fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}>
      {String(hour).padStart(2, '0')}:00
    </text>
  );

  const EX = Math.ceil(ext.x) + 6;
  const EY = Math.ceil(ext.y) + 6;
  return { nodes: k, EX, EY };
}

interface ClockFaceProps {
  segments: Segment[];
  hour: number;
  name: string;
  categories: Record<CategoryId, Category>;
}

export function ClockFace({ segments, hour, name, categories }: ClockFaceProps) {
  const { nodes, EX, EY } = useMemo(() => buildFace(segments, hour, name, categories), [segments, hour, name, categories]);
  return (
    <svg
      id="clock-face-svg"
      viewBox={`${-EX} ${-EY} ${EX * 2} ${EY * 2}`}
      style={{ width: '100%', maxWidth: `${px(Math.min(760, 700 * (EX / EY)))}px`, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      {nodes}
    </svg>
  );
}
