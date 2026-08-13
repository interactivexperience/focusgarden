/** Kleine dekorative Vektor-Icons ohne EPS-Vorlage (nicht Teil der 24 UI-Icons). */

export function ChevronDown({ size = 13, color = '#B3AC9E' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FlameIcon({ size = 13, color = '#C97A3B' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M12 2c1 3-3 4-3 8a3 3 0 006 0c1 1 2 2.5 2 4.5A5.5 5.5 0 0111.5 20 6 6 0 016 14c0-4 3-5 3-9 1 1 2 2 3-3z"
        fill={color}
      />
    </svg>
  )
}

export function BasketIcon({ size = 13, color = '#4C8A52' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M4 10h16l-1.6 9.2a2 2 0 01-2 1.8H7.6a2 2 0 01-2-1.8L4 10z" fill={color} />
      <path d="M8 10L9 5M16 10l-1-5M12 10V5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon({ size = 12, color = '#8A8172' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <rect x={5} y={11} width={14} height={10} rx={2} fill={color} />
      <path d="M8 11V8a4 4 0 018 0v3" stroke={color} strokeWidth={2} fill="none" />
    </svg>
  )
}

export function MiniRing({
  size,
  stroke,
  trackColor,
  progColor,
  ratio,
}: {
  size: number
  stroke: number
  trackColor: string
  progColor: string
  ratio: number
}) {
  const r = size / 2 - stroke
  const c = 2 * Math.PI * r
  const off = c * (1 - ratio)
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={progColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
      />
    </svg>
  )
}
