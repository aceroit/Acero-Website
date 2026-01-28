"use client"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProjectDetailsCard } from "@/components/projects/project-details-card"
import { ImageGallerySection } from "@/components/sections/image-gallery-section"
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
  // Fetch data from backend
  const { industries, isLoading: industriesLoading } = useIndustries()
  const { buildingTypes, isLoading: buildingTypesLoading } = useBuildingTypes(industrySlug)
  const { projects, isLoading: projectsLoading } = useProjects(industrySlug, buildingTypeSlug)

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

  // Get all project images from all projects and combine them
  const allProjectImages = projects.flatMap((project) =>
    (project.projectImages || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((img) => ({
        src: img.url,
        alt: img.altText || `${project.jobNumber} - ${buildingTypeName}`,
      }))
  )

  // Get unique project details (use first project as representative)
  const representativeProject = projects[0]

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
          image={buildingTypeImage || "/images/projects/hero.jpg"} 
          title={buildingTypeName || "Building Type"} 
        />

        {/* Project Details Section */}
        {isLoading ? (
          <section className="border-t border-border bg-background py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">Loading project details...</p>
              </div>
            </div>
          </section>
        ) : projectForCard ? (
          <section className="border-t border-border bg-background py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <ProjectDetailsCard
                project={projectForCard}
                industry={industryName || ""}
                buildingType={buildingTypeName || ""}
              />
            </div>
          </section>
        ) : null}

        {/* Image Gallery Section */}
        {!isLoading && allProjectImages.length > 0 && (
          <ImageGallerySection
            title="Project Gallery"
            paragraph={`Explore images from our ${buildingTypeName} projects in the ${industryName} industry`}
            images={allProjectImages}
            columns={3}
          />
        )}

        {/* Additional Projects Info */}
        {projects.length > 1 && (
          <section className="border-t border-border bg-background py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center">
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  {projects.length} Projects Completed
                </h2>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">
                  We have successfully completed {projects.length} projects of type{" "}
                  {buildingTypeName} in the {industryName} industry.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}

export default function BuildingTypePage({ params }: BuildingTypePageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingTypePageContent params={params} />
    </Suspense>
  )
}

async function BuildingTypePageContent({ params }: BuildingTypePageProps) {
  const { industry, buildingType } = await params

  return <BuildingTypeContent industrySlug={industry} buildingTypeSlug={buildingType} />
}

