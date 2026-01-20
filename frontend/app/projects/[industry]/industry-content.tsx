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
import {
  getBuildingTypes,
  getIndustryName,
  processedData,
} from "@/utils/projects-data"

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

  const industryName = getIndustryName(industrySlug, processedData)

  if (!industryName) {
    notFound()
  }

  const buildingTypes = getBuildingTypes(industrySlug, processedData, {
    area,
    region,
    country,
  })

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroImageSection image="/images/projects/hero.jpg" title={industryName} />

        {/* Building Types Section */}
        <section
          ref={ref}
          className="border-t border-border bg-background py-24 md:py-32"
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
              <ProjectFilters hideIndustry />
            </motion.div>

            {/* Building Types Grid */}
            <ProjectsGridSection
              buildingTypes={buildingTypes}
              industrySlug={industrySlug}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

