import type { DayPlanBlock } from './dayplan'
import type { FruitType } from './fruits'

export interface SoundState {
  focusEnd: boolean
  breakEnd: boolean
  haptics: boolean
}

export interface StoredDayPlan {
  blocks: DayPlanBlock[]
  /** Lokaler Kalendertag, für den der Plan erstellt wurde – ein Plan von gestern
   *  darf nicht in den neuen Tag hinein aktiv bleiben. */
  dateKey: string
}

export interface StoredState {
  todaysHarvest: FruitType[]
  totalSeconds: number
  pendingMinutes: number
  soundState: SoundState
  lastHarvestDate: string
  discoveredTypes: FruitType[]
  streak: number
  /** Anzahl abgeschlossener Fokuszeiten seit der letzten langen Pause (0–3). */
  cycleCount: number
  /** Aktiver Tagesplan, falls über "Tag planen" übernommen. */
  dayPlan: StoredDayPlan | null
  /** Index des nächsten noch nicht gestarteten Blocks in dayPlan.blocks. */
  currentBlockIndex: number
}

const STORAGE_KEY = 'fokusgarten_state_v1'

/**
 * Lokales Kalenderdatum (nicht UTC!) als "YYYY-MM-DD". `toISOString()` würde
 * in Zeitzonen östlich von UTC (z.B. Deutschland) rund um Mitternacht noch
 * den Vortag liefern und damit Tageswechsel-Logik (Streak, Tages-Ernte) verschieben.
 */
export function todayDateKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Einzige Stelle, die lokalen Zustand liest. Bei einem späteren Cloud-Backend
 * wird hier zusätzlich aus der Datenbank gelesen – der Rest der App bleibt unangetastet.
 */
export function loadStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredState
  } catch {
    return null
  }
}

/**
 * Einzige Stelle, die lokalen Zustand schreibt. Bei einem späteren Cloud-Backend
 * wird hier zusätzlich in die Datenbank geschrieben – der Rest der App bleibt unangetastet.
 */
export function saveStoredState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage kann in seltenen Fällen (Private Mode, voller Speicher) fehlschlagen –
    // die App bleibt in diesem Fall innerhalb der Session weiter benutzbar.
  }
}
