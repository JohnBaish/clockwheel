import { useState, useEffect } from 'react';
import { useApp } from '../state/store';
import { DAYS } from '../data/days';
import { splitBg } from '../lib/color';
import { computeSplit } from '../lib/clockStats';
import { relativeTime } from '../lib/time';
import { useIsNarrow } from '../lib/responsive';

export function SummaryScreen() {
  const { clocks, clockOrder, week, outside, sumSel, setSumSel, openClock, categories, categoryOrder } = useApp();
  const cats = { byId: categories, order: categoryOrder };
  const isNarrow = useIsNarrow(720);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: 'none' }}>
          <div className="card-kicker" style={{ margin: 0 }}>Standard week</div>
          <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>Summary</h2>
        </div>
      </div>

      <div style={{ padding: '0 var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'var(--color-surface)', borderRadius: 'calc(var(--radius-lg)*1.1)', padding: '9px var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ font: '700 11px var(--font-body)', letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-neutral-700)', flex: 'none' }}>Selected clock</span>
          <select
            className="input"
            style={{ width: 240, padding: '6px 14px', fontSize: '13.5px' }}
            value={sumSel}
            onChange={(e) => setSumSel(e.target.value)}
          >
            {clockOrder.map((id) => <option key={id} value={id}>{clocks[id].name}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={() => openClock(sumSel)} style={{ color: 'var(--color-accent-700)', whiteSpace: 'nowrap' }}>Open clock</button>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 'calc(var(--radius-lg)*1.4)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            {categoryOrder.map((id) => (
              <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '12.5px', color: 'var(--color-neutral-800)' }}>
                <span style={{ width: 13, height: 13, borderRadius: 999, background: categories[id].color, flex: 'none', boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.14)' }} />{categories[id].name}
              </span>
            ))}
          </div>
          {clockOrder.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-700)' }}>No clocks yet.</div>
          ) : (
            <>
              {isNarrow && (
                <div data-noprint="1" style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginBottom: 6 }}>
                  Swipe the table sideways to see Days and Last changed →
                </div>
              )}
              <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Clock</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Hours a week</th>
                  <th style={{ textAlign: 'left', minWidth: 180 }}>Mix</th>
                  <th style={{ textAlign: 'left' }}>Days</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Last changed</th>
                </tr>
              </thead>
              <tbody>
                {clockOrder.map((id) => {
                  const c = clocks[id];
                  const split = computeSplit(c.segments, categoryOrder);
                  const keys = Object.keys(week).filter((k) => week[k] === id && !outside[k]);
                  const runs = DAYS.map(([d]) => keys.some((k) => k.split('-')[0] === d));
                  const selected = id === sumSel;
                  return (
                    <tr key={id} onClick={() => setSumSel(id)} style={{ cursor: 'pointer', background: selected ? 'var(--color-accent-100)' : 'transparent' }}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                          <span style={{ width: 15, height: 15, borderRadius: 999, flex: 'none', background: c.color, boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.12)' }} />
                          <b style={{ fontWeight: selected ? 800 : 600 }}>{c.name}</b>
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: 'right' }}>{keys.length || '—'}</td>
                      <td>
                        <span style={{ display: 'block', height: 11, borderRadius: 999, background: splitBg(split, cats), boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.10)' }} />
                      </td>
                      <td>
                        <span style={{ display: 'flex', gap: 3 }}>
                          {DAYS.map(([d, dl], i) => (
                            <span key={d} className="mono" style={{ width: 17, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '11.5px', fontWeight: runs[i] ? 800 : 500, color: runs[i] ? 'var(--color-text)' : 'var(--color-neutral-700)' }}>
                              {dl[0]}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: 'right', color: 'var(--color-neutral-700)', whiteSpace: 'nowrap' }}>{relativeTime(c.lastEditedAt, now)}</td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
}
