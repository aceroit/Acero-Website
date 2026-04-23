"use client"

import { Suspense, use } from "react"
import { notFound, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProjectDetailsCard } from "@/components/projects/project-details-card"
import { ProjectsGalleryImagesSection } from "@/components/sections/projects-gallery-images-section"
import { useProjects, useIndustries, useBuildingTypes } from "@/hooks/use-projects"

interface BuildingTypePageProps {
  params: Promise<{ industry: string; buildingType: string }>
}

function BuildingTypeContent({
  industrySlug,
  buildingTypeSlug,
}: {
  industrySlug: string
  buildingTypeSlug: string
}) {
  const searchParams = useSearchParams()

  // Get location filters from URL
  const areaParam = searchParams.get("area")
  const regionParam = searchParams.get("region")
  const countryParam = searchParams.get("country")
  const projectSlugParam = searchParams.get("project")

  const area = areaParam && areaParam !== "all" ? areaParam : undefined
  const region = regionParam && regionParam !== "all" ? regionParam : undefined
  const country = countryParam && countryParam !== "all" ? countryParam : undefined

  const locationFilters = { area, region, country }

  // Fetch data from backend with location filters
  const { industries, isLoading: industriesLoading } = useIndustries(locationFilters)
  const { buildingTypes, isLoading: buildingTypesLoading } = useBuildingTypes(industrySlug, locationFilters)
  const { projects, isLoading: projectsLoading } = useProjects(industrySlug, buildingTypeSlug, locationFilters)

  const isLoading = industriesLoading || buildingTypesLoading || projectsLoading

  const industry = industries.find((ind) => ind.slug === industrySlug)
  const buildingType = buildingTypes.find((bt) => bt.slug === buildingTypeSlug)

  const industryName = industry?.name
  const buildingTypeName = buildingType?.name
  const buildingTypeImage = buildingType?.image?.url || null

  // Only check for not found after loading is complete
  if (!isLoading) {
    if (!industryName || !buildingTypeName) {
      notFound()
    }
    if (projects.length === 0) {
      notFound()
    }
  }

  // Filter projects if a specific project slug is provided
  const filteredProjects = projectSlugParam 
    ? projects.filter(p => p.jobNumberSlug === projectSlugParam)
    : projects

  // Get all project images from filtered projects; only include images with valid src (no empty cards)
  const allProjectImages = filteredProjects.flatMap((project) =>
    (project.projectImages || [])
      .filter((img) => img?.url && String(img.url).trim())
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((img) => ({
        src: img.url,
        alt: img.altText || `${project.jobNumber} - ${buildingTypeName}`,
      }))
  )

  // Get unique project details (use first project from filtered list as representative)
  const representativeProject = filteredProjects[0] || projects[0]

  // Transform project for ProjectDetailsCard component
  const projectForCard = representativeProject
    ? {
        jobNumber: representativeProject.jobNumber,
        region: representativeProject.region?.name || "--",
        country: representativeProject.country?.name || "--",
        accessoriesAndSpecialFeatures:
          representativeProject.specialFeatures?.join(", ") || "--",
        builtUpAreaSqm: representativeProject.totalArea || "--",
      }
    : null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroImageSection 
          image={representativeProject?.thumbnailImage?.url || buildingTypeImage || "/images/projects/hero.jpg"} 
          title={buildingTypeName || "Building Type"} 
        />

        {/* Project Details Section */}
        {isLoading ? (
          <section className="border-t border-border bg-background py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">Loading project details...</p>
              </div>
            </div>
          </section>
        ) : projectForCard ? (
          <section className="border-t border-border bg-background py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <ProjectDetailsCard
                project={projectForCard}
                industry={industryName || ""}
                buildingType={buildingTypeName || ""}
              />
            </div>
          </section>
        ) : null}

        {/* Projects Gallery Images – dynamic title at top, large 2-col cover cards */}
        {!isLoading && allProjectImages.length > 0 && (
          <ProjectsGalleryImagesSection
            title={`Project Gallery – ${buildingTypeName} | ${industryName}`}
            paragraph={`Explore images from our ${buildingTypeName} projects in the ${industryName} industry.`}
            images={allProjectImages}
          />
        )}
      </main>
      <Footer />
    </>
  )
}

function BuildingTypePageContent({ params }: BuildingTypePageProps) {
  const { industry, buildingType } = use(params)

  return <BuildingTypeContent industrySlug={industry} buildingTypeSlug={buildingType} />
}

export default function BuildingTypePage({ params }: BuildingTypePageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingTypePageContent params={params} />
    </Suspense>
  )
}

