import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp, type Screen } from '../state/store';
import { relativeTime } from '../lib/time';
import { isBacktimerHost } from '../lib/hostMode';

const LINKS: { screen: Screen; label: string }[] = [
  { screen: 'lib', label: 'Library' },
  { screen: 'categories', label: 'Categories' },
  { screen: 'list', label: 'List' },
  { screen: 'clock', label: 'Clock' },
  { screen: 'week', label: 'Week' },
  { screen: 'summary', label: 'Summary' },
  { screen: 'backtimer', label: 'Backtimer' },
  { screen: 'guide', label: 'Guide' },
];

export function Nav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const { lastEditedAt, createClock } = useApp();
  // Same build, two domains (see lib/hostMode.ts) — on the Backtimer-only
  // one, there's nowhere else to navigate to, so the rest of Clockmaker's
  // nav simply doesn't exist here rather than existing-but-going-nowhere.
  const backtimerOnly = isBacktimerHost();
  // No links at all here — a link to the only page there is would just be a
  // no-op "you are here", and the brand text already says as much.
  const links = backtimerOnly ? [] : LINKS;
  useEffect(() => {
    if (backtimerOnly) document.title = 'Backtimer';
  }, [backtimerOnly]);
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
      <span className="nav-brand">{backtimerOnly ? 'Backtimer' : 'Clockmaker'}</span>
      <button
        className="nav-menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        data-noprint="1"
      >
        {menuOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
      {!backtimerOnly && (
        <button
          className="btn btn-primary"
          onClick={() => createClock()}
          style={{ padding: '7px 16px', fontSize: '13.5px', whiteSpace: 'nowrap', marginLeft: 'auto' }}
        >
          New clock
        </button>
      )}
      <div className={`nav-panel${menuOpen ? ' open' : ''}`}>
        {links.map((l) => (
          <a
            key={l.screen}
            href={`#${l.screen}`}
            onClick={(e) => { e.preventDefault(); navigate(l.screen); }}
            aria-current={screen === l.screen ? 'page' : undefined}
          >
            {l.label}
          </a>
        ))}
        {(screen === 'clock' || screen === 'list' || screen === 'backtimer') && (
          <button
            className="btn btn-ghost"
            onClick={() => window.print()}
            data-noprint="1"
            style={{ color: 'var(--color-accent-700)', marginLeft: backtimerOnly ? 'auto' : undefined }}
          >
            Print
          </button>
        )}
        <span className="tag tag-neutral mono" data-noprint="1">saved {relativeTime(lastEditedAt, now)}</span>
      </div>
    </div>
  );
}
