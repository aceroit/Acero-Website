"use client"

import { useRef } from "react"
import { useInView } from "framer-motion"
import { cn } from "@/lib/utils"
import { IndustryCard } from "./industry-card"
import { BuildingTypeCard } from "./building-type-card"
import type { Industry, BuildingType } from "@/utils/projects-data"

interface ProjectsGridSectionProps {
  industries?: Industry[]
  buildingTypes?: BuildingType[]
  industrySlug?: string
  className?: string
}

export function ProjectsGridSection({
  industries,
  buildingTypes,
  industrySlug,
  className,
}: ProjectsGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  if (!industries && !buildingTypes) {
    return null
  }

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {industries &&
            industries.map((industry, index) => (
              <IndustryCard
                key={industry.slug}
                industry={industry}
                index={index}
                className={isInView ? "" : "opacity-0"}
              />
            ))}

          {buildingTypes &&
            industrySlug &&
            buildingTypes.map((buildingType, index) => (
              <BuildingTypeCard
                key={buildingType.slug}
                buildingType={buildingType}
                industrySlug={industrySlug}
                index={index}
                className={isInView ? "" : "opacity-0"}
              />
            ))}
        </div>

        {/* Empty State */}
        {((industries && industries.length === 0) ||
          (buildingTypes && buildingTypes.length === 0)) && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No results found.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

