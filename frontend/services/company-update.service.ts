import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export interface CompanyUpdateResponse {
  success: boolean
  message: string
  data: {
    companyUpdates: CompanyUpdate[]
    count: number
  }
}

export interface CompanyUpdate {
  _id: string
  slug: string
  title: string
  heading: string
  category: {
    _id: string
    name: string
    slug: string
  }
  banner?: {
    url: string
    publicId: string
    width: number
    height: number
  }
  featureImage?: {
    url: string
    publicId: string
    width: number
    height: number
  }
  gallery?: Array<{
    url: string
    publicId: string
    width: number
    height: number
    altText?: string
    order?: number
  }>
  shortDescription?: string
  description?: string
  eventDate?: string
  metaTitle?: string
  metaImage?: {
    url: string
    publicId: string
    width: number
    height: number
  }
  metaDescription?: string
  metaKeywords?: string[]
  linkedInPosts?: Array<{
    companyName: string
    date: string
    text: string
    imageUrl?: string
    videoUrl?: string
    videoThumbnail?: string
    hashtags: string[]
    likes: number
    comments: number
    isVideo: boolean
    publishedAt?: string
    order?: number
  }>
  status: string
  featured: boolean
  isActive: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Fetch company updates for home page (showOnHomePage only, max 3)
 */
export async function getHomePageCompanyUpdates(): Promise<CompanyUpdate[]> {
  try {
    const response = await apiGet<CompanyUpdateResponse>(API_ENDPOINTS.PUBLIC_COMPANY_UPDATES_HOME)
    if (response.success && response.data) {
      const updates = response.data.companyUpdates || []
      return updates
    }
    return []
  } catch (error) {
    console.error('Error fetching home page company updates:', error)
    throw error
  }
}

/**
 * Fetch all published and featured company updates
 */
export async function getCompanyUpdates(): Promise<CompanyUpdate[]> {
  try {
    const response = await apiGet<CompanyUpdateResponse>('/api/public/company-updates')
    
    if (response.success && response.data) {
      const updates = response.data.companyUpdates || []
      // Log for debugging
      console.log('Fetched company updates:', updates.length)
      if (updates.length > 0) {
        console.log('Sample update:', {
          _id: updates[0]._id,
          title: updates[0].title,
          hasFeatureImage: !!updates[0].featureImage,
          featureImageUrl: updates[0].featureImage?.url,
          hasBanner: !!updates[0].banner,
          bannerUrl: updates[0].banner?.url,
          hasShortDescription: !!updates[0].shortDescription,
          hasDescription: !!updates[0].description,
        })
      }
      return updates
    }
    
    return []
  } catch (error) {
    console.error('Error fetching company updates:', error)
    throw error
  }
}

/**
 * Fetch company update by slug
 */
export async function getCompanyUpdateBySlug(slug: string): Promise<CompanyUpdate | null> {
  try {
    const response = await apiGet<{ success: boolean; message: string; data: { companyUpdate: CompanyUpdate } }>(
      `/api/public/company-updates/slug/${slug}`
    )
    
    if (response.success && response.data) {
      return response.data.companyUpdate
    }
    
    return null
  } catch (error) {
    console.error('Error fetching company update by slug:', error)
    throw error
  }
}
