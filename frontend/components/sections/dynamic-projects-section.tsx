"use client"

import { ProjectsSection, type Project as ProjectType } from '@/components/sections/projects-section'
import { useHomePageProjects } from '@/hooks/use-home-projects'

interface DynamicProjectsSectionProps {
  sectionId: string
  staticProjects?: Array<{
    id: string
    title: string
    description: string
    image: string
    category?: string
    link?: string
  }>
  title?: string
  subtitle?: string
  columns?: 3 | 4
}

/**
 * Dynamic Projects Section that fetches data from backend
 */
export function DynamicProjectsSection({
  sectionId,
  staticProjects,
  title = '',
  subtitle,
  columns = 3,
}: DynamicProjectsSectionProps) {
  // Fetch home page projects (showOnHomePage only, max 6)
  const { projects, isLoading } = useHomePageProjects()

  // Transform backend data to match Project interface
  let transformedProjects: ProjectType[] = []

  // Always prioritize backend data over static projects
  if (projects && projects.length > 0) {
    // Transform backend projects
    transformedProjects = projects.map((project) => {
      // Use thumbnailImage or first project image
      const imageUrl = project.thumbnailImage?.url || project.projectImages?.[0]?.url || ''
      
      // Use description or create from job number
      const description = project.description || `Project ${project.jobNumber}`
      
      // Create link to building type page (projects are displayed on building type pages)
      const link = `/projects/${project.industry?.slug || 'all'}/${project.buildingType?.slug || 'all'}`
      
      return {
        id: project._id,
        title: project.jobNumber || project.title || 'Project',
        description: description,
        image: imageUrl,
        category: project.industry?.name, // Only industry, not building type
        link: link,
      }
    })
  } else if (!isLoading && staticProjects && staticProjects.length > 0) {
    // Use static projects only as fallback if no backend data and not loading
    transformedProjects = staticProjects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      image: project.image,
      category: project.category,
      link: project.link,
    }))
  }

  // Show loading state only if we're loading and have no data yet
  if (isLoading && transformedProjects.length === 0 && !staticProjects) {
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

  // If no projects, don't render
  if (transformedProjects.length === 0) {
    return null
  }

  // Limit to first 6 projects for carousel
  const limitedProjects = transformedProjects.slice(0, 6)

  return (
    <ProjectsSection
      key={sectionId}
      projects={limitedProjects}
      title={title}
      subtitle={subtitle}
      columns={columns}
    />
  )
}

