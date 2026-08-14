import { useEffect, useRef, useState, type ReactNode } from 'react'
import { isStandalone } from '../lib/standalone'

const THRESHOLD = 70
const MAX_PULL = 110

function nearestScrollTop(el: Element | null): number {
  let node = el
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node.scrollTop
    }
    node = node.parentElement
  }
  return 0
}

/**
 * Bildet Pull-to-refresh manuell nach für den zum Homescreen hinzugefügten
 * Modus (standalone) – dort fehlt die Browser-Chrome, die dieses Gesture in
 * einem normalen Tab sonst automatisch bereitstellt.
 */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const trackingRef = useRef(false)
  const startYRef = useRef(0)
  const enabledRef = useRef(isStandalone())

  useEffect(() => {
    if (!enabledRef.current) return

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      if (nearestScrollTop(e.target as Element) > 0) return
      trackingRef.current = true
      startYRef.current = touch.clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (!trackingRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) {
        setPull(0)
        return
      }
      // Widerstand, damit es sich nicht 1:1 wie freies Ziehen anfühlt.
      const damped = Math.min(MAX_PULL, delta * 0.45)
      setPull(damped)
      e.preventDefault()
    }

    function onTouchEnd() {
      if (!trackingRef.current) return
      trackingRef.current = false
      setPull((current) => {
        if (current >= THRESHOLD) {
          setRefreshing(true)
          window.location.reload()
        } else {
          return 0
        }
        return current
      })
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onTouchEnd)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  if (!enabledRef.current) return <>{children}</>

  const progress = Math.min(1, pull / THRESHOLD)

  return (
    <>
      <div
        className="absolute inset-x-0 top-0 z-30 flex justify-center pointer-events-none transition-transform"
        style={{ transform: `translateY(${Math.max(0, pull - 40)}px)`, opacity: pull > 4 ? 1 : 0 }}
      >
        <div className="mt-3 w-8 h-8 rounded-full bg-white/85 backdrop-blur-xl shadow-[0_4px_14px_rgba(61,58,52,0.14)] flex items-center justify-center">
          <div
            className="w-4 h-4 rounded-full border-2 border-leaf-pale"
            style={{
              borderTopColor: 'var(--color-leaf)',
              transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
              animation: refreshing ? 'spin 0.7s linear infinite' : undefined,
            }}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0" style={{ transform: pull ? `translateY(${pull}px)` : undefined }}>
        {children}
      </div>
    </>
  )
}
