'use client'

import { useState, useEffect } from 'react'
import {
  loadState, moveKanbanCard, getJobById, updateKanbanNote,
  toggleStar, getWidCode, setWidCode, trackApplicationToWid,
} from '@/store/appStore'
import type { KanbanCard, KanbanColumn, Job } from '@/types'
import {
  ExternalLink, StickyNote, FileText, Search, Kanban, ChevronRight,
  Star, X, Clock, ShieldCheck, Link2, HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Nav } from '@/components/Nav'

const COLUMNS: { id: KanbanColumn; label: string; color: string }[] = [
  { id: 'saved',     label: '🔖 Gemerkt',   color: 'slate' },
  { id: 'applied',   label: '📤 Beworben',  color: 'blue' },
  { id: 'interview', label: '🎯 Interview', color: 'indigo' },
  { id: 'offer',     label: '🎉 Angebot',   color: 'emerald' },
  { id: 'rejected',  label: '❌ Absage',    color: 'red' },
]

const colBorder: Record<string, string> = {
  slate: 'border-slate-700', blue: 'border-blue-700/50',
  indigo: 'border-indigo-700/50', emerald: 'border-emerald-700/50', red: 'border-red-700/50',
}
const colBg: Record<string, string> = {
  slate: 'bg-slate-800/40', blue: 'bg-blue-900/20',
  indigo: 'bg-indigo-900/20', emerald: 'bg-emerald-900/20', red: 'bg-red-900/20',
}

// ── Bewerbungs-Modal ──────────────────────────────────────────────────────────

interface ApplicationModalProps {
  job: Job
  onConfirm: (emailProof: string) => void
  onCancel: () => void
}

function ApplicationModal({ job, onConfirm, onCancel }: ApplicationModalProps) {
  const [emailProof, setEmailProof] = useState('')
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Bewerbung bestätigen</h3>
            <p className="text-slate-400 text-sm mt-0.5">{job.title} · {job.company}</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zeitstempel */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-indigo-300 font-medium">Bewerbungszeitstempel wird gespeichert</p>
            <p className="text-xs text-slate-400">{new Date().toLocaleString('de-DE')}</p>
          </div>
        </div>

        {/* E-Mail Nachweis (optional) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-slate-300 font-medium">
              E-Mail Betreff <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <button onClick={() => setShowTutorial(t => !t)}
              className="text-slate-500 hover:text-slate-300">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {showTutorial && (
            <div className="mb-2 px-3 py-2.5 rounded-lg text-xs text-slate-300"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <p className="font-semibold text-indigo-300 mb-1">Warum ist das wichtig?</p>
              <p className="mb-1">
                Dein Koordinator kann auf Anfrage nachfragen ob du dich wirklich beworben hast.
                Der Betreff deiner Bewerbungs-E-Mail ist ein einfacher Nachweis.
              </p>
              <p className="text-slate-400">
                Beispiel: <em>"Bewerbung als Fachinformatiker – Max Mustermann"</em>
              </p>
            </div>
          )}

          <input
            type="text"
            value={emailProof}
            onChange={e => setEmailProof(e.target.value)}
            placeholder='z.B. "Bewerbung als Verkäufer – Anna Schmidt"'
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(emailProof)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Bewerbung bestätigen
          </button>
          <button
            onClick={onCancel}
            className="px-4 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

// ── WID-Code Banner ───────────────────────────────────────────────────────────

function WidCodeBanner({ onLink }: { onLink: (code: string) => void }) {
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
      <Link2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <span className="text-indigo-300 font-medium">WID-Kurs verknüpfen</span>
        <span className="text-slate-400 ml-2">
          Teilnehmer eines WID-Programms? Code eingeben damit dein Koordinator deinen Fortschritt sehen kann.
        </span>
      </div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs px-3 py-1.5 rounded-lg text-indigo-300 hover:text-white border border-indigo-700/50 hover:border-indigo-500 transition-colors flex-shrink-0">
          Code eingeben
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="WID-XXXXXX"
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs w-32 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => { if (code.length >= 6) { onLink(code); setOpen(false) } }}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
            Verknüpfen
          </button>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function BoardPage() {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [jobs, setJobs] = useState<Record<string, Job>>({})
  const [editNote, setEditNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)
  const [widCode, setWidCodeState] = useState<string | undefined>()
  const [applicationPending, setApplicationPending] = useState<{ jobId: string; targetCol: KanbanColumn } | null>(null)

  useEffect(() => {
    refresh()
    setWidCodeState(getWidCode())
  }, [])

  function refresh() {
    const state = loadState()
    setCards(state.kanban)
    const jobMap: Record<string, Job> = {}
    for (const card of state.kanban) {
      const job = getJobById(card.jobId)
      if (job) jobMap[job.id] = job
    }
    setJobs(jobMap)
  }

  function handleMove(jobId: string, col: KanbanColumn) {
    if (col === 'applied') {
      setApplicationPending({ jobId, targetCol: col })
    } else {
      moveKanbanCard(jobId, col)
      setCards(prev => prev.map(c => c.jobId === jobId ? { ...c, column: col } : c))
    }
  }

  async function confirmApplication(emailProof: string) {
    if (!applicationPending) return
    const { jobId } = applicationPending
    const appliedAt = new Date().toISOString()
    moveKanbanCard(jobId, 'applied', { appliedAt, emailProof: emailProof || undefined })
    setCards(prev => prev.map(c => c.jobId === jobId ? { ...c, column: 'applied', appliedAt, emailProof: emailProof || undefined } : c))
    setApplicationPending(null)
    const job = jobs[jobId]
    if (job) await trackApplicationToWid(job, appliedAt, emailProof || undefined)
  }

  function handleStar(e: React.MouseEvent, jobId: string) {
    e.stopPropagation()
    toggleStar(jobId)
    setCards(prev => prev.map(c => c.jobId === jobId ? { ...c, starred: !c.starred } : c))
  }

  function handleLinkWidCode(code: string) {
    setWidCode(code)
    setWidCodeState(code)
  }

  function saveNote(jobId: string) {
    updateKanbanNote(jobId, noteText)
    setCards(prev => prev.map(c => c.jobId === jobId ? { ...c, notes: noteText } : c))
    setEditNote(null)
  }

  function onDragStart(jobId: string) { setDragging(jobId) }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function onDrop(e: React.DragEvent, col: KanbanColumn) {
    e.preventDefault()
    if (dragging) handleMove(dragging, col)
    setDragging(null)
  }

  const cardsForCol = (col: KanbanColumn) => {
    const col_cards = cards.filter(c => c.column === col)
    return col_cards.sort((a, b) => {
      if (a.starred && !b.starred) return -1
      if (!a.starred && b.starred) return 1
      return 0
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      <Nav />

      <div className="flex-1 overflow-x-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Bewerbungs-Board</h1>

        {/* WID-Code Banner wenn nicht verknüpft */}
        {!widCode && (
          <WidCodeBanner onLink={handleLinkWidCode} />
        )}

        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-400 mb-3">Noch keine Jobs gespeichert.</p>
            <Link href="/jobs" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              Jobs suchen →
            </Link>
          </div>
        )}

        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-72 flex-shrink-0"
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, col.id)}>
              <div className={`rounded-2xl border-2 ${colBorder[col.color]} ${colBg[col.color]} p-3 min-h-96`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-white font-semibold text-sm">{col.label}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {cardsForCol(col.id).length}
                  </span>
                </div>

                <div className="space-y-2">
                  {cardsForCol(col.id).map(card => {
                    const job = jobs[card.jobId]
                    if (!job) return null
                    return (
                      <div key={card.jobId} draggable
                        onDragStart={() => onDragStart(card.jobId)}
                        className={`bg-slate-900 border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${
                          card.starred
                            ? 'border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.12)]'
                            : 'border-slate-700 hover:border-slate-500'
                        } ${dragging === card.jobId ? 'opacity-50' : ''}`}>

                        <div className="flex items-start gap-1.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold leading-snug mb-0.5 line-clamp-2">
                              {job.title}
                            </p>
                            <p className="text-slate-400 text-xs">{job.company} · {job.location}</p>
                          </div>
                          <button onClick={e => handleStar(e, card.jobId)}
                            className={`p-1 rounded flex-shrink-0 transition-colors ${
                              card.starred ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-400'
                            }`}>
                            <Star className="w-3.5 h-3.5" fill={card.starred ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        {/* Bewerbungs-Timestamp für "applied" Karten */}
                        {card.column === 'applied' && card.appliedAt && (
                          <div className="flex items-center gap-1 mt-2 text-xs"
                            style={{ color: 'rgba(96,165,250,0.8)' }}>
                            <Clock className="w-3 h-3" />
                            {new Date(card.appliedAt).toLocaleDateString('de-DE', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {card.emailProof && (
                              <span className="ml-1 text-indigo-400" title={card.emailProof}>
                                ✉
                              </span>
                            )}
                          </div>
                        )}

                        {card.notes && (
                          <p className="text-slate-500 text-xs italic mt-2 line-clamp-2">{card.notes}</p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                          <button onClick={() => { setEditNote(card.jobId); setNoteText(card.notes || '') }}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>
                          <a href={job.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Move-Buttons */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {COLUMNS.filter(c => c.id !== col.id).map(c => (
                            <button key={c.id}
                              onClick={() => handleMove(card.jobId, c.id)}
                              className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-all">
                              → {c.label.split(' ')[1]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bewerbungs-Modal */}
      {applicationPending && jobs[applicationPending.jobId] && (
        <ApplicationModal
          job={jobs[applicationPending.jobId]}
          onConfirm={confirmApplication}
          onCancel={() => setApplicationPending(null)}
        />
      )}

      {/* Notiz-Modal */}
      {editNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-3">Notiz</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Notizen, nächste Schritte, Ansprechpartner..." rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => saveNote(editNote)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-sm font-medium transition-colors">
                Speichern
              </button>
              <button onClick={() => setEditNote(null)} className="px-4 text-slate-400 hover:text-white text-sm transition-colors">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
