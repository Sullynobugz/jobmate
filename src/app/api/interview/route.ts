import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystem(job: { title: string; company?: string; description?: string }, cvText?: string): string {
  const companyLine = job.company ? `bei ${job.company}` : ''
  return `Du bist ein erfahrener HR-Manager ${companyLine} und führst ein Vorstellungsgespräch für die Stelle "${job.title}" auf Deutsch.

${job.description ? `**Stellenbeschreibung (Auszug):**\n${job.description.slice(0, 800)}\n` : ''}
${cvText ? `**Lebenslauf des Bewerbers:**\n${cvText.slice(0, 2000)}\n` : ''}

**Deine Aufgabe:** Führe ein realistisches, professionelles Gespräch mit 5–7 Fragen.

**Format jeder deiner Antworten (Ausnahme: erste Begrüßung):**
Reagiere kurz auf die letzte Antwort, stelle dann die nächste Frage — dann füge exakt diesen Block an:

\`\`\`feedback
Stärken: [Was konkret gut war — 1 Satz]
Verbesserung: [Was besser sein könnte — 1 Satz]
Bewertung: [Zahl 1–5]
\`\`\`

**Erste Nachricht:** Stell dich kurz vor, erkläre den Ablauf, stelle als erste Frage "Erzählen Sie mir kurz etwas über sich."
**Abschluss (nach ~6 Antworten):** Schreibe eine Gesamtauswertung als abschließendes Feedback — ohne weiteren Feedback-Block.
**Stil:** Professionell, freundlich, realistisch. Keine übertrieben langen Antworten.`
}

export async function POST(req: NextRequest) {
  const { messages, job, cvText } = await req.json()

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystem(job, cvText),
    messages,
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
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    }
  )
}
