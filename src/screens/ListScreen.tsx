import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../state/store';
import { withTimes } from '../data/segments';
import { clockOf, dur, parseDur } from '../lib/time';
import { useDragReorder } from '../lib/useDragReorder';
import { useIsNarrow } from '../lib/responsive';
import { IconGrip, IconPin, IconPlus, IconNote, IconTrash } from '../lib/icons';
import { PINS_ENABLED, NOTES_ENABLED } from '../config';

const NARROW = 720;

export function ListScreen() {
  const {
    clocks, openClockId, reorderSegments, setSegmentCategory, setSegmentName,
    setSegmentDuration, addSegment, removeSegment, categories, categoryOrder,
  } = useApp();
  const clock = clocks[openClockId];
  const seed = clock.segments;
  const rows = withTimes(seed);
  const isNarrow = useIsNarrow(NARROW);
  const [durDrafts, setDurDrafts] = useState<Record<string, string>>({});
  const nameInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const durInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevCount = useRef(seed.length);

  const { dragIndex, overIndex, setItemRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useDragReorder(rows.length, reorderSegments);

  useEffect(() => {
    if (seed.length > prevCount.current) {
      const lastId = seed[seed.length - 1].id;
      const input = nameInputs.current[lastId];
      if (input) { input.focus(); input.select(); }
    }
    prevCount.current = seed.length;
  }, [seed]);

  const commitDuration = (segmentId: string) => {
    const parsed = parseDur(durDrafts[segmentId] ?? '');
    if (parsed !== null) setSegmentDuration(segmentId, parsed);
    setDurDrafts((d) => { const next = { ...d }; delete next[segmentId]; return next; });
  };

  const focusName = (segmentId: string) => {
    const input = nameInputs.current[segmentId];
    if (input) { input.focus(); input.select(); }
  };

  const focusDuration = (segmentId: string) => {
    const input = durInputs.current[segmentId];
    if (input) { input.focus(); input.select(); }
  };

  // Tab from Duration always advances to the NEXT row's Segment field —
  // whether that row already exists, or (past the last row) gets created —
  // so the keyboard flow is one consistent rule rather than two.
  const handleDurationTab = (index: number, segmentId: string) => {
    commitDuration(segmentId);
    if (index < rows.length - 1) focusName(rows[index + 1].id);
    else addSegment();
  };

  // Up/Down from Segment or Duration jumps to the same column on the
  // previous/next row — spreadsheet-style row navigation.
  const handleRowArrow = (e: KeyboardEvent, index: number, focus: (id: string) => void) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const target = index + (e.key === 'ArrowUp' ? -1 : 1);
    if (target < 0 || target >= rows.length) return;
    e.preventDefault();
    focus(rows[target].id);
  };

  const durationKeyDown = (i: number, segmentId: string) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
    else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); handleDurationTab(i, segmentId); }
    else handleRowArrow(e, i, focusDuration);
  };

  const categorySelect = (s: (typeof rows)[number]) => (
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
  );

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

      {isNarrow ? (
        rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
            No segments yet — add the first one above.
          </div>
        ) : (
          <div className="list-cards">
            {rows.map((s, i) => (
              <div
                key={s.id}
                ref={setItemRef(i)}
                className="list-card"
                style={{
                  opacity: dragIndex === i ? 0.4 : 1,
                  boxShadow: overIndex === i && dragIndex !== null && dragIndex !== i ? '0 0 0 2px var(--color-accent)' : undefined,
                }}
              >
                <div className="list-card-row">
                  <span
                    className="list-card-grip"
                    onPointerDown={onPointerDown(i)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerCancel}
                  >
                    <IconGrip size={16} />
                  </span>
                  <input
                    ref={(el) => { nameInputs.current[s.id] = el; }}
                    className="plain-input"
                    style={{ fontWeight: 600, flex: 1 }}
                    value={s.n}
                    maxLength={50}
                    onChange={(e) => setSegmentName(s.id, e.target.value)}
                    onKeyDown={(e) => handleRowArrow(e, i, focusName)}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() => removeSegment(s.id)}
                    title="Remove segment"
                    style={{ padding: '4px 6px', color: 'var(--color-neutral-600)', flex: 'none' }}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
                <div className="list-card-row" style={{ marginTop: 6 }}>
                  <span className="mono time-chip" style={{ fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
                    {clockOf(clock.hour, s.t)}
                  </span>
                  {categorySelect(s)}
                  <input
                    ref={(el) => { durInputs.current[s.id] = el; }}
                    className="plain-input mono outlined-input"
                    style={{ width: 56, textAlign: 'right', marginLeft: 'auto', flex: 'none' }}
                    value={durDrafts[s.id] ?? dur(s.d)}
                    onFocus={(e) => { setDurDrafts((d) => ({ ...d, [s.id]: dur(s.d) })); e.target.select(); }}
                    onChange={(e) => setDurDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                    onBlur={() => commitDuration(s.id)}
                    onKeyDown={durationKeyDown(i, s.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
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
                ref={setItemRef(i)}
                style={{
                  opacity: dragIndex === i ? 0.4 : 1,
                  background: overIndex === i && dragIndex !== null && dragIndex !== i ? 'var(--color-accent-100)' : undefined,
                }}
              >
                <td
                  data-noprint="1"
                  onPointerDown={onPointerDown(i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  style={{ paddingRight: 0, color: 'var(--color-neutral-600)', cursor: 'grab', touchAction: 'none' }}
                >
                  <IconGrip size={14} />
                </td>
                <td>
                  <span className="mono time-chip" style={{ fontWeight: PINS_ENABLED && s.pin ? 700 : 400, color: PINS_ENABLED && s.pin ? '#201e1d' : 'var(--color-neutral-700)' }}>
                    {clockOf(clock.hour, s.t)}
                  </span>
                </td>
                <td>
                  <input
                    ref={(el) => { nameInputs.current[s.id] = el; }}
                    className="plain-input"
                    style={{ fontWeight: 600 }}
                    value={s.n}
                    maxLength={50}
                    onChange={(e) => setSegmentName(s.id, e.target.value)}
                    onKeyDown={(e) => handleRowArrow(e, i, focusName)}
                  />
                </td>
                <td>{categorySelect(s)}</td>
                <td>
                  <input
                    ref={(el) => { durInputs.current[s.id] = el; }}
                    className="plain-input mono outlined-input"
                    value={durDrafts[s.id] ?? dur(s.d)}
                    onFocus={(e) => { setDurDrafts((d) => ({ ...d, [s.id]: dur(s.d) })); e.target.select(); }}
                    onChange={(e) => setDurDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                    onBlur={() => commitDuration(s.id)}
                    onKeyDown={durationKeyDown(i, s.id)}
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
      )}
    </div>
  );
}
