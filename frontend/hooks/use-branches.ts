"use client"

import { useState, useEffect, useCallback } from 'react'
import { getBranchesGroupedByCountry, type CountryWithBranches } from '@/services/branch.service'

let branchesCache: CountryWithBranches[] | null = null
let branchesCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useBranches() {
  const [countries, setCountries] = useState<CountryWithBranches[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBranches = useCallback(async () => {
    const now = Date.now()
    if (branchesCache && now - branchesCacheTime < CACHE_DURATION) {
      setCountries(branchesCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getBranchesGroupedByCountry()
      branchesCache = data
      branchesCacheTime = Date.now()
      setCountries(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch branches'))
      console.error('Error in useBranches:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  return { countries, isLoading, error, refetch: fetchBranches }
}
