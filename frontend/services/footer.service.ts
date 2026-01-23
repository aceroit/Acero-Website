/**
 * Footer Service
 * Handles fetching footer configuration from the API
 */

import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { FooterResponse, FooterConfiguration } from '@/lib/api/types'

/**
 * Get published footer configuration
 */
export async function getFooterConfiguration(): Promise<FooterConfiguration | null> {
  try {
    const response = await apiGet<FooterResponse>(API_ENDPOINTS.PUBLIC_FOOTER_CONFIG)
    
    if (response.success && response.data?.footer) {
      return response.data.footer
    }
    
    return null
  } catch (error) {
    console.error('Error fetching footer configuration:', error)
    return null
  }
}

