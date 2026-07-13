import { apiGet } from '@/lib/api/client'
import { normalizeCmsAssetUrls } from '@/utils/cms-asset-url'

export interface CustomerResponse {
  success: boolean
  message: string
  data: {
    customers: Customer[]
    count: number
  }
}

export interface Customer {
  _id: string
  name: string
  customerImage?: {
    url: string
    publicId: string
    width: number
    height: number
  }
  order: number
  status: string
  featured: boolean
  isActive: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Fetch all published and featured customers
 */
export async function getCustomers(): Promise<Customer[]> {
  try {
    const response = await apiGet<CustomerResponse>('/api/public/customers')

    if (response.success && response.data) {
      return normalizeCmsAssetUrls(response.data.customers || [])
    }

    return []
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw error
  }
}