/**
 * Header Service
 * Handles fetching header configuration from the API
 */

import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { HeaderResponse, HeaderConfiguration } from '@/lib/api/types'

/**
 * Get published header configuration
 */
export async function getHeaderConfiguration(): Promise<HeaderConfiguration | null> {
  try {
    const response = await apiGet<HeaderResponse>(API_ENDPOINTS.PUBLIC_HEADER_CONFIG)
    
    if (response.success && response.data?.header) {
      return response.data.header
    }
    
    return null
  } catch (error) {
    console.error('Error fetching header configuration:', error)
    return null
  }
}

