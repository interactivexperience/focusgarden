import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { type FruitType, randomFruitType } from '../lib/fruits'
import { presetForMinutes, TIME_PRESETS } from '../lib/presets'
import { loadStoredState, saveStoredState, todayDateKey, type SoundState, type StoredState } from '../lib/storage'

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
  harvestReplayTick: number
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = Date.parse(fromKey)
  const to = Date.parse(toKey)
  if (Number.isNaN(from) || Number.isNaN(to)) return Infinity
  return Math.round((to - from) / 86400000)
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
      harvestReplayTick: 0,
    }
  }

  const lastHarvestDate = stored.lastHarvestDate ?? ''
  const isNewDay = lastHarvestDate !== today
  const gap = daysBetween(lastHarvestDate, today)
  const streak = isNewDay && gap > 1 ? 0 : (stored.streak ?? 0)
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
    harvestReplayTick: 0,
  }
}

type Action =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'SELECT_PRESET'; minutes: number; name: string }
  | { type: 'STEP_MINUTES'; delta: number }
  | { type: 'APPLY_TIME' }
  | { type: 'START_SESSION' }
  | { type: 'TICK' }
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
      return { ...state, remainingSeconds: state.totalSeconds, sessionPaused: false, screen: 'running' }

    case 'TICK': {
      if (state.sessionPaused || state.screen !== 'running') return state
      const remaining = state.remainingSeconds - 1
      if (remaining > 0) return { ...state, remainingSeconds: remaining }

      const type = randomFruitType()
      const today = todayDateKey()
      const alreadyHarvestedToday = state.lastHarvestDate === today
      const gap = daysBetween(state.lastHarvestDate, today)
      const streak = alreadyHarvestedToday ? state.streak : gap === 1 ? state.streak + 1 : 1
      const discoveredTypes = state.discoveredTypes.includes(type)
        ? state.discoveredTypes
        : [...state.discoveredTypes, type]

      return {
        ...state,
        remainingSeconds: state.totalSeconds,
        sessionPaused: false,
        screen: 'harvest',
        todaysHarvest: [...state.todaysHarvest, type],
        lastHarvestType: type,
        lastHarvestDate: today,
        streak,
        discoveredTypes,
        harvestReplayTick: state.harvestReplayTick + 1,
      }
    }

    case 'TOGGLE_PAUSE':
      return { ...state, sessionPaused: !state.sessionPaused }

    case 'RESET_AFTER_STOP':
      return { ...state, remainingSeconds: state.totalSeconds, sessionPaused: false, screen: 'start' }

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

  useEffect(() => {
    const id = window.setInterval(() => {
      if (stateRef.current.screen === 'running' && !stateRef.current.sessionPaused) {
        dispatch({ type: 'TICK' })
      }
    }, 1000)
    return () => window.clearInterval(id)
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
