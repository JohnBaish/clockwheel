import { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './state/store';
import { isBacktimerHost } from './lib/hostMode';
import { screenFromHash } from './lib/screenHash';
import { Nav } from './components/Nav';
import { EditorHeader } from './components/EditorHeader';
import { WeekHeader } from './components/WeekHeader';
import { ClockScreen } from './screens/ClockScreen';
import { ListScreen } from './screens/ListScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { WeekScreen } from './screens/WeekScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { BacktimerScreen } from './screens/BacktimerScreen';
import { GuideScreen } from './screens/GuideScreen';

function Shell() {
  const { screen, setScreen, clocks, openClockId } = useApp();
  // Clock and List show whichever clock is open; with no clocks at all (every
  // one deleted) there's nothing to show, so they say so instead of crashing.
  const noClock = !clocks[openClockId];

  // Keep the address in step with the screen (…/#week), adding a history
  // entry for each move so Back returns to the previous screen. The first
  // render only labels the current entry rather than adding one.
  const firstRender = useRef(true);
  useEffect(() => {
    if (isBacktimerHost()) return;
    const want = `#${screen}`;
    if (window.location.hash !== want) {
      if (firstRender.current) history.replaceState(null, '', want);
      else history.pushState(null, '', want);
    }
    firstRender.current = false;
  }, [screen]);
  // Back/Forward (or an edited address) changes the hash; follow it.
  useEffect(() => {
    const follow = () => { const s = screenFromHash(); if (s) setScreen(s); };
    window.addEventListener('popstate', follow);
    window.addEventListener('hashchange', follow);
    return () => { window.removeEventListener('popstate', follow); window.removeEventListener('hashchange', follow); };
  }, [setScreen]);
  const isEditor = (screen === 'clock' || screen === 'list') && !noClock;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav screen={screen} onNavigate={setScreen} />
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
        {screen === 'week' && <WeekHeader />}
        {isEditor && <EditorHeader />}
        {screen === 'guide' && <GuideScreen />}
        {screen === 'lib' && <LibraryScreen />}
        {screen === 'summary' && <SummaryScreen />}
        {isEditor && screen === 'clock' && <ClockScreen />}
        {isEditor && screen === 'list' && <ListScreen />}
        {(screen === 'clock' || screen === 'list') && noClock && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-700)' }}>
            No clocks yet. Press New clock to start one.
          </div>
        )}
        {screen === 'week' && <WeekScreen />}
        {screen === 'categories' && <CategoriesScreen />}
        {screen === 'backtimer' && <BacktimerScreen />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default App;
