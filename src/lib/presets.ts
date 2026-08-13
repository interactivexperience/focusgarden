import type { FruitType } from './fruits'

export interface TimePreset {
  name: string
  minutes: number
  breakMinutes: number
  standard?: boolean
  icon: FruitType
}

export const TIME_PRESETS: TimePreset[] = [
  { name: 'Pomodoro', minutes: 25, breakMinutes: 5, standard: true, icon: 'tomato' },
  { name: 'Lang-Pomodoro', minutes: 50, breakMinutes: 10, icon: 'corn' },
  { name: '52/17-Methode', minutes: 52, breakMinutes: 17, icon: 'avocado' },
  { name: 'Ultradian Rhythm', minutes: 90, breakMinutes: 20, icon: 'eggplant' },
]

export const CUSTOM_MIN_MINUTES = 5
export const CUSTOM_MAX_MINUTES = 90
export const CUSTOM_STEP_MINUTES = 5

export function presetForMinutes(minutes: number): TimePreset | undefined {
  return TIME_PRESETS.find((p) => p.minutes === minutes)
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
