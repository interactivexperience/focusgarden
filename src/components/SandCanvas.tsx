import { useEffect, useRef } from 'react'
import type { FruitType } from '../lib/fruits'
import { fruitImageSrc } from '../lib/assets'

interface Particle {
  type: FruitType
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

/**
 * Bewusst außerhalb der Komponente (Modul-Ebene statt useRef): StartScreen –
 * und damit SandCanvas – wird bei jedem Verlassen von "start" (Fokus läuft,
 * Ernte) komplett unmountet und beim Zurückkehren neu gemountet. Mit einem
 * useRef würden dabei alle Partikel-Positionen verloren gehen, wodurch JEDE
 * bereits erarbeitete Sorte erneut von oben hereinfällt – nicht nur die neu
 * hinzugekommene. Als Modul-Variable überlebt der Zustand den Remount.
 */
let sharedParticles: Particle[] = []

/**
 * Auch der Bild-Cache lebt auf Modul-Ebene statt in einem useRef: sonst
 * verwirft jeder Remount (siehe oben) alle bereits geladenen Image-Objekte
 * und erzwingt einen kompletten Neuaufbau – jede Sorte zeigt dann kurz
 * wieder den Fallback-Kreis, bis sie erneut geladen hat. Bei vielen Sorten
 * oder langsamer Verbindung kann das sichtbar hängen bleiben (eine Sorte
 * bleibt dauerhaft als Kreis statt der echten Illustration).
 */
let sharedImageCache: Record<string, HTMLImageElement> = {}

/**
 * Auch Schwerkraft-Ziel/-Zustand und die iOS-Berechtigung leben auf Modul-Ebene:
 * StartScreen (und damit SandCanvas) unmountet bei JEDER Navigation weg von
 * "start" (Fokus läuft, Ernte, Pause …) und remountet beim Zurückkehren. Wären
 * das lokale useRefs, würde die Neigungs-Berechtigung bei jedem Remount
 * zurückgesetzt – in der Praxis ist der allererste Tap auf dem Start-Screen
 * fast immer "Fokus starten", der sofort wegnavigiert, bevor requestPermission()
 * überhaupt auflösen kann. Mit Modul-Ebene bleibt eine einmal erteilte
 * Berechtigung für die gesamte Seiten-Lebensdauer aktiv, unabhängig davon,
 * welcher Screen gerade sichtbar ist.
 */
let sharedGravity = { x: 0, y: 1 }
let sharedTargetGravity = { x: 0, y: 1 }
let orientationPermissionGranted = false
let orientationListenerAttached = false

function onDeviceOrientation(e: DeviceOrientationEvent) {
  // gamma: Links-Rechts-Neigung (Roll) -> horizontale Schwerkraft-Komponente.
  const gamma = e.gamma ?? 0
  const xRaw = Math.max(-1, Math.min(1, gamma / 32))
  // beta: Vor-Zurück-Neigung (Pitch). 90° = aufrecht in der Hand, Formel gibt
  // dort volle Y-Komponente. Kippt man das Handy nach hinten, sinkt beta
  // Richtung 0; dreht man es weiter bis auf den Kopf, wird der Wert negativ –
  // die Sorten fallen dann Richtung Bildschirm-Oberkante statt nur seitwärts.
  const beta = e.beta ?? 90
  const yRaw = Math.cos(((beta - 90) * Math.PI) / 180)
  // Nur die RICHTUNG kommt aus dem Winkel, nicht die STÄRKE: eine reine
  // Kombination aus xRaw/yRaw wäre bei jeder Nichtreferenzhaltung (z.B. Handy
  // beim natürlichen Halten nicht exakt bei beta=90°) spürbar schwächer als
  // "voll" – Sorten fielen dann sichtbar langsamer und wirkten wie
  // "hängengeblieben", statt einfach nur seltener/leichter zu tippen. Ein
  // echtes Sanduhr-Glas hat unabhängig vom genauen Haltewinkel eine
  // durchgehend spürbare Schwerkraft; nur bei nahezu flacher Haltung (Handy
  // liegt wie ein Tablett, kaum Neigung erkennbar) gibt es keine sinnvolle
  // Richtung – dann bleibt die letzte Richtung erhalten statt zu jittern.
  const magnitude = Math.hypot(xRaw, yRaw)
  if (magnitude < 0.05) return
  sharedTargetGravity = { x: xRaw / magnitude, y: yRaw / magnitude }
}

function attachOrientationListener() {
  if (orientationListenerAttached) return
  orientationListenerAttached = true
  window.addEventListener('deviceorientation', onDeviceOrientation)
}

/** Auf iOS MUSS DeviceOrientationEvent.requestPermission() aus einer echten,
 *  synchronen Nutzergeste (Klick/Touch) heraus aufgerufen werden. Ruft man es
 *  stattdessen z.B. in einem useEffect beim Mounten auf (keine Geste), lehnt
 *  iOS die Anfrage nicht nur kommentarlos ab, sondern merkt sich das für den
 *  gesamten Origin dauerhaft – alle späteren, selbst echt geste-getriggerten
 *  Versuche liefern danach nur noch 'denied', ohne je wieder einen Dialog zu
 *  zeigen (nicht mal nach einem harten Reload). Deshalb wird diese Funktion
 *  ausschließlich aus den page-weiten click/touchend-Listenern unten
 *  aufgerufen – niemals direkt aus einem Komponenten-Mount o.ä. Nicht
 *  {once:true}, damit auch ein erster erfolgloser Versuch spätere Taps nicht
 *  dauerhaft blockiert. Page-weit statt nur auf dem Canvas-Elternelement,
 *  damit JEDER Tap irgendwo in der App – auch "Fokus starten" selbst – die
 *  Berechtigung auslösen kann. */
function ensureTiltPermission() {
  if (orientationPermissionGranted) return
  const DOE = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> })
    | undefined
  if (!DOE) return
  if (typeof DOE.requestPermission !== 'function') {
    // Android/Desktop mit Sensoren brauchen keine Erlaubnis.
    orientationPermissionGranted = true
    attachOrientationListener()
    return
  }
  DOE.requestPermission()
    .then((state) => {
      if (state === 'granted') {
        orientationPermissionGranted = true
        attachOrientationListener()
      }
      // Bei 'denied' bewusst nichts weiter tun: der Listener bleibt aktiv und
      // versucht es beim nächsten Tap erneut (falls der erste Versuch aus
      // irgendeinem Grund nie sauber erteilt wurde).
    })
    .catch(() => {})
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', ensureTiltPermission)
  document.addEventListener('touchend', ensureTiltPermission)

  // Android/Desktop mit Sensoren brauchen keine Geste-Berechtigung – dort
  // sofort aktivieren statt auf den ersten Tap zu warten. Der Check hier
  // stellt sicher, dass NIE requestPermission() selbst außerhalb einer Geste
  // aufgerufen wird (nur der reine "gibt es die Methode?"-Test).
  const doe = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> })
    | undefined
  if (doe && typeof doe.requestPermission !== 'function') {
    ensureTiltPermission()
  }
}

const FRUIT_COLOR: Partial<Record<FruitType, string>> = {
  tomato: '#FF6B5C',
  strawberry: '#FF7F93',
  apple: '#FF4D5E',
  orange: '#FFA245',
  lemon: '#FFE066',
  watermelon: '#8FD16B',
  grape: '#9B7EDE',
  cherry: '#E8435A',
  peach: '#FFB199',
  blueberry: '#7B93E0',
  carrot: '#FFA552',
  eggplant: '#9B7EDE',
  corn: '#FFD75E',
  broccoli: '#5F9A5A',
  pumpkin: '#F5943A',
  pea: '#8FC96B',
  radish: '#FF6B84',
  onion: '#D888C7',
  potato: '#C99A6B',
  banana: '#FFE066',
  lime: '#A8D96B',
  pineapple: '#FFC94A',
  melon: '#F5D65C',
  kiwi: '#8FB93E',
  mango: '#FFB13B',
  pear: '#C7D96B',
  plum: '#8C6BB0',
  pomegranate: '#C43B4E',
  cabbage: '#A8D98A',
  cucumber: '#6FA96C',
  bellpepper: '#FF6B4A',
  kale: '#4C8A52',
  garlic: '#F1EAD9',
  sweetpotato: '#D97B4A',
  chili: '#E8433A',
  cauliflower: '#F1EAD9',
  leek: '#8FC96B',
  turnip: '#E8D9E8',
}

const HAPTIC_MIN_SPEED = 0.6
const HAPTIC_THROTTLE_MS = 150

/**
 * Sanduhr-Effekt: ein Partikel pro tatsächlich erarbeiteter Sorte des Tages.
 * Reagiert auf Geräteneigung (mit Maus-Fallback), Canvas-Backing-Buffer wird
 * mit devicePixelRatio skaliert, sonst wirkt es auf Retina-Displays pixelig.
 */
export function SandCanvas({ fruitTypes, hapticsEnabled }: { fruitTypes: FruitType[]; hapticsEnabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const hapticsRef = useRef(hapticsEnabled)
  hapticsRef.current = hapticsEnabled

  useEffect(() => {
    // Tageswechsel (todaysHarvest wurde zurückgesetzt) oder erster echter
    // Seitenaufruf mit weniger Einträgen als zuvor gespeichert: komplett neu
    // aufbauen, statt überzählige alte Partikel stehen zu lassen.
    if (fruitTypes.length < sharedParticles.length) {
      sharedParticles = []
    }
    while (sharedParticles.length < fruitTypes.length) {
      const type = fruitTypes[sharedParticles.length]
      sharedParticles.push({
        type,
        x: sizeRef.current.w / 2 + (Math.random() * 40 - 20),
        y: -20 - Math.random() * 30,
        vx: Math.random() * 2 - 1,
        vy: 0,
        r: 15 + Math.random() * 3,
      })
    }
  }, [fruitTypes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function getFruitImage(type: FruitType): HTMLImageElement | null {
      const src = fruitImageSrc(type)
      if (!src) return null
      const cached = sharedImageCache[type]
      if (cached) return cached
      const img = new Image()
      img.src = src
      sharedImageCache[type] = img
      return img
    }

    function sizeCanvas() {
      const parent = canvas!.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas!.width = Math.round(rect.width * dpr)
      canvas!.height = Math.round(rect.height * dpr)
      canvas!.style.width = `${rect.width}px`
      canvas!.style.height = `${rect.height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)

    function onPointerMove(e: PointerEvent) {
      // Maus-Fallback fürs Desktop-Testen: horizontale Position simuliert
      // Links-Rechts-Neigung, vertikale Position simuliert Vor-Zurück-Neigung
      // (oben im Canvas = nach hinten gekippt, unten = nach vorn/kopfüber).
      const rect = canvas!.getBoundingClientRect()
      const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
      sharedTargetGravity = {
        x: Math.max(-1, Math.min(1, relX)),
        y: Math.max(-1, Math.min(1, relY)),
      }
    }
    function onPointerLeave() {
      sharedTargetGravity = { x: 0, y: 1 }
    }
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)

    let rafId = 0
    let lastVibrateAt = 0
    function step() {
      const { w: W, h: H } = sizeRef.current
      sharedGravity.x += (sharedTargetGravity.x - sharedGravity.x) * 0.06
      sharedGravity.y += (sharedTargetGravity.y - sharedGravity.y) * 0.06
      const gravity = sharedGravity

      const particles = sharedParticles
      let anyHardHit = false
      particles.forEach((p) => {
        p.vx += gravity.x * 0.3
        p.vy += gravity.y * 0.3
        p.vx *= 0.93
        p.vy *= 0.93
        p.x += p.vx
        p.y += p.vy
        // Aufprall-Stärke VOR dem Clamping messen, sonst wäre sie nach dem
        // Bounce künstlich klein und ein ruhig liegendes Partikel (das jeden
        // Frame am Rand "anliegt") würde dauerhaft mitzählen.
        const speed = Math.hypot(p.vx, p.vy)
        let hit = false
        if (p.x - p.r < 0) {
          p.x = p.r
          p.vx *= -0.3
          hit = true
        }
        if (p.x + p.r > W) {
          p.x = W - p.r
          p.vx *= -0.3
          hit = true
        }
        if (p.y - p.r < 0) {
          p.y = p.r
          p.vy *= -0.3
          hit = true
        }
        if (p.y + p.r > H) {
          p.y = H - p.r
          p.vy *= -0.3
          hit = true
        }
        if (hit && speed > HAPTIC_MIN_SPEED) anyHardHit = true
      })
      if (anyHardHit && hapticsRef.current && 'vibrate' in navigator) {
        const now = performance.now()
        if (now - lastVibrateAt > HAPTIC_THROTTLE_MS) {
          navigator.vibrate(12)
          lastVibrateAt = now
        }
      }

      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i]
            const b = particles[j]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
            const minDist = a.r + b.r
            if (dist < minDist) {
              const overlap = (minDist - dist) / 2
              const nx = dx / dist
              const ny = dy / dist
              a.x -= nx * overlap
              a.y -= ny * overlap
              b.x += nx * overlap
              b.y += ny * overlap
            }
          }
        }
      }

      ctx!.clearRect(0, 0, W, H)
      particles.forEach((p) => {
        const img = getFruitImage(p.type)
        if (img && img.complete && img.naturalWidth) {
          // Seitenverhältnis erhalten (die PNGs sind nicht quadratisch) –
          // sonst werden Sorten wie Kiwi/Ananas sichtbar in die Breite oder
          // Höhe gestaucht, weil drawImage sie sonst stur in ein p.r*2
          // großes Quadrat zwingt.
          const diameter = p.r * 2
          const scale = Math.min(diameter / img.naturalWidth, diameter / img.naturalHeight)
          const dw = img.naturalWidth * scale
          const dh = img.naturalHeight * scale
          ctx!.drawImage(img, p.x - dw / 2, p.y - dh / 2, dw, dh)
        } else {
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx!.fillStyle = FRUIT_COLOR[p.type] || '#8FC96B'
          ctx!.fill()
        }
      })
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)

    return () => {
      // Der deviceorientation-Listener selbst bleibt bewusst über den gesamten
      // Seiten-Lebenszyklus bestehen (siehe attachOrientationListener) und wird
      // hier nicht entfernt – nur die an dieses Canvas-Mount gebundenen Dinge.
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', sizeCanvas)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
