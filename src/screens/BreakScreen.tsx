import { SunflowerIcon } from '../lib/assets'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

export function BreakScreen() {
  const { state, skipBreak } = useFocusGarden()

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center gap-5 select-none">
      <div className="text-[12px] font-bold text-leaf-dark uppercase tracking-wide">
        {state.isLongBreak ? 'Lange Pause' : 'Pause'}
      </div>

      <div className="font-display font-extrabold text-[64px] sm:text-[76px] leading-none tabular-nums text-ink">
        {formatTime(state.breakRemainingSeconds)}
      </div>

      <div className="w-[92px]">
        <SunflowerIcon mood="tired" size={92} className="w-full block" />
      </div>

      <div className="text-[12px] font-bold text-center max-w-[220px] leading-relaxed text-ink-soft">
        Kurz durchatmen, bevor es weitergeht.
      </div>

      <button
        type="button"
        onClick={skipBreak}
        className="text-[11.5px] font-bold text-leaf-dark underline underline-offset-4 active:opacity-50 transition-opacity mt-2"
      >
        Pause überspringen
      </button>
    </div>
  )
}
