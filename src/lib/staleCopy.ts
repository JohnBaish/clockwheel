// Spotting that another browser tab has changed the saved work, so this tab
// can warn instead of quietly saving its older copy over the top.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** JSON with object keys sorted, so the same data built in a different field
 *  order compares equal. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Only the person's work: not which screen, clock or Summary row is selected,
 *  and not the "last edited" stamp, because moving around is saved too and
 *  must not look like a change. A round trip through JSON drops fields that
 *  are undefined, as saving does. */
function workOf(state: Record<string, unknown>): string {
  const { screen: _s, openClockId: _o, sumSel: _m, lastEditedAt: _l, ...work } = state;
  return stableJson(JSON.parse(JSON.stringify(work)));
}

/** Whether the browser's saved copy (raw text) holds different work from `mine`.
 *  Unreadable or missing text says false: nothing worth warning about. */
export function savedCopyDiffers(raw: string | null, mine: object): boolean {
  if (!raw) return false;
  try {
    const theirs: unknown = JSON.parse(raw);
    if (!isObject(theirs)) return false;
    return workOf(theirs) !== workOf(mine as Record<string, unknown>);
  } catch {
    return false;
  }
}
