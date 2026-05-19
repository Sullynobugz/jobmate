'use client'

import { useRouter } from 'next/navigation'
import { setMode } from '@/store/appStore'
import { Briefcase, User } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  function choose(mode: 'seeker' | 'recruiter') {
    setMode(mode)
    router.push(mode === 'seeker' ? '/cv' : '/recruiter')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 70%)' }}>

      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-2xl font-black text-white">
            J
          </div>
          <span className="text-4xl font-black text-white tracking-tight">JobMate</span>
        </div>
        <p className="text-slate-400 text-lg">KI-gestützte Karriereplattform für beide Seiten</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
        <button
          onClick={() => choose('seeker')}
          className="group flex-1 flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-slate-700 hover:border-indigo-500 bg-slate-900/60 hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 group-hover:bg-indigo-500/30 flex items-center justify-center transition-all">
            <User className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-xl mb-1">Ich suche einen Job</div>
            <div className="text-slate-400 text-sm leading-relaxed">
              CV verbessern · passende Stellen finden · Bewerbungen tracken
            </div>
          </div>
        </button>

        <button
          onClick={() => choose('recruiter')}
          className="group flex-1 flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-slate-700 hover:border-emerald-500 bg-slate-900/60 hover:bg-emerald-500/10 transition-all duration-200 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center transition-all">
            <Briefcase className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-xl mb-1">Ich suche Talente</div>
            <div className="text-slate-400 text-sm leading-relaxed">
              Anforderungen definieren · Kandidaten matchen · Shortlist erstellen
            </div>
          </div>
        </button>
      </div>

      <p className="mt-12 text-slate-600 text-sm">Keine Registrierung · Alles lokal gespeichert</p>
    </main>
  )
}
