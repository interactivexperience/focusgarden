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

/**
 * Sanduhr-Effekt: ein Partikel pro tatsächlich erarbeiteter Sorte des Tages.
 * Reagiert auf Geräteneigung (mit Maus-Fallback), Canvas-Backing-Buffer wird
 * mit devicePixelRatio skaliert, sonst wirkt es auf Retina-Displays pixelig.
 */
export function SandCanvas({ fruitTypes }: { fruitTypes: FruitType[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const imgCacheRef = useRef<Record<string, HTMLImageElement>>({})
  const sizeRef = useRef({ w: 0, h: 0 })
  const gravityRef = useRef({ x: 0, y: 1 })
  const targetGravityRef = useRef({ x: 0, y: 1 })

  useEffect(() => {
    while (particlesRef.current.length < fruitTypes.length) {
      const type = fruitTypes[particlesRef.current.length]
      particlesRef.current.push({
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
      const gamma = e.gamma || 0
      targetGravityRef.current = { x: Math.max(-1, Math.min(1, gamma / 32)), y: 1 }
    }

    function enableTilt() {
      const DOE = window.DeviceOrientationEvent as
        | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> })
        | undefined
      if (DOE && typeof DOE.requestPermission === 'function') {
        DOE.requestPermission()
          .then((state) => {
            if (state === 'granted') window.addEventListener('deviceorientation', onOrientation)
          })
          .catch(() => {})
      } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onOrientation)
      }
    }
    const parent = canvas.parentElement
    parent?.addEventListener('click', enableTilt, { once: true })

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      targetGravityRef.current = { x: Math.max(-1, Math.min(1, relX)), y: 1 }
    }
    function onPointerLeave() {
      targetGravityRef.current = { x: 0, y: 1 }
    }
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)

    let rafId = 0
    function step() {
      const { w: W, h: H } = sizeRef.current
      const gravity = gravityRef.current
      const target = targetGravityRef.current
      gravity.x += (target.x - gravity.x) * 0.06
      gravity.y += (target.y - gravity.y) * 0.06

      const particles = particlesRef.current
      particles.forEach((p) => {
        p.vx += gravity.x * 0.3
        p.vy += gravity.y * 0.3
        p.vx *= 0.93
        p.vy *= 0.93
        p.x += p.vx
        p.y += p.vy
        if (p.x - p.r < 0) {
          p.x = p.r
          p.vx *= -0.3
        }
        if (p.x + p.r > W) {
          p.x = W - p.r
          p.vx *= -0.3
        }
        if (p.y - p.r < 0) {
          p.y = p.r
          p.vy *= -0.3
        }
        if (p.y + p.r > H) {
          p.y = H - p.r
          p.vy *= -0.3
        }
      })

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
      parent?.removeEventListener('click', enableTilt)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
