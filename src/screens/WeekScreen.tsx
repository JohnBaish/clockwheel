import { useEffect, useState } from 'react';
import { useApp } from '../state/store';
import { DAYS } from '../data/days';
import { cellKey, type ClockId } from '../data/clocks';
import { hh } from '../lib/time';
import { localKeys } from '../lib/weekStats';
import { splitBg, contrastInk } from '../lib/color';
import { computeSplit } from '../lib/clockStats';

const HATCH = 'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 3px,var(--color-neutral-100) 3px 6px)';
const HATCH_STRONG = 'repeating-linear-gradient(135deg,var(--color-neutral-300) 0 3px,var(--color-neutral-100) 3px 6px)';

export function WeekScreen() {
  const { clocks, clockOrder, week, outside, assign, markLocal, categories, categoryOrder, openClock } = useApp();
  const cats = { byId: categories, order: categoryOrder };
  const [sel, setSel] = useState<Record<string, true>>({});
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  // undefined = nothing copied yet; null = copied an empty/no-clock cell.
  const [clipboard, setClipboard] = useState<ClockId | null | undefined>(undefined);

  useEffect(() => {
    const up = () => setDrag(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const pickKeys = (keys: string[], add: boolean) => {
    setSel((prev) => {
      const next = add ? { ...prev } : {};
      keys.forEach((k) => { next[k] = true; });
      return next;
    });
  };

  const selKeys = Object.keys(sel);
  const hasSel = selKeys.length > 0;
  const allOut = selKeys.length > 0 && selKeys.every((k) => outside[k]);
  const outLabel = allOut ? 'Local' : 'Non-local';
  const keys = localKeys(outside);
  const usedClocks = clockOrder.filter((id) => keys.some((k) => week[k] === id));
  const hoverClock = hover ? week[hover] : undefined;
  const hoverLabel = hover
    ? `${DAYS.find((d) => d[0] === hover.split('-')[0])![1]} ${hh(+hover.split('-')[1])} · ${
        hoverClock ? clocks[hoverClock].name : outside[hover] ? 'non-local' : 'no clock yet'
      }`
    : '';

  const closePicker = () => setPicker(false);
  const doAssign = (id: ClockId | null) => { assign(selKeys, id); setSel({}); setPicker(false); };
  const doMarkLocal = (local: boolean) => { markLocal(selKeys, local); setSel({}); };

  // Ctrl/Cmd+C copies the first selected cell's clock; Ctrl/Cmd+V assigns it
  // to whatever's currently selected — reuses the existing multi-cell
  // selection, so pasting onto a whole day or hour-row works the same way
  // assigning from the library already does.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === 'c') {
        if (selKeys.length === 0) return;
        e.preventDefault();
        setClipboard(week[selKeys[0]] ?? null);
      } else if (key === 'v') {
        if (clipboard === undefined || selKeys.length === 0) return;
        e.preventDefault();
        assign(selKeys, clipboard);
        setSel({});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selKeys, clipboard, week, assign]);

  return (
    <div style={{ padding: '0 var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'var(--color-surface)', borderRadius: 'calc(var(--radius-lg)*1.1)', padding: '9px var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
        <span style={{ font: '700 11px var(--font-body)', letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-neutral-700)', flex: 'none' }}>Local hours</span>
        <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }} data-noprint="1">Set per day: select any hours in the grid and mark them local or non-local. Select a cell and press Ctrl/Cmd+C to copy its clock, then select another and press Ctrl/Cmd+V to paste.</span>
        {clipboard !== undefined && (
          <span className="tag tag-neutral mono" data-noprint="1" style={{ flex: 'none' }}>
            Copied {clipboard ? clocks[clipboard].name : 'empty'} — Ctrl/Cmd+V to paste
          </span>
        )}
        <span className="mono" style={{ marginLeft: 'auto', font: '600 13px var(--font-body)', color: 'var(--color-text)', minHeight: 18 }}>{hoverLabel}</span>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 'calc(var(--radius-lg)*1.4)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '58px repeat(7,minmax(0,1fr))', gap: 5, marginBottom: 7 }}>
          <div />
          {DAYS.map(([d, label]) => (
            <div
              key={d}
              className="week-pick-label"
              onClick={(e) => pickKeys(Array.from({ length: 24 }, (_, i) => cellKey(d, i)), e.shiftKey || e.metaKey)}
              style={{ textAlign: 'center', cursor: 'pointer', font: '700 12px var(--font-body)', letterSpacing: '.04em', color: 'var(--color-neutral-800)', padding: '4px 0', borderRadius: 999 }}
            >
              {label}
            </div>
          ))}
        </div>
        {Array.from({ length: 24 }, (_, i) => i).map((i) => {
          const rowInk = DAYS.some(([d]) => !outside[cellKey(d, i)]) ? 'var(--color-text)' : 'var(--color-neutral-700)';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '58px repeat(7,minmax(0,1fr))', gap: 5, marginBottom: 4, alignItems: 'center' }}>
              <div
                onClick={(e) => pickKeys(DAYS.map(([d]) => cellKey(d, i)), e.shiftKey || e.metaKey)}
                className="mono week-pick-label"
                style={{ textAlign: 'right', paddingRight: 8, cursor: 'pointer', font: '700 11px var(--font-body)', color: rowInk }}
              >
                {hh(i)}
              </div>
              {DAYS.map(([d, dl]) => {
                const key = cellKey(d, i);
                const out = !!outside[key];
                const id = week[key];
                const on = !!sel[key];
                return (
                  <div
                    key={d}
                    title={`${dl} ${hh(i)}${out ? ' · non-local' : id ? ' · ' + clocks[id].name : ' · no clock yet'}`}
                    onMouseDown={(e) => { e.preventDefault(); setDrag(true); pickKeys([key], e.shiftKey || e.metaKey || on); }}
                    onMouseEnter={() => { setHover(key); if (drag) pickKeys([key], true); }}
                    onDoubleClick={() => { if (id) openClock(id); }}
                    style={{
                      height: 21, borderRadius: 7, cursor: 'pointer', overflow: 'hidden',
                      display: 'flex', alignItems: 'center',
                      padding: id ? '0 6px' : 0,
                      background: out ? HATCH : id ? clocks[id].color : 'transparent',
                      border: out ? '1px solid transparent' : id ? '1px solid rgba(32,30,29,.10)' : '1.5px dashed var(--color-neutral-400)',
                      boxShadow: on ? '0 0 0 2px var(--color-accent)' : 'none',
                    }}
                  >
                    {id && (
                      <span
                        style={{
                          font: '600 9.5px var(--font-body)', color: contrastInk(clocks[id].color),
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%',
                        }}
                      >
                        {clocks[id].name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: 'var(--color-neutral-700)' }}>
        {usedClocks.map((id) => (
          <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
            <span style={{ width: 26, height: 13, borderRadius: 999, background: clocks[id].color, boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.12)' }} />{clocks[id].name}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 13, borderRadius: 999, border: '1.5px dashed var(--color-neutral-400)' }} />no clock yet
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 13, borderRadius: 999, background: HATCH }} />non-local
        </span>
      </div>

      {hasSel && (
        <div style={{ position: 'sticky', bottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'var(--color-surface)', borderRadius: 999, padding: '9px var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
          <span className="mono" style={{ font: '700 13px var(--font-body)', whiteSpace: 'nowrap' }}>{selKeys.length} {selKeys.length === 1 ? 'hour' : 'hours'}</span>
          <span style={{ fontSize: 13, color: 'var(--color-neutral-700)', whiteSpace: 'nowrap' }}>assign</span>
          <button className="btn btn-primary" onClick={() => setPicker(true)} style={{ padding: '6px 16px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>Choose from library</button>
          <button
            className="week-toggle-local"
            onClick={() => doMarkLocal(allOut)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 999, border: '1px solid var(--color-neutral-300)', background: 'var(--color-bg)', cursor: 'pointer', font: '600 12.5px var(--font-body)', color: 'var(--color-text)', whiteSpace: 'nowrap' }}
          >
            <span style={{ width: 22, height: 10, borderRadius: 999, background: HATCH_STRONG }} />{outLabel}
          </button>
          <button className="btn btn-ghost" onClick={() => doAssign(null)} style={{ marginLeft: 'auto', whiteSpace: 'nowrap', color: 'var(--color-accent-700)' }}>Clear</button>
          <button className="btn btn-ghost" onClick={() => setSel({})} style={{ whiteSpace: 'nowrap', color: 'var(--color-accent-700)' }}>Done</button>
        </div>
      )}

      {picker && (
        <div className="dialog-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="dialog" style={{ width: 'min(600px,94vw)', maxHeight: '78vh', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Choose a clock</h3>
              <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>for {selKeys.length} {selKeys.length === 1 ? 'hour' : 'hours'}</span>
            </div>
            <input className="input" placeholder="Search clocks" style={{ width: '100%' }} />
            <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {clockOrder.length === 0 && (
                <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--color-neutral-700)' }}>No clocks yet — create one from the nav first.</div>
              )}
              {clockOrder.map((id) => {
                const c = clocks[id];
                const split = computeSplit(c.segments, categoryOrder);
                const n = keys.filter((k) => week[k] === id).length;
                return (
                  <button
                    key={id}
                    className="week-picker-row"
                    onClick={() => doAssign(id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 'calc(var(--radius-lg)*0.8)', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: 999, flex: 'none', background: c.color, boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.12)' }} />
                    <span style={{ font: '700 14px var(--font-body)', color: 'var(--color-text)', flex: 'none', width: 170 }}>{c.name}</span>
                    <span style={{ flex: 1, minWidth: 60, height: 9, borderRadius: 999, background: splitBg(split, cats), boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.10)' }} />
                    <span className="mono" style={{ font: '600 12px var(--font-body)', color: 'var(--color-neutral-700)', flex: 'none' }}>{n ? `${n}×` : 'unused'}</span>
                  </button>
                );
              })}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={closePicker} style={{ color: 'var(--color-accent-700)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
