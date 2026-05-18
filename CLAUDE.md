# ApplAI — Recruiting-Automatisierungs-Plattform

## Was diese App ist
AI-gestützte Recruiting-Plattform. Recruiter laden Job-Anforderungsdokumente hoch (PDF, DOCX, TXT), die AI extrahiert daraus strukturierte Anforderungen. Kandidaten werden angelegt/importiert, automatisch gegen die Anforderungen gescort und in einer priorisierten Liste dargestellt. Shortlist-Export für den weiteren Prozess.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Mantine UI, React Router
- **Backend**: Node.js + Express, PostgreSQL, Sequelize ORM
- **AI**: OpenAI API (Anforderungs-Extraktion, Kandidaten-Matching)
- **Queue**: BullMQ + Redis (Hintergrund-Jobs)
- **Datei-Parsing**: pdf-parse, docx
- **Icons**: Tabler Icons

## Aktueller Stand
Prototyp mit vollständiger MVP-Architektur. Frontend (Kandidaten-Dashboard, Job-Uploads), Backend (API, DB-Schema, Queue) und AI-Integration vorhanden. Multi-Tenancy und RBAC sind von Anfang an eingeplant. Implementierungsgrad der einzelnen Features unklar.

## Architektur
```
ApplAI/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React Root + Router
│   │   ├── components/      # UI-Komponenten
│   │   ├── pages/           # Dashboard, Jobs, Kandidaten, Shortlist
│   │   └── main.jsx
│   └── package.json         # React, Mantine, Axios
├── backend/
│   ├── src/
│   │   ├── main.py / main.js    # API-Einstiegspunkt
│   │   ├── routes/          # Jobs, Kandidaten, Matching
│   │   ├── services/        # AI-Service (OpenAI), Parser-Service
│   │   └── models/          # Sequelize: Job, Candidate, Match
│   ├── requirements.txt     # (Python-Variante)
│   └── package.json         # Express, Sequelize, BullMQ, OpenAI
├── docker-compose.yml       # DB + Redis + API + Frontend
└── PRD_Recruitment_Automation_Platform.md  # Product Requirements
```

**Datenfluss**: Upload (PDF/DOCX/TXT) → Parser → OpenAI Extraktion → Job-Anforderungen in DB → Kandidaten-Matching → Score-Ranking → Shortlist-Export

## Dev-Befehle
```bash
# Alles via Docker
docker-compose up --build

# Manuell:
# Backend
cd backend && npm install && npm run dev   # oder: pip install -r requirements.txt && python main.py

# Frontend
cd frontend && npm install && npm run dev  # localhost:5173
```

**Env-Variablen** (`.env` im Backend):
```
OPENAI_API_KEY=
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

## Nächste Schritte
1. **AI-Prompt tunen**: Anforderungs-Extraktion und Matching-Scoring verbessern
2. **Auth**: Login/Register + RBAC (Recruiter vs. Admin)
3. **Multi-Tenancy**: Mehrere Unternehmen/Teams isoliert
4. **Kandidaten-Import**: CSV/LinkedIn-Import
5. **E-Mail-Benachrichtigungen**: Kandidaten automatisch kontaktieren

## Bekannte Probleme / Technische Schulden
- Backend scheint sowohl Python (`main.py`, `requirements.txt`) als auch Node.js (`package.json`) zu haben — unklar welches aktiv ist
- `.env` Datei-Handling prüfen (nicht committen)
- BullMQ benötigt laufenden Redis-Server

## Wichtige Entscheidungen & Konventionen
- Mantine UI für schnelles, konsistentes Frontend ohne viel Custom-CSS
- BullMQ für AI-Jobs im Hintergrund (Parsing kann dauern — blockiert nicht den Request)
- Multi-Tenancy von Anfang an eingeplant (nicht nachträglich)
- PRD (`PRD_Recruitment_Automation_Platform.md`) als Referenz für Feature-Scope

---

## Entwicklungslog & Nächste Schritte

> **Anweisung für Claude Code**: Halte diesen Abschnitt nach jeder Session aktuell.
> - **Nach Änderungen**: Kurzen Log-Eintrag hinzufügen (Datum + was gemacht + warum)
> - **Nächste Schritte**: Immer nach Rücksprache mit dem Nutzer definieren — nie eigenständig befüllen
> - **"Mach weiter"**: Den obersten offenen Punkt aus "Nächste Schritte" aufgreifen und umsetzen, dann Log aktualisieren und neue Schritte vorschlagen

### Nächste Schritte
- [ ] (noch nicht definiert — bitte kurz besprechen)

### Log
| Datum | Was & Warum |
|-------|-------------|
| 2026-05-07 | CLAUDE.md angelegt — Projektdokumentation initialisiert |


---

## Git-Konvention

Nach jeder größeren Änderung wird committed — niemals ungesicherte Arbeit liegenlassen.

**Wann committen:** Nach jedem abgeschlossenen Feature, Bugfix, Refactoring oder bevor die Session endet.

**Commit-Message Format:**
```
<typ>: <kurze Beschreibung was & warum>
Typen: feat / fix / refactor / docs / chore
```

**Für Claude Code:** Nach jeder größeren Änderung eigenständig committen. Staging selektiv — keine .env, keine Secrets. Nie blind `git add -A`.
