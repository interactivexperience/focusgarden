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

/** Mais-Vorlage war beim Export aus der EPS oben abgeschnitten – handgezeichneter Fallback im selben Sticker-Stil. */
function CornIcon({ size = 64, className }: { size?: number; className?: string }) {
  const outline = { stroke: '#2B2118', strokeWidth: 6, style: { paintOrder: 'stroke' as const } }
  const outlineSm = { stroke: '#2B2118', strokeWidth: 4, style: { paintOrder: 'stroke' as const } }
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <rect x={34} y={10} width={52} height={100} rx={24} fill="#FFD75E" {...outline} />
      <g fill="#EFC24A">
        <circle cx={46} cy={28} r={4.3} />
        <circle cx={60} cy={24} r={4.3} />
        <circle cx={74} cy={28} r={4.3} />
        <circle cx={40} cy={42} r={4.3} />
        <circle cx={53} cy={40} r={4.3} />
        <circle cx={67} cy={40} r={4.3} />
        <circle cx={80} cy={42} r={4.3} />
        <circle cx={46} cy={56} r={4.3} />
        <circle cx={60} cy={54} r={4.3} />
        <circle cx={74} cy={56} r={4.3} />
        <circle cx={40} cy={70} r={4.3} />
        <circle cx={53} cy={68} r={4.3} />
        <circle cx={67} cy={68} r={4.3} />
        <circle cx={80} cy={70} r={4.3} />
      </g>
      <path d="M30 78 Q14 88 22 102 Q12 106 16 116 L34 110 Q26 100 32 90 Z" fill="#6FA96C" {...outlineSm} />
      <path d="M90 78 Q106 88 98 102 Q108 106 104 116 L86 110 Q94 100 88 90 Z" fill="#4C8A52" {...outlineSm} />
      <circle cx={46} cy={80} r={5.8} fill="#2B2118" />
      <circle cx={44} cy={77.5} r={1.4} fill="#fff" />
      <circle cx={74} cy={80} r={5.8} fill="#2B2118" />
      <circle cx={72} cy={77.5} r={1.4} fill="#fff" />
      <path d="M53 89 Q60 94 67 89" stroke="#2B2118" strokeWidth={2.6} fill="none" strokeLinecap="round" />
    </svg>
  )
}

const HAND_DRAWN_FALLBACKS: Partial<Record<FruitType, typeof CornIcon>> = {
  corn: CornIcon,
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
  if (!src) {
    const Fallback = HAND_DRAWN_FALLBACKS[type]
    return Fallback ? <Fallback size={size} className={className} /> : null
  }
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

export type SunflowerMood = keyof typeof SUNFLOWER_IMAGES

export function SunflowerIcon({
  mood,
  size = 132,
  className,
}: {
  mood: SunflowerMood
  size?: number
  className?: string
}) {
  const src = SUNFLOWER_IMAGES[mood]
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
