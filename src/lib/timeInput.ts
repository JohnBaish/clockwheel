// Helpers for the minutes:seconds boxes, mainly for phones.

// Phone/tablet keyboards only open when focus happens during a tap.
export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// The digits keypad (inputMode="decimal") has a "." key but no ":", so "."
// (or "," on keypads that show a comma) is turned into ":" as it's typed.
export const toColon = (v: string) => v.replace(/[.,]/g, ':');

// On phones the tap that focused the box would otherwise put the cursor back
// where the finger landed, undoing the selection — so there it's deferred.
export const selectAllSoon = (el: HTMLInputElement) => {
  if (!isTouch()) { el.select(); return; }
  setTimeout(() => el.setSelectionRange(0, el.value.length), 0);
};
