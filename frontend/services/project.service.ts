import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { apiGet } from '@/lib/api/client'

interface FilterParams {
  industry?: string
  buildingType?: string
  country?: string
  region?: string
  area?: string
}

interface Industry {
  _id: string
  name: string
  slug: string
  projectCount?: number
  logo?: {
    url: string
    publicId?: string
    width?: number
    height?: number
  }
}

interface BuildingType {
  _id: string
  name: string
  slug: string
  projectCount?: number
  image?: {
    url: string
    publicId?: string
    width?: number
    height?: number
  }
}

interface ProjectImage {
  url: string
  publicId: string
  width?: number
  height?: number
  altText?: string
  order: number
}

interface Project {
  _id: string
  jobNumber: string
  jobNumberSlug: string
  typeSlug: string
  thumbnailImage?: {
    url: string
    publicId?: string
    width?: number
    height?: number
  }
  projectImages: ProjectImage[]
  country?: {
    name: string
    code: string
  }
  region?: {
    name: string
    code: string
  }
  area?: {
    name: string
    code: string
  }
  industry?: {
    name: string
    slug: string
    logo?: {
      url: string
    }
  }
  buildingType?: {
    name: string
    slug: string
    image?: {
      url: string
    }
  }
  specialFeatures?: string[]
  totalArea?: string
}

interface FilterOptions {
  industries: Array<{ name: string; slug: string }>
  countries: Array<{ name: string; code: string }>
  regions: Array<{ name: string; code: string; country?: string }>
  areas: Array<{ name: string; code: string; region?: string }>
}


/**
 * Get published industries with optional location filters
 */
export async function getPublishedIndustries(filters?: FilterParams): Promise<Industry[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.country) params.append('country', filters.country)
    if (filters?.region) params.append('region', filters.region)
    if (filters?.area) params.append('area', filters.area)

    const queryString = params.toString()
    const endpoint = `${API_ENDPOINTS.PUBLIC_INDUSTRIES}${queryString ? `?${queryString}` : ''}`

    const result = await apiGet<{ industries: Industry[]; count: number }>(endpoint)

    if (result.success && result.data) {
      return result.data.industries || []
    }

    return []
  } catch (error) {
    console.error('Error fetching industries:', error)
    return []
  }
}

/**
 * Get building types by industry slug with optional location filters
 */
export async function getBuildingTypesByIndustry(
  industrySlug: string,
  filters?: FilterParams
): Promise<BuildingType[]> {
  try {
    const params = new URLSearchParams()
    params.append('industry', industrySlug)
    if (filters?.country) params.append('country', filters.country)
    if (filters?.region) params.append('region', filters.region)
    if (filters?.area) params.append('area', filters.area)

    const endpoint = `${API_ENDPOINTS.PUBLIC_BUILDING_TYPES}?${params.toString()}`

    const result = await apiGet<{ buildingTypes: BuildingType[]; count: number }>(endpoint)

    if (result.success && result.data) {
      const buildingTypes = result.data.buildingTypes || []
      // Debug: Log received building types
      console.log('Received building types from API:', buildingTypes.map(bt => ({ 
        name: bt.name, 
        slug: bt.slug, 
        hasSlug: !!bt.slug,
        _id: bt._id 
      })))
      return buildingTypes
    }

    return []
  } catch (error) {
    console.error('Error fetching building types:', error)
    return []
  }
}

/**
 * Get projects by industry and buildingType slugs with optional location filters
 */
export async function getProjectsByBuildingType(
  industrySlug: string,
  buildingTypeSlug: string,
  filters?: FilterParams
): Promise<Project[]> {
  try {
    const params = new URLSearchParams()
    params.append('industry', industrySlug)
    params.append('buildingType', buildingTypeSlug)
    if (filters?.country) params.append('country', filters.country)
    if (filters?.region) params.append('region', filters.region)
    if (filters?.area) params.append('area', filters.area)

    const endpoint = `${API_ENDPOINTS.PUBLIC_PROJECTS}?${params.toString()}`

    const result = await apiGet<{ projects: Project[]; count: number }>(endpoint)

    if (result.success && result.data) {
      return result.data.projects || []
    }

    return []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

/**
 * Get published and featured projects (for Projects listing page; uses filters)
 */
export async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const result = await apiGet<{ projects: Project[]; count: number }>(API_ENDPOINTS.PUBLIC_PROJECTS)

    if (result.success && result.data) {
      return result.data.projects || []
    }

    return []
  } catch (error) {
    console.error('Error fetching featured projects:', error)
    return []
  }
}

/**
 * Get projects shown on home page (showOnHomePage only, max 6)
 */
export async function getHomePageProjects(): Promise<Project[]> {
  try {
    const result = await apiGet<{ projects: Project[]; count: number }>(API_ENDPOINTS.PUBLIC_PROJECTS_HOME)

    if (result.success && result.data) {
      return result.data.projects || []
    }

    return []
  } catch (error) {
    console.error('Error fetching home page projects:', error)
    return []
  }
}

/**
 * Get available filter options based on current selections (for cascading filters)
 */
export async function getFilterOptions(filters?: FilterParams): Promise<FilterOptions> {
  try {
    const params = new URLSearchParams()
    if (filters?.industry) params.append('industry', filters.industry)
    if (filters?.buildingType) params.append('buildingType', filters.buildingType)
    if (filters?.country) params.append('country', filters.country)
    if (filters?.region) params.append('region', filters.region)
    if (filters?.area) params.append('area', filters.area)

    const queryString = params.toString()
    const endpoint = `${API_ENDPOINTS.PUBLIC_FILTER_OPTIONS}${queryString ? `?${queryString}` : ''}`

    const result = await apiGet<FilterOptions>(endpoint)

    if (result.success && result.data) {
      return result.data
    }

    return {
      industries: [],
      countries: [],
      regions: [],
      areas: [],
    }
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return {
      industries: [],
      countries: [],
      regions: [],
      areas: [],
    }
  }
}

// Export types for use in components
export type { Industry, BuildingType, Project, ProjectImage, FilterOptions, FilterParams }
