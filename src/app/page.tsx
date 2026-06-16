'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutGrid, ChevronRight, PlusCircle, Upload, ShieldCheck, Sparkles } from 'lucide-react'
import { captureWidFromUrl, loadState } from '@/store/appStore'

export default function Home() {
  const router = useRouter()
  const [widLinked, setWidLinked] = useState(false)
  const [hasCv, setHasCv] = useState(false)

  useEffect(() => {
    const wid = captureWidFromUrl()

    const state = loadState()
    setWidLinked(!!state.widCode || !!wid)
    setHasCv(!!state.cv?.raw)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-xl"
          style={{ background: 'var(--primary)' }}>
          J
        </div>
        <div>
          <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>JobMate</span>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--muted)' }}>Enter · Linguu · JobMate</p>
        </div>
      </div>

      <p className="text-base text-center mb-10" style={{ color: 'var(--muted)' }}>
        Dein KI-Assistent für die Jobsuche in Deutschland
      </p>

      {widLinked && (
        <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{ background: 'var(--primary-subtle)', borderColor: 'rgba(79,70,229,0.25)', color: 'var(--primary)' }}>
          <ShieldCheck className="w-4 h-4" />
          <span className="text-sm font-semibold">Teil deines Enter-Programms</span>
        </div>
      )}

      {/* Einstieg */}
      <div className="w-full max-w-sm">
        <p className="font-bold text-xl text-center mb-1" style={{ color: 'var(--text)' }}>
          Was möchtest du als Nächstes tun?
        </p>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
          Jobs suchen, CV bearbeiten oder Bewerbungen organisieren
        </p>

        <div className="flex flex-col gap-3 mb-7">
          <button
            onClick={() => router.push('/jobs')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#10b981')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <Search className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Stellenanzeigen suchen</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Beschreibe mit Stichworten, was dich interessiert</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          </button>

          <button
            onClick={() => router.push('/board')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#f59e0b')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)' }}>
              <LayoutGrid className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Bewerbungen tracken</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Gemerkte Jobs im Kanban-Board verwalten</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Lebenslauf</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/cv?start=upload')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-subtle)' }}>
              <Upload className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Ja, ich habe einen</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Hochladen — dann gemeinsam verbessern</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          </button>

          <button
            onClick={() => router.push('/cv?start=create')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#10b981')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Noch nicht</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>KI führt dich Schritt für Schritt durch die Erstellung</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {hasCv && (
          <button
            onClick={() => router.push('/cv')}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 text-sm font-medium cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            Weiter mit deinem Lebenslauf
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-10 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>Keine Registrierung · Alles lokal im Browser gespeichert</span>
      </div>
    </main>
  )
}
