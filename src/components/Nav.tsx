import { useEffect, useState } from 'react';
import { useApp, type Screen } from '../state/store';
import { relativeTime } from '../lib/time';

const LINKS: { screen: Screen; label: string }[] = [
  { screen: 'lib', label: 'Library' },
  { screen: 'clock', label: 'Clock' },
  { screen: 'list', label: 'List' },
  { screen: 'week', label: 'Week' },
  { screen: 'summary', label: 'Summary' },
  { screen: 'categories', label: 'Categories' },
];

export function Nav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const { lastEditedAt, createClock } = useApp();
  // The "ago" wording goes stale just from time passing, not just from edits —
  // this ticks "now" periodically so it stays accurate while idle.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="nav" style={{ padding: 'var(--space-3) var(--space-6)', background: 'var(--color-surface)' }}>
      <span className="nav-brand">Clockwheel</span>
      {LINKS.map((l) => (
        <a
          key={l.screen}
          href={`#${l.screen}`}
          onClick={(e) => { e.preventDefault(); onNavigate(l.screen); }}
          aria-current={screen === l.screen ? 'page' : undefined}
        >
          {l.label}
        </a>
      ))}
      <button
        className="btn btn-primary"
        onClick={() => createClock()}
        style={{ padding: '7px 16px', fontSize: '13.5px', whiteSpace: 'nowrap', marginLeft: 'auto' }}
      >
        New clock
      </button>
      <button
        className="btn btn-ghost"
        onClick={() => window.print()}
        data-noprint="1"
        style={{ color: 'var(--color-accent-700)' }}
      >
        Print
      </button>
      <span className="tag tag-neutral mono" data-noprint="1">saved {relativeTime(lastEditedAt, now)}</span>
    </div>
  );
}
