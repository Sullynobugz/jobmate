@AGENTS.md

# JobMate — KI-Karriereplattform

## Status
Aktiv

## Was diese App ist
Zweiseitige KI-Karriereplattform. Bewerber verbessern ihren Lebenslauf per Claude-Chat, finden passende Stellen über Bundesagentur für Arbeit und Arbeitnow, und tracken ihre Bewerbungen in einem Kanban-Board. Recruiter (Phase 2) können Stellenanforderungen hochladen, Kandidaten matchen und KI-Interviews durchführen.

**Ursprung**: Umbenannt von ApplAI (Recruiter-Tool) zu JobMate (zweiseitige Plattform).

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react
- **KI**: Anthropic API (`claude-sonnet-4-6`) — CV-Chat, Verbesserungsvorschläge
- **Job-APIs**: 6 Quellen — BA, Arbeitnow, Remotive, RemoteOK (alle gratis/keine Auth) + Adzuna, Jooble (optional mit API-Key)
- **Geocoding**: Nominatim (OpenStreetMap, gratis) + Haversine-Distanzberechnung
- **Persistenz**: localStorage (kein Backend, kein Login)
- **Deployment**: Coolify (Hetzner 167.233.30.113) → jobmate.techstag.de

## Architektur
```
src/
├── app/
│   ├── page.tsx              # Landing — Erklärung + "Hast du einen Lebenslauf?" (kein Recruiter-Pfad mehr)
│   ├── cv/page.tsx           # CV-Upload + Claude-Chat (h-screen Layout, linke Spalte = Datei-Info)
│   ├── jobs/page.tsx         # Job-Suche (BA + Arbeitnow)
│   ├── board/page.tsx        # Kanban-Board (Drag & Drop)
│   └── api/
│       ├── cv-chat/route.ts  # → Claude API (Streaming)
│       ├── cv-parse/route.ts # PDF/TXT Text-Extraktion
│       ├── jobs/route.ts     # → BA API + Arbeitnow Proxy
│       └── geocode/route.ts  # → Nominatim (OSM)
├── store/
│   └── appStore.ts           # localStorage CRUD (mode, cv, jobs, kanban)
└── types/index.ts            # Job, KanbanCard, CVData, AppState, etc.
```

## ⚠️ CV-Seite Layout — h-screen
`cv/page.tsx` verwendet `h-screen` (nicht `min-h-screen`) + `min-h-0` auf allen Flex-Kindern. Das ist zwingend damit der Chat-Input immer am unteren Rand bleibt ohne Scrollen. Nicht auf `min-h-screen` zurückstellen.

## ⚠️ Linke Spalte — kein CV-Volltext
Die linke Spalte (`w-2/5`) zeigt **nur Datei-Info** (Icon, Dateiname, Zeichenanzahl, Download-Button). Kein `<pre>`-Block mit CV-Text — der würde das Layout aufblähen und den Chat nach unten schieben. Volltext-Anzeige ist bewusst entfernt.

## ⚠️ ?start= URL-Param
`/cv?start=create` → startet Create-Mode direkt. `/cv?start=upload` → zeigt Upload-Dropzone direkt. Wird von der Landing-Page genutzt um den internen Choice-Screen zu überspringen.

## Bewerber-Flow
1. **Landing** → Erklärung + Frage "Hast du bereits einen Lebenslauf?" → Ja: `/cv?start=upload`, Nein: `/cv?start=create`
2. **CV** → Upload/Erstellen → Claude-Chat → Download
3. **Jobs** → Stichwort + Ort → BA API + Arbeitnow → Job merken
4. **Board** → Kanban: Gemerkt → Beworben → Interview → Angebot / Absage

## Dev-Befehle
```bash
npm run dev   # http://localhost:3000 (oder nächster freier Port)
npm run build
```

## Env-Variablen
```
ANTHROPIC_API_KEY=sk-ant-...

# Optional — aktivieren weitere Job-Quellen:
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
JOOBLE_API_KEY=...
```

## Nächste Schritte
1. **Distanz-Radar**: Leaflet-Karte auf der Jobs-Seite mit km-Kreisen (Koordinaten liegen vor)
2. **CV-Export**: Verbesserter Lebenslauf als PDF generieren (react-pdf)

## ⚠️ Dark Mode deaktiviert
`src/app/globals.css` hat keinen `@media (prefers-color-scheme: dark)` Block. Alle drei Apps (WID, Linguu, JobMate) bleiben fix im Light Theme — für visuelle Einheitlichkeit bei Präsentationen und weil Linguu hardcodierte Hex-Werte statt CSS-Variablen nutzt.

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-05-19 | Neustart als JobMate — zweiseitige Plattform, Next.js, Bewerber-MVP gebaut |
| 2026-05-26 | 6 Job-Quellen (BA, Arbeitnow, Remotive, RemoteOK + opt. Adzuna/Jooble), Präferenzen-Sidebar, Distanzberechnung via Haversine |
| 2026-06-05 | Bewerbungsgespräch-Simulator: /interview Seite + /api/interview (Claude als HR-Manager) |
| 2026-06-07 | Interview-Vorbereitung: 3-Step-Flow, /api/interview-prep. Live deployed: jobmate.techstag.de |
| 2026-06-07 | Recruiter-Pfad entfernt (verwirrt User). Neue Landing: Erklärung + CV-Frage → ?start=create/upload |
| 2026-06-07 | h-screen Chat-Fix: Layout bleibt im Viewport. Linke Spalte zeigt nur Datei-Info (kein Volltext). Chat-Nachrichten mit Slide-In-Animation (CSS: chat-in-user / chat-in-bot) |
| 2026-06-08/09 | Full Light Theme Migration: alle 4 Seiten (cv, board, jobs, interview) von dark-mode Tailwind-Klassen auf light bereinigt. Dark Mode Override aus globals.css entfernt. Nav Indigo-Farbe. Landing neu geschrieben mit CSS-Variablen. |
| 2026-06-09 | Board: draggable von ganzer Card auf Grip-Handle verschoben → Buttons wieder zuverlässig klickbar. Move-Buttons größere Hit-Areas, cursor-pointer überall. Jobs: Action-Buttons (Öffnen/Merken/Üben) mit cursor-pointer + py-2 statt py-1.5. |
| 2026-06-11 | Posthog Analytics eingebaut: `src/app/providers.tsx` (PHProvider Client Component), Layout gewrappt, Env Vars in Coolify gesetzt. Automatisches Page-View-Tracking aktiv. |
