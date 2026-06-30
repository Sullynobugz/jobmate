import { NextRequest, NextResponse } from 'next/server'
import type { Job } from '@/types'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'JobMate/1.0' } }
    )
    const data = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

function relativeDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  return iso
}

const REMOTE_KEYWORDS = ['remote', 'homeoffice', 'home office', 'mobiles arbeiten', 'mobile arbeit', 'full remote', 'fully remote']

function detectRemote(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  return REMOTE_KEYWORDS.some(kw => text.includes(kw))
}

function locationMatches(jobLocation: string, userLocation: string): boolean {
  if (!userLocation) return true
  const jl = jobLocation.toLowerCase()
  const ul = userLocation.toLowerCase()
  return jl.includes(ul) || ul.includes(jl)
}

const STOP_WORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'und', 'oder', 'mit', 'fur', 'von', 'im', 'in', 'am', 'an', 'auf', 'als', 'zu',
  'job', 'jobs', 'stelle', 'stellen', 'arbeit',
])

// Bidirektionale Synonym-Gruppen. Index 0 = bevorzugter API-Suchbegriff.
const SYNONYM_GROUPS: string[][] = [
  ['kunstliche intelligenz', 'ki', 'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'generative ai', 'llm', 'chatgpt', 'gpt', 'nlp', 'neural network', 'neuronales netz'],
  ['softwareentwickler', 'software developer', 'entwickler', 'programmer', 'programmierer', 'softwareentwicklung', 'software engineer', 'webentwickler', 'web developer', 'fullstack', 'frontend', 'backend'],
  ['buchhalter', 'buchhaltung', 'accountant', 'finanzbuchhaltung', 'rechnungswesen', 'bilanzbuchhalter', 'steuerfachangestellter'],
  ['pflegefachkraft', 'pflegekraft', 'krankenpflege', 'krankenschwester', 'altenpflege', 'altenpfleger', 'pflegerin', 'pfleger', 'pflegehelfer', 'gesundheitspflege'],
  ['vertrieb', 'sales', 'aussendienst', 'akquise', 'verkaufer', 'verkauf', 'account manager', 'kundenbetreuer', 'handelsvertreter'],
  ['projektmanager', 'projektleiter', 'project manager', 'projektmanagement', 'projektleitung', 'scrum master', 'agile coach'],
  ['ux', 'user experience', 'ui', 'user interface', 'ux design', 'ui design', 'produktdesign', 'interfacedesign', 'interaction design'],
  ['datenanalyse', 'data analyst', 'data scientist', 'data science', 'datenanalyst', 'datenwissenschaft', 'business intelligence', 'bi analyst', 'sql', 'tableau', 'power bi'],
  ['marketing', 'online marketing', 'digitalmarketing', 'seo', 'suchmaschinenoptimierung', 'sem', 'content marketing', 'performance marketing', 'growth hacker', 'social media manager'],
  ['erzieher', 'erzieherin', 'sozialpadagoge', 'sozialer dienst', 'kita', 'kindergarten', 'fruhkindliche bildung', 'padagogik', 'sozialpadagogik'],
  ['fahrer', 'kraftfahrer', 'lkw fahrer', 'berufskraftfahrer', 'lieferant', 'lieferfahrer', 'transportfahrer'],
  ['lagerlogistik', 'lagerarbeiter', 'lagerhaltung', 'logistik', 'kommissionierer', 'warehouse', 'lager'],
  ['elektriker', 'elektroinstallateur', 'elektroniker', 'elektrotechniker', 'elektrofachkraft', 'elektrik', 'elektro'],
  ['reinigung', 'reinigungskraft', 'gebaudereinigung', 'hausmeister', 'hausreinigung', 'facility management'],
  ['kundenservice', 'kundendienst', 'customer service', 'kundenbetreuung', 'support', 'helpdesk', 'callcenter', 'hotline'],
  ['teilzeit', 'part time', 'parttime', 'halbtags', 'stundenweise', 'minijob', 'geringfugig'],
  ['quereinstieg', 'karrierewechsel', 'umschulung', 'quereinsteiger', 'berufsumstieg', 'neueinsteiger'],
  ['dozent', 'lehrer', 'ausbilder', 'trainer', 'lehrbeauftragter', 'kursleiter', 'lehrerin', 'ausbilderin', 'coach', 'weiterbildung'],
  ['arzt', 'mediziner', 'facharzt', 'hausarzt', 'allgemeinmedizin', 'medizin', 'physician', 'doctor'],
  ['hr', 'personalwesen', 'personalabteilung', 'human resources', 'recruiter', 'recruiting', 'personalreferent'],
  ['controlling', 'controller', 'finanzen', 'finance', 'kpi', 'reporting', 'finanzanalyse'],
  ['it sicherheit', 'cybersecurity', 'informationssicherheit', 'security analyst', 'penetration testing', 'it security'],
  ['cloud', 'aws', 'azure', 'google cloud', 'devops', 'kubernetes', 'docker', 'infrastruktur'],
  ['ecommerce', 'e-commerce', 'onlineshop', 'shopify', 'amazon', 'marktplatz', 'webshop'],
]

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'ae')
    .replace(/Ö/g, 'oe')
    .replace(/Ü/g, 'ue')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&[#a-z0-9]+;/gi, ' ')
    .replace(/[^a-z0-9+.#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function queryTokens(query: string): string[] {
  return normalizeSearchText(query)
    .split(/[\s,;|/]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t))
}

function getSynonymsForToken(token: string): string[] {
  for (const group of SYNONYM_GROUPS) {
    const normGroup = group.map(normalizeSearchText)
    if (normGroup.includes(token)) {
      return normGroup.filter(t => t !== token)
    }
  }
  return []
}

function containsSearchTerm(text: string, term: string): boolean {
  if (term.length <= 2) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[\\s])${escaped}([\\s]|$)`).test(text)
  }
  return text.includes(term)
}

function relevanceScore(job: Job, query: string): number {
  const normalizedQuery = normalizeSearchText(query)
  const tokens = queryTokens(query)
  if (!normalizedQuery || tokens.length === 0) return 1

  const allSearchTerms = new Set<string>([normalizedQuery])
  for (const token of tokens) {
    allSearchTerms.add(token)
    for (const syn of getSynonymsForToken(token)) {
      allSearchTerms.add(syn)
    }
  }

  const titleText = normalizeSearchText([job.title, job.tags?.join(' ')].filter(Boolean).join(' '))
  const fullText = normalizeSearchText([
    job.title,
    job.company,
    job.location,
    job.description,
    job.jobType,
    job.tags?.join(' '),
  ].filter(Boolean).join(' '))

  let score = 0
  for (const term of allSearchTerms) {
    if (containsSearchTerm(titleText, term)) score += 10
    else if (containsSearchTerm(fullText, term)) score += 5
  }

  const matchedTokens = tokens.filter(token => {
    const candidates = [token, ...getSynonymsForToken(token)]
    return candidates.some(t => containsSearchTerm(fullText, t))
  }).length

  const enoughTokenCoverage = tokens.length <= 2
    ? matchedTokens === tokens.length
    : matchedTokens >= 2

  return score > 0 && (score >= 5 || enoughTokenCoverage) ? score : 0
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const radius = parseInt(searchParams.get('radius') || '50', 10)
  const remote = searchParams.get('remote') || 'any'
  const page = searchParams.get('page') || '1'
  const country = searchParams.get('country') || 'de'  // 'de' = nur Deutschland, 'world' = international

  const jobs: Job[] = []
  const seen = new Set<string>()

  let userCoords: { lat: number; lng: number } | null = null
  if (location && remote !== 'remote') {
    userCoords = await geocode(location)
  }

  // ─── 1. Bundesagentur für Arbeit ────────────────────────────────────────────
  // Läuft immer — auch bei "Nur Remote", weil BA viele Mobile-Arbeiten-Stellen hat.
  // Remote-Filter passiert nach dem Einlesen.
  try {
    const baParams = new URLSearchParams({
      was: query,
      wo: location || 'Deutschland',
      umkreis: String(radius),
      page,
      size: '50',
    })
    const baRes = await fetch(
      `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${baParams}`,
      { headers: { 'X-API-Key': 'jobboerse-jobsuche', Accept: 'application/json' } }
    )
    if (baRes.ok) {
      const data = await baRes.json()
      for (const item of data.stellenangebote ?? []) {
        const refnr = item.refnr
        if (!refnr) continue
        const id = `ba_${refnr}`
        if (seen.has(id)) continue
        seen.add(id)
        const lat = item.arbeitsort?.koordinaten?.lat
        const lng = item.arbeitsort?.koordinaten?.lon
        const distanceKm = item.arbeitsort?.entfernung
          ? parseInt(item.arbeitsort.entfernung, 10)
          : userCoords && lat && lng
            ? Math.round(haversineKm(userCoords.lat, userCoords.lng, lat, lng))
            : undefined
        const isRemoteBa = detectRemote(item.titel ?? '', item.kurzbeschreibung ?? '')
        if (remote === 'remote' && !isRemoteBa) continue
        if (remote === 'onsite' && isRemoteBa) continue
        if (userCoords && distanceKm !== undefined && distanceKm > radius && !isRemoteBa) continue
        const url = item.externeUrl || `https://www.arbeitsagentur.de/jobsuche/jobdetail/${refnr}`
        jobs.push({
          id,
          title: item.titel ?? '',
          company: item.arbeitgeber ?? '',
          location: isRemoteBa ? `${item.arbeitsort?.ort ?? ''} (Remote möglich)` : (item.arbeitsort?.ort ?? ''),
          description: item.kurzbeschreibung ?? '',
          url,
          source: 'ba',
          postedAt: relativeDate(item.aktuelleVeroeffentlichungsdatum ?? item.eintrittsdatum),
          lat,
          lng,
          distance: isRemoteBa ? undefined : distanceKm,
          remote: isRemoteBa,
        })
      }
    }
  } catch { /* BA nicht erreichbar */ }

  // ─── 2. Arbeitnow (DE-fokussierter Aggregator) ──────────────────────────────
  try {
    const anParams = new URLSearchParams({ search: query, location, page })
    const anRes = await fetch(`https://www.arbeitnow.com/api/job-board-api?${anParams}`, {
      headers: { Accept: 'application/json' },
    })
    if (anRes.ok) {
      const data = await anRes.json()
      for (const item of data.data ?? []) {
        const id = `an_${item.slug}`
        if (seen.has(id)) continue
        seen.add(id)
        const isRemote = item.remote === true || detectRemote(item.title ?? '', item.description ?? '')
        if (remote === 'remote' && !isRemote) continue
        if (remote === 'onsite' && isRemote) continue
        if (location && !isRemote && !locationMatches(item.location ?? '', location)) continue
        jobs.push({
          id,
          title: item.title ?? '',
          company: item.company_name ?? '',
          location: isRemote ? 'Remote' : (item.location ?? ''),
          description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
          url: item.url ?? '',
          source: 'arbeitnow',
          postedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : undefined,
          remote: isRemote,
          tags: item.tags?.slice(0, 5) ?? [],
        })
      }
    }
  } catch { /* Arbeitnow nicht erreichbar */ }

  // ─── 3. Remotive (Remote-Jobs, international) ────────────────────────────────
  // Nur bei country === 'world' oder wenn explizit Remote gewählt
  if (remote !== 'onsite' && (country === 'world' || remote === 'remote')) {
    try {
      const remotiveParams = new URLSearchParams({ search: query, limit: '20' })
      const rRes = await fetch(`https://remotive.com/api/remote-jobs?${remotiveParams}`, {
        headers: { Accept: 'application/json' },
      })
      if (rRes.ok) {
        const data = await rRes.json()
        for (const item of (data.jobs ?? []).slice(0, 20)) {
          const id = `remotive_${item.id}`
          if (seen.has(id)) continue
          seen.add(id)
          jobs.push({
            id,
            title: item.title ?? '',
            company: item.company_name ?? '',
            location: item.candidate_required_location || 'Weltweit',
            description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
            url: item.url ?? '',
            source: 'remotive',
            postedAt: item.publication_date,
            remote: true,
            salary: item.salary || undefined,
            jobType: item.job_type || undefined,
            tags: item.tags?.slice(0, 5) ?? [],
          })
        }
      }
    } catch { /* Remotive nicht erreichbar */ }
  }

  // ─── 4. RemoteOK (international) ─────────────────────────────────────────────
  // Nur bei country === 'world' oder wenn explizit Remote gewählt
  if (remote !== 'onsite' && query && (country === 'world' || remote === 'remote')) {
    try {
      const tags = query.toLowerCase().replace(/\s+/g, ',')
      const rokRes = await fetch(`https://remoteok.com/api?tags=${encodeURIComponent(tags)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'JobMate/1.0' },
      })
      if (rokRes.ok) {
        const data: unknown[] = await rokRes.json()
        for (const item of (data.slice(1) as Record<string, unknown>[]).slice(0, 15)) {
          const slug = item.slug as string | undefined
          if (!slug) continue
          const id = `rok_${slug}`
          if (seen.has(id)) continue
          seen.add(id)
          jobs.push({
            id,
            title: (item.position as string) ?? '',
            company: (item.company as string) ?? '',
            location: (item.location as string) || 'Remote',
            description: ((item.description as string) ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
            url: (item.url as string) ?? `https://remoteok.com/jobs/${slug}`,
            source: 'remoteok',
            postedAt: item.date as string | undefined,
            remote: true,
            salary: item.salary as string | undefined,
            tags: ((item.tags as string[]) ?? []).slice(0, 5),
          })
        }
      }
    } catch { /* RemoteOK nicht erreichbar */ }
  }

  // ─── 5. Adzuna (optional, mit API-Key) ──────────────────────────────────────
  const adzunaId = process.env.ADZUNA_APP_ID
  const adzunaKey = process.env.ADZUNA_APP_KEY
  if (adzunaId && adzunaKey) {
    try {
      const adzunaParams = new URLSearchParams({
        app_id: adzunaId,
        app_key: adzunaKey,
        results_per_page: '20',
        what: query,
        where: location || 'Deutschland',
        distance: String(radius),
        content_type: 'application/json',
      })
      const aRes = await fetch(
        `https://api.adzuna.com/v1/api/jobs/de/search/${page}?${adzunaParams}`,
        { headers: { Accept: 'application/json' } }
      )
      if (aRes.ok) {
        const data = await aRes.json()
        for (const item of data.results ?? []) {
          const id = `adzuna_${item.id}`
          if (seen.has(id)) continue
          seen.add(id)
          const isRemote = detectRemote(item.title as string ?? '', item.description as string ?? '')
          if (remote === 'remote' && !isRemote) continue
          if (remote === 'onsite' && isRemote) continue
          const salaryMin = item.salary_min ? Math.round(item.salary_min) : undefined
          const salaryMax = item.salary_max ? Math.round(item.salary_max) : undefined
          const salary = salaryMin && salaryMax
            ? `${salaryMin.toLocaleString('de-DE')}–${salaryMax.toLocaleString('de-DE')} €`
            : undefined
          jobs.push({
            id,
            title: item.title ?? '',
            company: item.company?.display_name ?? '',
            location: item.location?.display_name ?? '',
            description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
            url: item.redirect_url ?? '',
            source: 'adzuna',
            postedAt: item.created,
            remote: isRemote,
            salary,
            jobType: item.contract_type === 'permanent' ? 'Festanstellung' : item.contract_type,
          })
        }
      }
    } catch { /* Adzuna nicht erreichbar */ }
  }

  // ─── 6. Jooble (optional, mit API-Key) ─────────────────────────────────────
  const joobleKey = process.env.JOOBLE_API_KEY
  if (joobleKey && query) {
    try {
      const jRes = await fetch(`https://jooble.org/api/${joobleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: query,
          location: location || 'Deutschland',
          radius: String(radius),
          page,
        }),
      })
      if (jRes.ok) {
        const data = await jRes.json()
        for (const item of (data.jobs ?? []).slice(0, 20)) {
          const id = `jooble_${item.id}`
          if (seen.has(id)) continue
          seen.add(id)
          const isRemote = detectRemote(item.title as string ?? '', (item.snippet as string ?? '') + ' ' + (item.type as string ?? ''))
          if (remote === 'remote' && !isRemote) continue
          if (remote === 'onsite' && isRemote) continue
          jobs.push({
            id,
            title: item.title ?? '',
            company: item.company ?? '',
            location: item.location ?? '',
            description: (item.snippet ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
            url: item.link ?? '',
            source: 'jooble',
            postedAt: item.updated,
            remote: isRemote,
            salary: item.salary || undefined,
            jobType: item.type || undefined,
          })
        }
      }
    } catch { /* Jooble nicht erreichbar */ }
  }

  const scoredJobs = query.trim()
    ? jobs
        .map(job => ({ job, score: relevanceScore(job, query) }))
        .filter(item => item.score > 0)
    : jobs.map(job => ({ job, score: 0 }))

  scoredJobs.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    const jobA = a.job
    const jobB = b.job
    if (jobA.distance !== undefined && jobB.distance !== undefined) return jobA.distance - jobB.distance
    if (jobA.distance !== undefined) return -1
    if (jobB.distance !== undefined) return 1
    if (jobA.postedAt && jobB.postedAt) return new Date(jobB.postedAt).getTime() - new Date(jobA.postedAt).getTime()
    return 0
  })

  const relevantJobs = scoredJobs.map(item => item.job)
  const sources = [...new Set(relevantJobs.map(j => j.source))]
  return NextResponse.json({ jobs: relevantJobs, total: relevantJobs.length, sources, centerCoords: userCoords })
}
