# Fokusgarten

Kawaii-Pomodoro-App mit Sammelmechanik: Bei jeder abgeschlossenen Fokuszeit fällt eine
zufällige Obst-/Gemüse-Sorte herab und bleibt für den Tag "liegen".

## Tech-Stack

- React 19 + TypeScript, gebaut mit Vite
- Tailwind CSS v4
- Rein lokal: Speicherung über `localStorage` (siehe `src/lib/storage.ts` – zentrale
  `saveStoredState`/`loadStoredState`-Funktionen, gedacht als einzige Stelle, die später
  um ein Cloud-Backend erweitert wird)

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

Push nach `main` baut die App über GitHub Actions (`.github/workflows/deploy.yml`) und
veröffentlicht sie auf GitHub Pages unter `/focusgarden/`.

## Assets

Die 37 Obst-/Gemüse-Icons, 8 Sonnenblumen-Stimmungen und 24 UI-Icons stammen aus der vom
Nutzer bereitgestellten Vektor-Vorlage und liegen als echte PNG-Dateien unter
`src/assets/`. Mais war beim Export aus der EPS oben abgeschnitten und wird deshalb als
handgezeichnetes SVG im selben Sticker-Stil dargestellt (`src/lib/assets.tsx`).

## Offene Punkte

- Echter Pausen-Timer nach Ablauf der Fokuszeit (aktuell: Ernte-Screen → zurück zum Start)
- Push-Benachrichtigungen für Fokus-/Pausenende
