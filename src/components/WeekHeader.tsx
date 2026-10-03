import { useApp } from '../state/store';
import { computeWeekStats } from '../lib/weekStats';

export function WeekHeader() {
  const { week, outside } = useApp();
  const { assigned, slots, gaps } = computeWeekStats(week, outside);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
      <div style={{ flex: 'none' }}>
        <div className="card-kicker" style={{ margin: 0 }}>Standard week</div>
        <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>Schedule</h2>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
        <span className="tag tag-neutral mono">{assigned} of {slots} active hours assigned</span>
        <span className="tag tag-neutral mono">{gaps} unassigned</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
        <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>Save</button>
      </div>
    </div>
  );
}
