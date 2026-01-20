import projectsData from "@/data.json"

// Type Definitions
export interface Project {
  jobNumber: string
  buildingType: string
  region: string
  area: string
  country: string
  accessoriesAndSpecialFeatures: string
  builtUpAreaSqm: string
}

export interface IndustryData {
  industry: string
  projects: Project[]
}

export interface Industry {
  name: string
  slug: string
  projectCount: number
}

export interface BuildingType {
  name: string
  slug: string
  projectCount: number
  projects: Project[]
}

export interface FilterOptions {
  industries: string[]
  areas: string[]
  regions: string[]
  countries: string[]
}

// Generate URL-friendly slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

// Convert slug back to original name (case-insensitive matching)
export function slugToName(slug: string, options: string[]): string | null {
  const normalizedSlug = slug.toLowerCase()
  return (
    options.find((option) => generateSlug(option).toLowerCase() === normalizedSlug) || null
  )
}

// Merge duplicate industries (case-insensitive)
export function mergeIndustries(data: IndustryData[]): IndustryData[] {
  const mergedMap = new Map<string, IndustryData>()

  for (const item of data) {
    const normalizedIndustry = item.industry.trim()
    const key = normalizedIndustry.toLowerCase()

    if (mergedMap.has(key)) {
      // Merge projects
      const existing = mergedMap.get(key)!
      existing.projects = [...existing.projects, ...item.projects]
    } else {
      // Create new entry
      mergedMap.set(key, {
        industry: normalizedIndustry,
        projects: [...item.projects],
      })
    }
  }

  return Array.from(mergedMap.values())
}

// Get all unique industries
export function getIndustries(
  data: IndustryData[],
  filters?: {
    area?: string
    region?: string
    country?: string
  }
): Industry[] {
  const merged = mergeIndustries(data)
  const industries: Industry[] = []

  for (const item of merged) {
    let projects = item.projects

    // Apply filters
    if (filters) {
      projects = filterProjects(projects, {
        area: filters.area,
        region: filters.region,
        country: filters.country,
      })
    }

    if (projects.length > 0) {
      industries.push({
        name: item.industry,
        slug: generateSlug(item.industry),
        projectCount: projects.length,
      })
    }
  }

  return industries.sort((a, b) => a.name.localeCompare(b.name))
}

// Get building types for a specific industry
export function getBuildingTypes(
  industrySlug: string,
  data: IndustryData[],
  filters?: {
    area?: string
    region?: string
    country?: string
  }
): BuildingType[] {
  const merged = mergeIndustries(data)
  const normalizedSlug = industrySlug.toLowerCase()

  // Find the industry
  const industryData = merged.find(
    (item) => generateSlug(item.industry).toLowerCase() === normalizedSlug
  )

  if (!industryData) {
    return []
  }

  // Group projects by building type
  const buildingTypeMap = new Map<string, Project[]>()

  for (const project of industryData.projects) {
    const buildingType = project.buildingType.trim()
    if (!buildingType || buildingType === "--") continue

    // Apply filters
    if (filters) {
      const matches =
        (!filters.area || project.area === filters.area) &&
        (!filters.region || project.region === filters.region) &&
        (!filters.country || project.country === filters.country)

      if (!matches) continue
    }

    if (!buildingTypeMap.has(buildingType)) {
      buildingTypeMap.set(buildingType, [])
    }
    buildingTypeMap.get(buildingType)!.push(project)
  }

  // Convert to BuildingType array
  const buildingTypes: BuildingType[] = []
  for (const [name, projects] of buildingTypeMap.entries()) {
    buildingTypes.push({
      name,
      slug: generateSlug(name),
      projectCount: projects.length,
      projects,
    })
  }

  return buildingTypes.sort((a, b) => a.name.localeCompare(b.name))
}

// Get projects for a specific building type
export function getBuildingTypeProjects(
  industrySlug: string,
  buildingTypeSlug: string,
  data: IndustryData[]
): Project[] {
  const merged = mergeIndustries(data)
  const normalizedIndustrySlug = industrySlug.toLowerCase()
  const normalizedBuildingTypeSlug = buildingTypeSlug.toLowerCase()

  // Find the industry
  const industryData = merged.find(
    (item) => generateSlug(item.industry).toLowerCase() === normalizedIndustrySlug
  )

  if (!industryData) {
    return []
  }

  // Find projects matching the building type
  return industryData.projects.filter((project) => {
    const projectBuildingType = project.buildingType.trim()
    return (
      projectBuildingType &&
      projectBuildingType !== "--" &&
      generateSlug(projectBuildingType).toLowerCase() === normalizedBuildingTypeSlug
    )
  })
}

// Filter projects by criteria
export function filterProjects(
  projects: Project[],
  filters: {
    industry?: string
    area?: string
    region?: string
    country?: string
    buildingType?: string
  }
): Project[] {
  return projects.filter((project) => {
    if (filters.area && project.area !== filters.area) return false
    if (filters.region && project.region !== filters.region) return false
    if (filters.country && project.country !== filters.country) return false
    if (filters.buildingType && project.buildingType !== filters.buildingType) return false
    return true
  })
}

// Extract unique filter options from all data
export function getFilterOptions(data: IndustryData[]): FilterOptions {
  const merged = mergeIndustries(data)
  const industries = new Set<string>()
  const areas = new Set<string>()
  const regions = new Set<string>()
  const countries = new Set<string>()

  for (const item of merged) {
    industries.add(item.industry)

    for (const project of item.projects) {
      if (project.area && project.area !== "--") {
        areas.add(project.area)
      }
      if (project.region && project.region !== "--") {
        regions.add(project.region)
      }
      if (project.country && project.country !== "--") {
        countries.add(project.country)
      }
    }
  }

  return {
    industries: Array.from(industries).sort(),
    areas: Array.from(areas).sort(),
    regions: Array.from(regions).sort(),
    countries: Array.from(countries).sort(),
  }
}

// Get industry name from slug
export function getIndustryName(slug: string, data: IndustryData[]): string | null {
  const merged = mergeIndustries(data)
  const industries = merged.map((item) => item.industry)
  return slugToName(slug, industries)
}

// Get building type name from slug
export function getBuildingTypeName(
  industrySlug: string,
  buildingTypeSlug: string,
  data: IndustryData[]
): string | null {
  const buildingTypes = getBuildingTypes(industrySlug, data)
  const buildingTypeNames = buildingTypes.map((bt) => bt.name)
  return slugToName(buildingTypeSlug, buildingTypeNames)
}

// Export processed data
export const processedData = mergeIndustries(projectsData as IndustryData[])
export const filterOptions = getFilterOptions(processedData)


