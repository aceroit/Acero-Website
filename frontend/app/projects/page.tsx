"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProjectFilters } from "@/components/projects/project-filters"
import { ProjectsGridSection } from "@/components/projects/projects-grid-section"
import { getIndustries, processedData } from "@/utils/projects-data"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

function ProjectsContent() {
  const searchParams = useSearchParams()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const areaParam = searchParams.get("area")
  const regionParam = searchParams.get("region")
  const countryParam = searchParams.get("country")
  const industryParam = searchParams.get("industry")

  const area = areaParam && areaParam !== "all" ? areaParam : undefined
  const region = regionParam && regionParam !== "all" ? regionParam : undefined
  const country = countryParam && countryParam !== "all" ? countryParam : undefined
  const industry = industryParam && industryParam !== "all" ? industryParam : undefined

  const industries = getIndustries(
    processedData,
    industry ? undefined : { area, region, country }
  )

  // Filter industries by industry filter if provided
  const filteredIndustries = industry
    ? industries.filter((ind) => ind.name === industry)
    : industries

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroImageSection
          image="/images/projects/hero.jpg"
          title="Our Projects"
        />

        {/* Our Projects Section */}
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
                Our Projects
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">
                Explore our diverse portfolio of projects across various industries and building
                types
              </p>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <ProjectFilters />
            </motion.div>

            {/* Industries Grid */}
            <ProjectsGridSection industries={filteredIndustries} />
          </div>
        </section>
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

