"use client"

import { CompanyUpdatesSection, type CompanyUpdate as CompanyUpdateType } from '@/components/sections/company-updates-section'
import { useCompanyUpdates } from '@/hooks/use-company-updates'

interface DynamicCompanyUpdatesSectionProps {
  sectionId: string
  forHome?: boolean
  staticUpdates?: Array<{
    id: string
    title: string
    description: string
    image: string
    date: string | Date
    category?: string
    link?: string
  }>
  title?: string
  subtitle?: string
  columns?: 3 | 4
}

/**
 * Dynamic Company Updates Section that fetches data from backend.
 * When forHome is true, uses home endpoint (showOnHomePage only, max 3).
 */
export function DynamicCompanyUpdatesSection({
  sectionId,
  forHome = false,
  staticUpdates,
  title = '',
  subtitle,
  columns = 3,
}: DynamicCompanyUpdatesSectionProps) {
  const { companyUpdates, isLoading } = useCompanyUpdates({ forHome })

  // Transform backend data to match CompanyUpdate interface
  let updates: CompanyUpdateType[] = []

  // Always prioritize backend data over static updates
  if (companyUpdates && companyUpdates.length > 0) {
    // Transform backend company updates
    updates = companyUpdates.map((update) => {
      // Use featureImage or banner as the image
      const imageUrl = update.featureImage?.url || update.banner?.url || ''
      
      // Use shortDescription or description
      const description = update.shortDescription || update.description || ''
      
      // Create link from slug - ensure it points to the detail page
      const link = `/media/company-update/${update.slug}`
      
      // Get date from publishedAt or createdAt
      const date = update.publishedAt || update.createdAt || new Date().toISOString()
      
      return {
        id: update._id,
        title: update.title,
        description: description,
        image: imageUrl,
        date: new Date(date),
        category: update.category?.name,
        link: link,
      }
    })
  } else if (!isLoading && staticUpdates && staticUpdates.length > 0) {
    // Use static updates only as fallback if no backend data and not loading
    updates = staticUpdates.map((update) => ({
      id: update.id,
      title: update.title,
      description: update.description,
      image: update.image,
      date: typeof update.date === 'string' ? new Date(update.date) : update.date,
      category: update.category,
      link: update.link,
    }))
  }

  // Show loading state only if we're loading and have no data yet
  if (isLoading && updates.length === 0 && !staticUpdates) {
    return (
      <section className="border-t border-border bg-background py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {title && (
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </section>
    )
  }

  // If no updates after loading, don't render
  if (updates.length === 0) {
    return null
  }

  return (
    <CompanyUpdatesSection
      key={sectionId}
      updates={updates}
      title={title}
      subtitle={subtitle}
      columns={columns}
    />
  )
}

