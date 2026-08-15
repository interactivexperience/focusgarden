import { SandCanvas } from '../components/SandCanvas'
import { minutesToClock, nextActionableBlock } from '../lib/dayplan'
import { ChevronDown } from '../lib/decor-icons'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

export function StartScreen() {
  const { state, navigate, startSession, startNextPlanBlock, leaveDayPlan } = useFocusGarden()
  const planNext = state.dayPlan ? nextActionableBlock(state.dayPlan.blocks, state.currentBlockIndex) : null

  return (
    <div className="relative flex-1 overflow-hidden">
      <SandCanvas fruitTypes={state.todaysHarvest} hapticsEnabled={state.soundState.haptics} />
      {/* pointer-events-none: sonst blockiert dieser volle-Bildschirm-Wrapper
          (h-full, um seinen Inhalt zu zentrieren) den Sanduhr-Canvas darunter
          komplett für Maus-/Touch-Events, auch außerhalb der sichtbaren Buttons. */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-9 px-6 pointer-events-none">
        {state.dayPlan && planNext ? (
          <>
            <div className="flex flex-col items-center pointer-events-auto">
              <div className="font-display font-extrabold text-[64px] sm:text-[80px] leading-none tabular-nums text-ink">
                {formatTime(planNext.block.minutes * 60)}
              </div>
              <div className="text-[13px] font-bold text-ink-faint mt-1.5 text-center">
                {planNext.block.type === 'focus'
                  ? 'Nächster Fokusblock'
                  : planNext.block.type === 'longbreak'
                    ? 'Nächste lange Pause'
                    : 'Nächste Pause'}{' '}
                · {minutesToClock(planNext.block.start)}–{minutesToClock(planNext.block.end)}
              </div>
            </div>
            <button
              type="button"
              onClick={startNextPlanBlock}
              className="bg-leaf text-white font-bold text-[15px] px-9 py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.94] transition-transform pointer-events-auto"
            >
              {planNext.block.type === 'focus' ? 'Fokus starten' : 'Pause starten'}
            </button>
            <button
              type="button"
              onClick={leaveDayPlan}
              className="text-[11.5px] font-bold text-ink-faint underline underline-offset-4 active:opacity-50 transition-opacity pointer-events-auto"
            >
              Tagesplan verlassen
            </button>
          </>
        ) : state.dayPlan ? (
          <>
            <div className="text-[14px] font-bold text-ink-soft text-center pointer-events-auto">
              Tagesplan abgeschlossen 🌿
            </div>
            <button
              type="button"
              onClick={leaveDayPlan}
              className="bg-leaf text-white font-bold text-[15px] px-9 py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.94] transition-transform pointer-events-auto"
            >
              Weiter im freien Modus
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('timeSheet')}
              className="flex flex-col items-center active:scale-[0.97] transition-transform pointer-events-auto"
            >
              <div className="font-display font-extrabold text-[64px] sm:text-[80px] leading-none tabular-nums text-ink">
                {formatTime(state.remainingSeconds)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[15px] font-bold text-ink-faint">
                  {state.selectedPresetName ?? 'Eigene Zeit'}
                </span>
                <ChevronDown />
              </div>
            </button>
            <div className="flex flex-col items-center gap-3 pointer-events-auto">
              <button
                type="button"
                onClick={startSession}
                className="bg-leaf text-white font-bold text-[15px] px-9 py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.94] transition-transform"
              >
                Fokus starten
              </button>
              <button
                type="button"
                onClick={() => navigate('dayPlan')}
                className="text-[11.5px] font-bold text-leaf-dark underline underline-offset-4 active:opacity-50 transition-opacity"
              >
                Tag planen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
