import { AppIcon } from '../lib/assets'
import { FlameIcon } from '../lib/decor-icons'

export function AppHeader({ streak }: { streak?: number }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 font-display font-bold text-[17px] text-leaf-dark">
        <span className="w-6 h-6 rounded-full bg-leaf flex items-center justify-center">
          <AppIcon name="leaf" size={14} />
        </span>
        Fokusgarten
      </div>
      {streak !== undefined && streak > 0 && (
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-[13px] font-bold text-[#C97A3B] shadow-[0_4px_14px_rgba(61,58,52,0.07)]">
          <FlameIcon size={14} />
          {streak} {streak === 1 ? 'Tag' : 'Tage'}
        </div>
      )}
    </div>
  )
}
