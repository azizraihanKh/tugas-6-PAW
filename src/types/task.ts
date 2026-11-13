export type TaskStatus = 'Belum Selesai' | 'Selesai'

export interface Task {
  id: number
  course: string
  title: string
  description: string
  deadline: string
  resultLink?: string
}