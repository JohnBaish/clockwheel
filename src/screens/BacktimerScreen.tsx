import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../state/store';
import { withBackTimes, normalizeOutTime } from '../data/backtimer';
import { dur, parseDur, parseOutTime, wrapHour } from '../lib/time';
import { useDragReorder } from '../lib/useDragReorder';
import { useIsNarrow } from '../lib/responsive';
import { IconGrip, IconPlus, IconTrash, IconArrowUpDown, IconPrint } from '../lib/icons';
import { isBacktimerHost } from '../lib/hostMode';

const NARROW = 720;

export function BacktimerScreen() {
  const {
    backtimer, setBacktimerOutTime, addBacktimerItem, removeBacktimerItem,
    setBacktimerItemName, setBacktimerItemDuration, reorderBacktimerItems, resetBacktimer,
    toggleBacktimerReversed,
  } = useApp();
  const seed = backtimer.items;
  // `computed` is always in the one true order items are stored/calculated
  // in (latest thing first, working backwards) — `rows` is what's actually
  // rendered, optionally flipped for display by the Reverse button. Keeping
  // both around means the "in the hour before" check below can stay anchored
  // to the real earliest item regardless of which way the list is facing.
  const computed = withBackTimes(seed, backtimer.outTime);
  const reversed = !!backtimer.reversed;
  const rows = reversed ? [...computed].reverse() : computed;
  const total = seed.reduce((a, it) => a + it.d, 0);
  const isNarrow = useIsNarrow(NARROW);
  const [outDraft, setOutDraft] = useState<string | null>(null);
  const [durDrafts, setDurDrafts] = useState<Record<string, string>>({});
  const nameInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const durInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevCount = useRef(seed.length);

  // The drag hook works entirely in on-screen row positions, but reordering
  // has to happen on the real (unreversed) item array — when flipped, visual
  // position i is the mirror image of its real index, so translate before
  // committing.
  const commitReorder = (from: number, to: number) => {
    const toRealIndex = (i: number) => (reversed ? rows.length - 1 - i : i);
    reorderBacktimerItems(toRealIndex(from), toRealIndex(to));
  };
  const { dragIndex, overIndex, setItemRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useDragReorder(rows.length, commitReorder);

  useEffect(() => {
    if (seed.length > prevCount.current) {
      const lastId = seed[seed.length - 1].id;
      const input = nameInputs.current[lastId];
      if (input) { input.focus(); input.select(); }
    }
    prevCount.current = seed.length;
  }, [seed]);

  const commitOutTime = () => {
    const parsed = outDraft === null ? null : parseOutTime(outDraft);
    if (parsed !== null) setBacktimerOutTime(normalizeOutTime(parsed));
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

  // Wipes the whole Backtimer, not just one item — unlike everything else on
  // this page, there's no library of saved Backtimers behind it to fall back
  // on, so this asks first rather than following the rest of the app's
  // no-confirmation pattern for destructive actions.
  const handleClear = () => {
    if (window.confirm('Clear all items and reset the out time back to 60:00?')) resetBacktimer();
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
            value={outDraft ?? dur(normalizeOutTime(backtimer.outTime))}
            onFocus={(e) => { setOutDraft(dur(normalizeOutTime(backtimer.outTime))); e.target.select(); }}
            onChange={(e) => setOutDraft(e.target.value)}
            onBlur={commitOutTime}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        </div>
        <span className="tag tag-neutral mono">{rows.length} item{rows.length === 1 ? '' : 's'} · drag to reorder</span>
        <span className="tag tag-neutral mono">{dur(total)} total</span>
        {computed.length > 0 && computed[computed.length - 1].start < 0 && (
          <span className="tag" style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-800)' }}>
            starts {dur(wrapHour(computed[computed.length - 1].start))} — in the hour before this one
          </span>
        )}
        <button
          className="btn btn-ghost"
          onClick={() => window.print()}
          data-noprint="1"
          style={{ marginLeft: 'auto', color: 'var(--color-accent-700)' }}
        >
          <IconPrint size={15} />Print
        </button>
        <button className="btn btn-ghost" onClick={() => addBacktimerItem()} style={{ color: 'var(--color-accent-700)' }}>
          <IconPlus size={15} />Add item
        </button>
        <button className="btn btn-ghost" onClick={handleClear} style={{ color: 'var(--color-neutral-700)' }}>
          Clear
        </button>
      </div>
      <div className="print-only" style={{ font: '400 22px var(--font-heading)', marginBottom: 'var(--space-3)' }}>
        Backtimer · out at {dur(normalizeOutTime(backtimer.outTime))}
      </div>

      {isNarrow ? (
        rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
            No items yet — check and change your out time above, then add the name and duration
            of the items before it, working backwards.
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
                    {dur(wrapHour(it.start))}
                  </span>
                  <input
                    ref={(el) => { durInputs.current[it.id] = el; }}
                    className="plain-input mono outlined-input"
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
                  No items yet — check and change your out time above, then add the name and
                  duration of the items before it, working backwards.
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
                  {dur(wrapHour(it.start))}
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
                    className="plain-input mono outlined-input"
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

      {rows.length > 0 && (
        <div data-noprint="1" style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
          <button
            className="btn btn-ghost"
            onClick={() => toggleBacktimerReversed()}
            title={reversed ? 'Show latest thing first, working backwards' : 'Show earliest thing first, in chronological order'}
            style={{ color: 'var(--color-neutral-700)' }}
          >
            <IconArrowUpDown size={14} />Reverse
          </button>
        </div>
      )}

      {isBacktimerHost() && (
        <div
          data-noprint="1"
          style={{
            marginTop: 64, paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-divider)',
            fontSize: 12, lineHeight: 1.6, color: 'var(--color-neutral-700)', textAlign: 'center',
          }}
        >
          Backtimer is a free-to-use personal project by John Baish.
          Nothing you type here is sent anywhere; your data is only saved in your own browser and you
          can{' '}
          <button
            onClick={handleClear}
            style={{
              background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit',
              color: 'var(--color-accent-700)', textDecoration: 'underline', cursor: 'pointer',
            }}
          >
            clear it
          </button>
          {' '}at any time. Contact: backtimer@baish.net.
        </div>
      )}
    </div>
  );
}
