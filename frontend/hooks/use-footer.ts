"use client"

import { useState, useEffect } from 'react'
import { getFooterConfiguration } from '@/services/footer.service'
import type { FooterConfiguration } from '@/lib/api/types'

interface UseFooterReturn {
  footer: FooterConfiguration | null
  isLoading: boolean
  error: Error | null
}

// Simple cache to avoid multiple requests
let footerCache: FooterConfiguration | null = null
let footerCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useFooter(): UseFooterReturn {
  const [footer, setFooter] = useState<FooterConfiguration | null>(footerCache)
  const [isLoading, setIsLoading] = useState(!footerCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Use cache if available and not expired
    const now = Date.now()
    if (footerCache && now - footerCacheTime < CACHE_DURATION) {
      setFooter(footerCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    getFooterConfiguration()
      .then((data) => {
        if (data) {
          footerCache = data
          footerCacheTime = Date.now()
          setFooter(data)
        } else {
          setError(new Error('No footer configuration found'))
        }
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to fetch footer configuration')
        setError(error)
        console.error('Error in useFooter:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return { footer, isLoading, error }
}

