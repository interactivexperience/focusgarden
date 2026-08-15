import { useMemo } from 'react'
import { AppHeader } from '../components/AppHeader'
import { AppIcon, FruitIcon } from '../lib/assets'
import { BasketIcon, FlameIcon } from '../lib/decor-icons'
import { useFocusGarden } from '../state/store'

const MAX_BOUQUET_ITEMS = 12

interface BouquetItem {
  key: number
  left: number
  top: number
  size: number
  rot: number
}

function bouquetLayout(count: number): BouquetItem[] {
  const shown = Math.min(count, MAX_BOUQUET_ITEMS)
  return Array.from({ length: shown }, (_, i) => {
    const angle = i * 137.508 * (Math.PI / 180)
    const radius = 15 * Math.sqrt(i)
    const left = Math.max(10, Math.min(90, 50 + radius * Math.cos(angle)))
    const top = Math.max(10, Math.min(90, 50 + radius * Math.sin(angle) * 0.85))
    const size = Math.max(26, 56 - i * 2)
    const rot = ((i * 47) % 60) - 30
    return { key: i, left, top, size, rot }
  })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function TodayScreen() {
  const { state } = useFocusGarden()
  const layout = useMemo(() => bouquetLayout(state.todaysHarvest.length), [state.todaysHarvest.length])
  const varietyCount = useMemo(() => new Set(state.todaysHarvest).size, [state.todaysHarvest])
  const focusHours = (state.todaysHarvest.length * (state.totalSeconds / 3600)).toFixed(1)

  return (
    <div className="flex-1 flex flex-col px-5 pt-9 pb-24 overflow-y-auto">
      <AppHeader streak={state.streak} />
      <div className="text-[11px] text-ink-faint font-semibold mb-4">Heute · {formatDate(new Date())}</div>

      <div className="relative overflow-hidden bg-gradient-to-br from-white to-[#F1FAEC] rounded-[28px] px-5 pt-2 pb-6 text-center shadow-[0_16px_36px_rgba(61,58,52,0.14)] mb-3.5">
        <div className="relative h-40">
          {state.todaysHarvest.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[12px] text-ink-soft font-semibold px-6">
              Noch keine Ernte heute – starte deine erste Fokuszeit.
            </div>
          ) : (
            layout.map((item, i) => (
              <div
                key={item.key}
                className="absolute drop-shadow-[0_5px_5px_rgba(0,0,0,0.14)]"
                style={{
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
                }}
              >
                <FruitIcon type={state.todaysHarvest[i]} size={item.size} />
              </div>
            ))
          )}
        </div>
        <div className="font-display font-extrabold text-[44px] leading-none -mt-1">
          {state.todaysHarvest.length}
          <span className="block text-[12px] font-bold text-ink-soft mt-1 font-body">Ernten heute</span>
        </div>
        {varietyCount > 0 && (
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-leaf-dark bg-leaf-pale px-3.5 py-1.5 rounded-full mt-2">
            <BasketIcon />
            {varietyCount} verschiedene {varietyCount === 1 ? 'Sorte' : 'Sorten'}
          </div>
        )}
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1 bg-white rounded-2xl px-2 py-3 text-center shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
          <AppIcon name="clock" size={16} className="mx-auto mb-1" />
          <div className="font-display text-[18px] font-bold text-leaf-dark">{focusHours}h</div>
          <div className="text-[9.5px] text-ink-faint font-bold uppercase tracking-wide mt-0.5">Fokuszeit</div>
        </div>
        <div className="flex-1 bg-white rounded-2xl px-2 py-3 text-center shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
          <div className="mx-auto mb-1 w-4 h-4 flex items-center justify-center">
            <FlameIcon size={16} />
          </div>
          <div className="font-display text-[18px] font-bold text-leaf-dark">{state.streak}</div>
          <div className="text-[9.5px] text-ink-faint font-bold uppercase tracking-wide mt-0.5">Streak</div>
        </div>
      </div>
    </div>
  )
}
