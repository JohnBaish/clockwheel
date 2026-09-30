import { useApp } from '../state/store';

// Placeholder copy — John is writing the real text himself. Structured as
// one section per tab so it can walk through the app in the order someone
// will actually use it, but that's just a starting shape for him to change.
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Library',
    body: 'Placeholder — this is where every clock you’ve built lives. Click a clock’s name (or Open) to work on it, or Duplicate to start a new one from it.',
  },
  {
    heading: 'Clock',
    body: 'Placeholder — the circular view of one hour’s clock, built up from its segments.',
  },
  {
    heading: 'List',
    body: 'Placeholder — the same hour as a table, for editing segment names, durations and categories.',
  },
  {
    heading: 'Week',
    body: 'Placeholder — assign a clock to each hour of the week, and mark which hours are local vs. non-local.',
  },
  {
    heading: 'Summary',
    body: 'Placeholder — an overview of how the week’s clocks add up.',
  },
  {
    heading: 'Categories',
    body: 'Placeholder — the segment categories (and their colours) used across every clock.',
  },
];

export function GuideScreen() {
  const { setScreen } = useApp();

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
      <div style={{ padding: 'var(--space-3) 0' }}>
        <div className="card-kicker">Start here</div>
        <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>How to use Clockwheel</h2>
      </div>

      <div className="card" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
          Placeholder intro paragraph — replace with your own wording explaining what Clockwheel is for and how it fits into the day-to-day.
        </p>
        {SECTIONS.map((s) => (
          <div key={s.heading}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{s.heading}</h3>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--color-neutral-700)' }}>{s.body}</p>
          </div>
        ))}
        <div>
          <button className="btn btn-primary" onClick={() => setScreen('lib')} style={{ padding: '9px 20px', fontSize: '13.5px' }}>
            Go to Library
          </button>
        </div>
      </div>
    </div>
  );
}
