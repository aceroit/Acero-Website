"use client"

import { useState, useEffect, useCallback } from 'react'
import { getBrochures, type Brochure } from '@/services/brochure.service'

interface UseBrochuresReturn {
  brochures: Brochure[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache to avoid multiple requests
let brochuresCache: Brochure[] | null = null
let brochuresCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useBrochures(): UseBrochuresReturn {
  const [brochures, setBrochures] = useState<Brochure[]>(brochuresCache || [])
  const [isLoading, setIsLoading] = useState(!brochuresCache)
  const [error, setError] = useState<string | null>(null)

  const fetchBrochures = useCallback(async () => {
    // Use cache if available and not expired
    const now = Date.now()
    if (brochuresCache && now - brochuresCacheTime < CACHE_DURATION) {
      setBrochures(brochuresCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getBrochures()
      brochuresCache = data
      brochuresCacheTime = Date.now()
      setBrochures(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch brochures'
      setError(errorMessage)
      console.error('Error in useBrochures:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrochures()
  }, [fetchBrochures])

  return {
    brochures,
    isLoading,
    error,
    refetch: fetchBrochures,
  }
}
