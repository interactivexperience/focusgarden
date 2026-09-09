import { mkdirSync, writeFileSync } from 'node:fs'

// Einzige Quelle für die Build-ID: läuft VOR dem eigentlichen Build und
// schreibt sie sowohl in public/version.json (landet unverändert in dist/,
// wird zur Laufzeit per fetch abgefragt) als auch – über vite.config.ts, das
// dieselbe Datei liest – in den JS-Bundle selbst (__BUILD_ID__). So können
// beide nie auseinanderlaufen.
const buildId = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : `dev-${Date.now()}`

mkdirSync('public', { recursive: true })
writeFileSync('public/version.json', JSON.stringify({ buildId }), 'utf-8')
console.log(`Build-ID: ${buildId}`)
