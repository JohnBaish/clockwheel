import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useApp } from '../state/store';
import { withBackTimes, normalizeOutTime } from '../data/backtimer';
import { dur, parseDur, parseOutTime, wrapHour } from '../lib/time';
import { useDragReorder } from '../lib/useDragReorder';
import { useIsNarrow } from '../lib/responsive';
import { IconGrip, IconPlus, IconTrash, IconArrowUpDown, IconPrint } from '../lib/icons';
import { isBacktimerHost } from '../lib/hostMode';
import { selectAllSoon, toColon } from '../lib/timeInput';
import { flushSync } from 'react-dom';
import { BacktimerWalkthrough } from '../components/BacktimerWalkthrough';
import { downloadJson } from '../lib/download';

const NARROW = 720;

export function BacktimerScreen() {
  const {
    backtimer, setBacktimerOutTime, addBacktimerItem, removeBacktimerItem,
    setBacktimerItemName, setBacktimerItemDuration, reorderBacktimerItems, resetBacktimer,
    toggleBacktimerReversed, backtimerWalkthroughOff, exportBacktimer, importBacktimer,
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
  const [showWalk, setShowWalk] = useState(() => seed.length === 0 && !backtimerWalkthroughOff);

  // On the desktop table, Reverse and the walkthrough card are centred on the
  // middle of the Item column rather than the page. Measured, not derived
  // from the column widths, so it stays right if those ever change.
  const tableRef = useRef<HTMLTableElement | null>(null);
  const itemThRef = useRef<HTMLTableCellElement | null>(null);
  const [itemCentre, setItemCentre] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const table = tableRef.current, th = itemThRef.current;
      if (!table || !th) { setItemCentre(null); return; }
      const t = table.getBoundingClientRect(), h = th.getBoundingClientRect();
      setItemCentre(h.left + h.width / 2 - t.left);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isNarrow, rows.length]);
  // A zero-width flex box at the centre point; justify-content: center
  // overhangs the child equally on both sides of it.
  const centreOnItem = (child: ReactNode, marginTop: string) =>
    !isNarrow && itemCentre !== null ? (
      <div data-noprint="1" style={{ marginLeft: itemCentre, width: 0, display: 'flex', justifyContent: 'center', marginTop }}>{child}</div>
    ) : (
      <div data-noprint="1" style={{ display: 'flex', justifyContent: 'center', marginTop }}>{child}</div>
    );

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
    // While the walkthrough is open it owns the keyboard focus, so an item it
    // creates mustn't pull focus down into the list.
    if (seed.length > prevCount.current && !showWalk) {
      const lastId = seed[seed.length - 1].id;
      const input = nameInputs.current[lastId];
      if (input) { input.focus(); input.select(); }
    }
    prevCount.current = seed.length;
  }, [seed, showWalk]);

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

  // Adds the item and focuses its name box inside the same tap, so a phone
  // opens its keyboard (it won't for focus that happens after the tap).
  const addItemAndFocus = () => {
    let id = '';
    flushSync(() => { id = addBacktimerItem(); });
    focusName(id);
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
    if (window.confirm('Clear all items and reset the out-time back to 60:00?')) {
      resetBacktimer();
      if (!backtimerWalkthroughOff) setShowWalk(true);
    }
  };

  // Export/Import exist only on the standalone backtimer.baish.net, which
  // has its own storage and no other way to back up or move a list.
  // Clockmaker's Backtimer tab is already covered by Library's Export.
  const standalone = isBacktimerHost();
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setImportError(importBacktimer(text, () => {
      const ok = window.confirm(
        `Replace everything in Backtimer (out-time and all items) with the contents of “${file.name}”? This can’t be undone. Press Cancel and then use Export first if you want to save your current work.`,
      );
      if (ok) {
        // Imported rows aren't "new" rows: don't jump into the last name box.
        prevCount.current = Number.POSITIVE_INFINITY;
        setShowWalk(false);
      }
      return ok;
    }));
  };

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
      <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: '700 11px var(--font-body)', letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
            Out-time
          </span>
          <input
            className="plain-input mono"
            style={{ width: 64, fontWeight: 700, background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
            value={outDraft ?? dur(normalizeOutTime(backtimer.outTime))}
            inputMode="decimal"
            onFocus={(e) => { setOutDraft(dur(normalizeOutTime(backtimer.outTime))); selectAllSoon(e.currentTarget); }}
            onChange={(e) => setOutDraft(toColon(e.target.value))}
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
        <button className="btn btn-ghost" onClick={addItemAndFocus} style={{ color: 'var(--color-accent-700)' }}>
          <IconPlus size={15} />Add item
        </button>
        {standalone && (
          <>
            <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: 'none' }} />
            <button className="btn btn-secondary" onClick={() => fileInput.current?.click()} style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
              Import
            </button>
            <button className="btn btn-secondary" onClick={() => downloadJson(exportBacktimer(), 'backtimer')} style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
              Export
            </button>
          </>
        )}
        <button className="btn btn-ghost" onClick={handleClear} style={{ color: 'var(--color-neutral-700)' }}>
          Clear
        </button>
      </div>
      {importError && (
        <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-accent-100)', color: 'var(--color-accent-800)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 'var(--space-3)', fontSize: 13.5 }}>
          <span style={{ flex: 1 }}>{importError}</span>
          <button className="btn btn-ghost" onClick={() => setImportError(null)} style={{ color: 'var(--color-accent-700)', padding: '2px 8px' }}>Dismiss</button>
        </div>
      )}
      <div className="print-only" style={{ font: '400 22px var(--font-heading)', marginBottom: 'var(--space-3)' }}>
        Backtimer · out at {dur(normalizeOutTime(backtimer.outTime))}
      </div>

      {/* On a phone the card goes above the list, so the keypad can't cover its Next button. */}
      {showWalk && isNarrow && (
        <div data-noprint="1" style={{ marginBottom: 'var(--space-4)' }}>
          <BacktimerWalkthrough onClose={() => setShowWalk(false)} />
        </div>
      )}

      {isNarrow ? (
        rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
            No items yet — check and change your out-time above, then add the name and duration
            of the items before it, working backwards.
          </div>
        ) : (
          <>
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
                    style={{ width: 76, textAlign: 'right', marginLeft: 'auto', flex: 'none' }}
                    value={durDrafts[it.id] ?? dur(it.d)}
                    inputMode="decimal"
                    onFocus={(e) => { setDurDrafts((d) => ({ ...d, [it.id]: dur(it.d) })); selectAllSoon(e.currentTarget); }}
                    onChange={(e) => setDurDrafts((d) => ({ ...d, [it.id]: toColon(e.target.value) }))}
                    onBlur={() => commitDuration(it.id)}
                    onKeyDown={durationKeyDown(i, it.id)}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Phones have no Tab key to start the next item, so offer it here. */}
          <button className="btn btn-secondary" data-noprint="1" onClick={addItemAndFocus}
            style={{ width: '100%', marginTop: 'var(--space-2)', color: 'var(--color-accent-700)' }}>
            <IconPlus size={15} />Add item
          </button>
          </>
        )
      ) : (
        <table className="table" ref={tableRef}>
          <thead>
            <tr>
              <th data-noprint="1" style={{ width: 26 }}></th>
              <th style={{ width: 78 }}>Starts</th>
              <th ref={itemThRef} style={{ width: 460 }}>Item</th>
              <th style={{ width: 84 }}>Dur</th>
              <th data-noprint="1" style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>
                  No items yet — check and change your out-time above, then add the name and
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
                    inputMode="decimal"
                    onFocus={(e) => { setDurDrafts((d) => ({ ...d, [it.id]: dur(it.d) })); selectAllSoon(e.currentTarget); }}
                    onChange={(e) => setDurDrafts((d) => ({ ...d, [it.id]: toColon(e.target.value) }))}
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

      {rows.length > 0 && centreOnItem(
          <button
            className="btn btn-ghost"
            onClick={() => toggleBacktimerReversed()}
            title={reversed ? 'Show latest thing first, working backwards' : 'Show earliest thing first, in chronological order'}
            style={{ color: 'var(--color-neutral-700)' }}
          >
            <IconArrowUpDown size={14} />Reverse
          </button>,
          'var(--space-4)',
      )}

      {showWalk && !isNarrow && centreOnItem(
        <BacktimerWalkthrough onClose={() => setShowWalk(false)} />,
        'var(--space-4)',
      )}

      {/* Explainer, standalone site only (2026-10-17): written for people
          arriving from a search as much as for search engines. Folded parts
          keep the page short; Google still reads what's inside them. */}
      {isBacktimerHost() && (
        <section className="backtimer-about" data-noprint="1">
          <h3>A free backtiming calculator for radio and TV</h3>
          <details>
            <summary>What is backtiming?</summary>
            <p>
              Backtiming means working backwards from a fixed time to find out when each item has to start. If the
              news is at the top of the hour and you need to hit it exactly, you need to know when to start your last
              song, and the songs or items before it. Presenters, producers, directors and production assistants in
              radio and TV do this every day, from student, community and hospital radio to the networks. Backtimer
              does the sums for you.
            </p>
          </details>
          <details>
            <summary>How do I use Backtimer?</summary>
            <ol>
              <li>
                Set your out-time: the moment you need to finish, for instance 60:00 for the top of the hour or 30:00
                for the half-hour.
              </li>
              <li>Add your last item and its duration, then the item before it, and so on, working backwards.</li>
              <li>
                Backtimer shows when each item must start. If there’s more than fits, the earliest items show as
                starting in the hour before, so you can see what needs to go.
              </li>
            </ol>
          </details>
        </section>
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
          The data you enter here is not collected; it’s only saved in your own browser and you
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
          {' '}at any time. Use Export to back up your list or move it to another browser. A companion set of tools to build and visualise clock hours is available at{' '}
          <a
            href="https://clockmaker.baish.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent-700)', textDecoration: 'underline' }}
          >
            https://clockmaker.baish.net
          </a>
          . Contact: workshop@baish.net.
        </div>
      )}

    </div>
  );
}
