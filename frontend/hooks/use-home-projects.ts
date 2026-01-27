"use client"

import { useState, useEffect, useCallback } from 'react'
import { getHomePageProjects, type Project } from '@/services/project.service'

interface UseHomePageProjectsReturn {
  projects: Project[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

let homePageProjectsCache: Project[] | null = null
let homePageProjectsCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch projects shown on home page (showOnHomePage only, max 6)
 */
export function useHomePageProjects(): UseHomePageProjectsReturn {
  const [projects, setProjects] = useState<Project[]>(homePageProjectsCache || [])
  const [isLoading, setIsLoading] = useState(!homePageProjectsCache)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    const now = Date.now()
    if (homePageProjectsCache && now - homePageProjectsCacheTime < CACHE_DURATION) {
      setProjects(homePageProjectsCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getHomePageProjects()
      homePageProjectsCache = data
      homePageProjectsCacheTime = Date.now()
      setProjects(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch home page projects'
      setError(errorMessage)
      console.error('Error in useHomePageProjects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
  }
}
