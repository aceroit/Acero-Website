import { apiPost } from '@/lib/api/client'

export interface EnquiryData {
  purpose: 'general' | 'sales' | 'support' | 'partnership' | 'other'
  fullName: string
  companyName?: string
  mobileNumber?: string
  email: string
  country: string
  countryCode?: string
  telephoneNumber?: string
  subject: string
  message: string
  recaptchaToken?: string | null
}

export interface GetQuoteData {
  fullName: string
  email: string
  mobileNumber?: string
  recaptchaToken?: string | null
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

/**
 * Submit header Get Quote popup request
 */
export async function submitGetQuote(
  quoteData: GetQuoteData
): Promise<EnquiryResponse> {
  try {
    const response = await apiPost<EnquiryResponse>(
      '/api/public/get-quote',
      quoteData
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to submit quote request')
    }

    return response
  } catch (error) {
    console.error('Error submitting quote request:', error)
    throw error
  }
}
