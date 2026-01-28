import { apiGet } from '@/lib/api/client'

export interface BrochureResponse {
  success: boolean
  message: string
  data: {
    brochures: Brochure[]
    count: number
  }
}

export interface Brochure {
  _id: string
  title: string
  brochureImage: {
    url: string
    publicId: string
    width: number
    height: number
  }
  description?: string
  languages?: Array<{
    languageCode: string
    languageName: string
    fileUrl: string
  }>
  order: number
  featured: boolean
  status: string
  isActive: boolean
  downloadLink?: string
}

/**
 * Fetch all published and featured brochures from the backend
 */
export async function getBrochures(): Promise<Brochure[]> {
  try {
    const response = await apiGet<BrochureResponse>('/api/public/brochures')
    
    if (response.success && response.data) {
      return response.data.brochures || []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching brochures:', error)
    throw error
  }
}
