"use client"

import { useState, useEffect, useCallback } from 'react'
import { getVacancies, type Vacancy, type VacancyQueryOptions } from '@/services/vacancy.service'

interface UseVacanciesReturn {
  vacancies: Vacancy[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface VacancyCacheEntry {
  data: Vacancy[]
  timestamp: number
}

const vacancyCache = new Map<string, VacancyCacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(options: VacancyQueryOptions = {}) {
  return JSON.stringify({ featured: options.featured ?? 'all' })
}

export function useVacancies(options: VacancyQueryOptions = {}): UseVacanciesReturn {
  const cacheKey = getCacheKey(options)
  const cachedEntry = vacancyCache.get(cacheKey)

  const [vacancies, setVacancies] = useState<Vacancy[]>(cachedEntry?.data || [])
  const [isLoading, setIsLoading] = useState(!cachedEntry)
  const [error, setError] = useState<string | null>(null)

  const fetchVacancies = useCallback(async () => {
    const cached = vacancyCache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setVacancies(cached.data)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getVacancies(options)
      vacancyCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })
      setVacancies(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vacancies'
      setError(errorMessage)
      console.error('Error in useVacancies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, options])

  useEffect(() => {
    fetchVacancies()
  }, [fetchVacancies])

  return {
    vacancies,
    isLoading,
    error,
    refetch: fetchVacancies,
  }
}