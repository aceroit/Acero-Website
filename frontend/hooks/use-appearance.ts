"use client"

import { useState, useEffect } from 'react'
import { getWebsiteAppearance } from '@/services/appearance.service'
import type { WebsiteAppearance } from '@/lib/api/types'

interface UseAppearanceReturn {
  appearance: WebsiteAppearance | null
  isLoading: boolean
  error: Error | null
}

// Simple cache to avoid multiple requests
let appearanceCache: WebsiteAppearance | null = null
let appearanceCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAppearance(): UseAppearanceReturn {
  const [appearance, setAppearance] = useState<WebsiteAppearance | null>(appearanceCache)
  const [isLoading, setIsLoading] = useState(!appearanceCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Use cache if available and not expired
    const now = Date.now()
    if (appearanceCache && now - appearanceCacheTime < CACHE_DURATION) {
      setAppearance(appearanceCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    getWebsiteAppearance()
      .then((data) => {
        if (data) {
          appearanceCache = data
          appearanceCacheTime = Date.now()
          setAppearance(data)
        } else {
          setError(new Error('No website appearance found'))
        }
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to fetch website appearance')
        setError(error)
        console.error('Error in useAppearance:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return { appearance, isLoading, error }
}

