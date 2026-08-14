/** Erkennt, ob die App im eigenständigen Modus läuft (zum Homescreen hinzugefügt),
 *  nicht in einem normalen Browser-Tab. Dort fehlt das native Pull-to-refresh der
 *  Browser-Chrome komplett, weshalb die App das selbst nachbilden muss. */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true
}
