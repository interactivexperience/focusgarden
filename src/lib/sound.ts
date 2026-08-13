let sharedCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedCtx) sharedCtx = new Ctor()
    return sharedCtx
  } catch {
    return null
  }
}

/** Zwei-Ton Web-Audio-Chime – kein Audio-Asset nötig. */
export function playChime() {
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  ;[660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + i * 0.15)
    gain.gain.linearRampToValueAtTime(0.22, now + i * 0.15 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.15)
    osc.stop(now + i * 0.15 + 0.55)
  })
}

export function vibrate(pattern: number | number[] = 30) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}
