import { apiGet } from '@/lib/api/client'

export interface VideoResponse {
  success: boolean
  message: string
  data: {
    videos: Video[]
    count: number
  }
}

export interface Video {
  _id: string
  title: string
  description?: string
  youtubeId: string
  youtubeUrl?: string
  thumbnailUrl?: string
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

/**
 * Fetch all YouTube videos from Media Library
 */
export async function getVideos(): Promise<Video[]> {
  try {
    const response = await apiGet<VideoResponse>('/api/public/videos')
    
    if (response.success && response.data) {
      return response.data.videos || []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching videos:', error)
    throw error
  }
}
