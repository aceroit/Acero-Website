"use client"

import { useState, useEffect } from 'react'
import { getPageBySlug } from '@/services/page.service'
import type { PageResponse, Page, Section } from '@/lib/api/types'

interface UsePageReturn {
  page: Page | null
  sections: Section[]
  isLoading: boolean
  error: Error | null
}

// Simple cache to avoid multiple requests
let pageCache: Record<string, PageResponse | null> = {}
let pageCacheTime: Record<string, number> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function usePage(slug: string): UsePageReturn {
  const cacheKey = slug
  const [page, setPage] = useState<Page | null>(pageCache[cacheKey]?.page || null)
  const [sections, setSections] = useState<Section[]>(pageCache[cacheKey]?.sections || [])
  const [isLoading, setIsLoading] = useState(!pageCache[cacheKey])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Use cache if available and not expired
    const now = Date.now()
    if (pageCache[cacheKey] && now - (pageCacheTime[cacheKey] || 0) < CACHE_DURATION) {
      setPage(pageCache[cacheKey]?.page || null)
      setSections(pageCache[cacheKey]?.sections || [])
      setIsLoading(false)
      return
    }

    // Fetch fresh data
    setIsLoading(true)
    setError(null)

    getPageBySlug(slug)
      .then((data) => {
        if (data) {
          pageCache[cacheKey] = data
          pageCacheTime[cacheKey] = Date.now()
          setPage(data.page)
          setSections(data.sections || [])
        } else {
          setError(new Error(`Page with slug "${slug}" not found`))
        }
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to fetch page')
        setError(error)
        console.error('Error in usePage:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [slug, cacheKey])

  return { page, sections, isLoading, error }
}

