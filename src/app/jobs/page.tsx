'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, MapPin, ExternalLink, Plus, SlidersHorizontal,
  Wifi, Building2, Euro, Tag, Calendar, X, FileText, MessageSquare,
} from 'lucide-react'
import { addJob, addToKanban, loadState, savePreferences, trackJobSavedToWid } from '@/store/appStore'
import type { Job, SearchPreferences, RemotePreference, CountryPreference, JobSource } from '@/types'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Nav } from '@/components/Nav'

// Leaflet greift auf window zu → nur clientseitig laden (kein SSR-Prerender)
const JobRadarMap = dynamic(() => import('@/components/JobRadarMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-xs text-slate-400" style={{ height: 360 }}>
      Karte wird geladen…
    </div>
  ),
})

const SOURCE_META: Record<JobSource, { label: string; color: string; bg: string }> = {
  ba:        { label: 'Bundesagentur', color: 'text-blue-600',    bg: 'bg-blue-500/15 border-blue-500/30' },
  arbeitnow: { label: 'Arbeitnow',    color: 'text-orange-600',  bg: 'bg-orange-500/15 border-orange-500/30' },
  remotive:  { label: 'Remotive',     color: 'text-emerald-600', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  remoteok:  { label: 'RemoteOK',     color: 'text-teal-600',    bg: 'bg-teal-500/15 border-teal-500/30' },
  adzuna:    { label: 'Adzuna',       color: 'text-violet-600',  bg: 'bg-violet-500/15 border-violet-500/30' },
  jooble:    { label: 'Jooble',       color: 'text-yellow-700',  bg: 'bg-yellow-500/15 border-yellow-500/30' },
  manual:    { label: 'Manuell',      color: "text-slate-600",   bg: "bg-slate-100 border-slate-300" },
}

const JOB_TYPES = [
  { id: 'fulltime',    label: 'Vollzeit' },
  { id: 'parttime',   label: 'Teilzeit' },
  { id: 'freelance',  label: 'Freelance' },
  { id: 'minijob',    label: 'Minijob' },
  { id: 'internship', label: 'Praktikum' },
]

const RADII = [10, 25, 50, 100, 200]

const QUICK_SEARCHES = [
  'Soziales, Beratung, Teilzeit',
  'IT Support, Quereinstieg',
  'Marketing, Social Media',
  'Büro, Verwaltung, Homeoffice',
  'Data Analyst, SQL',
  'UX Design, Research',
]

function relativeTime(iso: string | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'heute'
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  if (days < 30) return `vor ${Math.floor(days / 7)} Wo.`
  return `vor ${Math.floor(days / 30)} Mon.`
}

export default function JobsPage() {
  const [query, setQuery] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [total, setTotal] = useState<number | null>(null)
  const [activeSources, setActiveSources] = useState<Set<JobSource>>(new Set())
  const [hasCV, setHasCV] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radarOpen, setRadarOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [prefs, setPrefs] = useState<SearchPreferences>({
    location: '',
    radius: 50,
    remote: 'any',
    jobTypes: [],
    country: 'de',
  })

  useEffect(() => {
    const state = loadState()
    setAdded(new Set(state.kanban.map(k => k.jobId)))
    setPrefs(state.preferences)
    setHasCV(!!state.cv?.raw)
    inputRef.current?.focus()
  }, [])

  function updatePref<K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      savePreferences(next)
      return next
    })
  }

  function toggleJobType(id: string) {
    setPrefs(prev => {
      const next = prev.jobTypes.includes(id)
        ? prev.jobTypes.filter(t => t !== id)
        : [...prev.jobTypes, id]
      const updated = { ...prev, jobTypes: next }
      savePreferences(updated)
      return updated
    })
  }

  async function search(overrideQuery?: string) {
    const q = overrideQuery ?? query
    setLoading(true)
    setJobs([])
    setTotal(null)
    setActiveSources(new Set())
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        location: prefs.location,
        radius: String(prefs.radius),
        remote: prefs.remote,
        country: prefs.country,
      })
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs ?? [])
      setTotal(data.total ?? 0)
      setCenterCoords(data.centerCoords ?? null)
    } finally {
      setLoading(false)
    }
  }

  function onQueryKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      search()
    }
  }

  function saveJob(job: Job) {
    addJob(job)
    addToKanban(job.id, 'saved')
    void trackJobSavedToWid(job)
    setAdded(prev => new Set(prev).add(job.id))
  }

  function toggleSource(src: JobSource) {
    setActiveSources(prev => {
      const next = new Set(prev)
      if (next.has(src)) next.delete(src)
      else next.add(src)
      return next
    })
  }

  const displayedJobs = activeSources.size > 0
    ? jobs.filter(j => activeSources.has(j.source))
    : jobs

  const sourceGroups = jobs.reduce<Partial<Record<JobSource, number>>>((acc, j) => {
    acc[j.source] = (acc[j.source] ?? 0) + 1
    return acc
  }, {})

  const hasSearched = total !== null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      <Nav />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`flex-shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto transition-all duration-200 ${filtersOpen ? 'w-64' : 'w-12'}`}>

          {/* Toggle */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-b border-gray-100 text-slate-500 hover:text-gray-900 transition-colors w-full"
            title={filtersOpen ? 'Filter einklappen' : 'Filter ausklappen'}
          >
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
            {filtersOpen && <span className="text-xs font-medium flex-1 text-left">Filter</span>}
          </button>

          {filtersOpen && (
            <div className="p-4 space-y-5 flex-1">

              {/* Wohnort */}
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">Wohnort</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    value={prefs.location}
                    onChange={e => updatePref('location', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Stadt oder PLZ"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-900 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Umkreis */}
              {prefs.remote !== 'remote' && (
                <div>
                  <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">
                    Umkreis — <span className="text-indigo-600">{prefs.radius} km</span>
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {RADII.map(r => (
                      <button
                        key={r}
                        onClick={() => updatePref('radius', r)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                          prefs.radius === r
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-50 border-gray-200 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Remote */}
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">Arbeitsort</label>
                <div className="flex flex-col gap-1">
                  {([
                    { id: 'any',    icon: <Building2 className="w-3.5 h-3.5" />, label: 'Egal' },
                    { id: 'remote', icon: <Wifi className="w-3.5 h-3.5" />,      label: 'Nur Remote' },
                    { id: 'onsite', icon: <Building2 className="w-3.5 h-3.5" />, label: 'Nur Vor Ort' },
                  ] as { id: RemotePreference; icon: React.ReactNode; label: string }[]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => updatePref('remote', opt.id)}
                      className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all text-left ${
                        prefs.remote === opt.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-600'
                          : 'bg-slate-50/50 border-gray-200 text-slate-400 hover:border-gray-400 hover:text-slate-700'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Land */}
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">Land</label>
                <div className="flex flex-col gap-1">
                  {([
                    { id: 'de',    label: '🇩🇪 Nur Deutschland' },
                    { id: 'world', label: '🌍 Auch international' },
                  ] as { id: CountryPreference; label: string }[]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => updatePref('country', opt.id)}
                      className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all text-left ${
                        prefs.country === opt.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-600'
                          : 'bg-slate-50/50 border-gray-200 text-slate-400 hover:border-gray-400 hover:text-slate-700'
                      }`}
                    >
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jobtyp */}
              <div>
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">Jobtyp</label>
                <div className="flex flex-wrap gap-1">
                  {JOB_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleJobType(t.id)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        prefs.jobTypes.includes(t.id)
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-50 border-gray-200 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quellen-Filter */}
              {Object.keys(sourceGroups).length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">Quellen filtern</label>
                  <div className="space-y-1">
                    {(Object.entries(sourceGroups) as [JobSource, number][]).map(([src, count]) => {
                      const meta = SOURCE_META[src]
                      const active = activeSources.has(src)
                      return (
                        <button
                          key={src}
                          onClick={() => toggleSource(src)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-all ${
                            active
                              ? `${meta.bg} ${meta.color}`
                              : 'bg-slate-50/50 border-gray-200 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span>{meta.label}</span>
                          <span className="bg-slate-200 px-1.5 py-0.5 rounded-md text-slate-600">{count}</span>
                        </button>
                      )
                    })}
                    {activeSources.size > 0 && (
                      <button
                        onClick={() => setActiveSources(new Set())}
                        className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 py-1 transition-colors"
                      >
                        <X className="w-3 h-3" /> Alle anzeigen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Suchleiste */}
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onQueryKeyDown}
                  rows={2}
                  placeholder="Beschreibe mit Stichworten, was dich interessiert: z.B. Pflege, Teilzeit, Quereinstieg, Homeoffice..."
                  className="w-full min-h-[68px] resize-none bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                />
              </div>
              <button
                onClick={() => search()}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap sm:self-stretch"
              >
                {loading ? 'Suche läuft…' : 'Suchen'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Beispiele:</span>
              {QUICK_SEARCHES.slice(0, 4).map(q => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); search(q) }}
                  className="text-xs text-slate-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-500 hover:bg-indigo-500/10 px-2.5 py-1 rounded-lg transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Status-Zeile */}
            {hasSearched && !loading && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-slate-500 text-xs">
                  <span className="text-slate-700 font-medium">{total}</span> Jobs gefunden
                  {activeSources.size > 0 && <> · <span className="text-indigo-600">{displayedJobs.length} gefiltert</span></>}
                  {prefs.location && prefs.remote !== 'remote' && ` · ${prefs.radius} km um ${prefs.location}`}
                </p>
                {centerCoords && (
                  <button
                    onClick={() => setRadarOpen(v => !v)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border transition-all ${
                      radarOpen
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-600'
                        : 'bg-slate-50 border-gray-200 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <MapPin className="w-3 h-3" /> Distanz-Radar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Distanz-Radar — Leaflet-Karte: Nutzer-Standort als Mittelpunkt, Jobs als Pins, 15/30/50 km-Ringe */}
          {radarOpen && centerCoords && (() => {
            const jobsWithCoords = displayedJobs.filter(j => j.lat != null && j.lng != null)
            return (
              <div className="border-b border-gray-100 px-5 py-4 flex flex-col gap-2">
                <p className="text-xs text-slate-500">
                  Ringe 15 / 30 / 50 km · {jobsWithCoords.length} Jobs mit Koordinaten
                </p>
                <JobRadarMap
                  center={centerCoords}
                  jobs={displayedJobs}
                  savedIds={added}
                  radius={prefs.radius}
                />
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Dein Standort</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Job</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Gemerkt</span>
                </div>
              </div>
            )
          })()}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* Ladezustand */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p className="text-slate-400 text-sm">Durchsuche Bundesagentur, Arbeitnow, Remotive und mehr…</p>
              </div>
            )}

            {/* Leerer Startzustand */}
            {!loading && !hasSearched && (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                  <Search className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-1">Jobs finden</p>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Beschreibe in Stichworten, was dich interessiert. JobMate sucht daraus passende Stellenanzeigen.
                </p>

                {/* Schnellsuche */}
                <div className="w-full">
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-3">Beispiele</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_SEARCHES.map(q => (
                      <button
                        key={q}
                        onClick={() => { setQuery(q); search(q) }}
                        className="text-sm text-slate-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-500 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {!hasCV && (
                  <div className="mt-8 w-full p-4 rounded-2xl border border-gray-100 bg-white/80">
                    <p className="text-slate-500 text-sm mb-3">Hast du deinen Lebenslauf dabei?</p>
                    <Link
                      href="/cv"
                      className="inline-flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      <FileText className="w-4 h-4" /> CV hochladen & optimieren
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Keine Ergebnisse */}
            {!loading && hasSearched && displayedJobs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-400 mb-2">Keine Treffer gefunden.</p>
                <p className="text-slate-600 text-sm">Probiere einen anderen Suchbegriff oder erweitere den Umkreis.</p>
              </div>
            )}

            {/* Job-Liste */}
            <div className="space-y-3">
              {displayedJobs.map(job => {
                const meta = SOURCE_META[job.source]
                const isSaved = added.has(job.id)
                const date = relativeTime(job.postedAt)
                return (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-slate-500 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                          {job.remote && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <Wifi className="w-3 h-3" /> Remote
                            </span>
                          )}
                          {job.jobType && (
                            <span className="text-xs text-slate-400 bg-slate-50 border border-gray-200 px-2 py-0.5 rounded-full">
                              {job.jobType}
                            </span>
                          )}
                          {job.distance !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" /> {job.distance} km
                            </span>
                          )}
                          {date && (
                            <span className="flex items-center gap-1 text-xs text-slate-600 ml-auto">
                              <Calendar className="w-3 h-3" /> {date}
                            </span>
                          )}
                        </div>

                        {/* Titel */}
                        <h3 className="text-gray-900 font-semibold text-sm leading-snug mb-0.5 group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-slate-500 text-xs mb-0.5">{job.company}</p>
                        <p className="text-slate-600 text-xs flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {job.location}
                        </p>

                        {/* Beschreibung */}
                        {job.description && (
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">
                            {job.description}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {job.salary && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <Euro className="w-3 h-3" /> {job.salary}
                            </span>
                          )}
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Tag className="w-3 h-3 text-slate-700" />
                              {job.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Aktionen */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Öffnen
                        </a>
                        <button
                          onClick={() => saveJob(job)}
                          disabled={isSaved}
                          className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-default ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isSaved ? '✓ Gemerkt' : <><Plus className="w-3 h-3" /> Merken</>}
                        </button>
                        {isSaved && (
                          <Link
                            href="/interview"
                            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/25 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" /> Üben
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
