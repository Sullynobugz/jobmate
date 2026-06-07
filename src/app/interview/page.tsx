'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Nav as JobNav } from '@/components/Nav'
import {
  Mic, MicOff, Send, ChevronRight, Briefcase, FileText,
  Kanban, ArrowLeft, Star, TrendingUp, CheckCircle2, RefreshCw,
  MessageSquare, BookOpen, PlayCircle,
} from 'lucide-react'
import { loadState } from '@/store/appStore'
import type { Job, ChatMessage } from '@/types'

interface FeedbackData {
  strengths: string
  improvement: string
  rating: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  feedback?: FeedbackData
}

function parseFeedback(text: string): { clean: string; feedback: FeedbackData | null } {
  const match = text.match(/```feedback\n([\s\S]*?)```/)
  if (!match) return { clean: text.trim(), feedback: null }
  const block = match[1]
  const strengths = block.match(/Stärken:\s*(.+)/)?.[1]?.trim() ?? ''
  const improvement = block.match(/Verbesserung:\s*(.+)/)?.[1]?.trim() ?? ''
  const ratingStr = block.match(/Bewertung:\s*(\d)/)?.[1] ?? '3'
  const clean = text.replace(/```feedback[\s\S]*?```/, '').trim()
  return { clean, feedback: { strengths, improvement, rating: parseInt(ratingStr) } }
}

function FeedbackCard({ feedback }: { feedback: FeedbackData }) {
  return (
    <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800/60 p-3 space-y-2 text-xs">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <span className="text-slate-300"><span className="text-emerald-400 font-medium">Stärke:</span> {feedback.strengths}</span>
      </div>
      <div className="flex items-start gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        <span className="text-slate-300"><span className="text-amber-400 font-medium">Verbesserung:</span> {feedback.improvement}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3.5 h-3.5 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
        ))}
        <span className="text-slate-500 ml-1">{feedback.rating}/5</span>
      </div>
    </div>
  )
}

function JobSelector({ jobs, selected, onSelect }: {
  jobs: Job[]
  selected: Job | null
  onSelect: (job: Job | null) => void
}) {
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  function applyCustom() {
    if (!custom.trim()) return
    onSelect({ id: 'custom', title: custom.trim(), company: '', location: '', description: '', url: '', source: 'manual' })
  }

  return (
    <div className="space-y-3">
      {jobs.length > 0 && (
        <>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Gespeicherte Stellen</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => { onSelect(job); setShowCustom(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selected?.id === job.id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <p className="text-sm font-medium text-white leading-snug">{job.title}</p>
                {job.company && <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setShowCustom(v => !v)}
        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {showCustom ? '↑ Einklappen' : '+ Stelle manuell eingeben'}
      </button>

      {showCustom && (
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustom()}
            placeholder="z.B. Softwareentwickler @ Google"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={applyCustom}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
          >OK</button>
        </div>
      )}
    </div>
  )
}

type Step = 'setup' | 'prepare' | 'interview'

function PrepGuide({ text }: { text: string }) {
  const sections = text.split(/^## /m).filter(Boolean)
  return (
    <div className="space-y-5">
      {sections.map((section, i) => {
        const [headline, ...rest] = section.split('\n')
        const body = rest.join('\n').trim()
        const lines = body.split('\n').filter(Boolean)
        return (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">{headline.trim()}</h3>
            <div className="space-y-2">
              {lines.map((line, j) => {
                const clean = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '')
                const isBullet = /^[-*•]/.test(line) || /^\d+\./.test(line)
                if (line.startsWith('**') || line.startsWith('###')) {
                  return <p key={j} className="text-xs font-semibold text-indigo-400 mt-3">{clean.replace(/\*\*/g, '')}</p>
                }
                if (isBullet) {
                  return (
                    <div key={j} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="text-indigo-500 mt-0.5 flex-shrink-0">›</span>
                      <span>{clean.replace(/\*\*/g, '').replace(/\*/g, '')}</span>
                    </div>
                  )
                }
                return <p key={j} className="text-xs text-slate-400 leading-relaxed">{clean.replace(/\*\*/g, '')}</p>
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function InterviewPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [cvText, setCvText] = useState<string>('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('setup')
  const [prepGuide, setPrepGuide] = useState('')
  const [prepLoading, setPrepLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const state = loadState()
    setSavedJobs(state.savedJobs)
    setCvText(state.cv?.improved ?? state.cv?.raw ?? '')
    const hasSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setSpeechSupported(hasSpeech)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function startPrep() {
    if (!selectedJob) return
    setStep('prepare')
    setPrepGuide('')
    setPrepLoading(true)
    const res = await fetch('/api/interview-prep', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ job: selectedJob, cvText }),
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value, { stream: true })
      setPrepGuide(full)
    }
    setPrepLoading(false)
  }

  async function startInterview() {
    if (!selectedJob) return
    setStep('interview')
    setMessages([])
    setQuestionCount(0)
    await sendToApi([], selectedJob)
  }

  function reset() {
    setStep('setup')
    setMessages([])
    setInput('')
    setQuestionCount(0)
    setPrepGuide('')
  }

  async function sendToApi(history: Message[], job: Job, userMessage?: string) {
    const apiMessages: ChatMessage[] = history.map(m => ({ role: m.role, content: m.content }))
    if (userMessage) apiMessages.push({ role: 'user', content: userMessage })

    setLoading(true)
    let full = ''

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, job, cvText }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      const assistantMsg: Message = { role: 'assistant', content: '' }
      setMessages(prev => {
        const updated = userMessage
          ? [...prev, { role: 'user' as const, content: userMessage }, assistantMsg]
          : [...prev, assistantMsg]
        return updated
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: full }
          return copy
        })
      }

      const { clean, feedback } = parseFeedback(full)
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: clean, feedback: feedback ?? undefined }
        return copy
      })
      if (feedback) setQuestionCount(q => q + 1)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || !selectedJob) return
    const text = input.trim()
    setInput('')
    await sendToApi(messages, selectedJob, text)
  }

  const toggleMic = useCallback(() => {
    if (!speechSupported) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'de-DE'
    recognition.continuous = false
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setRecording(false)
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }, [recording, speechSupported])

  // ── Setup Screen ─────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
        <Nav hasCV={!!cvText} />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Interview-Vorbereitung</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                KI analysiert die Stelle, bereitet dich vor — dann übst du das Gespräch.
              </p>
            </div>

            {cvText && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                CV geladen — wird als Kontext verwendet
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <JobSelector jobs={savedJobs} selected={selectedJob} onSelect={setSelectedJob} />
            </div>

            {savedJobs.length === 0 && !selectedJob && (
              <p className="text-xs text-slate-600 text-center">
                Noch keine gespeicherten Stellen.{' '}
                <Link href="/jobs" className="text-indigo-400 hover:underline">Jobs suchen →</Link>
              </p>
            )}

            <div className="space-y-3">
              <button
                onClick={startPrep}
                disabled={!selectedJob}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Vorbereitung starten
              </button>
              <button
                onClick={startInterview}
                disabled={!selectedJob}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Direkt zum Gespräch
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Prepare Screen ────────────────────────────────────────────────
  if (step === 'prepare') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
        <Nav hasCV={!!cvText} />
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/50">
          <button onClick={() => setStep('setup')} className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{selectedJob?.title}</p>
            {selectedJob?.company && <p className="text-xs text-slate-500">{selectedJob.company}</p>}
          </div>
          <button
            onClick={startInterview}
            disabled={prepLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            Gespräch starten
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
          {prepLoading && !prepGuide && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Analysiere Stellenanzeige…</p>
            </div>
          )}
          {prepGuide && <PrepGuide text={prepGuide} />}
          {!prepLoading && prepGuide && (
            <button
              onClick={startInterview}
              className="w-full mt-6 py-3.5 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Jetzt Gespräch üben
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Interview Screen ──────────────────────────────────────────────
  if (step !== 'interview') return null
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Nav hasCV={!!cvText} />

      {/* Interview Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/50">
        <button onClick={reset} className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{selectedJob?.title}</p>
          {selectedJob?.company && <p className="text-xs text-slate-500">{selectedJob.company}</p>}
        </div>
        {questionCount > 0 && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">
            {questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'} beantwortet
          </span>
        )}
        <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
          <RefreshCw className="w-3.5 h-3.5" /> Neu
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Briefcase className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-slate-500">HR-Manager</span>
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-slate-800 text-slate-100 rounded-bl-sm'
              }`}>
                {msg.content || (loading && i === messages.length - 1
                  ? <span className="flex gap-1">{[0,1,2].map(d => <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}</span>
                  : ''
                )}
              </div>
              {msg.feedback && <FeedbackCard feedback={msg.feedback} />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          {speechSupported && (
            <button
              onClick={toggleMic}
              className={`flex-shrink-0 p-2.5 rounded-xl border transition-all ${
                recording
                  ? 'bg-red-600 border-red-500 text-white animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
              }`}
              title={recording ? 'Aufnahme stoppen' : 'Spracheingabe'}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={recording ? 'Aufnahme läuft…' : 'Deine Antwort — oder Mikrofon nutzen…'}
            rows={2}
            className="flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-700 mt-2">Enter zum Senden · Shift+Enter für Zeilenumbruch</p>
      </div>
    </div>
  )
}

function Nav() {
  return <JobNav />
}
