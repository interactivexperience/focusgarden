import { CYCLES_UNTIL_LONG_BREAK, longBreakMinutes } from './presets.ts'

export interface MeetingInput {
  start: number
  end: number
  title?: string
}

export type DayPlanBlockType = 'focus' | 'break' | 'longbreak' | 'meeting'

export interface DayPlanBlock {
  type: DayPlanBlockType
  start: number
  end: number
  minutes: number
  title?: string
}

export interface DayPlanResult {
  blocks: DayPlanBlock[]
  warning: string | null
}

const MIN_BUFFER = 20
const SHORT_BLOCK_MAX = 35
const LONG_WINDOW_THRESHOLD = 120
const POMODORO_FOCUS = 25
const POMODORO_BREAK = 5
const LONG_SESSION_FOCUS = 50
const LONG_SESSION_BREAK = 10
const LUNCH_START = 12 * 60
const LUNCH_END = 14 * 60
const LUNCH_MIN_OVERLAP = 15

export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

export function minutesToClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Baut eine Fokus/Pause-Kette, die in [start, end) passt – jede 4. Pause lang (wie beim Timer selbst). */
function buildChain(start: number, end: number, focusMin: number, breakMin: number): DayPlanBlock[] {
  const blocks: DayPlanBlock[] = []
  let t = start
  let cycle = 0
  while (t + focusMin <= end) {
    blocks.push({ type: 'focus', start: t, end: t + focusMin, minutes: focusMin })
    t += focusMin
    cycle += 1
    const isLong = cycle % CYCLES_UNTIL_LONG_BREAK === 0
    const bMin = isLong ? longBreakMinutes(breakMin) : breakMin
    if (t + bMin > end) break
    blocks.push({ type: isLong ? 'longbreak' : 'break', start: t, end: t + bMin, minutes: bMin })
    t += bMin
  }
  return blocks
}

/** Füllt genau ein freies (nicht-Mittagspausen-)Fenster nach den Größenregeln aus dem Konzept. */
function fillWindow(start: number, end: number): DayPlanBlock[] {
  const duration = end - start
  if (duration < MIN_BUFFER) return []
  if (duration <= SHORT_BLOCK_MAX) return [{ type: 'focus', start, end, minutes: duration }]
  if (duration <= LONG_WINDOW_THRESHOLD) return buildChain(start, end, POMODORO_FOCUS, POMODORO_BREAK)
  return buildChain(start, end, LONG_SESSION_FOCUS, LONG_SESSION_BREAK)
}

/** Zerlegt ein Fenster an der Mittagszeit (12–14 Uhr) in Vor-/Nach-Teile plus einen expliziten Mittagspause-Block. */
function splitAroundLunch(start: number, end: number): { workable: [number, number][]; lunch: DayPlanBlock | null } {
  const overlapStart = Math.max(start, LUNCH_START)
  const overlapEnd = Math.min(end, LUNCH_END)
  if (overlapEnd - overlapStart < LUNCH_MIN_OVERLAP) {
    return { workable: [[start, end]], lunch: null }
  }
  const workable: [number, number][] = []
  if (overlapStart > start) workable.push([start, overlapStart])
  if (end > overlapEnd) workable.push([overlapEnd, end])
  return {
    workable,
    lunch: { type: 'break', start: overlapStart, end: overlapEnd, minutes: overlapEnd - overlapStart, title: 'Mittagspause' },
  }
}

function mergeIntervals(intervals: [number, number][]): [number, number][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e)
    } else {
      merged.push([s, e])
    }
  }
  return merged
}

export function buildDayPlan(workStart: number, workEnd: number, meetings: MeetingInput[]): DayPlanResult {
  if (workEnd <= workStart) {
    return { blocks: [], warning: 'Arbeitsende muss nach dem Arbeitsbeginn liegen.' }
  }

  const clippedMeetings = meetings
    .map((m) => ({ ...m, start: Math.max(workStart, m.start), end: Math.min(workEnd, m.end) }))
    .filter((m) => m.end > m.start)

  const occupied = mergeIntervals(clippedMeetings.map((m): [number, number] => [m.start, m.end]))

  const freeWindows: [number, number][] = []
  let cursor = workStart
  for (const [s, e] of occupied) {
    if (s > cursor) freeWindows.push([cursor, s])
    cursor = Math.max(cursor, e)
  }
  if (cursor < workEnd) freeWindows.push([cursor, workEnd])

  const meetingBlocks: DayPlanBlock[] = [...clippedMeetings]
    .sort((a, b) => a.start - b.start)
    .map((m) => ({ type: 'meeting', start: m.start, end: m.end, minutes: m.end - m.start, title: m.title }))

  const scheduledBlocks: DayPlanBlock[] = []
  for (const [s, e] of freeWindows) {
    const { workable, lunch } = splitAroundLunch(s, e)
    if (lunch) scheduledBlocks.push(lunch)
    for (const [ws, we] of workable) scheduledBlocks.push(...fillWindow(ws, we))
  }

  const blocks = [...meetingBlocks, ...scheduledBlocks].sort((a, b) => a.start - b.start)
  const hasFocus = blocks.some((b) => b.type === 'focus')
  const warning = hasFocus ? null : 'Der Tag ist zu dicht mit Terminen belegt, um sinnvolle Fokuszeiten einzuplanen.'

  return { blocks, warning }
}

export function planSummary(blocks: DayPlanBlock[]): { focusCount: number; focusMinutes: number; breakCount: number } {
  const focusBlocks = blocks.filter((b) => b.type === 'focus')
  const breakBlocks = blocks.filter((b) => b.type === 'break' || b.type === 'longbreak')
  return {
    focusCount: focusBlocks.length,
    focusMinutes: focusBlocks.reduce((sum, b) => sum + b.minutes, 0),
    breakCount: breakBlocks.length,
  }
}

/** Nächster noch nicht gestarteter, tatsächlich startbarer Block (überspringt reine Termin-Einträge). */
export function nextActionableBlock(
  blocks: DayPlanBlock[],
  fromIndex: number,
): { block: DayPlanBlock; index: number } | null {
  for (let i = fromIndex; i < blocks.length; i++) {
    if (blocks[i].type !== 'meeting') return { block: blocks[i], index: i }
  }
  return null
}
