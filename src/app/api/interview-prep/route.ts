import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { job, cvText } = await req.json()

  const prompt = `Erstelle einen strukturierten Vorbereitungsleitfaden für ein Bewerbungsgespräch auf Deutsch.

**Stelle:** ${job.title}${job.company ? ` bei ${job.company}` : ''}
${job.description ? `**Stellenbeschreibung:**\n${job.description.slice(0, 1000)}\n` : ''}
${cvText ? `**Lebenslauf des Bewerbers:**\n${cvText.slice(0, 1500)}\n` : ''}

Erstelle einen präzisen, umsetzbaren Leitfaden mit genau diesen 4 Abschnitten:

## 🎯 Antizipierte Fragen
6–8 konkrete Fragen die der Recruiter wahrscheinlich stellen wird. Pro Frage: 1–2 Sätze zur optimalen Antwortstruktur (STAR-Methode wo sinnvoll).

## 💡 Deine Stärken für diese Stelle
3–4 Punkte die den Bewerber für genau diese Stelle qualifizieren — direkt aus CV und Stellenbeschreibung abgeleitet.

## ❓ Fragen an den Recruiter
5 durchdachte Fragen die der Bewerber stellen sollte — zeigen echtes Interesse und kritisches Denken.

## 🧭 Gesprächsstrategie
3–4 konkrete Tipps für dieses spezifische Gespräch — Ton, Schwerpunkte, worauf besonders zu achten ist.

Keine Floskeln. Direkt und umsetzbar.`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1600,
    messages: [{ role: 'user', content: prompt }],
  })

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}
