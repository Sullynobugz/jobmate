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

## ⚠️ ?wid= URL-Param (WID-Tracking)
`captureWidFromUrl()` in `src/store/appStore.ts` liest `?wid=` aus der URL, persistiert den Code (uppercased) in localStorage und entfernt den Param wieder aus der Adresszeile. Der Aufruf sitzt im App-Root-Wrapper `src/app/providers.tsx` (`PHProvider`), läuft also beim Start auf **jeder** Route — ein WID-Teilnehmer kann direkt auf `/jobs?wid=…` oder `/cv?wid=…` verlinkt werden, der Code wird trotzdem erfasst. Alle `sendWidEvent`-Tracking-Calls (job_saved, application, cv_upload) lesen ihn danach automatisch via `getWidCode()`. Analog zu Linguus `WidCodeFromUrl` in `src/App.tsx`.

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
1. _(offen — nach Rücksprache definieren)_

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
| 2026-06-13 | `?wid=`-Erfassung in den App-Root verschoben: neue `captureWidFromUrl()` in `appStore.ts`, aufgerufen im `PHProvider` (`providers.tsx`) → läuft auf jeder Route beim Start (vorher nur Landing-Page). Landing-Page `page.tsx` nutzt jetzt denselben Helper statt Inline-Duplikat. Analog zu Linguu. |
| 2026-06-13 | CV-PDF-Export via `@react-pdf/renderer`: neuer Helper `src/lib/cvPdf.tsx` (`downloadCvAsPdf`) rendert den verbesserten Lebenslauf in ein simples A4-Template (Helvetica, Name als Header + indigo Trennlinie, Abschnitts-Heuristik) und lädt es als PDF herunter. Lib wird per dynamischem `import()` im Klick geladen → `/cv` bleibt static. Alter print-dialog-`exportPDF` (window.open) ersetzt, PDF-Button mit „Erstelle…“-Zustand. |
| 2026-06-13 | Distanz-Radar von SVG auf echte **Leaflet-Karte** umgestellt: neue `src/components/JobRadarMap.tsx` (react-leaflet@5, OSM-Tiles), Nutzer-Standort (`centerCoords`) als Mittelpunkt, Jobs als Pins (indigo / emerald wenn gemerkt), Popup mit Titel/Firma/Distanz/Link, drei `Circle`-Ringe 15/30/50 km. Wird in `jobs/page.tsx` per `next/dynamic` mit `ssr: false` geladen (Leaflet braucht `window`) → `/jobs` bleibt statisch prerendered. Alter SVG-Radar + `hoveredJob`-State entfernt. Deps: `leaflet`, `react-leaflet`, `@types/leaflet`. |
| 2026-06-15 | Jobsuche vom CV-Editor entkoppelt: Zwangs-Redirect der Landing-Page zu `/cv` (für Rückkehrer mit CV) entfernt — fing User im CV-Flow ein. Neuer dritter Einstieg "Passende Jobs finden" → `/jobs` (Stellensuche inkl. Distanz-Radar, ohne Lebenslauf startbar), mit "oder direkt"-Divider. Rückkehrer mit gespeichertem CV bekommen jetzt einen dezenten "Weiter mit deinem Lebenslauf"-Shortcut statt Zwangsumleitung. `/jobs` war technisch schon eigenständig (keine CV-Abhängigkeit), Kopplung war rein navigatorisch. |
| 2026-06-15 | Stellenanzeigen als eigener Produkt-Einstieg sichtbarer gemacht: Landing zeigt jetzt "Stellenanzeigen suchen" gleichwertig vor dem Lebenslauf-Abschnitt. `/jobs` nutzt eine größere Stichwort-/Interessen-Textarea mit Beispielen (z.B. Teilzeit, Quereinstieg, Homeoffice) statt reiner Jobtitel-Suche; Enter startet Suche, Shift+Enter bleibt für Zeilenumbrüche. |
| 2026-06-15 | Keyword-Relevanz in `/api/jobs` nachgeschärft: externe Quellen liefern bei freien Stichworten teils zu breite Treffer. JobMate normalisiert Suchtext jetzt serverseitig, filtert Ergebnisse nach Keyword-Abdeckung und Synonymen (u.a. "künstliche Intelligenz" → KI/AI/ML/LLM/ChatGPT) und sortiert Titel-/Tag-Treffer vor reinen Beschreibungstreffern. |
| 2026-06-15 | WID-Rücknavigation ergänzt: Wenn JobMate mit `?wid=` verknüpft ist, zeigt der globale Nav-Banner jetzt "Zurück zu WID" → `https://wid.techstag.de/lernen`. Damit bleiben CV-Editor, Jobsuche, Board und Interview als WID-Unterfeature navigierbar. |
| 2026-06-15 | Branding an Enter angepasst: sichtbare Dachmarke in Header/Banner ist jetzt "Enter · Linguu · JobMate"; WID bleibt technisch als `?wid=`/`widCode` bestehen, weil Tracking und bestehende Teilnehmercodes daran hängen. |
| 2026-06-16 | Letzter sichtbarer WID-Leftover entfernt: Code-Eingabe-Platzhalter im Board-Banner `WID-XXXXXX` → neutral `z. B. AB23CD` (Enter generiert Codes jetzt prefixlos). `?wid=`/`widCode` bleiben technisch unverändert. |
| 2026-06-23 | BA-Quelle für bundesweite/Remote-Suche gefixt: `/api/jobs` schickte bei leerem Ort ein leeres `wo` an die Bundesagentur-API → diese liefert dann **0 Treffer** (z.B. alle „Dozent"-Suchen kamen leer zurück, obwohl die BA die Hauptquelle für DE-Dozent/Bildungsträger-Stellen ist). Fix: `wo` fällt auf `"Deutschland"` zurück, `size` 25→50. Damit funktioniert die ortlose Stichwortsuche endlich. `scripts/gather-bastian.mjs` = einmaliges Sammel-/Scoring-Skript (BA+Arbeitnow+Remotive+RemoteOK → Profil-Score → Top 100 ins localStorage-Board), nicht Teil der App. |
