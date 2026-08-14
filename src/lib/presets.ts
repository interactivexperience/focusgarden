import type { FruitType } from './fruits'

export interface TimePreset {
  name: string
  minutes: number
  breakMinutes: number
  standard?: boolean
  icon: FruitType
  description: string
}

export const TIME_PRESETS: TimePreset[] = [
  {
    name: 'Pomodoro',
    minutes: 25,
    breakMinutes: 5,
    standard: true,
    icon: 'tomato',
    description:
      'Die klassische Technik von Francesco Cirillo aus den späten 1980ern (benannt nach seinem tomatenförmigen Küchenwecker): 25 Minuten fokussiert arbeiten, dann 5 Minuten Pause. Nach vier Runden folgt eine längere Pause von 15–30 Minuten. Die kurzen Intervalle machen Konzentration planbar und beugen Ermüdung vor.',
  },
  {
    name: 'Lang-Pomodoro',
    minutes: 50,
    breakMinutes: 10,
    icon: 'corn',
    description:
      'Eine verbreitete Variante des klassischen Pomodoros für Aufgaben, die etwas mehr Anlaufzeit brauchen. 50 Minuten Fokus, 10 Minuten Pause – dasselbe Prinzip, nur mit mehr Raum, um wirklich in einen Task hineinzukommen, bevor die Konzentration nachlässt.',
  },
  {
    name: '52/17-Methode',
    minutes: 52,
    breakMinutes: 17,
    icon: 'kiwi',
    description:
      'Geht auf eine vielzitierte Auswertung der Zeiterfassungs-App DeskTime zurück: die produktivsten Nutzer:innen arbeiteten im Schnitt in Blöcken von 52 Minuten, gefolgt von 17 Minuten echter Erholung (nicht nur kurz durchatmen). Die etwas ungeraden Zahlen sind kein Zufall, sondern der beobachtete Durchschnitt.',
  },
  {
    name: 'Ultradian Rhythm',
    minutes: 90,
    breakMinutes: 20,
    icon: 'eggplant',
    description:
      'Basiert auf dem Konzept der ultradianen Rhythmen – natürlichen Energie- und Aufmerksamkeitszyklen des Körpers von etwa 90 Minuten, die ursprünglich in der Schlafforschung (Nathaniel Kleitman) beschrieben und später von Peretz Lavie und anderen auf den Wachzustand übertragen wurden. Lange, intensive Arbeitsblöcke wechseln sich mit einer deutlich längeren Erholungsphase ab.',
  },
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
