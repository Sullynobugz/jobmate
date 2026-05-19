export type UserMode = 'seeker' | 'recruiter'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  url: string
  source: 'ba' | 'arbeitnow' | 'manual'
  postedAt?: string
  distance?: number // km
  lat?: number
  lng?: number
}

export type KanbanColumn = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface KanbanCard {
  jobId: string
  column: KanbanColumn
  addedAt: string
  notes?: string
}

export interface CVData {
  raw: string       // original extracted text
  improved: string  // Claude-improved version
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
}
