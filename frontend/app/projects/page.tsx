"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { ProjectFilters } from "@/components/projects/project-filters"
import { ProjectsGridSection } from "@/components/projects/projects-grid-section"
import { useIndustries } from "@/hooks/use-projects"
import { usePage } from "@/hooks/use-page"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { cn } from "@/lib/utils"

function ProjectsContent() {
  const searchParams = useSearchParams()

  const areaParam = searchParams.get("area")
  const regionParam = searchParams.get("region")
  const countryParam = searchParams.get("country")
  const industryParam = searchParams.get("industry")

  const area = areaParam && areaParam !== "all" ? areaParam : undefined
  const region = regionParam && regionParam !== "all" ? regionParam : undefined
  const country = countryParam && countryParam !== "all" ? countryParam : undefined
  const industry = industryParam && industryParam !== "all" ? industryParam : undefined

  // Fetch page with sections from CMS
  const { page, sections, isLoading: pageLoading } = usePage("projects")

  // Fetch industries from backend
  const { industries: backendIndustries, isLoading: industriesLoading } = useIndustries({
    country,
    region,
    area,
  })

  const isLoading = pageLoading || industriesLoading

  // Get spacing values from appearance
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Transform backend data to match frontend component expectations
  const industries = backendIndustries
    .filter((ind) => ind.slug) // Filter out industries without slugs
    .map((ind) => ({
      name: ind.name,
      slug: ind.slug || "", // Ensure slug is never undefined
      logo: ind.logo?.url || null, // Use null instead of placeholder so background doesn't show if no image
      projectCount: ind.projectCount || 0,
    }))

  // Filter industries by industry filter if provided
  const filteredIndustries = industry
    ? industries.filter((ind) => ind.slug === industry)
    : industries

  // Separate sections by type
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const projectsGridSection = sections.find((s) => s.sectionTypeSlug === "projects_grid_with_filters")
  const otherSections = sections.filter(
    (s) => s.sectionTypeSlug !== "hero_image" && s.sectionTypeSlug !== "projects_grid_with_filters"
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Render sections from CMS */}
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {/* Render hero section from CMS */}
            {heroSection && <SectionRenderer sections={[heroSection]} />}

            {/* Render projects grid section with filters */}
            {projectsGridSection && (
              <section className={cn("border-t border-border bg-background", spacing.sectionPadding)}>
                <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
                  {/* Section Title from CMS */}
                  {projectsGridSection.content?.title && (
                    <div className="mb-12 text-center">
                      <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                        {projectsGridSection.content.title as string}
                      </h2>
                      {projectsGridSection.content.subtitle && (
                        <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">
                          {projectsGridSection.content.subtitle as string}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Filters */}
                  {projectsGridSection.content?.showFilters !== false && (
                    <div className="mb-12">
                      <ProjectFilters />
                    </div>
                  )}

                  {/* Industries Grid */}
                  {industriesLoading ? (
                    <div className="py-12 text-center">
                      <p className="text-lg text-muted-foreground">Loading industries...</p>
                    </div>
                  ) : (
                    <ProjectsGridSection industries={filteredIndustries} noSection />
                  )}
                </div>
              </section>
            )}

            {/* Render other sections */}
            {otherSections.length > 0 && <SectionRenderer sections={otherSections} />}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  )
}

