import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, cvText } = await req.json()

  const system = `Du bist ein erfahrener Karriere-Coach und CV-Experte. Du hilfst Nutzern dabei, ihren Lebenslauf zu verbessern.

Der aktuelle Lebenslauf des Nutzers:
---
${cvText || '(noch nicht hochgeladen)'}
---

Deine Aufgabe:
- Analysiere den Lebenslauf kritisch und konstruktiv
- Gib konkrete, umsetzbare Verbesserungsvorschläge
- Wenn der Nutzer eine überarbeitete Version möchte, liefere den kompletten verbesserten Text
- Beachte deutsche Bewerbungsstandards (vollständige Kontaktdaten, Foto-Hinweis, XING/LinkedIn)
- Antworte immer auf Deutsch
- Halte Antworten präzise und hilfreich`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
