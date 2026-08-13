import { useRef, useState } from 'react'
import { SunflowerIcon } from '../lib/assets'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

const HOLD_MS = 900
const IDLE_HINT = 'Bildschirm antippen zum Pausieren · Lang halten zum Beenden'
const PAUSE_HINT = 'Pausiert – zum Fortsetzen tippen'

export function RunningScreen() {
  const { state, togglePause, resetAfterStop } = useFocusGarden()
  const [holding, setHolding] = useState(false)
  const [stopped, setStopped] = useState(false)
  const holdStartRef = useRef(0)
  const holdTimerRef = useRef<number | null>(null)

  function startHold() {
    if (stopped) return
    holdStartRef.current = Date.now()
    setHolding(true)
    holdTimerRef.current = window.setTimeout(() => {
      setHolding(false)
      setStopped(true)
      window.setTimeout(() => {
        setStopped(false)
        resetAfterStop()
      }, HOLD_MS)
    }, HOLD_MS)
  }

  function endHold() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    const elapsed = Date.now() - holdStartRef.current
    setHolding(false)
    if (elapsed < HOLD_MS && !stopped) {
      togglePause()
    }
  }

  const paused = state.sessionPaused
  const hint = stopped ? '' : holding ? 'Halten zum Beenden …' : paused ? PAUSE_HINT : IDLE_HINT
  const timeColor = holding ? 'text-stop' : paused ? 'text-ink-faint' : 'text-ink'
  const hintColor = holding ? 'text-stop' : paused ? 'text-leaf-dark' : 'text-ink-soft'

  return (
    <div
      className="relative flex-1 flex flex-col items-center justify-center gap-5 select-none touch-none"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
    >
      <div className={`font-display font-extrabold text-[64px] sm:text-[76px] leading-none transition-colors ${timeColor}`}>
        {formatTime(state.remainingSeconds)}
      </div>

      <div
        className="w-[150px] h-1.5 rounded-full bg-black/[0.08] overflow-hidden transition-opacity"
        style={{ opacity: holding ? 1 : 0 }}
      >
        <div
          className="h-full bg-stop rounded-full"
          style={holding ? { animation: `holdBarFill ${HOLD_MS}ms linear forwards` } : { width: 0 }}
        />
      </div>

      <div
        className="w-[92px] origin-bottom"
        style={{
          animation: 'sproutBounce 2.4s cubic-bezier(.34,1.2,.64,1) infinite',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        <SunflowerIcon mood={holding ? 'holding' : paused ? 'sleepy' : 'awake'} size={92} className="w-full block" />
      </div>

      <div className={`text-[12px] font-bold text-center max-w-[220px] leading-relaxed transition-colors ${hintColor}`}>
        {hint}
      </div>

      <div
        className="absolute inset-0 bg-[#FFF6F1] flex items-center justify-center font-display font-bold text-[17px] text-stop text-center px-8 pointer-events-none transition-opacity"
        style={{ opacity: stopped ? 1 : 0 }}
      >
        Fokus beendet
        <br />
        Zurück zum Start …
      </div>
    </div>
  )
}
