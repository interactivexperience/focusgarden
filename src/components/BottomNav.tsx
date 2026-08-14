import type { Screen } from '../state/store'
import { AppIcon, type IconName } from '../lib/assets'

const NAV_ITEMS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'start', label: 'Start', icon: 'leaf' },
  { screen: 'today', label: 'Heute', icon: 'calendar' },
  { screen: 'varieties', label: 'Sorten', icon: 'trophy' },
  { screen: 'settings', label: 'Sound', icon: 'settings' },
]

export function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-[26px] bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-white/60 shadow-[0_10px_30px_rgba(61,58,52,0.18),0_1px_1px_rgba(61,58,52,0.06)]">
        {NAV_ITEMS.map((item) => {
          const isActive = item.screen === active
          return (
            <button
              key={item.screen}
              type="button"
              onClick={() => onNavigate(item.screen)}
              className="flex flex-col items-center gap-0.5 w-16 py-1.5 rounded-full transition-all duration-200 ease-out active:scale-90"
              style={{ background: isActive ? 'var(--color-leaf-pale)' : 'transparent' }}
            >
              <AppIcon name={item.icon} size={19} className={isActive ? 'opacity-100' : 'opacity-45'} />
              <span
                className="text-[9.5px] font-bold transition-colors duration-200"
                style={{ color: isActive ? 'var(--color-leaf-dark)' : 'var(--color-ink-faint)' }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
