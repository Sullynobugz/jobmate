import { NextRequest, NextResponse } from 'next/server'
import type { Job } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const page = searchParams.get('page') || '1'

  const jobs: Job[] = []

  // Bundesagentur für Arbeit API
  try {
    const baParams = new URLSearchParams({
      was: query,
      wo: location,
      umkreis: '50',
      page,
      size: '20',
    })
    const baRes = await fetch(
      `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${baParams}`,
      {
        headers: {
          'X-API-Key': 'jobboerse-jobsuche',
          'Accept': 'application/json',
        },
      }
    )
    if (baRes.ok) {
      const data = await baRes.json()
      const items = data.stellenangebote ?? []
      for (const item of items) {
        jobs.push({
          id: `ba_${item.hashId}`,
          title: item.titel ?? '',
          company: item.arbeitgeber ?? '',
          location: item.arbeitsort?.ort ?? '',
          description: item.kurzbeschreibung ?? '',
          url: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${item.hashId}`,
          source: 'ba',
          postedAt: item.eintrittsdatum ?? undefined,
          lat: item.arbeitsort?.koordinaten?.lat,
          lng: item.arbeitsort?.koordinaten?.lon,
        })
      }
    }
  } catch {
    // BA API nicht erreichbar — weiter
  }

  // Arbeitnow API (aggregiert viele Quellen)
  try {
    const anParams = new URLSearchParams({
      search: query,
      location,
      page,
    })
    const anRes = await fetch(
      `https://www.arbeitnow.com/api/job-board-api?${anParams}`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (anRes.ok) {
      const data = await anRes.json()
      const items = data.data ?? []
      for (const item of items) {
        jobs.push({
          id: `an_${item.slug}`,
          title: item.title ?? '',
          company: item.company_name ?? '',
          location: item.location ?? '',
          description: item.description?.slice(0, 300) ?? '',
          url: item.url ?? '',
          source: 'arbeitnow',
          postedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : undefined,
        })
      }
    }
  } catch {
    // Arbeitnow nicht erreichbar — weiter
  }

  return NextResponse.json({ jobs })
}
