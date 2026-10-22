// Checks the sums behind Clockmaker and Backtimer on examples with known
// answers, including the ones fixed after real use. Run with: npm run check
// (Node runs the .ts file directly; there's no test framework in this project.)

import assert from 'node:assert/strict';
import { normalizeOutTime, withBackTimes, type BacktimerItemSeed } from '../src/data/backtimer.ts';
import { clockOf, dur, hourBalance, parseDur, parseOutTime, signedDur, wrapHour } from '../src/lib/time.ts';
import { toColon } from '../src/lib/timeInput.ts';
import { countOf, numberWord } from '../src/lib/words.ts';
import { savedCopyDiffers } from '../src/lib/staleCopy.ts';

let passed = 0;
function check(name: string, run: () => void) {
  try {
    run();
    passed++;
  } catch (e) {
    console.error(`FAILED: ${name}`);
    throw e;
  }
}

const items = (...ds: number[]): BacktimerItemSeed[] => ds.map((d, i) => ({ id: `i${i}`, n: `Item ${i + 1}`, d }));
const starts = (rows: { start: number }[]) => rows.map((r) => dur(wrapHour(r.start)));

check('Backtimer counts back from the out-time (29:30, then 2:30 → starts 27:00)', () => {
  const rows = withBackTimes(items(150), 29 * 60 + 30);
  assert.equal(dur(rows[0].start), '27:00');
  assert.equal(dur(rows[0].end), '29:30');
});

check('each row ends where the row above starts', () => {
  const rows = withBackTimes(items(17, 130, 551), 3600);
  for (let i = 1; i < rows.length; i++) assert.equal(rows[i].end, rows[i - 1].start);
});

check('an out-time of 0:00 means the top of the hour (17 seconds → starts 59:43)', () => {
  assert.equal(normalizeOutTime(0), 3600);
  assert.equal(normalizeOutTime(1800), 1800);
  assert.equal(dur(withBackTimes(items(17), 0)[0].start), '59:43');
});

check('rows before :00 read as the hour before (out 10:00; 0:17, 2:10, 9:11, 3:22)', () => {
  const rows = withBackTimes(items(17, 130, 551, 202), 600);
  assert.deepEqual(starts(rows), ['9:43', '7:33', '58:22', '55:00']);
  // The raw start stays negative: that's what marks a row as crossing the hour.
  assert.ok(rows[3].start < 0);
});

check('wrapHour and signedDur', () => {
  assert.equal(wrapHour(-98), 3502);
  assert.equal(dur(3502), '58:22');
  assert.equal(wrapHour(3600), 0);
  assert.equal(signedDur(-150), '-2:30');
  assert.equal(signedDur(150), '2:30');
});

check('durations as typed', () => {
  assert.equal(parseDur('3:30'), 210);
  assert.equal(parseDur('3:'), 180); // a phone keypad user can stop after the minutes
  assert.equal(parseDur('45'), 45);
  assert.equal(parseDur(' 2:05 '), 125);
  assert.equal(parseDur('0:00'), 1); // a duration is never nothing
  assert.equal(parseDur('3:75'), null);
  assert.equal(parseDur('abc'), null);
  assert.equal(parseDur(''), null);
});

check('out-times as typed allow exactly 0:00', () => {
  assert.equal(parseOutTime('0:00'), 0);
  assert.equal(parseOutTime('60:00'), 3600);
  assert.equal(parseOutTime('29:30'), 1770);
});

check('a "." or "," typed on a phone keypad becomes ":"', () => {
  assert.equal(toColon('3.30'), '3:30');
  assert.equal(toColon('3,30'), '3:30');
});

check('the hour balance tag', () => {
  assert.deepEqual(hourBalance(3600), { state: 'balanced', label: 'balanced' });
  assert.deepEqual(hourBalance(3630), { state: 'over', label: 'over by 0:30' });
  assert.deepEqual(hourBalance(3570), { state: 'under', label: 'under by 0:30' });
});

check('clock times roll into the next hour and past midnight', () => {
  assert.equal(clockOf(7, 1744), '07:29:04');
  assert.equal(clockOf(7, 3600), '08:00:00');
  assert.equal(clockOf(23, 3600), '00:00:00');
});

check('numbers in sentences: one to nine as words, 10 and above as digits', () => {
  assert.equal(numberWord(0), 'zero');
  assert.equal(numberWord(9), 'nine');
  assert.equal(numberWord(10), '10');
  assert.equal(countOf(1, 'hour'), 'one hour');
  assert.equal(countOf(3, 'hour'), 'three hours');
  assert.equal(countOf(12, 'hour'), '12 hours');
});

check('another tab: moving about is not a change, real work is', () => {
  const mine = { screen: 'lib', openClockId: 'a', clocks: { a: { name: 'Example' } } };
  const moved = JSON.stringify({ ...mine, screen: 'week', lastEditedAt: 5 });
  const edited = JSON.stringify({ ...mine, clocks: { a: { name: 'Breakfast' } } });
  assert.equal(savedCopyDiffers(moved, mine), false);
  assert.equal(savedCopyDiffers(edited, mine), true);
  assert.equal(savedCopyDiffers(null, mine), false);
  assert.equal(savedCopyDiffers('not json', mine), false);
});

console.log(`${passed} checks passed`);
