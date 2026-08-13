import { useEffect, useState } from 'react'
import { FruitIcon } from '../lib/assets'
import { MiniRing } from '../lib/decor-icons'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

export function WidgetPreviewScreen({ onBack }: { onBack: () => void }) {
  const { state } = useFocusGarden()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const ratio = state.totalSeconds > 0 ? 1 - state.remainingSeconds / state.totalSeconds : 0
  const fruit = state.lastHarvestType ?? 'tomato'
  const clockTime = now.toLocaleTimeString('de-DE', { hour: 'numeric', minute: '2-digit' })
  const clockDate = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex-1 flex flex-col items-center bg-gradient-to-b from-[#1B2A3D] to-[#0E1622] px-5 pt-10 pb-6 text-white overflow-y-auto">
      <button
        type="button"
        onClick={onBack}
        className="self-start mb-2 text-[12px] font-bold opacity-70 hover:opacity-100"
      >
        ← Zurück
      </button>
      <div className="text-center mb-6">
        <div className="font-display text-[42px] sm:text-[50px] font-bold">{clockTime}</div>
        <div className="text-[12px] opacity-70 mt-0.5 font-semibold capitalize">{clockDate}</div>
      </div>

      <div className="w-full bg-white/10 backdrop-blur-md rounded-[22px] px-4 py-3.5 flex items-center gap-3 mb-7">
        <div className="w-9.5 h-9.5 flex-shrink-0">
          <MiniRing size={38} stroke={4} trackColor="rgba(255,255,255,.25)" progColor="#8FC96B" ratio={ratio || 0.33} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold opacity-65 uppercase tracking-wide">Fokusgarten · läuft</div>
          <div className="font-display text-[17px] font-bold mt-0.5">{formatTime(state.remainingSeconds)} verbleibend</div>
        </div>
        <FruitIcon type={fruit} size={28} />
      </div>

      <div className="w-full text-[10.5px] font-bold opacity-55 uppercase tracking-wide mb-2.5 self-start">
        Homescreen-Widget
      </div>
      <div className="w-full flex gap-3 mt-auto">
        {(['iOS', 'Android'] as const).map((platform) => (
          <div key={platform} className="flex-1 bg-white rounded-[18px] px-2.5 py-3.5 text-ink text-center">
            <div className="text-[9px] font-extrabold uppercase tracking-wide text-ink-faint mb-2">{platform}</div>
            <div className="relative w-[52px] h-[52px] mx-auto mb-1.5">
              <MiniRing size={52} stroke={5} trackColor="#E7E2D6" progColor="#6FA96C" ratio={ratio || 0.33} />
              <div className="absolute inset-0 m-auto w-[22px] h-[22px]">
                <FruitIcon type={platform === 'iOS' ? 'tomato' : 'carrot'} size={22} />
              </div>
            </div>
            <div className="font-display font-bold text-[14px]">{formatTime(state.remainingSeconds)}</div>
            <div className="text-[9.5px] text-ink-soft font-bold mt-0.5">Fokuszeit</div>
          </div>
        ))}
      </div>
    </div>
  )
}
