import type { Screen } from '../state/store'
import { AppIcon, type IconName } from '../lib/assets'

const NAV_ITEMS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'start', label: 'Start', icon: 'leaf' },
  { screen: 'today', label: 'Heute', icon: 'calendar' },
  { screen: 'varieties', label: 'Sorten', icon: 'trophy' },
  { screen: 'settings', label: 'Einstellungen', icon: 'settings' },
]

export function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav className="flex items-center justify-around bg-white border-t border-line px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {NAV_ITEMS.map((item) => {
        const isActive = item.screen === active
        return (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-colors"
            style={{ background: isActive ? 'var(--color-leaf-pale)' : 'transparent' }}
          >
            <AppIcon name={item.icon} size={20} className={isActive ? 'opacity-100' : 'opacity-45'} />
            <span
              className="text-[10px] font-bold"
              style={{ color: isActive ? 'var(--color-leaf-dark)' : 'var(--color-ink-faint)' }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
