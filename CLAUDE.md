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
- **KI**: Anthropic API (`claude-sonnet-4-6`) — CV-Chat, Verbesserungsvorschläge
- **Job-APIs**: Bundesagentur für Arbeit REST API + Arbeitnow API (beide gratis)
- **Geocoding**: Nominatim (OpenStreetMap, gratis)
- **Persistenz**: localStorage (kein Backend, kein Login)
- **Deployment**: Vercel (geplant)

## Architektur
```
src/
├── app/
│   ├── page.tsx              # Landing — Pfad-Auswahl (Bewerber / Recruiter)
│   ├── cv/page.tsx           # CV hochladen + Claude-Chat
│   ├── jobs/page.tsx         # Job-Suche (BA + Arbeitnow)
│   ├── board/page.tsx        # Kanban-Board (Drag & Drop)
│   ├── recruiter/page.tsx    # Recruiter-Portal (Placeholder)
│   └── api/
│       ├── cv-chat/route.ts  # → Claude API (Streaming)
│       ├── cv-parse/route.ts # PDF/TXT Text-Extraktion
│       ├── jobs/route.ts     # → BA API + Arbeitnow Proxy
│       └── geocode/route.ts  # → Nominatim (OSM)
├── store/
│   └── appStore.ts           # localStorage CRUD (mode, cv, jobs, kanban)
└── types/index.ts            # Job, KanbanCard, CVData, AppState, etc.
```

## Bewerber-Flow
1. **Landing** → "Ich suche einen Job" wählen
2. **CV** → PDF/TXT hochladen → Text-Extraktion → Claude-Chat zum Verbessern → Download
3. **Jobs** → Stichwort + Ort → BA API + Arbeitnow → Job merken (landet im Board)
4. **Board** → Kanban: Gemerkt → Beworben → Interview → Angebot / Absage

## Dev-Befehle
```bash
npm run dev   # http://localhost:3000 (oder nächster freier Port)
npm run build
```

## Env-Variablen
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Nächste Schritte
1. **Recruiter-Pfad** implementieren: Stellenanforderungen hochladen, Kandidaten-Matching
2. **Distanz-Radar**: Leaflet-Karte auf der Jobs-Seite mit km-Kreisen
3. **CV-Export**: Verbesserter Lebenslauf als PDF generieren (react-pdf)
4. **Deployment**: Vercel + ANTHROPIC_API_KEY als Secret

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-05-19 | Neustart als JobMate — zweiseitige Plattform, Next.js, Bewerber-MVP gebaut |
