import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { type FruitType, randomFruitType } from '../lib/fruits'
import { presetForMinutes, TIME_PRESETS } from '../lib/presets'
import { loadStoredState, saveStoredState, todayDateKey, type SoundState, type StoredState } from '../lib/storage'
import { streakOnHarvest, streakOnNewDay } from '../lib/streak'

export type Screen =
  | 'start'
  | 'timeSheet'
  | 'running'
  | 'harvest'
  | 'today'
  | 'varieties'
  | 'widget'
  | 'settings'

interface State {
  screen: Screen
  todaysHarvest: FruitType[]
  totalSeconds: number
  remainingSeconds: number
  pendingMinutes: number
  selectedPresetName: string | null
  sessionPaused: boolean
  lastHarvestType: FruitType | null
  soundState: SoundState
  discoveredTypes: FruitType[]
  streak: number
  lastHarvestDate: string
  /** Kalendertag (lokal), auf den sich `todaysHarvest` gerade bezieht – erlaubt einen
   *  Tageswechsel zu erkennen, während die App offen bleibt (kein Reload über Mitternacht). */
  activeDayKey: string
  /** Timestamp (ms), zu dem die laufende Sitzung endet – während einer Pause null.
   *  Die Restzeit wird daraus neu berechnet statt hochzuzählen, damit gedrosselte
   *  oder pausierte Timer (Bildschirm aus, Tab im Hintergrund) beim Zurückkehren
   *  sofort wieder den korrekten Stand zeigen, statt Zeit "verloren" zu haben. */
  sessionEndAt: number | null
  harvestReplayTick: number
}

const DEFAULT_MINUTES = 25
const DEFAULT_SOUND: SoundState = { focusEnd: true, breakEnd: true, haptics: false }

function initState(): State {
  const stored = loadStoredState()
  const today = todayDateKey()

  if (!stored) {
    return {
      screen: 'start',
      todaysHarvest: [],
      totalSeconds: DEFAULT_MINUTES * 60,
      remainingSeconds: DEFAULT_MINUTES * 60,
      pendingMinutes: DEFAULT_MINUTES,
      selectedPresetName: 'Pomodoro',
      sessionPaused: false,
      lastHarvestType: null,
      soundState: DEFAULT_SOUND,
      discoveredTypes: [],
      streak: 0,
      lastHarvestDate: '',
      activeDayKey: today,
      sessionEndAt: null,
      harvestReplayTick: 0,
    }
  }

  const lastHarvestDate = stored.lastHarvestDate ?? ''
  const isNewDay = lastHarvestDate !== today
  const streak = isNewDay ? streakOnNewDay(stored.streak ?? 0, lastHarvestDate, today) : (stored.streak ?? 0)
  const totalSeconds = stored.totalSeconds ?? DEFAULT_MINUTES * 60
  const pendingMinutes = stored.pendingMinutes ?? DEFAULT_MINUTES
  const preset = presetForMinutes(pendingMinutes)

  return {
    screen: 'start',
    todaysHarvest: isNewDay ? [] : (stored.todaysHarvest ?? []),
    totalSeconds,
    remainingSeconds: totalSeconds,
    pendingMinutes,
    selectedPresetName: preset ? preset.name : null,
    sessionPaused: false,
    lastHarvestType: null,
    soundState: stored.soundState ?? DEFAULT_SOUND,
    discoveredTypes: stored.discoveredTypes ?? [],
    streak,
    lastHarvestDate,
    activeDayKey: today,
    sessionEndAt: null,
    harvestReplayTick: 0,
  }
}

type Action =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'SELECT_PRESET'; minutes: number; name: string }
  | { type: 'STEP_MINUTES'; delta: number }
  | { type: 'APPLY_TIME' }
  | { type: 'START_SESSION' }
  | { type: 'SYNC_TIME' }
  | { type: 'CHECK_DAY_ROLLOVER' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESET_AFTER_STOP' }
  | { type: 'REPLAY_HARVEST' }
  | { type: 'ACK_HARVEST' }
  | { type: 'TOGGLE_SOUND'; key: keyof SoundState }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen }

    case 'SELECT_PRESET':
      return { ...state, pendingMinutes: action.minutes, selectedPresetName: action.name }

    case 'STEP_MINUTES': {
      const next = Math.max(5, Math.min(90, state.pendingMinutes + action.delta))
      const preset = presetForMinutes(next)
      return { ...state, pendingMinutes: next, selectedPresetName: preset ? preset.name : null }
    }

    case 'APPLY_TIME': {
      const totalSeconds = state.pendingMinutes * 60
      return {
        ...state,
        totalSeconds,
        remainingSeconds: totalSeconds,
        sessionPaused: false,
        screen: 'start',
      }
    }

    case 'START_SESSION':
      return {
        ...state,
        remainingSeconds: state.totalSeconds,
        sessionEndAt: Date.now() + state.totalSeconds * 1000,
        sessionPaused: false,
        screen: 'running',
      }

    case 'SYNC_TIME': {
      if (state.sessionPaused || state.screen !== 'running' || state.sessionEndAt === null) return state
      const remaining = Math.max(0, Math.round((state.sessionEndAt - Date.now()) / 1000))
      if (remaining > 0) return { ...state, remainingSeconds: remaining }

      const type = randomFruitType()
      const today = todayDateKey()
      const streak = streakOnHarvest(state.streak, state.lastHarvestDate, today)
      const discoveredTypes = state.discoveredTypes.includes(type)
        ? state.discoveredTypes
        : [...state.discoveredTypes, type]
      // Falls die App über Mitternacht hinweg offen blieb (kein CHECK_DAY_ROLLOVER
      // dazwischen), hier defensiv den Tages-Eimer für die neue Ernte leeren,
      // statt sie an gestriges todaysHarvest anzuhängen.
      const todaysHarvest = state.activeDayKey === today ? [...state.todaysHarvest, type] : [type]

      return {
        ...state,
        remainingSeconds: state.totalSeconds,
        sessionEndAt: null,
        sessionPaused: false,
        screen: 'harvest',
        todaysHarvest,
        lastHarvestType: type,
        lastHarvestDate: today,
        activeDayKey: today,
        streak,
        discoveredTypes,
        harvestReplayTick: state.harvestReplayTick + 1,
      }
    }

    case 'CHECK_DAY_ROLLOVER': {
      const today = todayDateKey()
      if (state.activeDayKey === today) return state
      return {
        ...state,
        activeDayKey: today,
        todaysHarvest: [],
        streak: streakOnNewDay(state.streak, state.lastHarvestDate, today),
      }
    }

    case 'TOGGLE_PAUSE': {
      if (state.sessionPaused) {
        // Fortsetzen: neuen Ziel-Zeitpunkt aus der eingefrorenen Restzeit berechnen.
        return { ...state, sessionPaused: false, sessionEndAt: Date.now() + state.remainingSeconds * 1000 }
      }
      // Pausieren: Restzeit frisch aus sessionEndAt einfrieren, nicht den evtl.
      // veralteten (seit dem letzten SYNC_TIME) remainingSeconds-Wert übernehmen.
      const remaining =
        state.sessionEndAt !== null
          ? Math.max(0, Math.round((state.sessionEndAt - Date.now()) / 1000))
          : state.remainingSeconds
      return { ...state, sessionPaused: true, sessionEndAt: null, remainingSeconds: remaining }
    }

    case 'RESET_AFTER_STOP':
      return { ...state, remainingSeconds: state.totalSeconds, sessionEndAt: null, sessionPaused: false, screen: 'start' }

    case 'REPLAY_HARVEST':
      return { ...state, harvestReplayTick: state.harvestReplayTick + 1 }

    case 'ACK_HARVEST':
      return { ...state, screen: 'start' }

    case 'TOGGLE_SOUND':
      return { ...state, soundState: { ...state.soundState, [action.key]: !state.soundState[action.key] } }

    default:
      return state
  }
}

interface FocusGardenApi {
  state: State
  navigate: (screen: Screen) => void
  selectPreset: (minutes: number, name: string) => void
  stepMinutes: (delta: number) => void
  applyTime: () => void
  startSession: () => void
  togglePause: () => void
  resetAfterStop: () => void
  replayHarvest: () => void
  ackHarvest: () => void
  toggleSound: (key: keyof SoundState) => void
}

const FocusGardenContext = createContext<FocusGardenApi | null>(null)

export function FocusGardenProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Zählt nicht hoch, sondern berechnet die Restzeit bei jedem Tick aus
  // sessionEndAt neu – auch wenn setInterval gedrosselt wird (Tab im
  // Hintergrund, Bildschirm aus) und seltener als jede Sekunde feuert, zeigt
  // die App beim nächsten Tick sofort wieder die korrekte, real verstrichene
  // Zeit statt "verlorener" Sekunden.
  useEffect(() => {
    const sync = () => {
      if (stateRef.current.screen === 'running' && !stateRef.current.sessionPaused) {
        dispatch({ type: 'SYNC_TIME' })
      }
    }
    const id = window.setInterval(sync, 1000)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  // Screen Wake Lock: verhindert best-effort, dass der Bildschirm während
  // einer laufenden (nicht pausierten) Fokuszeit einschläft. Wird von manchen
  // Browsern nicht unterstützt oder kann fehlschlagen (z.B. Energiesparmodus) –
  // die Zeitmessung bleibt dank sessionEndAt auch dann korrekt.
  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
    }
    if (!nav.wakeLock) return

    let sentinel: { release: () => Promise<void> } | null = null
    let cancelled = false
    const shouldHold = state.screen === 'running' && !state.sessionPaused

    async function acquire() {
      try {
        const lock = await nav.wakeLock!.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
      } catch {
        // Ignorieren – z.B. Energiesparmodus oder Tab nicht sichtbar.
      }
    }
    function onVisibility() {
      if (shouldHold && document.visibilityState === 'visible' && !sentinel) void acquire()
    }

    if (shouldHold) void acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel) void sentinel.release()
    }
  }, [state.screen, state.sessionPaused])

  // Erkennt einen Tageswechsel, während die App offen bleibt (kein Reload über
  // Mitternacht hinweg) und setzt dann todaysHarvest/Streak zurück. 30s reicht,
  // da sich der Kalendertag nur einmal täglich ändert; auch beim Rückkehren aus
  // dem Hintergrund (visibilitychange) direkt prüfen, falls der Timer gedrosselt wurde.
  useEffect(() => {
    const check = () => dispatch({ type: 'CHECK_DAY_ROLLOVER' })
    const id = window.setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  useEffect(() => {
    const toPersist: StoredState = {
      todaysHarvest: state.todaysHarvest,
      totalSeconds: state.totalSeconds,
      pendingMinutes: state.pendingMinutes,
      soundState: state.soundState,
      lastHarvestDate: state.lastHarvestDate,
      discoveredTypes: state.discoveredTypes,
      streak: state.streak,
    }
    saveStoredState(toPersist)
  }, [
    state.todaysHarvest,
    state.totalSeconds,
    state.pendingMinutes,
    state.soundState,
    state.lastHarvestDate,
    state.discoveredTypes,
    state.streak,
  ])

  const api: FocusGardenApi = {
    state,
    navigate: (screen) => dispatch({ type: 'NAVIGATE', screen }),
    selectPreset: (minutes, name) => dispatch({ type: 'SELECT_PRESET', minutes, name }),
    stepMinutes: (delta) => dispatch({ type: 'STEP_MINUTES', delta }),
    applyTime: () => dispatch({ type: 'APPLY_TIME' }),
    startSession: () => dispatch({ type: 'START_SESSION' }),
    togglePause: () => dispatch({ type: 'TOGGLE_PAUSE' }),
    resetAfterStop: () => dispatch({ type: 'RESET_AFTER_STOP' }),
    replayHarvest: () => dispatch({ type: 'REPLAY_HARVEST' }),
    ackHarvest: () => dispatch({ type: 'ACK_HARVEST' }),
    toggleSound: (key) => dispatch({ type: 'TOGGLE_SOUND', key }),
  }

  return <FocusGardenContext.Provider value={api}>{children}</FocusGardenContext.Provider>
}

export function useFocusGarden(): FocusGardenApi {
  const ctx = useContext(FocusGardenContext)
  if (!ctx) throw new Error('useFocusGarden must be used within FocusGardenProvider')
  return ctx
}

export { TIME_PRESETS }
