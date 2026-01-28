import { apiPost } from '@/lib/api/client'

export interface EnquiryData {
  purpose: 'general' | 'sales' | 'support' | 'partnership' | 'other'
  fullName: string
  companyName?: string
  mobileNumber: string
  email: string
  country: string
  countryCode?: string
  telephoneNumber?: string
  subject: string
  message: string
}

export interface EnquiryResponse {
  success: boolean
  message: string
  data: {
    enquiryId: string
  }
}

/**
 * Submit contact form enquiry
 */
export async function submitEnquiry(
  enquiryData: EnquiryData
): Promise<EnquiryResponse> {
  try {
    const response = await apiPost<EnquiryResponse>(
      '/api/public/enquiries',
      enquiryData
    )
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to submit enquiry')
    }
    
    return response
  } catch (error) {
    console.error('Error submitting enquiry:', error)
    throw error
  }
}

