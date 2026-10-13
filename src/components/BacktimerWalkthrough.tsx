import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../state/store';
import { normalizeOutTime } from '../data/backtimer';
import { dur, parseDur, parseOutTime } from '../lib/time';
import { useIsNarrow } from '../lib/responsive';
import { IconArrowUpDown, IconGrip } from '../lib/icons';

const STEPS = 4;

// Phone/tablet keyboards only open when focus happens during a tap, so on
// touch screens fields are focused from the Next/Back tap itself, never on
// their own when the card first appears.
const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// The digits keypad ("decimal") has a "." key but no ":", so "." (or "," on
// keypads that show a comma) is turned into ":" as it's typed.
const toColon = (v: string) => v.replace(/[.,]/g, ':');

const selectAll = (e: FocusEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  // Deferred: on phones the tap that focused the box would otherwise put the
  // cursor back where the finger landed, undoing the selection.
  setTimeout(() => el.setSelectionRange(0, el.value.length), 0);
};

const inputStyle = {
  font: '700 16px var(--font-body)',
  fontVariantNumeric: 'tabular-nums' as const,
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-divider)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  width: '100%',
  boxSizing: 'border-box' as const,
};

export function BacktimerWalkthrough({ onClose }: { onClose: () => void }) {
  const {
    backtimer, setBacktimerOutTime, insertBacktimerItem, setBacktimerItemName,
    setBacktimerItemDuration, setBacktimerWalkthroughOff,
  } = useApp();
  const isNarrow = useIsNarrow(720);
  const [step, setStep] = useState(0);
  const [outText, setOutText] = useState(dur(normalizeOutTime(backtimer.outTime)));
  const [name, setName] = useState('');
  const [durText, setDurText] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dontShow, setDontShow] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const touch = isTouch();

  const focusField = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(0, el.value.length);
  };

  // First appearance only; later cards are focused by goTo().
  useEffect(() => {
    if (isTouch()) return;
    const el = inputRef.current;
    el?.focus();
    el?.setSelectionRange(0, el.value.length);
  }, []);

  // Renders the new card immediately (flushSync) so its box can be focused
  // while still inside the tap — the only way a phone will open its keyboard.
  const goTo = (n: number) => {
    setError(null);
    flushSync(() => setStep(n));
    focusField();
  };

  // Saves whatever is on the current card. Returns false (with a message,
  // unless silent) if the entry can't be used yet.
  const commit = (silent: boolean): boolean => {
    if (step === 0) {
      const parsed = parseOutTime(outText);
      if (parsed === null) { if (!silent) setError('Please enter minutes and seconds, like 29:30.'); return false; }
      setBacktimerOutTime(normalizeOutTime(parsed));
    } else if (step === 1) {
      const trimmed = name.trim();
      if (!trimmed) { if (!silent) setError('Please type a name, or press Skip.'); return false; }
      if (itemId) setBacktimerItemName(itemId, trimmed);
      else setItemId(insertBacktimerItem(trimmed));
    } else if (step === 2) {
      const parsed = parseDur(durText);
      if (parsed === null || !itemId) { if (!silent) setError('Please enter minutes and seconds, like 2:30.'); return false; }
      setBacktimerItemDuration(itemId, parsed);
    }
    return true;
  };

  const next = () => {
    if (!commit(false)) return;
    if (step < STEPS - 1) goTo(step + 1);
    else onClose();
  };

  const back = () => goTo(step - 1);

  const skip = () => { commit(true); onClose(); };

  const toggleDontShow = (checked: boolean) => {
    setDontShow(checked);
    setBacktimerWalkthroughOff(checked);
  };

  const bold = (text: string) => <strong>{text}</strong>;
  const itemName = bold(name.trim());

  let title: string;
  let body: ReactNode;
  let field: ReactNode = null;
  let later: ReactNode = null;

  if (step === 0) {
    title = 'Set your out-time';
    body = 'When do you want your sequence to finish, in minutes and seconds?';
    field = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input ref={inputRef} value={outText} onChange={(e) => setOutText(toColon(e.target.value))} onFocus={selectAll}
          inputMode="decimal" aria-label="Out-time" style={{ ...inputStyle, width: 110 }} />
        <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>e.g. 29:30{touch && ' · tap . for :'}</span>
      </div>
    );
    later = 'You can change this later in the OUT-TIME box at the top left.';
  } else if (step === 1) {
    title = 'Name your last item';
    body = 'What shall we call the last item before your out-time?';
    field = (
      <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)}
        maxLength={50} placeholder="e.g. Travel" aria-label="Item name" style={inputStyle} />
    );
    later = isNarrow
      ? 'You can change this later by tapping its name.'
      : 'You can change this later in the ITEM column.';
  } else if (step === 2) {
    title = 'How long is it?';
    body = <>How long is {itemName}, in minutes and seconds?</>;
    field = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input ref={inputRef} value={durText} onChange={(e) => setDurText(toColon(e.target.value))} onFocus={selectAll}
          inputMode="decimal" placeholder="e.g. 2:30" aria-label="Duration" style={{ ...inputStyle, width: 110 }} />
        {touch && <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>tap . for :</span>}
      </div>
    );
    later = isNarrow
      ? 'You can change this later by tapping its duration.'
      : 'You can change this later in the DUR column.';
  } else {
    title = 'There’s your first start time';
    body = (
      <>
        {isNarrow
          ? <>The start time for {itemName} now shows under its name.</>
          : <>The start time for {itemName} now shows in the STARTS column.</>}
        {' '}Add more items with “+ Add item”, or by pressing Tab in the last duration box. Each new item runs
        before the one above it. Drag the{' '}
        <span style={{ display: 'inline-flex', verticalAlign: 'middle', color: 'var(--color-neutral-700)' }}><IconGrip size={15} /></span>
        {' '}handle to move an item, and press “<span style={{ display: 'inline-flex', verticalAlign: 'middle' }}><IconArrowUpDown size={14} /></span>{' '}Reverse” to see
        your items with the earliest first instead of backwards.
      </>
    );
  }

  return (
    <>
      <div
        role="dialog"
        aria-label="Getting started with Backtimer"
        data-noprint="1"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'checkbox') { e.preventDefault(); next(); }
          if (e.key === 'Escape') skip();
        }}
        className="card"
        style={{
          flex: 'none',
          width: isNarrow ? '100%' : 460, boxSizing: 'border-box',
          padding: 'var(--space-4)', gap: 12,
          border: '1px solid var(--color-divider)',
          boxShadow: '0 12px 32px rgba(32,30,29,.18), 0 2px 6px rgba(32,30,29,.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="card-kicker">Step {step + 1} of {STEPS}</span>
          <button className="btn btn-secondary" onClick={skip} style={{ padding: '5px 14px', fontSize: 13 }}>
            Skip
          </button>
        </div>
        <div style={{ font: 'var(--font-heading-weight) 20px var(--font-heading)', lineHeight: 1.2 }}>{title}</div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{body}</p>
        {field}
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--color-accent-700)' }}>{error}</div>}
        {later && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: 'var(--color-neutral-700)' }}>{later}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-neutral-700)', cursor: 'pointer',
            ...(isNarrow ? { order: 1, flexBasis: '100%' } : { marginRight: 'auto' }),
          }}>
            <input type="checkbox" checked={dontShow} onChange={(e) => toggleDontShow(e.target.checked)} />
            Don’t show this again
          </label>
          {isNarrow && <span style={{ marginRight: 'auto' }} />}
          {step > 0 && (
            <button className="btn btn-ghost" onClick={back} style={{ padding: '8px 12px' }}>Back</button>
          )}
          <button className="btn btn-primary" onClick={next} style={{ padding: '8px 20px' }}>
            {step < STEPS - 1 ? 'Next' : 'Done'}
          </button>
        </div>
      </div>
    </>
  );
}
