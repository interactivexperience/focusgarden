import type { FruitType } from './fruits'

const fruitModules = import.meta.glob('../assets/fruits/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const iconModules = import.meta.glob('../assets/icons/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const sunflowerModules = import.meta.glob('../assets/sunflowers/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function keyByFilename(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const path in modules) {
    const name = path.split('/').pop()!.replace(/\.png$/, '')
    out[name] = modules[path]
  }
  return out
}

export const FRUIT_IMAGES = keyByFilename(fruitModules)
export const ICON_IMAGES = keyByFilename(iconModules)
export const SUNFLOWER_IMAGES = keyByFilename(sunflowerModules)

export type IconName = keyof typeof ICON_IMAGES

/** Avocado hat keine Vektor-Vorlage – handgezeichneter Fallback im selben Sticker-Stil. */
function AvocadoIcon({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 18 Q58 8 64 4"
        stroke="#8B5A3C"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M60 18 C50 18 46 32 48 44 C30 50 22 68 24 84 C26 102 42 112 60 112 C78 112 94 102 96 84 C98 68 90 50 72 44 C74 32 70 18 60 18 Z"
        fill="#7FAE5E"
        stroke="#2B2118"
        strokeWidth={6}
        style={{ paintOrder: 'stroke' }}
      />
      <circle
        cx={60}
        cy={80}
        r={26}
        fill="#EAD9A8"
        stroke="#2B2118"
        strokeWidth={4}
        style={{ paintOrder: 'stroke' }}
      />
      <circle
        cx={60}
        cy={80}
        r={15}
        fill="#8B5A3C"
        stroke="#2B2118"
        strokeWidth={4}
        style={{ paintOrder: 'stroke' }}
      />
      <circle cx={46} cy={40} r={5.8} fill="#2B2118" />
      <circle cx={44} cy={37.5} r={1.4} fill="#fff" />
      <circle cx={74} cy={40} r={5.8} fill="#2B2118" />
      <circle cx={72} cy={37.5} r={1.4} fill="#fff" />
      <path
        d="M53 49 Q60 54 67 49"
        stroke="#2B2118"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FruitIcon({
  type,
  size = 64,
  className,
}: {
  type: FruitType
  size?: number
  className?: string
}) {
  const src = FRUIT_IMAGES[type]
  if (!src) return <AvocadoIcon size={size} className={className} />
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={className}
      style={{ display: 'block', objectFit: 'contain', width: size, height: size }}
    />
  )
}

export function fruitImageSrc(type: FruitType): string | null {
  return FRUIT_IMAGES[type] ?? null
}

export function AppIcon({
  name,
  size = 20,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const src = ICON_IMAGES[name]
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={className}
      style={{ display: 'block', objectFit: 'contain', width: size, height: size }}
    />
  )
}

export type SunflowerMood = 'awake' | 'sleepy'

export function SunflowerIcon({
  mood,
  size = 132,
  className,
}: {
  mood: SunflowerMood
  size?: number
  className?: string
}) {
  const key = mood === 'sleepy' ? 'tired' : 'happy'
  const src = SUNFLOWER_IMAGES[key]
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={className}
      style={{ display: 'block', width: size, height: size }}
    />
  )
}
