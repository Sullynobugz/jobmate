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
      style={{ background: 'var(--bg)' }}>

      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black text-white"
            style={{ background: 'var(--primary)' }}>
            J
          </div>
          <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>JobMate</span>
        </div>
        <p className="text-base" style={{ color: 'var(--muted)' }}>KI-gestützte Karriereplattform für beide Seiten</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        <button
          onClick={() => choose('seeker')}
          className="group flex-1 flex flex-col items-center gap-4 p-7 rounded-2xl border-2 transition-all duration-150 cursor-pointer"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary-subtle)' }}>
            <User className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Ich suche einen Job</div>
            <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              CV verbessern · passende Stellen finden · Bewerbungen tracken
            </div>
          </div>
        </button>

        <button
          onClick={() => choose('recruiter')}
          className="group flex-1 flex flex-col items-center gap-4 p-7 rounded-2xl border-2 transition-all duration-150 cursor-pointer"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary-subtle)' }}>
            <Briefcase className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Ich suche Talente</div>
            <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Anforderungen definieren · Kandidaten matchen · Shortlist erstellen
            </div>
          </div>
        </button>
      </div>

      <p className="mt-10 text-sm" style={{ color: 'var(--muted)' }}>
        Keine Registrierung · Alles lokal gespeichert
      </p>

      <p className="mt-4 text-xs" style={{ color: 'var(--border)' }}>
        Powered by TechStag
      </p>
    </main>
  )
}
