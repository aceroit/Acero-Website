'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getPublishedIndustries,
  getBuildingTypesByIndustry,
  getProjectsByBuildingType,
  getFilterOptions,
  type Industry,
  type BuildingType,
  type Project,
  type FilterOptions,
  type FilterParams,
} from '@/services/project.service'

interface UseIndustriesReturn {
  industries: Industry[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

interface UseBuildingTypesReturn {
  buildingTypes: BuildingType[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

interface UseProjectsReturn {
  projects: Project[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

interface UseFilterOptionsReturn {
  filterOptions: FilterOptions
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Cache for industries
let industriesCache: { data: Industry[]; timestamp: number; filters?: FilterParams } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Cache for building types
const buildingTypesCache = new Map<string, { data: BuildingType[]; timestamp: number; filters?: FilterParams }>()

// Cache for projects
const projectsCache = new Map<string, { data: Project[]; timestamp: number; filters?: FilterParams }>()

// Cache for filter options
let filterOptionsCache: { data: FilterOptions; timestamp: number; filters?: FilterParams } | null = null
const FILTER_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

/**
 * Hook to fetch and cache published industries
 */
export function useIndustries(filters?: FilterParams): UseIndustriesReturn {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIndustries = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache
      const cacheKey = JSON.stringify(filters || {})
      if (
        industriesCache &&
        industriesCache.timestamp + CACHE_DURATION > Date.now() &&
        JSON.stringify(industriesCache.filters || {}) === cacheKey
      ) {
        setIndustries(industriesCache.data)
        setIsLoading(false)
        return
      }

      const data = await getPublishedIndustries(filters)
      setIndustries(data)

      // Update cache
      industriesCache = {
        data,
        timestamp: Date.now(),
        filters: filters || undefined,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch industries'
      setError(errorMessage)
      console.error('Error fetching industries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [JSON.stringify(filters || {})])

  useEffect(() => {
    fetchIndustries()
  }, [fetchIndustries])

  return {
    industries,
    isLoading,
    error,
    refetch: fetchIndustries,
  }
}

/**
 * Hook to fetch and cache building types for an industry
 */
export function useBuildingTypes(
  industrySlug: string,
  filters?: FilterParams
): UseBuildingTypesReturn {
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBuildingTypes = useCallback(async () => {
    if (!industrySlug) {
      setBuildingTypes([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check cache
      const cacheKey = `${industrySlug}-${JSON.stringify(filters || {})}`
      const cached = buildingTypesCache.get(cacheKey)
      if (cached && cached.timestamp + CACHE_DURATION > Date.now()) {
        setBuildingTypes(cached.data)
        setIsLoading(false)
        return
      }

      const data = await getBuildingTypesByIndustry(industrySlug, filters)
      setBuildingTypes(data)

      // Update cache
      buildingTypesCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        filters: filters || undefined,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch building types'
      setError(errorMessage)
      console.error('Error fetching building types:', err)
    } finally {
      setIsLoading(false)
    }
  }, [industrySlug, JSON.stringify(filters || {})])

  useEffect(() => {
    fetchBuildingTypes()
  }, [fetchBuildingTypes])

  return {
    buildingTypes,
    isLoading,
    error,
    refetch: fetchBuildingTypes,
  }
}

/**
 * Hook to fetch and cache projects for an industry and building type
 */
export function useProjects(
  industrySlug: string,
  buildingTypeSlug: string,
  filters?: FilterParams
): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!industrySlug || !buildingTypeSlug) {
      setProjects([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check cache
      const cacheKey = `${industrySlug}-${buildingTypeSlug}-${JSON.stringify(filters || {})}`
      const cached = projectsCache.get(cacheKey)
      if (cached && cached.timestamp + CACHE_DURATION > Date.now()) {
        setProjects(cached.data)
        setIsLoading(false)
        return
      }

      const data = await getProjectsByBuildingType(industrySlug, buildingTypeSlug, filters)
      setProjects(data)

      // Update cache
      projectsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        filters: filters || undefined,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
      console.error('Error fetching projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [industrySlug, buildingTypeSlug, JSON.stringify(filters || {})])

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

/**
 * Hook to fetch and cache filter options for cascading filters
 */
export function useFilterOptions(filters?: FilterParams): UseFilterOptionsReturn {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    industries: [],
    countries: [],
    regions: [],
    areas: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFilterOptions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache
      const cacheKey = JSON.stringify(filters || {})
      if (
        filterOptionsCache &&
        filterOptionsCache.timestamp + FILTER_CACHE_DURATION > Date.now() &&
        JSON.stringify(filterOptionsCache.filters || {}) === cacheKey
      ) {
        setFilterOptions(filterOptionsCache.data)
        setIsLoading(false)
        return
      }

      const data = await getFilterOptions(filters)
      setFilterOptions(data)

      // Update cache
      filterOptionsCache = {
        data,
        timestamp: Date.now(),
        filters: filters || undefined,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch filter options'
      setError(errorMessage)
      console.error('Error fetching filter options:', err)
    } finally {
      setIsLoading(false)
    }
  }, [JSON.stringify(filters || {})])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  return {
    filterOptions,
    isLoading,
    error,
    refetch: fetchFilterOptions,
  }
}
