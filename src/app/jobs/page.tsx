'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, MapPin, ExternalLink, Plus, Kanban, SlidersHorizontal,
  Wifi, Building2, Euro, Tag, Calendar, X, FileText, ChevronRight, MessageSquare,
} from 'lucide-react'
import { addJob, addToKanban, loadState, savePreferences } from '@/store/appStore'
import type { Job, SearchPreferences, RemotePreference, JobSource } from '@/types'
import Link from 'next/link'

const SOURCE_META: Record<JobSource, { label: string; color: string; bg: string }> = {
  ba:        { label: 'Bundesagentur', color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30' },
  arbeitnow: { label: 'Arbeitnow',    color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30' },
  remotive:  { label: 'Remotive',     color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  remoteok:  { label: 'RemoteOK',     color: 'text-teal-400',    bg: 'bg-teal-500/15 border-teal-500/30' },
  adzuna:    { label: 'Adzuna',       color: 'text-violet-400',  bg: 'bg-violet-500/15 border-violet-500/30' },
  jooble:    { label: 'Jooble',       color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30' },
  manual:    { label: 'Manuell',      color: 'text-slate-400',   bg: 'bg-slate-500/15 border-slate-500/30' },
}

const JOB_TYPES = [
  { id: 'fulltime',    label: 'Vollzeit' },
  { id: 'parttime',   label: 'Teilzeit' },
  { id: 'freelance',  label: 'Freelance' },
  { id: 'minijob',    label: 'Minijob' },
  { id: 'internship', label: 'Praktikum' },
]

const RADII = [10, 25, 50, 100, 200]

const QUICK_SEARCHES = ['Software Entwickler', 'Marketing Manager', 'Buchhalter', 'Projektmanager', 'Data Analyst', 'UX Designer']

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
  const inputRef = useRef<HTMLInputElement>(null)

  const [prefs, setPrefs] = useState<SearchPreferences>({
    location: '',
    radius: 50,
    remote: 'any',
    jobTypes: [],
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
      })
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  function saveJob(job: Job) {
    addJob(job)
    addToKanban(job.id, 'saved')
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
    <div className="min-h-screen flex flex-col" style={{ background: '#020617' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm">J</div>
          <span className="text-white font-bold">JobMate</span>
        </Link>

        {/* Stepper */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          <Link href="/cv" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${hasCV ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <FileText className="w-3.5 h-3.5" />
            {hasCV ? '✓ CV' : 'CV verbessern'}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-700" />
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
            <Search className="w-3.5 h-3.5" />
            Jobs suchen
          </span>
          <ChevronRight className="w-3 h-3 text-slate-700" />
          <Link href="/board" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
            <Kanban className="w-3.5 h-3.5" />
            Board
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/interview" className="flex items-center gap-1.5 text-sm bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/30">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Üben</span>
          </Link>
          <Link href="/board" className="flex items-center gap-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700">
            <Kanban className="w-4 h-4" />
            <span className="hidden sm:inline">Board</span>
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`flex-shrink-0 border-r border-slate-800 flex flex-col overflow-y-auto transition-all duration-200 ${filtersOpen ? 'w-64' : 'w-12'}`}>

          {/* Toggle */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-b border-slate-800 text-slate-400 hover:text-white transition-colors w-full"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Umkreis */}
              {prefs.remote !== 'remote' && (
                <div>
                  <label className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2 block">
                    Umkreis — <span className="text-indigo-400">{prefs.radius} km</span>
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {RADII.map(r => (
                      <button
                        key={r}
                        onClick={() => updatePref('radius', r)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                          prefs.radius === r
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
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
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {opt.icon}
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
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
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
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span>{meta.label}</span>
                          <span className="bg-slate-700/60 px-1.5 py-0.5 rounded-md text-slate-300">{count}</span>
                        </button>
                      )
                    })}
                    {activeSources.size > 0 && (
                      <button
                        onClick={() => setActiveSources(new Set())}
                        className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
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
          <div className="px-5 py-4 border-b border-slate-800 flex-shrink-0">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="Jobtitel, Skill oder Bereich..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={() => search()}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                {loading ? 'Suche läuft…' : 'Suchen'}
              </button>
            </div>

            {/* Status-Zeile */}
            {hasSearched && !loading && (
              <p className="text-slate-500 text-xs mt-2">
                <span className="text-slate-300 font-medium">{total}</span> Jobs gefunden
                {activeSources.size > 0 && <> · <span className="text-indigo-400">{displayedJobs.length} gefiltert</span></>}
                {prefs.location && prefs.remote !== 'remote' && ` · ${prefs.radius} km um ${prefs.location}`}
              </p>
            )}
          </div>

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
                  <Search className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-white font-semibold text-lg mb-1">Jobs finden</p>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Suche nach Jobtitel oder Bereich — oder lass das Feld leer und such nur nach Ort.
                </p>

                {/* Schnellsuche */}
                <div className="w-full">
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-3">Beliebte Suchen</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_SEARCHES.map(q => (
                      <button
                        key={q}
                        onClick={() => { setQuery(q); search(q) }}
                        className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {!hasCV && (
                  <div className="mt-8 w-full p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
                    <p className="text-slate-400 text-sm mb-3">Hast du deinen Lebenslauf dabei?</p>
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
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-600 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                          {job.remote && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <Wifi className="w-3 h-3" /> Remote
                            </span>
                          )}
                          {job.jobType && (
                            <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
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
                        <h3 className="text-white font-semibold text-sm leading-snug mb-0.5 group-hover:text-indigo-300 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-slate-400 text-xs mb-0.5">{job.company}</p>
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
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <Euro className="w-3 h-3" /> {job.salary}
                            </span>
                          )}
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Tag className="w-3 h-3 text-slate-700" />
                              {job.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
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
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Öffnen
                        </a>
                        <button
                          onClick={() => saveJob(job)}
                          disabled={isSaved}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isSaved ? '✓ Gemerkt' : <><Plus className="w-3 h-3" /> Merken</>}
                        </button>
                        {isSaved && (
                          <Link
                            href="/interview"
                            className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/25 px-3 py-1.5 rounded-lg transition-colors"
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
