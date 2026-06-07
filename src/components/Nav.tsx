'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Search, Kanban, MessageSquare } from 'lucide-react'

const navItems = [
  { href: '/cv',        label: 'CV',        icon: FileText },
  { href: '/jobs',      label: 'Jobs',       icon: Search },
  { href: '/board',     label: 'Board',      icon: Kanban },
  { href: '/interview', label: 'Interview',  icon: MessageSquare },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-between px-5 py-3 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
          style={{ background: 'var(--primary)' }}>
          J
        </div>
        <span className="font-bold" style={{ color: 'var(--text)' }}>JobMate</span>
      </Link>

      <div className="hidden sm:flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? 'var(--primary-subtle)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--muted)',
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
              style={{ color: active ? 'var(--primary)' : 'var(--muted)' }}>
              <Icon className="w-5 h-5" />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
