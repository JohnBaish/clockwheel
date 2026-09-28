import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
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

  // Below the narrow-screen breakpoint (see global.css), the links/Print/
  // saved-tag collapse behind this toggle instead of overflowing the bar —
  // on a wide screen .nav-panel is CSS `display: contents`, so this state
  // is simply irrelevant there regardless of its value.
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (s: Screen) => { onNavigate(s); setMenuOpen(false); };

  return (
    <div className="nav" style={{ padding: 'var(--space-3) var(--space-6)', background: 'var(--color-surface)', flexWrap: 'wrap' }}>
      <span className="nav-brand">Clockwheel</span>
      <button
        className="nav-menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        data-noprint="1"
      >
        {menuOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
      <button
        className="btn btn-primary"
        onClick={() => createClock()}
        style={{ padding: '7px 16px', fontSize: '13.5px', whiteSpace: 'nowrap', marginLeft: 'auto' }}
      >
        New clock
      </button>
      <div className={`nav-panel${menuOpen ? ' open' : ''}`}>
        {LINKS.map((l) => (
          <a
            key={l.screen}
            href={`#${l.screen}`}
            onClick={(e) => { e.preventDefault(); navigate(l.screen); }}
            aria-current={screen === l.screen ? 'page' : undefined}
          >
            {l.label}
          </a>
        ))}
        {(screen === 'clock' || screen === 'list') && (
          <button
            className="btn btn-ghost"
            onClick={() => window.print()}
            data-noprint="1"
            style={{ color: 'var(--color-accent-700)' }}
          >
            Print
          </button>
        )}
        <span className="tag tag-neutral mono" data-noprint="1">saved {relativeTime(lastEditedAt, now)}</span>
      </div>
    </div>
  );
}
