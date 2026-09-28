import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { dur, hourBalance } from '../lib/time';
import { songCount } from '../lib/clockStats';
import { withTimes } from '../data/segments';
import { copyClockImage, copyListImage } from '../lib/exportImage';
import { PINS_ENABLED } from '../config';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

// A filesystem-safe stand-in for whatever the clock's own name is, for the
// downloaded-file fallback's filename.
const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'clock';

// Shared header for the Clock and List screens — both are views onto
// whichever clock is currently open.
export function EditorHeader() {
  const { clocks, openClockId, renameClock, setClockHour, duplicateClock, openClock, categories, setScreen, screen } = useApp();
  const clock = clocks[openClockId];
  const total = clock.segments.reduce((a, s) => a + s.d, 0);
  const anchors = clock.segments.filter((s) => s.pin).length;
  const songs = songCount(clock.segments, categories);
  const balance = hourBalance(total);
  const [imageStatus, setImageStatus] = useState<'idle' | 'copied' | 'downloaded'>('idle');
  const nameInput = useRef<HTMLTextAreaElement | null>(null);

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

  // The name field is a <textarea> (not <input>) specifically so a long
  // title can wrap onto a second line instead of overflowing — but a plain
  // fixed-rows textarea would either clip a wrapped line or waste space on
  // a short one, so its height is measured and reset to fit its content on
  // every change.
  useEffect(() => {
    const el = nameInput.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [clock.name]);

  const copyImage = async () => {
    try {
      const filename = `${slug(clock.name)}-${String(clock.hour).padStart(2, '0')}00`;
      const result = screen === 'clock'
        ? await copyClockImage(document.querySelector<SVGSVGElement>('#clock-face-svg')!, `${filename}.png`)
        : await copyListImage(withTimes(clock.segments), clock, categories, `${filename}-list.png`);
      setImageStatus(result);
      setTimeout(() => setImageStatus('idle'), 1500);
    } catch {
      // Nothing user-actionable beyond leaving the button unchanged — the
      // clipboard/canvas APIs this relies on can be unavailable or blocked.
    }
  };

  return (
    <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
      <div style={{ flex: 'none', maxWidth: 420 }}>
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
        <textarea
          ref={nameInput}
          className="plain-input"
          rows={1}
          maxLength={40}
          value={clock.name}
          onChange={(e) => renameClock(clock.id, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
          style={{
            font: '400 32px var(--font-heading)', lineHeight: 1.05, margin: '1px 0 0', padding: '0 6px',
            display: 'block', resize: 'none', overflow: 'hidden', wordBreak: 'break-word',
          }}
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
        <button onClick={copyImage} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
          {imageStatus === 'copied' ? 'Copied!' : imageStatus === 'downloaded' ? 'Downloaded' : 'Copy image'}
        </button>
        <button onClick={() => setScreen('lib')} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>Done</button>
      </div>
    </div>
  );
}
