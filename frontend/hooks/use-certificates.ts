"use client"

import { useState, useEffect, useCallback } from 'react'
import { getCertificates, type Certificate } from '@/services/certificate.service'

interface UseCertificatesReturn {
  certificates: Certificate[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache to avoid multiple requests
let certificatesCache: Certificate[] | null = null
let certificatesCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch all certificates
 */
export function useCertificates(): UseCertificatesReturn {
  const [certificates, setCertificates] = useState<Certificate[]>(certificatesCache || [])
  const [isLoading, setIsLoading] = useState(!certificatesCache)
  const [error, setError] = useState<string | null>(null)

  const fetchCertificates = useCallback(async () => {
    // Use cache if available and not expired
    const now = Date.now()
    if (certificatesCache && now - certificatesCacheTime < CACHE_DURATION) {
      setCertificates(certificatesCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getCertificates()
      certificatesCache = data
      certificatesCacheTime = Date.now()
      setCertificates(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch certificates'
      setError(errorMessage)
      console.error('Error in useCertificates:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  return {
    certificates,
    isLoading,
    error,
    refetch: fetchCertificates,
  }
}

