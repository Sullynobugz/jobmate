import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function ext(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Keine Datei erhalten.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const format = ext(file.name)

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (format === 'pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse')
      const { text } = await pdfParse(buffer)
      const clean = text.trim()
      if (!clean) return NextResponse.json({ error: 'PDF enthält keinen lesbaren Text (z.B. gescanntes Bild). Bitte speichere deinen CV als bearbeitbares PDF oder DOCX.' }, { status: 422 })
      return NextResponse.json({ text: clean })
    } catch (err) {
      console.error('[cv-parse] pdf-parse Fehler:', err)
      return NextResponse.json({ error: 'PDF konnte nicht gelesen werden. Bitte als DOCX oder TXT hochladen.' }, { status: 422 })
    }
  }

  // ── DOCX / DOC ───────────────────────────────────────────────────────────
  if (format === 'docx' || format === 'doc') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const clean = result.value?.trim()
      if (!clean) return NextResponse.json({ error: 'Word-Datei enthält keinen lesbaren Text.' }, { status: 422 })
      return NextResponse.json({ text: clean })
    } catch (err) {
      console.error('[cv-parse] mammoth Fehler:', err)
      return NextResponse.json({ error: 'Word-Datei konnte nicht gelesen werden.' }, { status: 422 })
    }
  }

  // ── TXT / RTF / alles andere als Plain Text ──────────────────────────────
  const text = buffer.toString('utf-8').trim()
  if (!text) return NextResponse.json({ error: 'Datei ist leer.' }, { status: 422 })
  return NextResponse.json({ text })
}
