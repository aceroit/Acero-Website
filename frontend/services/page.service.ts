/**
 * Page Service
 * Handles fetching page and sections data from the API
 */

import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { PageResponse, Page } from '@/lib/api/types'

/**
 * Get published page by slug with sections
 */
export async function getPageBySlug(slug: string): Promise<PageResponse | null> {
  try {
    const endpoint = `${API_ENDPOINTS.PUBLIC_PAGE_BY_SLUG}/${slug}`
    const response = await apiGet<PageResponse>(endpoint)
    
    if (response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    console.error('Error fetching page by slug:', error)
    return null
  }
}

/**
 * Get published page by path with sections
 */
export async function getPageByPath(path: string): Promise<PageResponse | null> {
  try {
    const response = await apiGet<PageResponse>(
      `${API_ENDPOINTS.PUBLIC_PAGE_BY_PATH}?path=${encodeURIComponent(path)}`
    )
    
    if (response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    console.error('Error fetching page by path:', error)
    return null
  }
}

