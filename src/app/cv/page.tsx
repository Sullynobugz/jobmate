'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Send, FileText, ArrowRight, Download } from 'lucide-react'
import { loadState, saveCV, saveChatHistory } from '@/store/appStore'
import type { ChatMessage } from '@/types'
import Link from 'next/link'

export default function CVPage() {
  const router = useRouter()
  const state = loadState()

  const [cvText, setCvText] = useState(state.cv?.improved || state.cv?.raw || '')
  const [filename, setFilename] = useState(state.cv?.filename || '')
  const [messages, setMessages] = useState<ChatMessage[]>(state.chatHistory || [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/cv-parse', { method: 'POST', body: formData })
      const { text } = await res.json()
      setCvText(text)
      setFilename(file.name)
      saveCV({ raw: text, improved: text, filename: file.name, updatedAt: new Date().toISOString() })
      const welcome: ChatMessage = {
        role: 'assistant',
        content: `✅ Lebenslauf **${file.name}** hochgeladen. Ich habe ihn analysiert und bin bereit, dir zu helfen.\n\nWas möchtest du verbessern? Ich kann dir Feedback geben, Formulierungen überarbeiten oder einen komplett überarbeiteten Entwurf erstellen.`,
      }
      const newHistory = [welcome]
      setMessages(newHistory)
      saveChatHistory(newHistory)
    } finally {
      setUploading(false)
    }
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
          cvText,
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

      // If response contains an improved CV, save it
      if (assistantText.includes('---') || assistantText.length > 500) {
        const improved = assistantText
        saveCV({
          raw: state.cv?.raw || cvText,
          improved,
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020617' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm">J</div>
          <span className="text-white font-bold">JobMate</span>
        </Link>
        <div className="flex items-center gap-3">
          {cvText && (
            <button onClick={downloadCV} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500">
              <Download className="w-4 h-4" />
              Herunterladen
            </button>
          )}
          {cvText && (
            <Link href="/jobs" className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors">
              Jobs finden
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Left: CV Preview */}
        <div className="w-2/5 border-r border-slate-800 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 text-sm font-medium">
              {filename || 'Lebenslauf'}
            </span>
          </div>

          {!cvText ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div
                className="w-full max-w-sm border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer transition-all group"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
              >
                <Upload className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 mx-auto mb-4 transition-colors" />
                <p className="text-slate-300 font-semibold mb-1">Lebenslauf hochladen</p>
                <p className="text-slate-500 text-sm">PDF oder TXT · Drag & Drop</p>
                {uploading && <p className="text-indigo-400 text-sm mt-3">Wird verarbeitet...</p>}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/50 rounded-xl p-4 min-h-full">
                {cvText}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-slate-300 font-semibold mb-2">Dein KI-Karriere-Coach</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  Lade deinen Lebenslauf hoch — dann analysiere ich ihn und gebe dir konkrete Verbesserungsvorschläge.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
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
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={cvText ? 'Frag mich etwas zu deinem Lebenslauf...' : 'Lade zuerst deinen Lebenslauf hoch'}
                disabled={!cvText || loading}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || !cvText}
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
