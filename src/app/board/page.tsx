'use client'

import { useState, useEffect } from 'react'
import { loadState, moveKanbanCard, getJobById, updateKanbanNote } from '@/store/appStore'
import type { KanbanCard, KanbanColumn, Job } from '@/types'
import { ExternalLink, StickyNote } from 'lucide-react'
import Link from 'next/link'

const COLUMNS: { id: KanbanColumn; label: string; color: string }[] = [
  { id: 'saved',     label: '🔖 Gemerkt',    color: 'slate' },
  { id: 'applied',   label: '📤 Beworben',   color: 'blue' },
  { id: 'interview', label: '🎯 Interview',  color: 'indigo' },
  { id: 'offer',     label: '🎉 Angebot',    color: 'emerald' },
  { id: 'rejected',  label: '❌ Absage',     color: 'red' },
]

const colBorder: Record<string, string> = {
  slate: 'border-slate-700', blue: 'border-blue-700/50',
  indigo: 'border-indigo-700/50', emerald: 'border-emerald-700/50', red: 'border-red-700/50',
}
const colBg: Record<string, string> = {
  slate: 'bg-slate-800/40', blue: 'bg-blue-900/20',
  indigo: 'bg-indigo-900/20', emerald: 'bg-emerald-900/20', red: 'bg-red-900/20',
}

export default function BoardPage() {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [jobs, setJobs] = useState<Record<string, Job>>({})
  const [editNote, setEditNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)

  useEffect(() => {
    refresh()
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

  function move(jobId: string, col: KanbanColumn) {
    moveKanbanCard(jobId, col)
    setCards(prev => prev.map(c => c.jobId === jobId ? { ...c, column: col } : c))
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
    if (dragging) move(dragging, col)
    setDragging(null)
  }

  const cardsForCol = (col: KanbanColumn) => cards.filter(c => c.column === col)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020617' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm">J</div>
          <span className="text-white font-bold">JobMate</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/cv" className="text-slate-400 hover:text-white text-sm transition-colors">CV</Link>
          <Link href="/jobs" className="text-slate-400 hover:text-white text-sm transition-colors">Jobs suchen</Link>
        </div>
      </nav>

      <div className="flex-1 overflow-x-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Bewerbungs-Board</h1>

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
            <div
              key={col.id}
              className="w-72 flex-shrink-0"
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, col.id)}
            >
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
                      <div
                        key={card.jobId}
                        draggable
                        onDragStart={() => onDragStart(card.jobId)}
                        className={`bg-slate-900 border border-slate-700 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-slate-500 transition-all ${dragging === card.jobId ? 'opacity-50' : ''}`}
                      >
                        <p className="text-white text-sm font-semibold leading-snug mb-0.5">{job.title}</p>
                        <p className="text-slate-400 text-xs mb-2">{job.company} · {job.location}</p>

                        {card.notes && (
                          <p className="text-slate-500 text-xs italic mb-2 line-clamp-2">
                            {card.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => { setEditNote(card.jobId); setNoteText(card.notes || '') }}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Move buttons */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {COLUMNS.filter(c => c.id !== col.id).map(c => (
                            <button
                              key={c.id}
                              onClick={() => move(card.jobId, c.id)}
                              className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-all"
                            >
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

      {/* Note Modal */}
      {editNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-3">Notiz</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Notizen, nächste Schritte, Ansprechpartner..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => saveNote(editNote)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-sm font-medium transition-colors">
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
