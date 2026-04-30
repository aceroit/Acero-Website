"use client"

import { Suspense, use } from "react"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProjectDetailsCard } from "@/components/projects/project-details-card"
import { ProjectsGalleryImagesSection } from "@/components/sections/projects-gallery-images-section"
import { useProjects } from "@/hooks/use-projects"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const router = useRouter()

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
  const { projects, isLoading: projectsLoading } = useProjects(industrySlug, buildingTypeSlug, locationFilters)

  const isLoading = projectsLoading

  // Get unique project details (use first project from list as representative)
  const representativeProject = projects[0]

  const industryName = representativeProject?.industry?.name
  const buildingTypeName = representativeProject?.buildingType?.name
  const buildingTypeImage = representativeProject?.buildingType?.image?.url || null

  // Only check for not found after loading is complete
  if (!isLoading) {
    if (projects.length === 0 || !industryName || !buildingTypeName) {
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

  // We already defined representativeProject above as projects[0], but if filtered we can update it
  const filteredRepresentativeProject = filteredProjects[0] || projects[0]

  // Transform project for ProjectDetailsCard component
  const projectForCard = filteredRepresentativeProject
    ? {
        jobNumber: filteredRepresentativeProject.jobNumber,
        buildingType: buildingTypeName || "--",
        region: filteredRepresentativeProject.region?.name || "--",
        area: filteredRepresentativeProject.area?.name || "--",
        country: filteredRepresentativeProject.country?.name || "--",
        accessoriesAndSpecialFeatures:
          filteredRepresentativeProject.specialFeatures?.join(", ") || "--",
        builtUpAreaSqm: filteredRepresentativeProject.totalArea || "--",
      }
    : null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroImageSection 
          image={filteredRepresentativeProject?.thumbnailImage?.url || buildingTypeImage || "/placeholder.jpg"} 
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
              <div className="mb-8 flex justify-start">
                <Button 
                  onClick={() => router.back()}
                  className="group flex items-center gap-2 bg-steel-red text-steel-white hover:bg-steel-red/90 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back
                </Button>
              </div>
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

