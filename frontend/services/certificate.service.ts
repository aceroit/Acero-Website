import { apiGet } from '@/lib/api/client'

export interface CertificateResponse {
  success: boolean
  message: string
  data: {
    certifications: Certificate[]
    count: number
  }
}

export interface Certificate {
  _id: string
  name: string
  certificationImage?: {
    url: string
    publicId: string
    width: number
    height: number
  }
  link?: string
  status: string
  featured: boolean
  isActive: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Fetch all published and featured certifications
 */
export async function getCertificates(): Promise<Certificate[]> {
  try {
    const response = await apiGet<CertificateResponse>('/api/public/certifications')
    
    if (response.success && response.data) {
      const certificates = response.data.certifications || []
      return certificates
    }
    
    return []
  } catch (error) {
    console.error('Error fetching certificates:', error)
    throw error
  }
}

