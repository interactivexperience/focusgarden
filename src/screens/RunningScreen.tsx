import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { SunflowerIcon, type SunflowerMood } from '../lib/assets'
import { formatTime } from '../lib/presets'
import { useFocusGarden } from '../state/store'

const HOLD_MS = 900
/** Bewegung in px, ab der ein Zeigerkontakt als Wisch-/Drag-Geste zählt statt
 *  als ruhiger Tap – z.B. das iOS-System-Wischgesture zum App-Wechsel läuft
 *  über den ganzen Screen und kann sonst fälschlich als kurzer Tap (=Pause)
 *  gewertet werden. */
const MOVE_CANCEL_THRESHOLD = 24
const IDLE_HINT = 'Bildschirm antippen zum Pausieren · Lang halten zum Beenden'
const PAUSE_HINT = 'Pausiert – zum Fortsetzen tippen'
/** Je öfter innerhalb einer Sitzung gehalten wird, desto genervter schaut die Sonnenblume. */
const HOLD_MOOD_CYCLE = ['shock', 'sad', 'wink'] as const
/** Während des ruhigen Fokus-Zustands wechselt die Mimik nur gelegentlich, nie hüpfend. */
const IDLE_MOODS: SunflowerMood[] = ['happy', 'heart', 'wink', 'laugh', 'neutral']

export function RunningScreen() {
  const { state, togglePause, resetAfterStop } = useFocusGarden()
  const [holding, setHolding] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [holdAttempts, setHoldAttempts] = useState(0)
  const [idleMood, setIdleMood] = useState<SunflowerMood>('happy')
  const holdStartRef = useRef(0)
  const holdStartPosRef = useRef({ x: 0, y: 0 })
  const holdTimerRef = useRef<number | null>(null)
  // Synchronous guard: pointerup AND pointerleave can both fire for one tap
  // (e.g. hit-test jitter on touch), so React state (which batches/re-renders
  // asynchronously) can't reliably prevent endHold() from running twice.
  const holdActiveRef = useRef(false)

  function startHold(e: PointerEvent) {
    if (stopped || holdActiveRef.current) return
    holdActiveRef.current = true
    holdStartRef.current = Date.now()
    holdStartPosRef.current = { x: e.clientX, y: e.clientY }
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

  function endHold(e: PointerEvent) {
    if (!holdActiveRef.current) return
    holdActiveRef.current = false
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    const elapsed = Date.now() - holdStartRef.current
    const moved = Math.hypot(e.clientX - holdStartPosRef.current.x, e.clientY - holdStartPosRef.current.y)
    setHolding(false)
    // Nur als abgeschlossenen Tap werten, wenn sich der Kontaktpunkt kaum
    // bewegt hat – sonst würde z.B. das iOS-Wischgesture zum App-Wechsel
    // (läuft über den ganzen Screen, endet oft mit pointerleave) fälschlich
    // als kurzer Tap gewertet und pausiert die Sitzung ungewollt.
    if (elapsed < HOLD_MS && moved < MOVE_CANCEL_THRESHOLD && !stopped) {
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

  // Gelegentlicher, unregelmäßiger Mimik-Wechsel während der Fokus ruhig
  // läuft – kein Countdown, damit es sich nicht mechanisch anfühlt.
  useEffect(() => {
    if (paused || holding || stopped) return
    const delay = 20_000 + Math.random() * 25_000
    const id = window.setTimeout(() => {
      const options = IDLE_MOODS.filter((m) => m !== idleMood)
      setIdleMood(options[Math.floor(Math.random() * options.length)])
    }, delay)
    return () => window.clearTimeout(id)
  }, [paused, holding, stopped, idleMood])
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
      <div
        className={`font-display font-extrabold text-[64px] sm:text-[76px] leading-none tabular-nums transition-colors ${timeColor}`}
      >
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

      <div className="w-[92px]">
        <SunflowerIcon
          mood={holding ? HOLD_MOOD_CYCLE[(holdAttempts - 1) % HOLD_MOOD_CYCLE.length] : paused ? 'tired' : idleMood}
          size={92}
          className="w-full block transition-opacity duration-500"
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
