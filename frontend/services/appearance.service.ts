/**
 * Appearance Service
 * Handles fetching website appearance configuration from the API
 */

import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { AppearanceResponse, WebsiteAppearance } from '@/lib/api/types'

/**
 * Get published website appearance configuration
 */
export async function getWebsiteAppearance(): Promise<WebsiteAppearance | null> {
  try {
    const response = await apiGet<AppearanceResponse>(API_ENDPOINTS.PUBLIC_APPEARANCE_CONFIG)
    
    if (response.success && response.data?.appearance) {
      return response.data.appearance
    }
    
    return null
  } catch (error) {
    console.error('Error fetching website appearance:', error)
    return null
  }
}

