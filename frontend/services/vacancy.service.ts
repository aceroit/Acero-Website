import { apiGet } from '@/lib/api/client'

export interface Vacancy {
  _id: string
  title: string
  department: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract'
  description?: string
  requirements?: string[]
  responsibilities?: string[]
  experienceLevels?: Array<{ value: string; label: string }>
  educationLevels?: Array<{ value: string; label: string }>
  languages?: Array<{ value: string; label: string }>
  notificationEmail: string
  status: string
  featured: boolean
  isActive: boolean
  publishedAt?: string
  createdAt: string
}

export interface VacancyResponse {
  success: boolean
  message: string
  data: {
    vacancies: Vacancy[]
    count: number
  }
}

export async function getVacancies(): Promise<Vacancy[]> {
  try {
    const response = await apiGet<VacancyResponse>('/api/public/vacancies')
    
    if (response.success && response.data) {
      return response.data.vacancies || []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching vacancies:', error)
    throw error
  }
}

