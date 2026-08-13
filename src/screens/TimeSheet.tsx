import { FruitIcon } from '../lib/assets'
import { AppIcon } from '../lib/assets'
import { CUSTOM_MAX_MINUTES, CUSTOM_MIN_MINUTES, CUSTOM_STEP_MINUTES, TIME_PRESETS } from '../lib/presets'
import { useFocusGarden } from '../state/store'

export function TimeSheet() {
  const { state, navigate, selectPreset, stepMinutes, applyTime } = useFocusGarden()

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Schließen"
        onClick={() => navigate('start')}
        className="absolute inset-0 bg-black/20"
      />
      <div className="relative bg-bg-app rounded-t-[32px] pt-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[85vh] flex flex-col animate-[sheetIn_0.28s_cubic-bezier(0.22,1,0.36,1)]">
        <div className="w-9 h-1 bg-line rounded-full mx-auto mb-4.5" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[19px] font-bold m-0">Fokuszeit wählen</h2>
          <button
            type="button"
            onClick={() => navigate('start')}
            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center"
          >
            <AppIcon name="close" size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 mb-4 overflow-y-auto">
          {TIME_PRESETS.map((preset) => {
            const selected = state.selectedPresetName === preset.name
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => selectPreset(preset.minutes, preset.name)}
                className={`flex items-center gap-3.5 rounded-2xl px-3.5 py-3 border-[1.5px] text-left shadow-[0_4px_14px_rgba(61,58,52,0.07)] ${
                  selected ? 'border-leaf bg-leaf-pale' : 'border-transparent bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-white' : 'bg-leaf-pale'
                  }`}
                >
                  <FruitIcon type={preset.icon} size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] flex items-center gap-1.5">
                    {preset.name}
                    {preset.standard && (
                      <span className="bg-leaf text-white text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Standard
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-soft font-semibold mt-0.5">
                    {preset.minutes} Min Fokus · {preset.breakMinutes} Min Pause
                  </div>
                </div>
                <div
                  className={`w-[19px] h-[19px] rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    selected ? 'border-leaf' : 'border-[#DCD6C8]'
                  }`}
                >
                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-leaf" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(61,58,52,0.07)] mb-4">
          <div className="font-bold text-[13px] mb-3">Eigene Zeit</div>
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => stepMinutes(-CUSTOM_STEP_MINUTES)}
              disabled={state.pendingMinutes <= CUSTOM_MIN_MINUTES}
              className="w-9 h-9 rounded-full border-[1.5px] border-line bg-white text-[15px] text-ink disabled:opacity-30"
            >
              −
            </button>
            <div className="font-display text-[21px] font-bold min-w-[76px] text-center">
              {state.pendingMinutes}
              <small className="block text-[9.5px] text-ink-faint font-bold font-body uppercase tracking-wide">
                Minuten
              </small>
            </div>
            <button
              type="button"
              onClick={() => stepMinutes(CUSTOM_STEP_MINUTES)}
              disabled={state.pendingMinutes >= CUSTOM_MAX_MINUTES}
              className="w-9 h-9 rounded-full border-[1.5px] border-line bg-white text-[15px] text-ink disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={applyTime}
          className="mt-auto w-full justify-center bg-leaf text-white font-bold text-[14.5px] py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.97] transition-transform"
        >
          Übernehmen
        </button>
      </div>
    </div>
  )
}
