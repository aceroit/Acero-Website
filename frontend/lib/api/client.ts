/**
 * API Client
 * Handles all API requests with proper error handling and base URL configuration
 */

import { ApiResponse } from './types'

// Get base URL from environment variable
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  } else {
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  }
}

// Get full API URL
const getApiUrl = (): string => {
  const baseUrl = getBaseUrl()
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  return `${cleanBaseUrl}`
}

/**
 * Make API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl()
  const url = `${apiUrl}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }))
      throw new Error(errorData.message || 'API request failed')
    }

    const data: ApiResponse<T> = await response.json()
    return data
  } catch (error) {
    // Handle network errors or other fetch errors
    if (error instanceof Error) {
      console.error(`API request failed for ${endpoint}:`, error.message)
      return {
        success: false,
        message: error.message || 'Network error occurred',
      }
    }
    return {
      success: false,
      message: 'An unexpected error occurred',
    }
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
  })
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  })
}

