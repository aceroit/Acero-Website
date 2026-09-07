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
  coordinates?: { lat?: number | null; lng?: number | null } | null
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

function extractCoordinatesFromGoogleLink(googleLink?: string | null): { lat: number; lng: number } | null {
  if (!googleLink) return null

  const value = googleLink.trim()
  if (!value) return null

  const coordinatePairPattern = /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/

  try {
    const parsedUrl = new URL(value)
    const queryValue = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query')
    const queryMatch = queryValue?.match(coordinatePairPattern)

    if (queryMatch) {
      return {
        lat: Number(queryMatch[1]),
        lng: Number(queryMatch[2]),
      }
    }
  } catch {
    // Some copied Google Maps values are iframe snippets or partial URLs, so fall through to regex parsing.
  }

  const atMatch = value.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (atMatch) {
    return {
      lat: Number(atMatch[1]),
      lng: Number(atMatch[2]),
    }
  }

  const embedMatch = value.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/)
  if (embedMatch) {
    return {
      lat: Number(embedMatch[2]),
      lng: Number(embedMatch[1]),
    }
  }

  const plainMatch = value.match(coordinatePairPattern)
  if (plainMatch) {
    return {
      lat: Number(plainMatch[1]),
      lng: Number(plainMatch[2]),
    }
  }

  return null
}

function transformBranch(api: ApiBranch): Branch {
  const location = [api.state, api.city].filter(Boolean).join(', ') || api.city || ''
  const savedCoordinates =
    Number.isFinite(api.coordinates?.lat) && Number.isFinite(api.coordinates?.lng)
      ? { lat: Number(api.coordinates?.lat), lng: Number(api.coordinates?.lng) }
      : null

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
    coordinates: savedCoordinates || extractCoordinatesFromGoogleLink(api.googleLink),
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
