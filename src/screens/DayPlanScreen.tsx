import { useState } from 'react'
import { AppIcon } from '../lib/assets'
import {
  buildDayPlan,
  clockToMinutes,
  DEFAULT_LUNCH_BREAK_MINUTES,
  LUNCH_BREAK_MAX_MINUTES,
  LUNCH_BREAK_MIN_MINUTES,
  LUNCH_BREAK_STEP_MINUTES,
  minutesToClock,
  planSummary,
  type DayPlanBlock,
  type DayPlanResult,
} from '../lib/dayplan'
import { useFocusGarden } from '../state/store'

interface MeetingDraft {
  id: string
  start: string
  end: string
  title: string
}

const DURATION_PRESETS = [15, 30, 60]

function newMeeting(): MeetingDraft {
  return { id: `${Date.now()}-${Math.random()}`, start: '10:00', end: '10:30', title: '' }
}

function currentTimeClock(): string {
  const now = new Date()
  return minutesToClock(now.getHours() * 60 + now.getMinutes())
}

const BLOCK_LABEL: Record<DayPlanBlock['type'], string> = {
  focus: 'Fokus',
  break: 'Pause',
  longbreak: 'Lange Pause',
  meeting: 'Termin',
}

const BREAK_ADJUST_STEP = 5
const BREAK_MIN_MINUTES = 5

/** Verschiebt alle Blöcke nach `fromIndex` innerhalb desselben Zeitfensters
 *  (bis zum nächsten fest verankerten Termin oder Listenende) um `delta`
 *  Minuten – Termine selbst haben feste Uhrzeiten und werden nie verschoben. */
function shiftFollowing(blocks: DayPlanBlock[], fromIndex: number, delta: number): DayPlanBlock[] {
  let boundary = blocks.length
  for (let i = fromIndex + 1; i < blocks.length; i++) {
    if (blocks[i].type === 'meeting') {
      boundary = i
      break
    }
  }
  return blocks.map((b, i) => (i > fromIndex && i < boundary ? { ...b, start: b.start + delta, end: b.end + delta } : b))
}

function BlockRow({
  block,
  onAdjust,
  onDelete,
}: {
  block: DayPlanBlock
  onAdjust?: (deltaMinutes: number) => void
  onDelete?: () => void
}) {
  const isFocus = block.type === 'focus'
  const isMeeting = block.type === 'meeting'
  const isBreak = block.type === 'break' || block.type === 'longbreak'
  const label = isMeeting ? (block.title?.trim() || 'Termin') : `${BLOCK_LABEL[block.type]} · ${block.minutes} Min`
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border-[1.5px] ${
        isFocus
          ? 'bg-leaf-pale border-leaf/30'
          : isMeeting
            ? 'bg-[#F1EFE9] border-transparent opacity-70'
            : 'bg-[#FFF6DE] border-[#F0DFA0]'
      }`}
    >
      <div className="text-[11.5px] font-bold text-ink-soft w-[92px] flex-shrink-0 tabular-nums">
        {minutesToClock(block.start)}–{minutesToClock(block.end)}
      </div>
      <div className="text-[13px] font-bold flex-1 min-w-0 truncate">{label}</div>
      {isBreak && onAdjust && onDelete && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onAdjust(-BREAK_ADJUST_STEP)}
            disabled={block.minutes <= BREAK_MIN_MINUTES}
            aria-label="Pause verkürzen"
            className="w-6 h-6 rounded-full border-[1.5px] border-[#F0DFA0] bg-white text-[13px] text-ink-soft disabled:opacity-30 active:scale-90 transition-transform duration-150"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdjust(BREAK_ADJUST_STEP)}
            aria-label="Pause verlängern"
            className="w-6 h-6 rounded-full border-[1.5px] border-[#F0DFA0] bg-white text-[13px] text-ink-soft active:scale-90 transition-transform duration-150"
          >
            +
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Pause entfernen"
            className="p-1 -mr-1 active:scale-90 active:opacity-60 transition-all duration-150"
          >
            <AppIcon name="trash" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export function DayPlanScreen() {
  const { navigate, applyDayPlan } = useFocusGarden()
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('17:00')
  const [meetings, setMeetings] = useState<MeetingDraft[]>([])
  const [lunchBreakMinutes, setLunchBreakMinutes] = useState(DEFAULT_LUNCH_BREAK_MINUTES)
  const [result, setResult] = useState<DayPlanResult | null>(null)
  const [editableBlocks, setEditableBlocks] = useState<DayPlanBlock[]>([])

  function addMeeting() {
    setMeetings((m) => [...m, newMeeting()])
  }
  function updateMeeting(id: string, patch: Partial<MeetingDraft>) {
    setMeetings((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }
  /** Verschiebt die Endzeit mit, wenn die Startzeit geändert wird, statt die
   *  bisherige Dauer stillschweigend zu verwerfen (z.B. Start 10:00→11:00
   *  bei einem 30-Min-Termin ergibt weiterhin 11:00–11:30, nicht 11:00–10:30). */
  function updateMeetingStart(id: string, newStart: string) {
    setMeetings((list) =>
      list.map((m) => {
        if (m.id !== id) return m
        const duration = Math.max(5, clockToMinutes(m.end) - clockToMinutes(m.start))
        return { ...m, start: newStart, end: minutesToClock(clockToMinutes(newStart) + duration) }
      }),
    )
  }
  function setMeetingDuration(id: string, duration: number) {
    setMeetings((list) =>
      list.map((m) => (m.id === id ? { ...m, end: minutesToClock(clockToMinutes(m.start) + duration) } : m)),
    )
  }
  function removeMeeting(id: string) {
    setMeetings((list) => list.filter((m) => m.id !== id))
  }

  function handleBuild() {
    const inputs = meetings
      .filter((m) => m.start && m.end)
      .map((m) => ({ start: clockToMinutes(m.start), end: clockToMinutes(m.end), title: m.title.trim() || undefined }))
    const r = buildDayPlan(clockToMinutes(workStart), clockToMinutes(workEnd), inputs, lunchBreakMinutes)
    setResult(r)
    setEditableBlocks(r.blocks)
  }

  function handleApply() {
    applyDayPlan(editableBlocks)
  }

  /** Pause verkürzen/verlängern (5-Min-Schritte) – alle Blöcke danach im
   *  selben Zeitfenster verschieben sich mit, Termine bleiben unangetastet. */
  function adjustBreak(index: number, deltaMinutes: number) {
    setEditableBlocks((blocks) => {
      const block = blocks[index]
      if (block.type !== 'break' && block.type !== 'longbreak') return blocks
      const newMinutes = Math.max(BREAK_MIN_MINUTES, block.minutes + deltaMinutes)
      const delta = newMinutes - block.minutes
      if (delta === 0) return blocks
      const updated = blocks.map((b, i) => (i === index ? { ...b, minutes: newMinutes, end: b.end + delta } : b))
      return shiftFollowing(updated, index, delta)
    })
  }

  /** Pause komplett entfernen – alle Blöcke danach im selben Zeitfenster
   *  rücken entsprechend nach vorn. */
  function deleteBreak(index: number) {
    setEditableBlocks((blocks) => {
      const block = blocks[index]
      if (block.type !== 'break' && block.type !== 'longbreak') return blocks
      const shifted = shiftFollowing(blocks, index, -block.minutes)
      return shifted.filter((_, i) => i !== index)
    })
  }

  const summary = editableBlocks.length > 0 ? planSummary(editableBlocks) : null
  const focusHours = summary ? Math.floor(summary.focusMinutes / 60) : 0
  const focusMins = summary ? summary.focusMinutes % 60 : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-app">
      <div className="flex items-center justify-between px-5 pt-9 pb-2 flex-shrink-0">
        <h2 className="font-display text-[19px] font-bold m-0">
          {result ? 'Dein Tagesplan' : 'Tag planen'}
        </h2>
        <button
          type="button"
          onClick={() => navigate('start')}
          aria-label="Schließen"
          className="flex items-center justify-center p-1.5 -m-1.5 active:scale-90 active:opacity-60 transition-all duration-150"
        >
          <AppIcon name="close" size={22} />
        </button>
      </div>

      {!result && (
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
          <p className="text-[12px] text-ink-soft font-semibold leading-relaxed -mt-1">
            Trag deine Arbeitszeit und feste Termine ein – der Rest deines Tages wird automatisch mit
            Fokuszeiten und Pausen gefüllt.
          </p>

          <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[13px]">Arbeitszeit</div>
              <button
                type="button"
                onClick={() => setWorkStart(currentTimeClock())}
                className="flex items-center gap-1 text-[11.5px] font-bold text-leaf-dark active:opacity-50 transition-opacity"
              >
                <AppIcon name="clock" size={13} />
                Jetzt
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                onBlur={(e) => setWorkStart(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border-[1.5px] border-line px-3 py-2.5 text-[14px] font-bold text-ink bg-white"
              />
              <span className="text-ink-faint font-bold">–</span>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                onBlur={(e) => setWorkEnd(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border-[1.5px] border-line px-3 py-2.5 text-[14px] font-bold text-ink bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
            <div className="font-bold text-[13px] mb-0.5">Mittagspause</div>
            <div className="text-[11px] text-ink-soft font-semibold mb-3">
              Bei Überschneidung mit 12:00–14:00 automatisch eingeplant
            </div>
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => setLunchBreakMinutes((m) => Math.max(LUNCH_BREAK_MIN_MINUTES, m - LUNCH_BREAK_STEP_MINUTES))}
                disabled={lunchBreakMinutes <= LUNCH_BREAK_MIN_MINUTES}
                className="w-9 h-9 rounded-full border-[1.5px] border-line bg-white text-[15px] text-ink disabled:opacity-30 transition-transform duration-150 active:scale-90"
              >
                −
              </button>
              <div className="font-display text-[21px] font-bold min-w-[76px] text-center">
                {lunchBreakMinutes}
                <small className="block text-[9.5px] text-ink-faint font-bold font-body uppercase tracking-wide">
                  Minuten
                </small>
              </div>
              <button
                type="button"
                onClick={() => setLunchBreakMinutes((m) => Math.min(LUNCH_BREAK_MAX_MINUTES, m + LUNCH_BREAK_STEP_MINUTES))}
                disabled={lunchBreakMinutes >= LUNCH_BREAK_MAX_MINUTES}
                className="w-9 h-9 rounded-full border-[1.5px] border-line bg-white text-[15px] text-ink disabled:opacity-30 transition-transform duration-150 active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[13px]">Feste Termine</div>
              <button
                type="button"
                onClick={addMeeting}
                className="flex items-center gap-1 text-[11.5px] font-bold text-leaf-dark active:opacity-50 transition-opacity"
              >
                <AppIcon name="plus" size={13} />
                Termin
              </button>
            </div>

            {meetings.length === 0 && (
              <div className="text-[11.5px] text-ink-faint font-semibold py-1">Keine festen Termine.</div>
            )}

            <div className="flex flex-col gap-2.5">
              {meetings.map((m) => (
                <div key={m.id} className="flex flex-col gap-2 bg-[#F7F5EF] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={m.start}
                      onChange={(e) => updateMeetingStart(m.id, e.target.value)}
                      // Zusätzlich onBlur: native Zeit-Rad-Picker (v.a. iOS)
                      // feuern "change" teils erst unzuverlässig/verzögert
                      // während der Radauswahl – beim Verlassen des Felds
                      // greift der Wert garantiert, auch falls onChange
                      // ausbleibt.
                      onBlur={(e) => updateMeetingStart(m.id, e.target.value)}
                      className="w-[84px] flex-shrink-0 rounded-lg border-[1.5px] border-line px-2 py-1.5 text-[12.5px] font-bold text-ink bg-white"
                    />
                    <input
                      type="time"
                      value={m.end}
                      onChange={(e) => updateMeeting(m.id, { end: e.target.value })}
                      onBlur={(e) => updateMeeting(m.id, { end: e.target.value })}
                      className="w-[84px] flex-shrink-0 rounded-lg border-[1.5px] border-line px-2 py-1.5 text-[12.5px] font-bold text-ink bg-white"
                    />
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateMeeting(m.id, { title: e.target.value })}
                      placeholder="Titel (optional)"
                      className="flex-1 min-w-0 rounded-lg border-[1.5px] border-line px-2.5 py-1.5 text-[12.5px] font-semibold text-ink bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeMeeting(m.id)}
                      aria-label="Termin entfernen"
                      className="flex-shrink-0 p-1 active:scale-90 active:opacity-60 transition-all duration-150"
                    >
                      <AppIcon name="trash" size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wide mr-0.5">Dauer</span>
                    {DURATION_PRESETS.map((d) => {
                      const currentDuration = clockToMinutes(m.end) - clockToMinutes(m.start)
                      const active = currentDuration === d
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setMeetingDuration(m.id, d)}
                          className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border-[1.5px] active:scale-90 transition-all duration-150 ${
                            active ? 'bg-leaf border-leaf text-white' : 'bg-white border-line text-ink-soft'
                          }`}
                        >
                          {d} Min
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBuild}
            className="mt-auto w-full justify-center bg-leaf text-white font-bold text-[14.5px] py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.97] transition-transform"
          >
            Plan erstellen
          </button>
        </div>
      )}

      {result && (
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
          {result.warning ? (
            <div className="bg-[#FFF3ED] border-[1.5px] border-[#F0C4A8] rounded-2xl px-4 py-3.5 text-[12.5px] font-semibold text-ink leading-relaxed">
              {result.warning}
            </div>
          ) : (
            <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_4px_14px_rgba(61,58,52,0.07)] text-[12.5px] font-bold text-ink-soft text-center">
              {summary!.focusCount} Fokus-Sessions · {focusHours > 0 ? `${focusHours}h ` : ''}
              {focusMins}min Fokuszeit · {summary!.breakCount} Pausen
            </div>
          )}

          <div className="flex flex-col gap-2">
            {editableBlocks.map((b, i) => (
              <BlockRow
                key={`${b.type}-${b.start}-${i}`}
                block={b}
                onAdjust={(delta) => adjustBreak(i, delta)}
                onDelete={() => deleteBreak(i)}
              />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            {!result.warning && (
              <button
                type="button"
                onClick={handleApply}
                className="w-full justify-center bg-leaf text-white font-bold text-[14.5px] py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.97] transition-transform"
              >
                Plan übernehmen
              </button>
            )}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="self-center text-[11.5px] font-bold text-leaf-dark underline underline-offset-4"
            >
              Zurück zur Eingabe
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
