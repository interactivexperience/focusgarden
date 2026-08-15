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
  const imgCacheRef = useRef<Record<string, HTMLImageElement>>({})
  const sizeRef = useRef({ w: 0, h: 0 })
  const gravityRef = useRef({ x: 0, y: 1 })
  const targetGravityRef = useRef({ x: 0, y: 1 })
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
      const cached = imgCacheRef.current[type]
      if (cached) return cached
      const img = new Image()
      img.src = src
      imgCacheRef.current[type] = img
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

    function onOrientation(e: DeviceOrientationEvent) {
      // gamma: Links-Rechts-Neigung (Roll) -> horizontale Schwerkraft.
      const gamma = e.gamma ?? 0
      const x = Math.max(-1, Math.min(1, gamma / 32))
      // beta: Vor-Zurück-Neigung (Pitch). 90° = aufrecht in der Hand (Referenz-
      // haltung), Formel gibt dort +1 (voll runter). Kippt man das Handy nach
      // hinten, sinkt beta Richtung 0 und die Y-Schwerkraft schwächt sich ab;
      // dreht man es weiter bis auf den Kopf (beta Richtung 270/-90), wird der
      // Wert negativ – die Sorten fallen dann Richtung Bildschirm-Oberkante,
      // nicht nur seitwärts wie zuvor.
      const beta = e.beta ?? 90
      const y = Math.cos(((beta - 90) * Math.PI) / 180)
      targetGravityRef.current = { x, y }
    }

    const DOE = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> })
      | undefined
    const needsPermission = !!DOE && typeof DOE.requestPermission === 'function'
    let permissionGranted = false

    function requestTiltPermission() {
      if (permissionGranted) return
      DOE!.requestPermission!()
        .then((state) => {
          if (state === 'granted') {
            permissionGranted = true
            window.addEventListener('deviceorientation', onOrientation)
            parent?.removeEventListener('click', requestTiltPermission)
            parent?.removeEventListener('touchend', requestTiltPermission)
          }
          // Bei 'denied' bleibt der Listener bewusst aktiv: iOS beantwortet
          // wiederholte requestPermission()-Aufrufe zwar weiterhin mit
          // 'denied' (kein erneuter Dialog ohne Änderung in den
          // Geräteeinstellungen), aber falls der allererste Aufruf aus
          // irgendeinem Grund nie sauber aufgelöst wurde, kann so ein
          // späterer Tap es erneut versuchen, statt endgültig aufzugeben.
        })
        .catch(() => {})
    }

    const parent = canvas.parentElement
    if (needsPermission) {
      // iOS verlangt zwingend eine Nutzergeste für requestPermission() – kann
      // nicht vorab ohne Tap erteilt werden. Kein {once:true}: bewusst bei
      // jedem Tap erneut versuchen, bis die Erlaubnis tatsächlich erteilt ist.
      parent?.addEventListener('click', requestTiltPermission)
      parent?.addEventListener('touchend', requestTiltPermission)
    } else if (window.DeviceOrientationEvent) {
      // Android/Desktop mit Sensoren brauchen keine Erlaubnis – sofort lauschen,
      // statt unnötig auf einen ersten Tap zu warten.
      window.addEventListener('deviceorientation', onOrientation)
    }

    function onPointerMove(e: PointerEvent) {
      // Maus-Fallback fürs Desktop-Testen: horizontale Position simuliert
      // Links-Rechts-Neigung, vertikale Position simuliert Vor-Zurück-Neigung
      // (oben im Canvas = nach hinten gekippt, unten = nach vorn/kopfüber).
      const rect = canvas!.getBoundingClientRect()
      const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
      targetGravityRef.current = {
        x: Math.max(-1, Math.min(1, relX)),
        y: Math.max(-1, Math.min(1, relY)),
      }
    }
    function onPointerLeave() {
      targetGravityRef.current = { x: 0, y: 1 }
    }
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)

    let rafId = 0
    let lastVibrateAt = 0
    function step() {
      const { w: W, h: H } = sizeRef.current
      const gravity = gravityRef.current
      const target = targetGravityRef.current
      gravity.x += (target.x - gravity.x) * 0.06
      gravity.y += (target.y - gravity.y) * 0.06

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
          ctx!.drawImage(img, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
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
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', sizeCanvas)
      window.removeEventListener('deviceorientation', onOrientation)
      parent?.removeEventListener('click', requestTiltPermission)
      parent?.removeEventListener('touchend', requestTiltPermission)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
