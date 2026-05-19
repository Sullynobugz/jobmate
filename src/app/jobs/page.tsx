'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, ExternalLink, Plus, Kanban } from 'lucide-react'
import { addJob, addToKanban, loadState } from '@/store/appStore'
import type { Job } from '@/types'
import Link from 'next/link'

export default function JobsPage() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const state = loadState()
    setAdded(new Set(state.kanban.map(k => k.jobId)))
  }, [])

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`)
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } finally {
      setLoading(false)
    }
  }

  function saveJob(job: Job) {
    addJob(job)
    addToKanban(job.id, 'saved')
    setAdded(prev => new Set(prev).add(job.id))
  }

  return (
    <div className="min-h-screen" style={{ background: '#020617' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm">J</div>
          <span className="text-white font-bold">JobMate</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/cv" className="text-slate-400 hover:text-white text-sm transition-colors">CV verbessern</Link>
          <Link href="/board" className="flex items-center gap-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg transition-colors border border-slate-700">
            <Kanban className="w-4 h-4" />
            Board
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Search */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Jobs finden</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Berufsbezeichnung, Skills..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Ort oder PLZ"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={search}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
            >
              {loading ? 'Suche...' : 'Suchen'}
            </button>
          </div>
        </div>

        {/* Results */}
        {jobs.length > 0 && (
          <p className="text-slate-500 text-sm mb-4">{jobs.length} Ergebnisse</p>
        )}

        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {job.source === 'ba' ? 'Arbeitsagentur' : 'Arbeitnow'}
                    </span>
                    {job.distance && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.distance} km
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-base mb-0.5 truncate">{job.title}</h3>
                  <p className="text-slate-400 text-sm mb-1">{job.company}</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />{job.location}
                  </p>
                  {job.description && (
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2">{job.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Öffnen
                  </a>
                  <button
                    onClick={() => saveJob(job)}
                    disabled={added.has(job.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      added.has(job.id)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {added.has(job.id) ? '✓ Gespeichert' : (<><Plus className="w-3 h-3" /> Merken</>)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-slate-500">Gib einen Suchbegriff ein, um Jobs zu finden.</p>
          </div>
        )}
      </div>
    </div>
  )
}
