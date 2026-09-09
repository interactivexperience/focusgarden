import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Von scripts/gen-version.mjs geschrieben (läuft als erster Schritt von
// "npm run build"), damit __BUILD_ID__ im Bundle exakt mit der öffentlich
// abrufbaren public/version.json übereinstimmt – dieselbe Quelle für beide.
const buildId = existsSync('public/version.json')
  ? (JSON.parse(readFileSync('public/version.json', 'utf-8')).buildId as string)
  : 'dev'

// https://vite.dev/config/
export default defineConfig({
  base: '/focusgarden/',
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
})
