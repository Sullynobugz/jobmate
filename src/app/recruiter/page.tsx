'use client'

import Link from 'next/link'
import { Construction } from 'lucide-react'

export default function RecruiterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#020617' }}>
      <Construction className="w-12 h-12 text-emerald-400 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Recruiter-Portal</h1>
      <p className="text-slate-400 text-center max-w-sm mb-6">
        Dieser Bereich befindet sich im Aufbau. Hier können Unternehmen bald Stellen anlegen, Kandidaten matchen und KI-gestützte Interviews durchführen.
      </p>
      <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
        ← Zurück zur Startseite
      </Link>
    </div>
  )
}
