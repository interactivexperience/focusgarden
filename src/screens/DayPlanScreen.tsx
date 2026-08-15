import { useState } from 'react'
import { AppIcon } from '../lib/assets'
import { buildDayPlan, clockToMinutes, minutesToClock, planSummary, type DayPlanBlock, type DayPlanResult } from '../lib/dayplan'
import { useFocusGarden } from '../state/store'

interface MeetingDraft {
  id: string
  start: string
  end: string
  title: string
}

function newMeeting(): MeetingDraft {
  return { id: `${Date.now()}-${Math.random()}`, start: '10:00', end: '10:30', title: '' }
}

const BLOCK_LABEL: Record<DayPlanBlock['type'], string> = {
  focus: 'Fokus',
  break: 'Pause',
  longbreak: 'Lange Pause',
  meeting: 'Termin',
}

function BlockRow({ block }: { block: DayPlanBlock }) {
  const isFocus = block.type === 'focus'
  const isMeeting = block.type === 'meeting'
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
    </div>
  )
}

export function DayPlanScreen() {
  const { navigate, applyDayPlan } = useFocusGarden()
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('17:00')
  const [meetings, setMeetings] = useState<MeetingDraft[]>([])
  const [result, setResult] = useState<DayPlanResult | null>(null)

  function addMeeting() {
    setMeetings((m) => [...m, newMeeting()])
  }
  function updateMeeting(id: string, patch: Partial<MeetingDraft>) {
    setMeetings((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }
  function removeMeeting(id: string) {
    setMeetings((list) => list.filter((m) => m.id !== id))
  }

  function handleBuild() {
    const inputs = meetings
      .filter((m) => m.start && m.end)
      .map((m) => ({ start: clockToMinutes(m.start), end: clockToMinutes(m.end), title: m.title.trim() || undefined }))
    setResult(buildDayPlan(clockToMinutes(workStart), clockToMinutes(workEnd), inputs))
  }

  function handleApply() {
    if (!result) return
    applyDayPlan(result.blocks)
  }

  const summary = result ? planSummary(result.blocks) : null
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
            <div className="font-bold text-[13px] mb-3">Arbeitszeit</div>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border-[1.5px] border-line px-3 py-2.5 text-[14px] font-bold text-ink bg-white"
              />
              <span className="text-ink-faint font-bold">–</span>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border-[1.5px] border-line px-3 py-2.5 text-[14px] font-bold text-ink bg-white"
              />
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
                <div key={m.id} className="flex items-center gap-2 bg-[#F7F5EF] rounded-xl px-3 py-2.5">
                  <input
                    type="time"
                    value={m.start}
                    onChange={(e) => updateMeeting(m.id, { start: e.target.value })}
                    className="w-[84px] flex-shrink-0 rounded-lg border-[1.5px] border-line px-2 py-1.5 text-[12.5px] font-bold text-ink bg-white"
                  />
                  <input
                    type="time"
                    value={m.end}
                    onChange={(e) => updateMeeting(m.id, { end: e.target.value })}
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
            {result.blocks.map((b, i) => (
              <BlockRow key={`${b.type}-${b.start}-${i}`} block={b} />
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
