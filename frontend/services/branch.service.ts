/**
 * Branch Service
 * Fetches published branches from the API and transforms to UI shape
 */

import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

/** Backend branch shape (from API) */
interface ApiBranch {
  _id: string
  branchName: string
  googleLink: string
  country?: { name: string; code: string }
  city: string
  state: string
  address?: string | null
  email?: string | null
  phone?: string | null
  logo?: { url?: string | null } | null
}

/** UI branch shape (used by BranchSelectorSection and BranchAccordionItem) */
export interface Branch {
  _id: string
  name: string
  location: string
  country: string
  countryCode: string
  email: string
  phone: string
  address: string
  logo?: string | null
  googleLink: string
  coordinates?: { lat: number; lng: number } | null
}

export interface CountryWithBranches {
  code: string
  name: string
  branches: Branch[]
}

interface BranchesApiResponse {
  branches: ApiBranch[]
  count: number
}

function transformBranch(api: ApiBranch): Branch {
  const location = [api.state, api.city].filter(Boolean).join(', ') || api.city || ''
  return {
    _id: api._id,
    name: api.branchName,
    location,
    country: api.country?.name ?? '',
    countryCode: api.country?.code ?? '',
    email: api.email ?? '',
    phone: api.phone ?? '',
    address: api.address ?? '',
    logo: api.logo?.url ?? null,
    googleLink: api.googleLink,
    coordinates: null, // Backend Branch has no lat/lng; use googleLink for "Open in Maps"
  }
}

/**
 * Fetch published branches and group by country
 */
export async function getBranchesGroupedByCountry(): Promise<CountryWithBranches[]> {
  try {
    const response = await apiGet<BranchesApiResponse>(API_ENDPOINTS.PUBLIC_BRANCHES)

    if (!response.success || !response.data?.branches) {
      return []
    }

    const branches = response.data.branches.map(transformBranch)
    const byCode = new Map<string, Branch[]>()
    for (const b of branches) {
      const key = b.countryCode || b.country || 'unknown'
      if (!byCode.has(key)) byCode.set(key, [])
      byCode.get(key)!.push(b)
    }

    return Array.from(byCode.entries()).map(([code, bs]) => ({
      code,
      name: bs[0]?.country || code,
      branches: bs,
    }))
  } catch (error) {
    console.error('Error fetching branches:', error)
    return []
  }
}
