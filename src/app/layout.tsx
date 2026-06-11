import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PHProvider } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JobMate — KI-Karriereplattform',
  description: 'CV verbessern, Jobs finden und Bewerbungen tracken mit KI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col antialiased"><PHProvider>{children}</PHProvider></body>
    </html>
  )
}
