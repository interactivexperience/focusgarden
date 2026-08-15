import { AppHeader } from '../components/AppHeader'
import { AppIcon } from '../lib/assets'
import { playChime, vibrate } from '../lib/sound'
import { useFocusGarden } from '../state/store'

function ToggleRow({
  icon,
  name,
  description,
  on,
  onToggle,
}: {
  icon: Parameters<typeof AppIcon>[0]['name']
  name: string
  description: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
      <div className="w-8.5 h-8.5 rounded-[10px] bg-leaf-pale flex items-center justify-center flex-shrink-0">
        <AppIcon name={icon} size={16} />
      </div>
      <div className="flex-1">
        <div className="font-bold text-[13px]">{name}</div>
        <div className="text-[10.5px] text-ink-soft font-semibold mt-0.5 leading-snug">{description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className="relative w-11 h-6.5 rounded-full flex-shrink-0 transition-colors"
        style={{ background: on ? 'var(--color-leaf)' : '#DCD6C8' }}
      >
        <span
          className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform"
          style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

export function SettingsScreen({ onOpenWidgetPreview }: { onOpenWidgetPreview: () => void }) {
  const { state, toggleSound } = useFocusGarden()

  function handleTest() {
    playChime()
    if (state.soundState.haptics) vibrate(30)
  }

  return (
    <div className="flex-1 flex flex-col px-5 pt-9 pb-24 overflow-y-auto">
      <AppHeader />
      <div className="font-display text-[17px] font-bold mb-0.5">Einstellungen</div>
      <div className="text-[11.5px] text-ink-soft font-semibold mb-3.5">Sound &amp; Benachrichtigungen</div>

      <div className="flex flex-col gap-2.5">
        <ToggleRow
          icon="bell"
          name="Sound bei Fokus-Ende"
          description="Ton, sobald die Fokuszeit abgelaufen ist"
          on={state.soundState.focusEnd}
          onToggle={() => toggleSound('focusEnd')}
        />
        <ToggleRow
          icon="coffee"
          name="Sound bei Pausen-Ende"
          description="Ton, sobald die Pause vorbei ist"
          on={state.soundState.breakEnd}
          onToggle={() => toggleSound('breakEnd')}
        />
        <ToggleRow
          icon="vibrate"
          name="Vibration"
          description="Kurzes haptisches Feedback zusätzlich zum Ton"
          on={state.soundState.haptics}
          onToggle={() => toggleSound('haptics')}
        />
      </div>

      <button
        type="button"
        onClick={handleTest}
        className="mt-5 self-center bg-white text-ink border-[1.5px] border-line font-bold text-[13px] px-6.5 py-3.5 rounded-full flex items-center gap-2 active:scale-[0.94] transition-transform"
      >
        <AppIcon name="sound-on" size={16} />
        Sound testen
      </button>

      <button
        type="button"
        onClick={onOpenWidgetPreview}
        className="mt-3 self-center text-[11.5px] font-bold text-leaf-dark underline underline-offset-4"
      >
        Widget-Vorschau ansehen
      </button>
    </div>
  )
}
