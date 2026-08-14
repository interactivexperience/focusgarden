import { useEffect } from 'react'

/**
 * Best-effort Versuch, die Bildschirmausrichtung auf Hochformat zu sperren,
 * damit sich die App beim Neigen des Geräts (Sanduhr-Effekt) nicht selbst
 * dreht. Funktioniert zuverlässig nur in der zum Homescreen hinzugefügten
 * Version (dort greift zusätzlich "orientation": "portrait" im Manifest);
 * in einem normalen Browser-Tab verlangen die meisten Browser dafür
 * Fullscreen, daher scheitert der Aufruf dort meist lautlos – die App bleibt
 * trotzdem benutzbar, nur eben ohne erzwungene Sperre.
 */
export function useLockPortrait() {
  useEffect(() => {
    const orientation = screen.orientation as
      | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
      | undefined
    if (!orientation?.lock) return
    orientation.lock('portrait').catch(() => {
      // Nicht unterstützt oder verlangt Fullscreen – kein Problem, die App
      // funktioniert auch im Querformat weiter.
    })
  }, [])
}
