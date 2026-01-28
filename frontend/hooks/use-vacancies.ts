"use client"

import { useState, useEffect, useCallback } from 'react'
import { getVacancies, type Vacancy } from '@/services/vacancy.service'

interface UseVacanciesReturn {
  vacancies: Vacancy[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache
let vacanciesCache: Vacancy[] | null = null
let vacanciesCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useVacancies(): UseVacanciesReturn {
  const [vacancies, setVacancies] = useState<Vacancy[]>(vacanciesCache || [])
  const [isLoading, setIsLoading] = useState(!vacanciesCache)
  const [error, setError] = useState<string | null>(null)

  const fetchVacancies = useCallback(async () => {
    const now = Date.now()
    if (vacanciesCache && now - vacanciesCacheTime < CACHE_DURATION) {
      setVacancies(vacanciesCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getVacancies()
      vacanciesCache = data
      vacanciesCacheTime = Date.now()
      setVacancies(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vacancies'
      setError(errorMessage)
      console.error('Error in useVacancies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

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

