'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Search, LayoutGrid, ChevronRight, PlusCircle, Upload } from 'lucide-react'
import { setWidCode, loadState } from '@/store/appStore'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // ?wid= param von WID abspeichern
    const params = new URLSearchParams(window.location.search)
    const wid = params.get('wid')
    if (wid) {
      setWidCode(wid)
      const url = new URL(window.location.href)
      url.searchParams.delete('wid')
      window.history.replaceState({}, '', url.toString())
    }

    // Wiederkehrender Nutzer mit gespeichertem Lebenslauf → direkt zur CV-Seite
    const state = loadState()
    if (state.cv?.raw) {
      router.replace('/cv')
    }
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-xl bg-indigo-600">
          J
        </div>
        <span className="text-3xl font-black tracking-tight text-white">JobMate</span>
      </div>

      <p className="text-slate-400 text-base text-center mb-10">
        Dein KI-Assistent für die Jobsuche in Deutschland
      </p>

      {/* Was JobMate macht */}
      <div className="flex flex-col gap-2.5 mb-12 w-full max-w-sm">
        {[
          { icon: FileText, label: 'Lebenslauf verbessern', sub: 'Claude analysiert und optimiert deinen CV auf Deutsch' },
          { icon: Search, label: 'Passende Jobs finden', sub: 'Bundesagentur für Arbeit und weitere Quellen' },
          { icon: LayoutGrid, label: 'Bewerbungen tracken', sub: 'Kanban-Board — wer hat geantwortet, wer nicht' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-slate-500 text-xs leading-snug">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Die Frage */}
      <div className="w-full max-w-sm">
        <p className="text-white text-center font-bold text-xl mb-1">
          Hast du bereits einen Lebenslauf?
        </p>
        <p className="text-slate-500 text-sm text-center mb-6">
          Das bestimmt, wie wir starten
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/cv?start=upload')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-700 hover:border-indigo-500 bg-slate-900/50 hover:bg-slate-800/50 transition-all group text-left cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
              <Upload className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Ja, ich habe einen</p>
              <p className="text-slate-400 text-sm">Hochladen — dann gemeinsam verbessern</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </button>

          <button
            onClick={() => router.push('/cv?start=create')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-700 hover:border-emerald-500 bg-slate-900/50 hover:bg-slate-800/50 transition-all group text-left cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Noch nicht</p>
              <p className="text-slate-400 text-sm">KI führt dich Schritt für Schritt durch die Erstellung</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>
      </div>

      <p className="mt-10 text-xs text-slate-700">
        Keine Registrierung · Alles lokal im Browser gespeichert
      </p>
    </main>
  )
}
