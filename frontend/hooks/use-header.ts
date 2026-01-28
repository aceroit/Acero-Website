"use client"

import { useState, useEffect } from 'react'
import { getHeaderConfiguration } from '@/services/header.service'
import type { HeaderConfiguration } from '@/lib/api/types'

interface UseHeaderReturn {
  header: HeaderConfiguration | null
  isLoading: boolean
  error: Error | null
}

// Simple cache to avoid multiple requests
let headerCache: HeaderConfiguration | null = null
let headerCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useHeader(): UseHeaderReturn {
  const [header, setHeader] = useState<HeaderConfiguration | null>(headerCache)
  const [isLoading, setIsLoading] = useState(!headerCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Use cache if available and not expired
    const now = Date.now()
    if (headerCache && now - headerCacheTime < CACHE_DURATION) {
      setHeader(headerCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    getHeaderConfiguration()
      .then((data) => {
        if (data) {
          headerCache = data
          headerCacheTime = Date.now()
          setHeader(data)
        } else {
          setError(new Error('No header configuration found'))
        }
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to fetch header configuration')
        setError(error)
        console.error('Error in useHeader:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return { header, isLoading, error }
}

