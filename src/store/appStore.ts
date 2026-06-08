'use client'

import type { AppState, CVData, Job, KanbanCard, KanbanColumn, ChatMessage, UserMode, SearchPreferences } from '@/types'

const KEY = 'jobmate_state'

const DEFAULT_PREFS: SearchPreferences = {
  location: '',
  radius: 50,
  remote: 'any',
  jobTypes: [],
}

function defaultState(): AppState {
  return { mode: null, cv: null, savedJobs: [], kanban: [], chatHistory: [], preferences: DEFAULT_PREFS }
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return { ...defaultState(), ...parsed, preferences: { ...DEFAULT_PREFS, ...(parsed.preferences ?? {}) } }
  } catch {
    return defaultState()
  }
}

function save(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function setMode(mode: UserMode) {
  const s = loadState()
  save({ ...s, mode })
}

export function saveCV(cv: CVData) {
  const s = loadState()
  save({ ...s, cv })
}

export function saveChatHistory(history: ChatMessage[]) {
  const s = loadState()
  save({ ...s, chatHistory: history })
}

export function savePreferences(prefs: SearchPreferences) {
  const s = loadState()
  save({ ...s, preferences: prefs })
}

export function addJob(job: Job) {
  const s = loadState()
  if (s.savedJobs.find(j => j.id === job.id)) return
  save({ ...s, savedJobs: [...s.savedJobs, job] })
}

export function removeJob(jobId: string) {
  const s = loadState()
  save({
    ...s,
    savedJobs: s.savedJobs.filter(j => j.id !== jobId),
    kanban: s.kanban.filter(k => k.jobId !== jobId),
  })
}

export function addToKanban(jobId: string, column: KanbanColumn = 'saved') {
  const s = loadState()
  if (s.kanban.find(k => k.jobId === jobId)) return
  const card: KanbanCard = { jobId, column, addedAt: new Date().toISOString() }
  save({ ...s, kanban: [...s.kanban, card] })
}

export function moveKanbanCard(jobId: string, column: KanbanColumn, extra?: { appliedAt?: string; emailProof?: string }) {
  const s = loadState()
  save({
    ...s,
    kanban: s.kanban.map(k => k.jobId === jobId
      ? { ...k, column, ...(extra ?? {}) }
      : k),
  })
}

export function toggleStar(jobId: string) {
  const s = loadState()
  save({
    ...s,
    kanban: s.kanban.map(k => k.jobId === jobId ? { ...k, starred: !k.starred } : k),
  })
}

export function updateKanbanNote(jobId: string, notes: string) {
  const s = loadState()
  save({
    ...s,
    kanban: s.kanban.map(k => k.jobId === jobId ? { ...k, notes } : k),
  })
}

export function getJobById(jobId: string): Job | undefined {
  return loadState().savedJobs.find(j => j.id === jobId)
}

export function getWidCode(): string | undefined {
  return loadState().widCode
}

export function setWidCode(code: string) {
  const s = loadState()
  save({ ...s, widCode: code.trim().toUpperCase() })
}

async function sendWidEvent(type: 'job_saved' | 'application', data: Record<string, unknown>) {
  const widCode = getWidCode()
  if (!widCode) return
  try {
    await fetch('https://wid.techstag.de/api/participant/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        participantCode: widCode,
        app: 'jobmate',
        type,
        data,
      }),
    })
  } catch { /* ignorieren — Tracking ist optional */ }
}

export async function trackJobSavedToWid(job: Job) {
  await sendWidEvent('job_saved', {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    jobUrl: job.url,
  })
}

export async function trackApplicationToWid(job: Job, appliedAt: string, emailProof?: string) {
  await sendWidEvent('application', {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    jobUrl: job.url,
    appliedAt,
    emailProof: emailProof ?? null,
  })
}
