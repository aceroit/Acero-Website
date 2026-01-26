"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ProjectsCarousel } from "@/components/carousel/projects-carousel"
import { cn } from "@/lib/utils"

export interface Project {
  id: string
  title: string
  description: string
  image: string
  category?: string
  link?: string
}

interface ProjectsSectionProps {
  projects: Project[]
  title: string
  subtitle?: string
  columns?: 3 | 4
  className?: string
}

export function ProjectsSection({
  projects,
  title,
  subtitle,
  columns = 3,
  className,
}: ProjectsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  // Limit to first 6 projects
  const limitedProjects = projects.slice(0, 6)

  // Transform projects for carousel (only need image, alt, industry, and link)
  const carouselProjects = limitedProjects.map((project) => ({
    id: project.id,
    image: project.image,
    alt: project.title,
    industry: project.category, // Using category as industry
    link: project.link,
  }))

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Projects Carousel */}
        {carouselProjects.length > 0 && (
          <ProjectsCarousel
            projects={carouselProjects}
            itemClassName="h-64 w-96 md:h-80 md:w-[28rem] lg:h-96 lg:w-[32rem]"
            speed="medium"
            direction="left"
            pauseOnHover={true}
          />
        )}
      </div>
    </section>
  )
}

