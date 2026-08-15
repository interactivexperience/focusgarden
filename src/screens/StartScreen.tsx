import { SandCanvas } from '../components/SandCanvas'
import { ChevronDown } from '../lib/decor-icons'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

export function StartScreen() {
  const { state, navigate, startSession } = useFocusGarden()

  return (
    <div className="relative flex-1 overflow-hidden">
      <SandCanvas fruitTypes={state.todaysHarvest} hapticsEnabled={state.soundState.haptics} />
      {/* pointer-events-none: sonst blockiert dieser volle-Bildschirm-Wrapper
          (h-full, um seinen Inhalt zu zentrieren) den Sanduhr-Canvas darunter
          komplett für Maus-/Touch-Events, auch außerhalb der sichtbaren Buttons. */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-9 px-6 pointer-events-none">
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
        <button
          type="button"
          onClick={startSession}
          className="bg-leaf text-white font-bold text-[15px] px-9 py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.94] transition-transform pointer-events-auto"
        >
          Fokus starten
        </button>
      </div>
    </div>
  )
}
