'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Send, FileText, ArrowRight, Download, Search, Kanban, ChevronRight, PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { loadState, saveCV, saveChatHistory } from '@/store/appStore'
import type { ChatMessage } from '@/types'
import Link from 'next/link'
import { Nav } from '@/components/Nav'

type Mode = 'choice' | 'upload' | 'create' | 'improve'

const CV_MARKER_START = '--- LEBENSLAUF ---'
const CV_MARKER_END = '--- ENDE ---'

function extractCvFromMessage(text: string): string | null {
  const start = text.indexOf(CV_MARKER_START)
  const end = text.indexOf(CV_MARKER_END)
  if (start === -1 || end === -1) return null
  return text.slice(start + CV_MARKER_START.length, end).trim()
}

export default function CVPage() {
  const [mode, setMode] = useState<Mode>('choice')
  const [cvText, setCvText] = useState('')
  const [filename, setFilename] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cvCreated, setCvCreated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const state = loadState()
    const existing = state.cv?.improved || state.cv?.raw || ''
    if (existing) {
      setCvText(existing)
      setFilename(state.cv?.filename || 'Mein Lebenslauf')
      setMessages(state.chatHistory || [])
      setMode('improve')
      return
    }
    const params = new URLSearchParams(window.location.search)
    const start = params.get('start')
    if (start === 'create') startCreateMode()
    else if (start === 'upload') setMode('improve') // zeigt Upload-Dropzone direkt
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleFile(file: File) {
    setUploading(true)
    setMode('upload')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/cv-parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) {
        const errMsg: ChatMessage = {
          role: 'assistant',
          content: `❌ ${data.error ?? 'Datei konnte nicht gelesen werden.'} Bitte lade eine TXT-Datei hoch oder kopiere deinen Lebenslauf direkt ins Textfeld.`,
        }
        setMessages([errMsg])
        saveChatHistory([errMsg])
        return
      }
      const text: string = data.text
      setCvText(text)
      setFilename(file.name)
      saveCV({ raw: text, improved: text, filename: file.name, updatedAt: new Date().toISOString() })
      const welcome: ChatMessage = {
        role: 'assistant',
        content: `✅ Lebenslauf **${file.name}** hochgeladen und analysiert.\n\nWas möchtest du verbessern? Ich kann dir Feedback geben, Formulierungen überarbeiten oder einen komplett überarbeiteten Entwurf erstellen.`,
      }
      setMessages([welcome])
      saveChatHistory([welcome])
      setMode('improve')
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: '❌ Netzwerkfehler beim Upload. Bitte versuche es erneut.',
      }
      setMessages([errMsg])
    } finally {
      setUploading(false)
    }
  }

  function startCreateMode() {
    const firstMsg: ChatMessage = {
      role: 'assistant',
      content: 'Hallo! Ich helfe dir, einen professionellen Lebenslauf zu erstellen. 📄\n\nFangen wir mit deinen persönlichen Daten an:\n\n**Wie lautet dein vollständiger Name?**',
    }
    setMessages([firstMsg])
    saveChatHistory([firstMsg])
    setMode('create')
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/cv-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          cvText: mode === 'improve' ? cvText : undefined,
          mode: mode === 'create' ? 'create' : 'improve',
        }),
      })

      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
      setMessages(prev => [...prev, assistantMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantText },
        ])
      }

      const finalHistory = [...newMessages, { role: 'assistant' as const, content: assistantText }]
      saveChatHistory(finalHistory)

      // Erstellter CV aus Marker extrahieren (create mode)
      if (mode === 'create') {
        const extracted = extractCvFromMessage(assistantText)
        if (extracted) {
          setCvText(extracted)
          setFilename('Mein Lebenslauf')
          saveCV({ raw: extracted, improved: extracted, filename: 'Mein Lebenslauf.txt', updatedAt: new Date().toISOString() })
          setCvCreated(true)
        }
      }

      // Verbesserter CV im improve mode
      if (mode === 'improve' && (assistantText.includes('---') || assistantText.length > 500)) {
        saveCV({
          raw: loadState().cv?.raw || cvText,
          improved: assistantText,
          filename,
          updatedAt: new Date().toISOString(),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  function downloadCV() {
    const blob = new Blob([cvText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename.replace(/\.[^.]+$/, '')}_improved.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetCV() {
    setCvText('')
    setFilename('')
    setMessages([])
    setMode('choice')
    setCvCreated(false)
    saveChatHistory([])
    saveCV({ raw: '', improved: '', filename: '', updatedAt: new Date().toISOString() })
  }

  // ---- CHOICE SCREEN ----
  if (mode === 'choice') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
        <Nav />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="text-5xl mb-4">📄</div>
              <h1 className="text-2xl font-bold text-white mb-2">Lebenslauf</h1>
              <p className="text-slate-400">Hast du bereits einen Lebenslauf oder möchtest du einen erstellen?</p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-700 hover:border-indigo-500 bg-slate-900/50 hover:bg-slate-800/50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Lebenslauf hochladen</p>
                  <p className="text-slate-400 text-sm mt-0.5">PDF, DOCX, TXT — dann direkt verbessern</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 ml-auto group-hover:text-indigo-400 transition-colors" />
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.rtf" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              <button
                onClick={startCreateMode}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-700 hover:border-emerald-500 bg-slate-900/50 hover:bg-slate-800/50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <PlusCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Lebenslauf erstellen</p>
                  <p className="text-slate-400 text-sm mt-0.5">Noch keinen? KI führt dich Schritt für Schritt</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 ml-auto group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- MAIN LAYOUT (create / improve) ----
  const isCreateMode = mode === 'create'
  const chatDisabled = mode === 'improve' && !cvText

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      <Nav />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: CV Preview */}
        <div className="w-2/5 border-r border-slate-800 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 text-sm font-medium">Lebenslauf</span>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.rtf" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            {!cvText ? (
              /* Upload-Dropzone */
              isCreateMode ? (
                <div className="text-center">
                  <div className="text-4xl mb-4 animate-pulse">✍️</div>
                  <p className="text-slate-300 font-semibold mb-2">Lebenslauf wird erstellt</p>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Beantworte die Fragen im Chat — dein Lebenslauf erscheint hier sobald er fertig ist.
                  </p>
                </div>
              ) : (
                <div
                  className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-all group"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(file)
                  }}
                >
                  <Upload className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 mx-auto mb-3 transition-colors" />
                  <p className="text-slate-300 font-semibold mb-1">Lebenslauf hochladen</p>
                  <p className="text-slate-500 text-sm">PDF · DOCX · TXT · Drag & Drop</p>
                  {uploading && <p className="text-indigo-400 text-sm mt-3 animate-pulse">Wird verarbeitet...</p>}
                </div>
              )
            ) : (
              /* Datei-Info — kein langer Text, nur Dateiname + Aktionen */
              <div className="w-full space-y-3">
                {cvCreated && (
                  <div className="px-3 py-2 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    ✅ Lebenslauf erstellt!
                  </div>
                )}
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-900/60 border border-slate-700">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-200 font-semibold text-sm truncate max-w-full">{filename || 'Lebenslauf'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{cvText.length} Zeichen · bereit zur Verbesserung</p>
                  </div>
                  <button
                    onClick={downloadCV}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Herunterladen
                  </button>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-600 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Andere Datei hochladen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-slate-300 font-semibold mb-2">Dein KI-Karriere-Coach</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  {isCreateMode
                    ? 'Ich führe dich Schritt für Schritt durch die Erstellung deines Lebenslaufs.'
                    : 'Lade deinen Lebenslauf hoch — dann analysiere ich ihn und gebe dir konkrete Verbesserungsvorschläge.'}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end chat-msg-user' : 'justify-start chat-msg-bot'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {msg.role === 'assistant' && isCreateMode
                      ? msg.content
                          .replace(new RegExp(`${CV_MARKER_START}[\\s\\S]*?${CV_MARKER_END}`, 'g'), '✅ *Lebenslauf gespeichert — sieh links!*')
                      : msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-slate-800">
            {cvCreated && isCreateMode && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setMode('improve'); setCvCreated(false) }}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Lebenslauf weiter verbessern
                </button>
                <Link href="/jobs"
                  className="flex-1 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-2"
                >
                  Jobs suchen
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={
                  isCreateMode
                    ? 'Antworte auf die Frage...'
                    : chatDisabled
                    ? 'Lade zuerst deinen Lebenslauf hoch'
                    : 'Frag mich etwas zu deinem Lebenslauf...'
                }
                disabled={chatDisabled || loading}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || chatDisabled}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-4 py-3 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
