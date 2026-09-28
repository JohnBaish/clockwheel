import { useApp } from '../state/store';
import { withTimes } from '../data/segments';
import { ClockFace } from '../components/ClockFace';
import { PinMark } from '../lib/icons';
import { PINS_ENABLED } from '../config';

export function ClockScreen() {
  const { clocks, openClockId, categories, categoryOrder } = useApp();
  const clock = clocks[openClockId];
  const segments = withTimes(clock.segments);
  const total = segments.reduce((a, s) => a + s.d, 0);

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="print-clock-card" style={{ background: 'var(--color-surface)', borderRadius: 'calc(var(--radius-lg)*1.6)', padding: 'var(--space-6) var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
        <ClockFace segments={segments} hour={clock.hour} name={clock.name} categories={categories} />
      </div>
      <div data-noprint="1" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3) var(--space-6)', alignItems: 'center' }}>
        {categoryOrder
          .map((id) => {
            const secs = segments.filter((s) => s.c === id).reduce((a, s) => a + s.d, 0);
            const pct = total ? Math.round((secs / total) * 100) : 0;
            return { id, pct };
          })
          // A category at 0% isn't in this clock at all — categories get
          // reused across clocks for different purposes, so its absence
          // here isn't meaningful and just clutters the legend.
          .filter(({ pct }) => pct > 0)
          .map(({ id, pct }) => (
            <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13.5px' }}>
              <span style={{ width: 15, height: 15, borderRadius: 999, background: categories[id].color, flex: 'none', boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.14)' }} />
              {categories[id].name}<b className="mono">{pct}%</b>
            </span>
          ))}
        {PINS_ENABLED && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13.5px', color: 'var(--color-neutral-700)', marginLeft: 'var(--space-4)' }}>
            <PinMark />pinned to a clock time
          </span>
        )}
      </div>
    </div>
  );
}
