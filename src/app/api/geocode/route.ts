import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=de`,
    { headers: { 'User-Agent': 'JobMate/1.0' } }
  )

  if (!res.ok) return NextResponse.json({ lat: null, lng: null })
  const data = await res.json()
  const first = data[0]
  return NextResponse.json({
    lat: first ? parseFloat(first.lat) : null,
    lng: first ? parseFloat(first.lon) : null,
  })
}
