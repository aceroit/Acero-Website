"use client"

import { useState, useEffect } from 'react'
import { getFormConfiguration } from '@/services/form-configuration.service'
import type { FormConfiguration } from '@/lib/api/types'

const DEFAULT_SECTION = {
  thankYouTimeout: 5,
  thankYouRedirectUrl: '/',
}

export const defaultFormConfiguration: FormConfiguration = {
  career: { ...DEFAULT_SECTION },
  contact: { ...DEFAULT_SECTION },
}

interface UseFormConfigurationReturn {
  formConfiguration: FormConfiguration | null
  isLoading: boolean
  error: Error | null
}

// Simple cache to avoid multiple requests
let formConfigCache: FormConfiguration | null = null
let formConfigCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useFormConfiguration(): UseFormConfigurationReturn {
  const [formConfiguration, setFormConfiguration] = useState<FormConfiguration | null>(
    formConfigCache
  )
  const [isLoading, setIsLoading] = useState(!formConfigCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const now = Date.now()
    if (formConfigCache && now - formConfigCacheTime < CACHE_DURATION) {
      setFormConfiguration(formConfigCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    getFormConfiguration()
      .then((data) => {
        if (data) {
          formConfigCache = data
          formConfigCacheTime = Date.now()
          setFormConfiguration(data)
        } else {
          setError(new Error('No form configuration found'))
        }
      })
      .catch((err) => {
        const errObj = err instanceof Error ? err : new Error('Failed to fetch form configuration')
        setError(errObj)
        console.error('Error in useFormConfiguration:', errObj)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return { formConfiguration, isLoading, error }
}
