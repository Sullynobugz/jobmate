'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, Search, Kanban, MessageSquare, ShieldCheck } from 'lucide-react'
import { getWidCode } from '@/store/appStore'

const navItems = [
  { href: '/cv',        label: 'CV',        icon: FileText },
  { href: '/jobs',      label: 'Jobs',       icon: Search },
  { href: '/board',     label: 'Board',      icon: Kanban },
  { href: '/interview', label: 'Interview',  icon: MessageSquare },
]

export function Nav() {
  const pathname = usePathname()
  const [widCode, setWidCode] = useState<string | undefined>()

  useEffect(() => {
    setWidCode(getWidCode())
  }, [])

  return (
    <nav className="border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {widCode && (
        <div className="px-5 py-2 border-b text-xs flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--border)', background: 'rgba(245,158,11,0.08)', color: 'var(--warning)' }}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold">WID-Programm verknüpft</span>
          <span className="font-mono">{widCode}</span>
          <span className="hidden sm:inline" style={{ color: 'var(--muted)' }}>
            · gespeicherte Jobs und Bewerbungen fließen ins Reporting
          </span>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            J
          </div>
          <div>
            <span className="font-bold leading-none" style={{ color: 'var(--text)' }}>JobMate</span>
            <p className="text-[10px] leading-none mt-0.5 hidden sm:block" style={{ color: 'var(--muted)' }}>
              WID · Linguu · JobMate
            </p>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
                  color: active ? 'var(--warning)' : 'var(--muted)',
                  textDecoration: 'none',
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="sm:hidden flex items-center gap-3">
          {navItems.map(({ href, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                style={{ color: active ? 'var(--warning)' : 'var(--muted)' }}>
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
