"use client"

import { useState, useEffect, useCallback } from 'react'
import { getVideos, type Video } from '@/services/media.service'

interface UseVideosReturn {
  videos: Video[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple cache to avoid multiple requests
let videosCache: Video[] | null = null
let videosCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useVideos(): UseVideosReturn {
  const [videos, setVideos] = useState<Video[]>(videosCache || [])
  const [isLoading, setIsLoading] = useState(!videosCache)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    // Use cache if available and not expired
    const now = Date.now()
    if (videosCache && now - videosCacheTime < CACHE_DURATION) {
      setVideos(videosCache)
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    try {
      const data = await getVideos()
      videosCache = data
      videosCacheTime = Date.now()
      setVideos(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch videos'
      setError(errorMessage)
      console.error('Error in useVideos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  return {
    videos,
    isLoading,
    error,
    refetch: fetchVideos,
  }
}
