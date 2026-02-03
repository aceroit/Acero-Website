"use client"

import { useState, useEffect, useCallback } from 'react'
import { getCompanyUpdates, getCompanyUpdateBySlug, getHomePageCompanyUpdates, type CompanyUpdate } from '@/services/company-update.service'

interface UseCompanyUpdatesReturn {
  companyUpdates: CompanyUpdate[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseCompanyUpdateReturn {
  companyUpdate: CompanyUpdate | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache to avoid multiple requests
let companyUpdatesCache: CompanyUpdate[] | null = null
let companyUpdatesCacheTime: number = 0
let homeCompanyUpdatesCache: CompanyUpdate[] | null = null
let homeCompanyUpdatesCacheTime: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minute so backend date/content updates show sooner

let companyUpdateCache: Record<string, CompanyUpdate | null> = {}
let companyUpdateCacheTime: Record<string, number> = {}

interface UseCompanyUpdatesOptions {
  forHome?: boolean
}

/**
 * Hook to fetch company updates. When forHome is true, fetches home page updates (showOnHomePage only, max 3).
 */
export function useCompanyUpdates(options?: UseCompanyUpdatesOptions): UseCompanyUpdatesReturn {
  const forHome = options?.forHome ?? false
  const initialCache = forHome ? homeCompanyUpdatesCache : companyUpdatesCache
  const [companyUpdates, setCompanyUpdates] = useState<CompanyUpdate[]>(initialCache || [])
  const [isLoading, setIsLoading] = useState(!initialCache)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanyUpdates = useCallback(async () => {
    const now = Date.now()
    const cache = forHome ? homeCompanyUpdatesCache : companyUpdatesCache
    const cacheTime = forHome ? homeCompanyUpdatesCacheTime : companyUpdatesCacheTime
    if (cache && now - cacheTime < CACHE_DURATION) {
      setCompanyUpdates(cache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = forHome ? await getHomePageCompanyUpdates() : await getCompanyUpdates()
      if (forHome) {
        homeCompanyUpdatesCache = data
        homeCompanyUpdatesCacheTime = Date.now()
      } else {
        companyUpdatesCache = data
        companyUpdatesCacheTime = Date.now()
      }
      setCompanyUpdates(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company updates'
      setError(errorMessage)
      console.error('Error in useCompanyUpdates:', err)
    } finally {
      setIsLoading(false)
    }
  }, [forHome])

  useEffect(() => {
    fetchCompanyUpdates()
  }, [fetchCompanyUpdates])

  // When user returns to the tab, invalidate cache and refetch so backend updates (e.g. date changes) show
  useEffect(() => {
    const onFocus = () => {
      if (forHome) {
        homeCompanyUpdatesCache = null
        homeCompanyUpdatesCacheTime = 0
      } else {
        companyUpdatesCache = null
        companyUpdatesCacheTime = 0
      }
      fetchCompanyUpdates()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [forHome, fetchCompanyUpdates])

  return {
    companyUpdates,
    isLoading,
    error,
    refetch: fetchCompanyUpdates,
  }
}

/**
 * Hook to fetch home page company updates (showOnHomePage only, max 3). Convenience wrapper around useCompanyUpdates({ forHome: true }).
 */
export function useHomeCompanyUpdates(): UseCompanyUpdatesReturn {
  return useCompanyUpdates({ forHome: true })
}

/**
 * Hook to fetch a single company update by slug
 */
export function useCompanyUpdate(slug: string): UseCompanyUpdateReturn {
  const [companyUpdate, setCompanyUpdate] = useState<CompanyUpdate | null>(
    companyUpdateCache[slug] || null
  )
  const [isLoading, setIsLoading] = useState(!companyUpdateCache[slug])
  const [error, setError] = useState<string | null>(null)

  const fetchCompanyUpdate = useCallback(async () => {
    if (!slug) {
      setCompanyUpdate(null)
      setIsLoading(false)
      return
    }

    // Use cache if available and not expired
    const now = Date.now()
    if (companyUpdateCache[slug] && (companyUpdateCacheTime[slug] || 0) + CACHE_DURATION > now) {
      setCompanyUpdate(companyUpdateCache[slug])
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getCompanyUpdateBySlug(slug)
      companyUpdateCache[slug] = data
      companyUpdateCacheTime[slug] = Date.now()
      setCompanyUpdate(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company update'
      setError(errorMessage)
      console.error('Error in useCompanyUpdate:', err)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchCompanyUpdate()
  }, [fetchCompanyUpdate])

  return {
    companyUpdate,
    isLoading,
    error,
    refetch: fetchCompanyUpdate,
  }
}
