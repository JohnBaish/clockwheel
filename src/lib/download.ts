/** Downloads `text` as `<prefix>-YYYY-MM-DD-HHMM.json`, e.g.
 *  clockmaker-2026-10-15-1030.json. Shared by Clockmaker's and the
 *  standalone Backtimer's Export buttons so their file names match. */
export function downloadJson(text: string, prefix: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  // Local time, not UTC — someone exporting a couple of backups in the
  // same day wants filenames that match the clock on their own wall.
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  a.download = `${prefix}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
