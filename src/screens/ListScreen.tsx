import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { withTimes } from '../data/segments';
import { clockOf, dur, parseDur } from '../lib/time';
import { IconGrip, IconPin, IconPlus, IconNote, IconTrash } from '../lib/icons';
import { PINS_ENABLED, NOTES_ENABLED } from '../config';

export function ListScreen() {
  const {
    clocks, openClockId, reorderSegments, setSegmentCategory, setSegmentName,
    setSegmentDuration, addSegment, removeSegment, categories, categoryOrder,
  } = useApp();
  const clock = clocks[openClockId];
  const seed = clock.segments;
  const rows = withTimes(seed);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [durDrafts, setDurDrafts] = useState<Record<string, string>>({});
  const nameInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const durInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevCount = useRef(seed.length);
  // Tab-ing past the last row's duration adds a new row and should land back
  // in ITS duration field (keeping a fast duration-entry flow going), unlike
  // the Add-segment button, which focuses the name field for renaming.
  const focusNewRowDuration = useRef(false);

  useEffect(() => {
    if (seed.length > prevCount.current) {
      const lastId = seed[seed.length - 1].id;
      if (focusNewRowDuration.current) {
        const input = durInputs.current[lastId];
        if (input) { input.focus(); input.select(); }
      } else {
        const input = nameInputs.current[lastId];
        if (input) { input.focus(); input.select(); }
      }
      focusNewRowDuration.current = false;
    }
    prevCount.current = seed.length;
  }, [seed]);

  const handleDrop = (targetIndex: number) => {
    if (dragIndex !== null && dragIndex !== targetIndex) reorderSegments(dragIndex, targetIndex);
    setDragIndex(null);
    setOverIndex(null);
  };

  const commitDuration = (segmentId: string) => {
    const parsed = parseDur(durDrafts[segmentId] ?? '');
    if (parsed !== null) setSegmentDuration(segmentId, parsed);
    setDurDrafts((d) => { const next = { ...d }; delete next[segmentId]; return next; });
  };

  const focusDuration = (segmentId: string) => {
    const input = durInputs.current[segmentId];
    if (input) { input.focus(); input.select(); }
  };

  const handleDurationTab = (index: number, segmentId: string) => {
    commitDuration(segmentId);
    if (index < rows.length - 1) {
      focusDuration(rows[index + 1].id);
    } else {
      focusNewRowDuration.current = true;
      addSegment();
    }
  };

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
      <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <span style={{ font: '700 11px var(--font-body)', letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
          {rows.length} segments · drag to reorder
        </span>
        <button className="btn btn-ghost" onClick={() => addSegment()} style={{ marginLeft: 'auto', color: 'var(--color-accent-700)' }}>
          <IconPlus size={15} />Add segment
        </button>
      </div>
      <div className="print-only" style={{ font: '400 22px var(--font-heading)', marginBottom: 'var(--space-3)' }}>
        {clock.name} · {String(clock.hour).padStart(2, '0')}:00
      </div>
      <table className="table">
        <thead>
          <tr>
            <th data-noprint="1" style={{ width: 26 }}></th>
            <th style={{ width: 78 }}>Time</th>
            <th style={{ width: 460 }}>Segment</th>
            <th style={{ width: 104 }}>Category</th>
            <th style={{ width: 84 }}>Dur</th>
            {PINS_ENABLED && <th style={{ width: 104 }}>Anchor</th>}
            {NOTES_ENABLED && <th style={{ width: 30 }}></th>}
            <th data-noprint="1" style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
                No segments yet — add the first one above.
              </td>
            </tr>
          )}
          {rows.map((s, i) => (
            <tr
              key={s.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              style={{
                opacity: dragIndex === i ? 0.4 : 1,
                background: overIndex === i && dragIndex !== null && dragIndex !== i ? 'var(--color-accent-100)' : undefined,
              }}
            >
              <td data-noprint="1" style={{ paddingRight: 0, color: 'var(--color-neutral-600)', cursor: 'grab' }}><IconGrip size={14} /></td>
              <td className="mono" style={{ fontWeight: PINS_ENABLED && s.pin ? 700 : 400, color: PINS_ENABLED && s.pin ? '#201e1d' : 'var(--color-neutral-700)' }}>
                {clockOf(clock.hour, s.t)}
              </td>
              <td>
                <input
                  ref={(el) => { nameInputs.current[s.id] = el; }}
                  className="plain-input"
                  style={{ fontWeight: 600 }}
                  value={s.n}
                  maxLength={50}
                  onChange={(e) => setSegmentName(s.id, e.target.value)}
                />
              </td>
              <td>
                <select
                  className="tag"
                  value={s.c}
                  onChange={(e) => setSegmentCategory(s.id, e.target.value)}
                  style={{
                    appearance: 'none', WebkitAppearance: 'none', border: 'none', cursor: 'pointer',
                    background: categories[s.c].color, color: categories[s.c].ink, font: 'inherit',
                  }}
                >
                  {categoryOrder.map((id) => <option key={id} value={id}>{categories[id].name}</option>)}
                </select>
              </td>
              <td>
                <input
                  ref={(el) => { durInputs.current[s.id] = el; }}
                  className="plain-input mono"
                  value={durDrafts[s.id] ?? dur(s.d)}
                  onFocus={(e) => { setDurDrafts((d) => ({ ...d, [s.id]: dur(s.d) })); e.target.select(); }}
                  onChange={(e) => setDurDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                  onBlur={() => commitDuration(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
                    else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); handleDurationTab(i, s.id); }
                  }}
                />
              </td>
              {PINS_ENABLED && (
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999,
                    background: s.pin ? '#201e1d' : 'transparent', color: s.pin ? '#f5ead8' : 'var(--color-neutral-700)',
                    font: '700 10.5px var(--font-body)', letterSpacing: '.05em',
                  }}>
                    {s.pin && <IconPin size={12} />}{s.pin ? 'PINNED' : 'ELASTIC'}
                  </span>
                </td>
              )}
              {NOTES_ENABLED && (
                <td style={{ color: s.note ? '#56633f' : 'var(--color-neutral-600)' }}>
                  {s.note ? <IconNote size={14} /> : <IconPlus size={14} />}
                </td>
              )}
              <td data-noprint="1">
                <button
                  className="btn btn-ghost"
                  onClick={() => removeSegment(s.id)}
                  title="Remove segment"
                  style={{ padding: '4px 6px', color: 'var(--color-neutral-600)' }}
                >
                  <IconTrash size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
