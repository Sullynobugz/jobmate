export type UserMode = 'seeker' | 'recruiter'

export type JobSource = 'ba' | 'arbeitnow' | 'remotive' | 'remoteok' | 'adzuna' | 'jooble' | 'manual'

export type RemotePreference = 'any' | 'remote' | 'onsite'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  url: string
  source: JobSource
  postedAt?: string
  distance?: number
  lat?: number
  lng?: number
  remote?: boolean
  salary?: string
  jobType?: string
  tags?: string[]
}

export interface SearchPreferences {
  location: string
  radius: number
  remote: RemotePreference
  jobTypes: string[]
}

export type KanbanColumn = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface KanbanCard {
  jobId: string
  column: KanbanColumn
  addedAt: string
  notes?: string
  appliedAt?: string    // Timestamp wenn in "applied" verschoben
  emailProof?: string   // Optionaler E-Mail-Betreff als Nachweis
  starred?: boolean
}

export interface CVData {
  raw: string
  improved: string
  filename: string
  updatedAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AppState {
  mode: UserMode | null
  cv: CVData | null
  savedJobs: Job[]
  kanban: KanbanCard[]
  chatHistory: ChatMessage[]
  preferences: SearchPreferences
  widCode?: string    // WID-Teilnehmer-Code für Tracking
}
