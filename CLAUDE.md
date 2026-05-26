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

# Optional — aktivieren weitere Job-Quellen:
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
JOOBLE_API_KEY=...
```

## Nächste Schritte
1. **Recruiter-Pfad** implementieren: Stellenanforderungen hochladen, Kandidaten-Matching
2. **Distanz-Radar**: Leaflet-Karte auf der Jobs-Seite mit km-Kreisen (Koordinaten liegen vor)
3. **CV-Export**: Verbesserter Lebenslauf als PDF generieren (react-pdf)
4. **Deployment**: Vercel + alle ENV-Keys als Secrets
5. **Adzuna/Jooble Keys**: Kostenlos registrieren für ~200 weitere Jobs/Tag

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-05-19 | Neustart als JobMate — zweiseitige Plattform, Next.js, Bewerber-MVP gebaut |
| 2026-05-26 | 6 Job-Quellen (BA, Arbeitnow, Remotive, RemoteOK + opt. Adzuna/Jooble), Präferenzen-Sidebar (Wohnort, Radius, Remote, Jobtyp), Quellen-Filter, Distanzberechnung via Haversine, verbesserte Job-Cards mit Salary/Tags/Datum |
