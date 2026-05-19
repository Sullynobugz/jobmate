'use client'

import type { AppState, CVData, Job, KanbanCard, KanbanColumn, ChatMessage, UserMode } from '@/types'

const KEY = 'jobmate_state'

function defaultState(): AppState {
  return { mode: null, cv: null, savedJobs: [], kanban: [], chatHistory: [] }
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState()
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

export function moveKanbanCard(jobId: string, column: KanbanColumn) {
  const s = loadState()
  save({
    ...s,
    kanban: s.kanban.map(k => k.jobId === jobId ? { ...k, column } : k),
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
