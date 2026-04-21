"use client"

import { useRef } from "react"
import { useInView } from "framer-motion"
import { cn } from "@/lib/utils"
import { IndustryCard } from "./industry-card"
import { BuildingTypeCard } from "./building-type-card"
import { ProjectCard } from "./project-card"
import type { Industry, BuildingType } from "@/utils/projects-data"
import type { Project } from "@/services/project.service"

interface ProjectsGridSectionProps {
  industries?: Industry[]
  buildingTypes?: BuildingType[]
  projects?: Project[]
  industrySlug?: string
  className?: string
  /** When true, render only the inner content (no section wrapper). Use when already inside a section (e.g. projects list, building types list). */
  noSection?: boolean
}

export function ProjectsGridSection({
  industries,
  buildingTypes,
  projects,
  industrySlug,
  className,
  noSection = false,
}: ProjectsGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  if (!industries && !buildingTypes && !projects) {
    return null
  }

  const gridContent = (
    <>
      <div ref={noSection ? ref : undefined} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {projects &&
          projects.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              index={index}
              className={isInView ? "" : "opacity-0"}
            />
          ))}
      </div>

      {/* Empty State */}
      {((industries && industries.length === 0) ||
        (buildingTypes && buildingTypes.length === 0) ||
        (projects && projects.length === 0)) && (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">No results found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters to see more results.
          </p>
        </div>
      )}
    </>
  )

  if (noSection) {
    return <div className={className}>{gridContent}</div>
  }

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {gridContent}
      </div>
    </section>
  )
}

