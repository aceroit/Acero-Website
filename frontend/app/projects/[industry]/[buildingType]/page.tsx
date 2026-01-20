import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProjectDetailsCard } from "@/components/projects/project-details-card"
import { ImageGallerySection } from "@/components/sections/image-gallery-section"
import {
  getBuildingTypeProjects,
  getIndustryName,
  getBuildingTypeName,
  processedData,
} from "@/utils/projects-data"

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
  const industryName = getIndustryName(industrySlug, processedData)
  const buildingTypeName = getBuildingTypeName(
    industrySlug,
    buildingTypeSlug,
    processedData
  )

  if (!industryName || !buildingTypeName) {
    notFound()
  }

  const projects = getBuildingTypeProjects(industrySlug, buildingTypeSlug, processedData)

  if (projects.length === 0) {
    notFound()
  }

  // Generate image paths for projects (placeholder for now, ready for backend integration)
  const projectImages = projects.map((project) => {
    // Try to construct image path, fallback to placeholder
    const imagePath = `/images/projects/${industrySlug}/${buildingTypeSlug}/${project.jobNumber}.jpg`
    return {
      src: imagePath,
      alt: `${project.jobNumber} - ${buildingTypeName}`,
      // In a real implementation, you'd check if the image exists
      // For now, we'll use a placeholder
      fallback: true,
    }
  })

  // Use placeholder images for now
  const galleryImages = projectImages.map((img) => ({
    src: "/placeholder.jpg", // Placeholder image
    alt: img.alt,
  }))

  // Get unique project details (use first project as representative)
  const representativeProject = projects[0]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroImageSection image="/images/projects/hero.jpg" title={buildingTypeName} />

        {/* Project Details Section */}
        <section className="border-t border-border bg-background py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ProjectDetailsCard
              project={representativeProject}
              industry={industryName}
              buildingType={buildingTypeName}
            />
          </div>
        </section>

        {/* Image Gallery Section */}
        {galleryImages.length > 0 && (
          <ImageGallerySection
            title="Project Gallery"
            paragraph={`Explore images from our ${buildingTypeName} projects in the ${industryName} industry`}
            images={galleryImages}
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

export default async function BuildingTypePage({ params }: BuildingTypePageProps) {
  const { industry, buildingType } = await params

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingTypeContent industrySlug={industry} buildingTypeSlug={buildingType} />
    </Suspense>
  )
}

