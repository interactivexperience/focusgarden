import { useEffect, useMemo, useState } from 'react'
import { AppIcon, FruitIcon } from '../lib/assets'
import { FRUIT_KEYS, FRUIT_NAMES, randomFruitType } from '../lib/fruits'
import { playChime } from '../lib/sound'
import { useFocusGarden } from '../state/store'

interface FallItem {
  key: string
  type: ReturnType<typeof randomFruitType>
  size: number
  left: number
  duration: number
  delay: number
  swayPx: number
  rot: number
  restGap: number
}

function buildFallItems(): FallItem[] {
  const count = 11
  return Array.from({ length: count }, (_, i) => ({
    key: `${Date.now()}-${i}`,
    type: FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)],
    size: Math.round(28 + Math.random() * 20),
    left: 4 + Math.random() * 88,
    duration: 2.2 + Math.random() * 1.4,
    delay: Math.random() * 0.9,
    swayPx: Math.round((Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 36)),
    rot: Math.round((Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 220)),
    restGap: Math.round(4 + Math.random() * 14),
  }))
}

export function HarvestScreen() {
  const { state, replayHarvest, ackHarvest } = useFocusGarden()
  const [items, setItems] = useState<FallItem[]>([])

  useEffect(() => {
    const id = window.setTimeout(() => setItems(buildFallItems()), 60)
    return () => window.clearTimeout(id)
  }, [state.harvestReplayTick])

  useEffect(() => {
    if (!state.soundState.focusEnd) return
    const id = window.setTimeout(playChime, 150)
    return () => window.clearTimeout(id)
  }, [state.harvestReplayTick, state.soundState.focusEnd])

  const keyframes = useMemo(
    () =>
      items
        .map(
          (it) => `@keyframes fall-${it.key} {
        0% { top: -16%; transform: translateX(0) rotate(0deg); opacity: 0; }
        8% { opacity: 1; }
        45% { top: 42%; transform: translateX(${Math.round(it.swayPx * 0.5)}px) rotate(${Math.round(it.rot * 0.4)}deg); }
        100% { top: calc(100% - ${it.size}px - ${it.restGap}px); transform: translateX(${it.swayPx}px) rotate(${it.rot}deg); opacity: 1; }
      }`,
        )
        .join('\n'),
    [items],
  )

  const minutesFocused = Math.round(state.totalSeconds / 60)

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#F3FAEF] to-bg-app">
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <div className="absolute inset-0 pointer-events-none z-0">
        {items.map((it) => (
          <div
            key={it.key}
            className="absolute opacity-0"
            style={{
              left: `${it.left}%`,
              width: it.size,
              height: it.size,
              filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.15))',
              animation: `fall-${it.key} ${it.duration}s ${it.delay}s cubic-bezier(.4,.1,.6,1) forwards`,
            }}
          >
            <FruitIcon type={it.type} size={it.size} />
          </div>
        ))}
      </div>

      {state.lastHarvestType && (
        <div className="relative z-10 self-center bg-white rounded-full px-4.5 py-2 flex items-center gap-2 shadow-[0_16px_36px_rgba(61,58,52,0.14)] text-[12.5px] font-bold mt-1">
          <FruitIcon type={state.lastHarvestType} size={22} />
          <span>
            {FRUIT_NAMES[state.lastHarvestType]} geerntet · {minutesFocused} Min Fokus!
          </span>
        </div>
      )}

      <div className="absolute top-8 right-5 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
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
          className="text-[11.5px] font-bold text-leaf-dark underline underline-offset-4"
        >
          Animation erneut abspielen
        </button>
      </div>
    </div>
  )
}
