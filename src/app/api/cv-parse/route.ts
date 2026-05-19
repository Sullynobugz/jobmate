import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ text: '' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.name.endsWith('.pdf')) {
    // Dynamic import to avoid Edge Runtime issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return NextResponse.json({ text: data.text })
  }

  // Plain text fallback
  return NextResponse.json({ text: buffer.toString('utf-8') })
}
