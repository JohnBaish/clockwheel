import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../state/store';
import { withBackTimes } from '../data/backtimer';
import { dur, signedDur, parseDur } from '../lib/time';
import { useDragReorder } from '../lib/useDragReorder';
import { useIsNarrow } from '../lib/responsive';
import { IconGrip, IconPlus, IconTrash } from '../lib/icons';

const NARROW = 720;

export function BacktimerScreen() {
  const {
    backtimer, setBacktimerOutTime, addBacktimerItem, removeBacktimerItem,
    setBacktimerItemName, setBacktimerItemDuration, reorderBacktimerItems,
  } = useApp();
  const seed = backtimer.items;
  const rows = withBackTimes(seed, backtimer.outTime);
  const total = seed.reduce((a, it) => a + it.d, 0);
  const isNarrow = useIsNarrow(NARROW);
  const [outDraft, setOutDraft] = useState<string | null>(null);
  const [durDrafts, setDurDrafts] = useState<Record<string, string>>({});
  const nameInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const durInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevCount = useRef(seed.length);

  const { dragIndex, overIndex, setItemRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useDragReorder(rows.length, reorderBacktimerItems);

  useEffect(() => {
    if (seed.length > prevCount.current) {
      const lastId = seed[seed.length - 1].id;
      const input = nameInputs.current[lastId];
      if (input) { input.focus(); input.select(); }
    }
    prevCount.current = seed.length;
  }, [seed]);

  const commitOutTime = () => {
    const parsed = outDraft === null ? null : parseDur(outDraft);
    if (parsed !== null) setBacktimerOutTime(parsed);
    setOutDraft(null);
  };

  const commitDuration = (itemId: string) => {
    const parsed = parseDur(durDrafts[itemId] ?? '');
    if (parsed !== null) setBacktimerItemDuration(itemId, parsed);
    setDurDrafts((d) => { const next = { ...d }; delete next[itemId]; return next; });
  };

  const focusName = (itemId: string) => {
    const input = nameInputs.current[itemId];
    if (input) { input.focus(); input.select(); }
  };

  const focusDuration = (itemId: string) => {
    const input = durInputs.current[itemId];
    if (input) { input.focus(); input.select(); }
  };

  // Tab from Duration always advances to the NEXT row's Item field — whether
  // that row already exists, or (past the last row) gets created — same rule
  // as List, just walking further back in time instead of further forward.
  const handleDurationTab = (index: number, itemId: string) => {
    commitDuration(itemId);
    if (index < rows.length - 1) focusName(rows[index + 1].id);
    else addBacktimerItem();
  };

  const handleRowArrow = (e: KeyboardEvent, index: number, focus: (id: string) => void) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const target = index + (e.key === 'ArrowUp' ? -1 : 1);
    if (target < 0 || target >= rows.length) return;
    e.preventDefault();
    focus(rows[target].id);
  };

  const durationKeyDown = (i: number, itemId: string) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
    else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); handleDurationTab(i, itemId); }
    else handleRowArrow(e, i, focusDuration);
  };

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
      <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: '700 11px var(--font-body)', letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
            Out time
          </span>
          <input
            className="plain-input mono"
            style={{ width: 64, fontWeight: 700, background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
            value={outDraft ?? dur(backtimer.outTime)}
            onFocus={(e) => { setOutDraft(dur(backtimer.outTime)); e.target.select(); }}
            onChange={(e) => setOutDraft(e.target.value)}
            onBlur={commitOutTime}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        </div>
        <span className="tag tag-neutral mono">{rows.length} item{rows.length === 1 ? '' : 's'} · drag to reorder</span>
        <span className="tag tag-neutral mono">{dur(total)} total</span>
        {rows.length > 0 && rows[rows.length - 1].start < 0 && (
          <span className="tag" style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-800)' }}>
            starts {signedDur(rows[rows.length - 1].start)} — before the top of the hour
          </span>
        )}
        <button className="btn btn-ghost" onClick={() => addBacktimerItem()} style={{ marginLeft: 'auto', color: 'var(--color-accent-700)' }}>
          <IconPlus size={15} />Add item
        </button>
      </div>
      <div className="print-only" style={{ font: '400 22px var(--font-heading)', marginBottom: 'var(--space-3)' }}>
        Backtimer · out at {dur(backtimer.outTime)}
      </div>

      {isNarrow ? (
        rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
            No items yet — add the last thing before your out time first.
          </div>
        ) : (
          <div className="list-cards">
            {rows.map((it, i) => (
              <div
                key={it.id}
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
                    ref={(el) => { nameInputs.current[it.id] = el; }}
                    className="plain-input"
                    style={{ fontWeight: 600, flex: 1 }}
                    value={it.n}
                    maxLength={50}
                    onChange={(e) => setBacktimerItemName(it.id, e.target.value)}
                    onKeyDown={(e) => handleRowArrow(e, i, focusName)}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() => removeBacktimerItem(it.id)}
                    title="Remove item"
                    style={{ padding: '4px 6px', color: 'var(--color-neutral-600)', flex: 'none' }}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
                <div className="list-card-row" style={{ marginTop: 6 }}>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: it.start < 0 ? 'var(--color-accent-700)' : 'var(--color-neutral-700)' }}>
                    {signedDur(it.start)}
                  </span>
                  <input
                    ref={(el) => { durInputs.current[it.id] = el; }}
                    className="plain-input mono"
                    style={{ width: 56, textAlign: 'right', marginLeft: 'auto', flex: 'none' }}
                    value={durDrafts[it.id] ?? dur(it.d)}
                    onFocus={(e) => { setDurDrafts((d) => ({ ...d, [it.id]: dur(it.d) })); e.target.select(); }}
                    onChange={(e) => setDurDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
                    onBlur={() => commitDuration(it.id)}
                    onKeyDown={durationKeyDown(i, it.id)}
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
              <th style={{ width: 78 }}>Starts</th>
              <th style={{ width: 460 }}>Item</th>
              <th style={{ width: 84 }}>Dur</th>
              <th data-noprint="1" style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
                  No items yet — add the last thing before your out time first.
                </td>
              </tr>
            )}
            {rows.map((it, i) => (
              <tr
                key={it.id}
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
                <td className="mono" style={{ fontWeight: 700, color: it.start < 0 ? 'var(--color-accent-700)' : 'var(--color-neutral-700)' }}>
                  {signedDur(it.start)}
                </td>
                <td>
                  <input
                    ref={(el) => { nameInputs.current[it.id] = el; }}
                    className="plain-input"
                    style={{ fontWeight: 600 }}
                    value={it.n}
                    maxLength={50}
                    onChange={(e) => setBacktimerItemName(it.id, e.target.value)}
                    onKeyDown={(e) => handleRowArrow(e, i, focusName)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => { durInputs.current[it.id] = el; }}
                    className="plain-input mono"
                    value={durDrafts[it.id] ?? dur(it.d)}
                    onFocus={(e) => { setDurDrafts((d) => ({ ...d, [it.id]: dur(it.d) })); e.target.select(); }}
                    onChange={(e) => setDurDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
                    onBlur={() => commitDuration(it.id)}
                    onKeyDown={durationKeyDown(i, it.id)}
                  />
                </td>
                <td data-noprint="1">
                  <button
                    className="btn btn-ghost"
                    onClick={() => removeBacktimerItem(it.id)}
                    title="Remove item"
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
