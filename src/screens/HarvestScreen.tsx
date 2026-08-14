import { useEffect, useMemo, useState } from 'react'
import { AppIcon, FruitIcon } from '../lib/assets'
import type { FruitType } from '../lib/fruits'
import { FRUIT_NAMES } from '../lib/fruits'
import { playChime } from '../lib/sound'
import { useFocusGarden } from '../state/store'

interface FallItem {
  key: string
  type: FruitType
  size: number
  left: number
  duration: number
  swayPx: number
  rot: number
  landTop: number
}

/** Genau die eine tatsächlich geerntete Sorte fällt – kein Sortiment aus Zufalls-Deko. */
function buildFallItem(type: FruitType): FallItem {
  return {
    key: `${Date.now()}`,
    type,
    size: 92,
    left: 50 + (Math.random() * 10 - 5),
    duration: 1.9,
    swayPx: Math.round((Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 18)),
    rot: Math.round((Math.random() > 0.5 ? 1 : -1) * (140 + Math.random() * 100)),
    // Landet in der leeren Bildschirmmitte (Prozentwert, kein px-Offset vom
    // unteren Rand) – dort überlappt es nicht mit "Weiter" / "Animation
    // erneut abspielen" und bleibt über alle Bildschirmgrößen hinweg stabil.
    landTop: 56 + Math.random() * 4,
  }
}

export function HarvestScreen() {
  const { state, replayHarvest, ackHarvest } = useFocusGarden()
  const [item, setItem] = useState<FallItem | null>(null)

  useEffect(() => {
    if (!state.lastHarvestType) return
    const type = state.lastHarvestType
    const id = window.setTimeout(() => setItem(buildFallItem(type)), 60)
    return () => window.clearTimeout(id)
  }, [state.harvestReplayTick, state.lastHarvestType])

  useEffect(() => {
    if (!state.soundState.focusEnd) return
    const id = window.setTimeout(playChime, 150)
    return () => window.clearTimeout(id)
  }, [state.harvestReplayTick, state.soundState.focusEnd])

  const keyframes = useMemo(() => {
    if (!item) return ''
    return `@keyframes fall-${item.key} {
      0% { top: -16%; transform: translateX(0) rotate(0deg) scale(0.8); opacity: 0; }
      8% { opacity: 1; }
      55% { top: 38%; transform: translateX(${Math.round(item.swayPx * 0.5)}px) rotate(${Math.round(item.rot * 0.4)}deg) scale(1.05); }
      100% { top: ${item.landTop}%; transform: translateX(${item.swayPx}px) rotate(${item.rot}deg) scale(1); opacity: 1; }
    }`
  }, [item])

  const minutesFocused = Math.round(state.totalSeconds / 60)

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#F3FAEF] to-bg-app">
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <div className="absolute inset-0 pointer-events-none z-0">
        {item && (
          <div
            key={item.key}
            className="absolute opacity-0"
            style={{
              left: `${item.left}%`,
              width: item.size,
              height: item.size,
              filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.18))',
              animation: `fall-${item.key} ${item.duration}s cubic-bezier(.4,.1,.6,1) forwards`,
            }}
          >
            <FruitIcon type={item.type} size={item.size} />
          </div>
        )}
      </div>

      {state.lastHarvestType && (
        <div className="relative z-10 self-center bg-white/75 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-full px-4.5 py-2 flex items-center gap-2 shadow-[0_16px_36px_rgba(61,58,52,0.14)] text-[12.5px] font-bold mt-1">
          <FruitIcon type={state.lastHarvestType} size={22} />
          <span>
            {FRUIT_NAMES[state.lastHarvestType]} geerntet · {minutesFocused} Min Fokus!
          </span>
        </div>
      )}

      <div className="absolute top-8 right-5 z-10 w-8 h-8 rounded-full bg-white/75 backdrop-blur-xl backdrop-saturate-150 border border-white/60 flex items-center justify-center shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
        <AppIcon name={state.soundState.focusEnd ? 'sound-on' : 'sound-off'} size={16} />
      </div>

      <div className="relative z-10 mt-auto mb-4 flex flex-col items-center gap-2.5 px-6">
        <button
          type="button"
          onClick={ackHarvest}
          className="bg-leaf text-white font-bold text-[14.5px] px-9 py-4 rounded-full shadow-[0_8px_18px_rgba(111,169,108,0.28)] active:scale-[0.94] transition-transform"
        >
          Weiter
        </button>
        <button
          type="button"
          onClick={replayHarvest}
          className="text-[11.5px] font-bold text-leaf-dark underline underline-offset-4 active:opacity-50 transition-opacity"
        >
          Animation erneut abspielen
        </button>
      </div>
    </div>
  )
}
