'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Search, LayoutGrid, ChevronRight, PlusCircle, Upload, ShieldCheck } from 'lucide-react'
import { captureWidFromUrl, loadState } from '@/store/appStore'

export default function Home() {
  const router = useRouter()
  const [widLinked, setWidLinked] = useState(false)

  useEffect(() => {
    const wid = captureWidFromUrl()

    const state = loadState()
    setWidLinked(!!state.widCode || !!wid)
    if (state.cv?.raw) {
      router.replace('/cv')
    }
  }, [router])

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
          <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--muted)' }}>WID · Linguu · JobMate</p>
        </div>
      </div>

      <p className="text-base text-center mb-10" style={{ color: 'var(--muted)' }}>
        Dein KI-Assistent für die Jobsuche in Deutschland
      </p>

      {widLinked && (
        <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{ background: 'var(--primary-subtle)', borderColor: 'rgba(79,70,229,0.25)', color: 'var(--primary)' }}>
          <ShieldCheck className="w-4 h-4" />
          <span className="text-sm font-semibold">Teil deines WID-Integrationsprogramms</span>
        </div>
      )}

      {/* Feature-Karten */}
      <div className="flex flex-col gap-2.5 mb-12 w-full max-w-sm">
        {[
          { icon: FileText,   label: 'Lebenslauf verbessern', sub: 'Claude analysiert und optimiert deinen CV auf Deutsch', color: 'var(--primary)' },
          { icon: Search,     label: 'Passende Jobs finden',  sub: 'Bundesagentur für Arbeit und weitere Quellen',          color: '#10b981' },
          { icon: LayoutGrid, label: 'Bewerbungen tracken',   sub: 'Kanban-Board — wer hat geantwortet, wer nicht',         color: '#f59e0b' },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="card flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}15` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
              <p className="text-xs leading-snug" style={{ color: 'var(--muted)' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Einstiegsfrage */}
      <div className="w-full max-w-sm">
        <p className="font-bold text-xl text-center mb-1" style={{ color: 'var(--text)' }}>
          Hast du bereits einen Lebenslauf?
        </p>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
          Das bestimmt, wie wir starten
        </p>

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
      </div>

      <p className="mt-10 text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>
        Keine Registrierung · Alles lokal im Browser gespeichert
      </p>
    </main>
  )
}
