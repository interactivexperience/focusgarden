import { useMemo } from 'react'
import { AppHeader } from '../components/AppHeader'
import { FruitIcon } from '../lib/assets'
import { LockIcon } from '../lib/decor-icons'
import { FRUIT_CATEGORY, FRUIT_KEYS, FRUIT_NAMES, type FruitType } from '../lib/fruits'
import { useFocusGarden } from '../state/store'

function VarietyGroup({
  title,
  types,
  discovered,
}: {
  title: string
  types: FruitType[]
  discovered: Set<FruitType>
}) {
  return (
    <div>
      <div className="font-display font-bold text-[13px] text-leaf-dark mt-3.5 mb-2 first:mt-0">
        {title} ({types.length})
      </div>
      <div className="grid grid-cols-3 gap-2.5 pb-1.5">
        {types.map((type) => {
          const locked = !discovered.has(type)
          return (
            <div
              key={type}
              className="relative bg-white rounded-2xl px-1 pt-2.5 pb-2 text-center shadow-[0_4px_14px_rgba(61,58,52,0.07)]"
            >
              {locked && (
                <div className="absolute top-1.5 right-2">
                  <LockIcon />
                </div>
              )}
              <div className={locked ? 'opacity-45' : ''}>
                <FruitIcon type={type} size={52} className="mx-auto" silhouette={locked} />
              </div>
              <div className={`text-[9.5px] font-bold mt-0.5 ${locked ? 'text-ink-faint' : 'text-ink'}`}>
                {locked ? '???' : FRUIT_NAMES[type]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function VarietiesScreen() {
  const { state } = useFocusGarden()
  const discovered = useMemo(() => new Set(state.discoveredTypes), [state.discoveredTypes])
  const obst = useMemo(() => FRUIT_KEYS.filter((k) => FRUIT_CATEGORY[k] === 'obst'), [])
  const gemuese = useMemo(() => FRUIT_KEYS.filter((k) => FRUIT_CATEGORY[k] === 'gemuese'), [])

  return (
    <div className="flex-1 flex flex-col px-5 pt-9 pb-4 overflow-hidden">
      <AppHeader />
      <div className="font-display text-[17px] font-bold mb-0.5">Alle Sorten</div>
      <div className="text-[11.5px] text-ink-soft font-semibold mb-3.5">
        {discovered.size} von {FRUIT_KEYS.length} entdeckt
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        <VarietyGroup title="Obst" types={obst} discovered={discovered} />
        <VarietyGroup title="Gemüse" types={gemuese} discovered={discovered} />
      </div>
    </div>
  )
}
