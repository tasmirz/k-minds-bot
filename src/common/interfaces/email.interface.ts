export interface Email {
  from?: string
  to: string
  subject: string
  body: string
  html?: string
}

export interface User {
  email: string
  batch?: number
  role: 'student' | 'teacher' | 'alumny' | 'admin'
  discord_id?: bigint
  telegram_id?: string
  name?: string
  status: boolean
  term?: string
  created_at?: Date
  updated_at?: Date
}
