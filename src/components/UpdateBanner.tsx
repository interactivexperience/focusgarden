import { useEffect, useState } from 'react'

const CHECK_INTERVAL_MS = 2 * 60_000

/**
 * Zeigt ein Banner, sobald eine neuere Version deployt wurde, als die
 * gerade laufende. Ohne Service Worker gibt es sonst keinen Hinweis darauf,
 * ob man wirklich die aktuellste Version sieht – vor allem im Homescreen-
 * Modus, wo iOS die App oft nur pausiert statt neu zu laden, wenn man
 * zurückwechselt (ein einfaches "App wieder öffnen" holt dann nichts Neues).
 */
export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json?_=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { buildId?: string }
        if (data.buildId && data.buildId !== __BUILD_ID__) setUpdateAvailable(true)
      } catch {
        // Netzwerkfehler o.ä. – einfach beim nächsten Intervall erneut versuchen.
      }
    }

    check()
    const id = window.setInterval(check, CHECK_INTERVAL_MS)
    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!updateAvailable) return null

  function refresh() {
    // Cache-Buster statt reload(): siehe PullToRefresh.tsx – erzwingt einen
    // echten Netzwerk-Abruf statt eines möglichen Cache-Treffers.
    window.location.href = `${window.location.pathname}?_=${Date.now()}`
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))] px-4 pointer-events-none">
      <button
        type="button"
        onClick={refresh}
        className="pointer-events-auto flex items-center gap-2 bg-leaf text-white font-bold text-[12px] pl-3.5 pr-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(61,58,52,0.22)] active:scale-[0.97] transition-transform"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Update verfügbar · Antippen zum Aktualisieren
      </button>
    </div>
  )
}
