import { BottomNav } from './components/BottomNav'
import { PullToRefresh } from './components/PullToRefresh'
import { useLockPortrait } from './hooks/useLockPortrait'
import { HarvestScreen } from './screens/HarvestScreen'
import { RunningScreen } from './screens/RunningScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StartScreen } from './screens/StartScreen'
import { TimeSheet } from './screens/TimeSheet'
import { TodayScreen } from './screens/TodayScreen'
import { VarietiesScreen } from './screens/VarietiesScreen'
import { WidgetPreviewScreen } from './screens/WidgetPreviewScreen'
import { FocusGardenProvider, useFocusGarden, type Screen } from './state/store'

const TAB_SCREENS: Screen[] = ['start', 'today', 'varieties', 'settings']

function AppShell() {
  const { state, navigate } = useFocusGarden()
  const showNav = TAB_SCREENS.includes(state.screen)
  useLockPortrait()

  return (
    <div className="flex flex-col h-dvh bg-bg-app mx-auto max-w-[480px] overflow-hidden">
      <PullToRefresh>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {(state.screen === 'start' || state.screen === 'timeSheet') && <StartScreen />}
          {state.screen === 'timeSheet' && <TimeSheet />}
          {state.screen === 'running' && <RunningScreen />}
          {state.screen === 'harvest' && <HarvestScreen />}
          {state.screen === 'today' && <TodayScreen />}
          {state.screen === 'varieties' && <VarietiesScreen />}
          {state.screen === 'settings' && <SettingsScreen onOpenWidgetPreview={() => navigate('widget')} />}
          {state.screen === 'widget' && <WidgetPreviewScreen onBack={() => navigate('settings')} />}
          {showNav && <BottomNav active={state.screen} onNavigate={navigate} />}
        </div>
      </PullToRefresh>
    </div>
  )
}

function App() {
  return (
    <FocusGardenProvider>
      <AppShell />
    </FocusGardenProvider>
  )
}

export default App
