/**
 * Form Configuration Service
 * Fetches thank-you timeout and redirect settings for Contact/Career forms
 */

import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { FormConfiguration, FormConfigurationResponse } from '@/lib/api/types'

/**
 * Get active form configuration (thank-you timeout and redirect per contact/career)
 */
export async function getFormConfiguration(): Promise<FormConfiguration | null> {
  try {
    const response = await apiGet<FormConfigurationResponse>(
      API_ENDPOINTS.PUBLIC_FORM_CONFIGURATION
    )

    if (response.success && response.data?.config) {
      return response.data.config
    }

    return null
  } catch (error) {
    console.error('Error fetching form configuration:', error)
    return null
  }
}
