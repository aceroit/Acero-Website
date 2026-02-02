"use client"

import { notFound } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProjectFilters } from "@/components/projects/project-filters"
import { ProjectsGridSection } from "@/components/projects/projects-grid-section"
import { useBuildingTypes, useIndustries } from "@/hooks/use-projects"

export function IndustryContent({ industrySlug }: { industrySlug: string }) {
  const searchParams = useSearchParams()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const areaParam = searchParams.get("area")
  const regionParam = searchParams.get("region")
  const countryParam = searchParams.get("country")

  const area = areaParam && areaParam !== "all" ? areaParam : undefined
  const region = regionParam && regionParam !== "all" ? regionParam : undefined
  const country = countryParam && countryParam !== "all" ? countryParam : undefined

  // Fetch industry name from backend
  const { industries, isLoading: industriesLoading } = useIndustries()
  const industry = industries.find((ind) => ind.slug === industrySlug)
  const industryName = industry?.name
  const industryLogo = industry?.logo?.url || null

  // Fetch building types from backend
  const { buildingTypes: backendBuildingTypes, isLoading: buildingTypesLoading } = useBuildingTypes(industrySlug, {
    area,
    region,
    country,
  })

  const isLoading = industriesLoading || buildingTypesLoading

  // Check if industry exists after loading
  if (!isLoading && !industryName) {
    notFound()
  }


  // Debug: Log raw backend data
  if (!isLoading) {
    console.log('=== Building Types Debug ===')
    console.log(`Backend returned ${backendBuildingTypes.length} building types`)
    console.log('Raw backend building types:', backendBuildingTypes.map(bt => ({ 
      name: bt.name, 
      slug: bt.slug, 
      hasSlug: !!bt.slug,
      slugType: typeof bt.slug,
      slugValue: bt.slug,
      _id: bt._id,
      fullObject: bt
    })))
  }

  // Transform backend data to match frontend component expectations
  const buildingTypes = backendBuildingTypes
    .filter((bt) => {
      // Check if slug exists and is not empty
      const hasSlug = bt.slug && typeof bt.slug === 'string' && bt.slug.trim() !== ''
      if (!hasSlug) {
        console.warn(`BuildingType "${bt.name}" (${bt._id}) has no valid slug - skipping`, {
          slug: bt.slug,
          slugType: typeof bt.slug,
          fullObject: bt
        })
        return false
      }
      return true
    })
    .map((bt) => ({
      name: bt.name,
      slug: bt.slug?.trim() || '', // Ensure slug is trimmed and never undefined
      image: bt.image?.url || null, // Use null instead of placeholder so background doesn't show if no image
      projectCount: bt.projectCount || 0,
      projects: [], // Not needed for the grid display
    }))
  
  // Debug logging
  if (!isLoading) {
    console.log(`Industry "${industrySlug}": After filtering: ${buildingTypes.length} building types`)
    if (buildingTypes.length > 0) {
      console.log('Transformed building types:', buildingTypes.map(bt => ({ name: bt.name, slug: bt.slug })))
    } else if (backendBuildingTypes.length > 0) {
      console.error('ERROR: All building types were filtered out! Check slug values above.')
    }
    console.log('=== End Debug ===')
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroImageSection 
          image={industryLogo || "/images/projects/hero.jpg"} 
          title={industryName || "Industry"} 
        />

        {/* Building Types Section */}
        <section
          ref={ref}
          className="border-t border-border bg-background py-24"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Building Types
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">
                Explore the different building types we&apos;ve completed in the {industryName}{" "}
                industry
              </p>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <ProjectFilters hideIndustry industrySlug={industrySlug} />
            </motion.div>

            {/* Building Types Grid */}
            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">Loading building types...</p>
              </div>
            ) : buildingTypes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">No building types found.</p>
              </div>
            ) : (
              <ProjectsGridSection
                buildingTypes={buildingTypes}
                industrySlug={industrySlug}
                noSection
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

