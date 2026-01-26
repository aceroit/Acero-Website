"use client"

import { useState, useEffect, useCallback } from 'react'
import { getFeaturedProjects, type Project } from '@/services/project.service'

interface UseFeaturedProjectsReturn {
  projects: Project[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache to avoid multiple requests
let featuredProjectsCache: Project[] | null = null
let featuredProjectsCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch featured projects for home page
 */
export function useFeaturedProjects(): UseFeaturedProjectsReturn {
  const [projects, setProjects] = useState<Project[]>(featuredProjectsCache || [])
  const [isLoading, setIsLoading] = useState(!featuredProjectsCache)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    // Use cache if available and not expired
    const now = Date.now()
    if (featuredProjectsCache && now - featuredProjectsCacheTime < CACHE_DURATION) {
      setProjects(featuredProjectsCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getFeaturedProjects()
      featuredProjectsCache = data
      featuredProjectsCacheTime = Date.now()
      setProjects(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
      console.error('Error in useFeaturedProjects:', err)
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

