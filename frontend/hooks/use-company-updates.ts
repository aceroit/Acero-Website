"use client"

import { useState, useEffect, useCallback } from 'react'
import { getCompanyUpdates, getCompanyUpdateBySlug, type CompanyUpdate } from '@/services/company-update.service'

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
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

let companyUpdateCache: Record<string, CompanyUpdate | null> = {}
let companyUpdateCacheTime: Record<string, number> = {}

/**
 * Hook to fetch all company updates
 */
export function useCompanyUpdates(): UseCompanyUpdatesReturn {
  const [companyUpdates, setCompanyUpdates] = useState<CompanyUpdate[]>(companyUpdatesCache || [])
  const [isLoading, setIsLoading] = useState(!companyUpdatesCache)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanyUpdates = useCallback(async () => {
    // Use cache if available and not expired
    const now = Date.now()
    if (companyUpdatesCache && now - companyUpdatesCacheTime < CACHE_DURATION) {
      setCompanyUpdates(companyUpdatesCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getCompanyUpdates()
      companyUpdatesCache = data
      companyUpdatesCacheTime = Date.now()
      setCompanyUpdates(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company updates'
      setError(errorMessage)
      console.error('Error in useCompanyUpdates:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanyUpdates()
  }, [fetchCompanyUpdates])

  return {
    companyUpdates,
    isLoading,
    error,
    refetch: fetchCompanyUpdates,
  }
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
