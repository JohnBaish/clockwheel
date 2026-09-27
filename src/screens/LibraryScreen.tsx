import { useApp } from '../state/store';
import { localKeys } from '../lib/weekStats';
import { splitBg, wheelBg, mixLine } from '../lib/color';
import { computeSplit, newsJunctionCount } from '../lib/clockStats';

export function LibraryScreen() {
  const { clocks, clockOrder, week, outside, categories, categoryOrder, duplicateClock, openClock } = useApp();
  const cats = { byId: categories, order: categoryOrder };
  const keys = localKeys(outside);
  const countUsage = (id: string) => keys.filter((k) => week[k] === id).length;
  const unused = clockOrder.filter((id) => !countUsage(id)).length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: 'none' }}>
          <div className="card-kicker" style={{ margin: 0 }}>Saved clocks</div>
          <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>Library</h2>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
          <span className="tag tag-neutral mono">{clockOrder.length} clock{clockOrder.length === 1 ? '' : 's'}</span>
          <span className="tag tag-neutral mono">{unused ? `${unused} not in the week` : 'all in use'}</span>
        </div>
      </div>
      {clockOrder.length === 0 ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-700)' }}>
          No clocks yet — start with New clock in the nav bar.
        </div>
      ) : (
        <div style={{ padding: '0 var(--space-4) var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 'var(--space-4)' }}>
          {clockOrder.map((id) => {
            const c = clocks[id];
            const split = computeSplit(c.segments, categoryOrder);
            const n = countUsage(id);
            return (
              <div key={id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <div style={{ width: 76, height: 76, borderRadius: 999, flex: 'none', position: 'relative', background: wheelBg(split, cats), boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.10)' }}>
                    <div style={{ position: 'absolute', inset: 23, borderRadius: 999, background: 'var(--color-surface)' }} />
                    <div style={{ position: 'absolute', left: '50%', top: -3, width: 3, height: 9, marginLeft: -1.5, borderRadius: 999, background: c.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '700 15.5px var(--font-body)', lineHeight: 1.2, textWrap: 'pretty' }}>{c.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 3 }}>
                      {n ? `used ${n} hour${n === 1 ? '' : 's'} a week` : 'not in the week'}
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
                      {(() => { const nj = newsJunctionCount(c.segments, categories); return `${nj} news junction${nj === 1 ? '' : 's'}`; })()}
                    </div>
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: splitBg(split, cats), boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.10)' }} />
                <div style={{ fontSize: '12.5px', color: 'var(--color-neutral-700)', textWrap: 'pretty' }}>
                  {mixLine(split, cats) || 'No segments yet'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 2 }}>
                  <button className="btn btn-secondary" onClick={() => duplicateClock(id)} style={{ padding: '6px 14px', fontSize: '12.5px', flex: 1 }}>Duplicate</button>
                  <button className="btn btn-ghost" onClick={() => openClock(id)} style={{ padding: '6px 14px', fontSize: '12.5px', color: 'var(--color-accent-700)' }}>Open</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
