import { AppProvider, useApp } from './state/store';
import { Nav } from './components/Nav';
import { EditorHeader } from './components/EditorHeader';
import { WeekHeader } from './components/WeekHeader';
import { ClockScreen } from './screens/ClockScreen';
import { ListScreen } from './screens/ListScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { WeekScreen } from './screens/WeekScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';

function Shell() {
  const { screen, setScreen } = useApp();
  const isEditor = screen === 'clock' || screen === 'list';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav screen={screen} onNavigate={setScreen} />
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
        {screen === 'week' && <WeekHeader />}
        {isEditor && <EditorHeader />}
        {screen === 'lib' && <LibraryScreen />}
        {screen === 'summary' && <SummaryScreen />}
        {screen === 'clock' && <ClockScreen />}
        {screen === 'list' && <ListScreen />}
        {screen === 'week' && <WeekScreen />}
        {screen === 'categories' && <CategoriesScreen />}
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
