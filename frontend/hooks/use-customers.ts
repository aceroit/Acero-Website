"use client"

import { useState, useEffect, useCallback } from 'react'
import { getCustomers, type Customer } from '@/services/customer.service'

interface UseCustomersReturn {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache to avoid multiple requests
let customersCache: Customer[] | null = null
let customersCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch all customers
 */
export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>(customersCache || [])
  const [isLoading, setIsLoading] = useState(!customersCache)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    // Use cache if available and not expired
    const now = Date.now()
    if (customersCache && now - customersCacheTime < CACHE_DURATION) {
      setCustomers(customersCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getCustomers()
      customersCache = data
      customersCacheTime = Date.now()
      setCustomers(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers'
      setError(errorMessage)
      console.error('Error in useCustomers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers,
  }
}

