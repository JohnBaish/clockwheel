import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { dur, hourBalance } from '../lib/time';
import { songCount } from '../lib/clockStats';
import { PINS_ENABLED } from '../config';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

// Shared header for the Clock and List screens — both are views onto
// whichever clock is currently open.
export function EditorHeader() {
  const { clocks, openClockId, renameClock, setClockHour, duplicateClock, openClock, categories, setScreen } = useApp();
  const clock = clocks[openClockId];
  const total = clock.segments.reduce((a, s) => a + s.d, 0);
  const anchors = clock.segments.filter((s) => s.pin).length;
  const songs = songCount(clock.segments, categories);
  const balance = hourBalance(total);
  const [copied, setCopied] = useState(false);
  const nameInput = useRef<HTMLInputElement | null>(null);

  // A brand-new, untouched clock ("New clock", no segments yet) gets its name
  // field focused so it can be renamed immediately — checked whenever the
  // open clock changes, not on every keystroke.
  useEffect(() => {
    if (clock.name === 'New clock' && clock.segments.length === 0) {
      nameInput.current?.focus();
      nameInput.current?.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openClockId]);

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked (permissions, insecure context) —
      // nothing useful to do beyond leaving the button unchanged.
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
      <div style={{ flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="card-kicker" style={{ margin: 0 }}>The</span>
          <select
            className="input"
            value={clock.hour}
            onChange={(e) => setClockHour(clock.id, +e.target.value)}
            style={{ padding: '2px 8px', fontSize: '11px', width: 'auto' }}
          >
            {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
          </select>
          <span className="card-kicker" style={{ margin: 0 }}>hour</span>
        </div>
        <input
          ref={nameInput}
          className="plain-input"
          value={clock.name}
          onChange={(e) => renameClock(clock.id, e.target.value)}
          style={{ font: '400 32px var(--font-heading)', lineHeight: 1.05, margin: '1px 0 0', padding: '0 6px' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
        <span className={`tag mono ${balance.state === 'balanced' ? 'tag-accent-2' : 'tag-accent'}`}>{dur(total)} · {balance.label}</span>
        {PINS_ENABLED && <span className="tag tag-neutral mono">{anchors} anchors held</span>}
        <span className="tag tag-neutral mono">{songs} song{songs === 1 ? '' : 's'}</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
        <button
          className="btn btn-secondary"
          onClick={() => openClock(duplicateClock(clock.id))}
          style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}
        >
          Duplicate
        </button>
        <button onClick={shareLink} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
          {copied ? 'Copied!' : 'Share link'}
        </button>
        <button onClick={() => setScreen('lib')} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>Done</button>
      </div>
    </div>
  );
}
