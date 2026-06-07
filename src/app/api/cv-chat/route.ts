import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_IMPROVE = (cvText: string) => `Du bist ein erfahrener Karriere-Coach und CV-Experte. Du hilfst Nutzern dabei, ihren Lebenslauf zu verbessern.

Der aktuelle Lebenslauf des Nutzers:
---
${cvText}
---

Deine Aufgabe:
- Analysiere den Lebenslauf kritisch und konstruktiv
- Gib konkrete, umsetzbare Verbesserungsvorschläge
- Wenn der Nutzer eine überarbeitete Version möchte, liefere den VOLLSTÄNDIGEN verbesserten Lebenslauf
- Beachte deutsche Bewerbungsstandards (Kontaktdaten, Foto-Hinweis, XING/LinkedIn, Reverse-Chronologie)
- Antworte immer auf Deutsch, präzise und hilfreich`

const SYSTEM_CREATE = `Du bist ein erfahrener Karriere-Coach und hilfst dabei, einen professionellen Lebenslauf zu erstellen.

Führe den Nutzer Schritt für Schritt durch die wichtigsten Abschnitte:
1. Persönliche Daten (Name, Kontakt, Geburtsort/-datum optional)
2. Berufserfahrung (Positionen, Unternehmen, Zeitraum, Aufgaben)
3. Ausbildung (Abschlüsse, Institutionen, Zeitraum)
4. Fähigkeiten & Kenntnisse (Sprachen, Software, Zertifikate)
5. Weitere Informationen (Hobbys, Ehrenamt — optional)

Wichtige Regeln:
- Stelle EINE Frage nach der anderen — nicht alles auf einmal
- Bestätige jede Antwort kurz und geh zur nächsten Frage
- Wenn alle Abschnitte gesammelt sind, erstelle den VOLLSTÄNDIGEN Lebenslauf in einem sauberen Textformat
- Kennzeichne den fertigen Lebenslauf mit "--- LEBENSLAUF ---" am Anfang und "--- ENDE ---" am Ende
- Antworte immer auf Deutsch
- Halte dich kurz und freundlich`

export async function POST(req: NextRequest) {
  const { messages, cvText, mode } = await req.json()

  const system = mode === 'create' ? SYSTEM_CREATE : SYSTEM_IMPROVE(cvText ?? '')

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
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
