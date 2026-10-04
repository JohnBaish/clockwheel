import type { ReactNode } from 'react';
import { useApp } from '../state/store';
import { IconPrint } from '../lib/icons';

const linkStyle = { color: 'var(--color-accent-700)', textDecoration: 'underline' };

const SECTIONS: { heading: string; body: ReactNode }[] = [
  {
    heading: 'Library',
    body: 'Every clock you’ve built lives here. Click to open or duplicate it. Everything you build here is saved automatically, but only in this browser, on this device — there’s no account and nothing is sent anywhere. If you want to move your work to a different browser or computer, or just want a backup, use Export to download everything as one file. Import loads that file back in — but it replaces whatever’s currently here, so use it to restore or move your work, not to combine two sets of clocks.',
  },
  {
    heading: 'Categories',
    body: 'This is where you create the labels which will be shown on your clocks, each with its own colour. You can delete the example ones, but we suggest you keep “Music” because it drives a song count function. Any category used for any clock lives in this common list, each with its own colour. Add, rename, reorder or change their colour here, and the change shows up everywhere a category appears. You can’t delete one that’s still in use anywhere — Clockmaker will tell you how many segments are holding it, so you can reassign them first.',
  },
  {
    heading: 'List',
    body: 'Build your hour here. First, name your clock, then choose the hour to which it relates in the dropdown just above the name — this hour will appear in the centre of the circle of your finished clock. Click into a segment’s name to change it and add the duration, pick a category from the dropdown, and Tab will take you onto a new line. Drag the handle on the left to reorder the items. The time on the left is not clickable, it’s calculated from the items you enter. The running total at the top tells you at a glance whether the hour’s over, under or exactly on 60:00.',
  },
  {
    heading: 'Clock',
    body: 'This is the main output from Clockmaker – a circular view of the hour you created in List. Labels that don’t fit neatly within the ring are drawn out to the side with a leader line; you can click and drag each of these to improve its position if you prefer, or double-click to return it to where Clockmaker automatically placed it. Copy Image puts a clean picture of the clock face on your clipboard (or downloads it, if your browser won’t allow a direct copy), ready to paste wherever you need it.',
  },
  {
    heading: 'Week',
    body: 'Entirely optionally, you can assign a clock to an hour within the week by dragging across the grid, or selecting a block and choosing from the library. Hours can also be marked active or inactive (for instance, if your programming regularly comes from elsewhere in given hours). Double-click any filled cell to jump straight into that clock. If you’ve copied one clock’s assignment (Ctrl/Cmd+C), you can paste it onto another selection (Ctrl/Cmd+V) instead of reopening the picker each time.',
  },
  {
    heading: 'Summary',
    body: 'If you’ve used the Week section then here’s an overview: every clock in your library, how many hours it runs, its category mix as a coloured bar, which days it’s actually scheduled, and when it was last changed. Click any row — or use the dropdown at the top — to select a clock, then Open Clock to jump straight into editing its List.',
  },
  {
    heading: 'Backtimer',
    body: (
      <>
        This is a separate tool for working backwards from a fixed moment, which doesn’t have to be the end of the
        hour. Set the out-time, then add items and durations; Backtimer works out when each one needs to start.
        Reverse flips the display between working backwards and forwards. Backtimer also exists as a standalone web
        app, for people who don’t need the whole Clockmaker functionality, at{' '}
        <a href="https://backtimer.baish.net" target="_blank" rel="noopener noreferrer" style={linkStyle}>
          https://backtimer.baish.net
        </a>
        .
      </>
    ),
  },
  {
    heading: 'About Clockmaker',
    body: 'Clockmaker is a free-to-use personal project by John Baish. Nothing you type here is sent anywhere, because your data is only saved in your browser. Contact: clockmaker@baish.net.',
  },
];

export function GuideScreen() {
  const { setScreen } = useApp();

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', flexWrap: 'wrap' }}>
        <div>
          <div className="card-kicker">Start here</div>
          <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>How to use Clockmaker</h2>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => window.print()}
          data-noprint="1"
          style={{ marginLeft: 'auto', color: 'var(--color-accent-700)' }}
        >
          <IconPrint size={15} />Print
        </button>
      </div>

      <div className="card" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
          Clockmaker will create a circular clock from a list of items and durations, with the sections colour-coded
          according to categories you define. It helps you plan and share the shape of your hour at a glance. Here’s
          how to use it. (You can return to this intro page at any time via “Guide”.)
        </p>
        {SECTIONS.map((s) => (
          <div key={s.heading}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{s.heading}</h3>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--color-neutral-700)' }}>{s.body}</p>
          </div>
        ))}
        <div data-noprint="1">
          <button className="btn btn-primary" onClick={() => setScreen('lib')} style={{ padding: '9px 20px', fontSize: '13.5px' }}>
            Go to Library
          </button>
        </div>
      </div>
    </div>
  );
}
