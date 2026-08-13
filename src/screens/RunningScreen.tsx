import { useRef, useState } from 'react'
import { SunflowerIcon } from '../lib/assets'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

const HOLD_MS = 900
const IDLE_HINT = 'Bildschirm antippen zum Pausieren · Lang halten zum Beenden'
const PAUSE_HINT = 'Pausiert – zum Fortsetzen tippen'
/** Je öfter innerhalb einer Sitzung gehalten wird, desto genervter schaut die Sonnenblume. */
const HOLD_MOOD_CYCLE = ['shock', 'sad', 'wink'] as const

export function RunningScreen() {
  const { state, togglePause, resetAfterStop } = useFocusGarden()
  const [holding, setHolding] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [holdAttempts, setHoldAttempts] = useState(0)
  const holdStartRef = useRef(0)
  const holdTimerRef = useRef<number | null>(null)
  // Synchronous guard: pointerup AND pointerleave can both fire for one tap
  // (e.g. hit-test jitter on touch), so React state (which batches/re-renders
  // asynchronously) can't reliably prevent endHold() from running twice.
  const holdActiveRef = useRef(false)

  function startHold() {
    if (stopped || holdActiveRef.current) return
    holdActiveRef.current = true
    holdStartRef.current = Date.now()
    setHolding(true)
    setHoldAttempts((n) => n + 1)
    holdTimerRef.current = window.setTimeout(() => {
      holdActiveRef.current = false
      setHolding(false)
      setStopped(true)
      window.setTimeout(() => {
        setStopped(false)
        resetAfterStop()
      }, HOLD_MS)
    }, HOLD_MS)
  }

  function endHold() {
    if (!holdActiveRef.current) return
    holdActiveRef.current = false
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

  function cancelHold() {
    if (!holdActiveRef.current) return
    holdActiveRef.current = false
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setHolding(false)
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
      onPointerCancel={cancelHold}
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
        <SunflowerIcon
          mood={holding ? HOLD_MOOD_CYCLE[(holdAttempts - 1) % HOLD_MOOD_CYCLE.length] : paused ? 'tired' : 'happy'}
          size={92}
          className="w-full block"
        />
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
