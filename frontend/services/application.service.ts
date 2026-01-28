import { apiPost } from '@/lib/api/client'

export interface CVFile {
  url: string
  publicId: string
  filename: string
  size?: number
  mimeType?: string
}

export interface ApplicationData {
  vacancyId: string
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  country: string
  experienceLevel: string
  educationLevel: string
  hasEngineeringDegree: 'yes' | 'no'
  languages: string[]
  coverLetter: string
  cvFile: CVFile
}

export interface ApplicationResponse {
  success: boolean
  message: string
  data: {
    applicationId: string
  }
}

/**
 * Upload CV file
 */
export async function uploadCV(file: File): Promise<CVFile> {
  const formData = new FormData()
  formData.append('file', file)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  const response = await fetch(`${baseUrl}/api/public/upload-cv`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message || 'Failed to upload CV')
  }

  const data = await response.json()
  if (data.success && data.data?.cvFile) {
    return data.data.cvFile
  }

  throw new Error('Invalid response from server')
}

/**
 * Submit job application
 */
export async function submitApplication(
  applicationData: ApplicationData
): Promise<ApplicationResponse> {
  try {
    const response = await apiPost<ApplicationResponse>(
      '/api/public/applications',
      applicationData
    )
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to submit application')
    }
    
    return response
  } catch (error) {
    console.error('Error submitting application:', error)
    throw error
  }
}

