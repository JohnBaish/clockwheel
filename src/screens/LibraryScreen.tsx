import { useRef, useState, type ChangeEvent } from 'react';
import { useApp } from '../state/store';
import { localKeys } from '../lib/weekStats';
import { splitBg, wheelBg, mixLine } from '../lib/color';
import { computeSplit, newsJunctionCount } from '../lib/clockStats';

export function LibraryScreen() {
  const { clocks, clockOrder, week, outside, categories, categoryOrder, duplicateClock, openClock, exportState, importState } = useApp();
  const cats = { byId: categories, order: categoryOrder };
  const keys = localKeys(outside);
  const countUsage = (id: string) => keys.filter((k) => week[k] === id).length;
  const unused = clockOrder.filter((id) => !countUsage(id)).length;
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clockwheel-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setError(importState(text));
  };

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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
          <input ref={fileInput} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => fileInput.current?.click()} style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
            Import
          </button>
          <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
            Export
          </button>
        </div>
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-accent-100)', color: 'var(--color-accent-800)', borderRadius: 'var(--radius-md)', padding: '10px 14px', margin: '0 var(--space-4) var(--space-3)', fontSize: 13.5 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-ghost" onClick={() => setError(null)} style={{ color: 'var(--color-accent-700)', padding: '2px 8px' }}>Dismiss</button>
        </div>
      )}
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
                  <button className="btn btn-ghost" onClick={() => openClock(id)} style={{ padding: '6px 14px', fontSize: '12.5px', flex: 1, color: 'var(--color-accent-700)', borderColor: 'var(--color-divider)' }}>Open</button>
                  <button className="btn btn-secondary" onClick={() => duplicateClock(id)} style={{ padding: '6px 14px', fontSize: '12.5px' }}>Duplicate</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
