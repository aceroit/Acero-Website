"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import AutoPlay from "embla-carousel-autoplay"

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

/**
 * Project card matching Projects page industry card design:
 * rectangular aspect-[4/3], image only by default, title on hover, 3 per row
 */
function ProjectCard({
  project,
  index = 0,
}: {
  project: Project
  index?: number
}) {
  const card = (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-500 hover:border-steel-red/50 hover:shadow-xl">
      {project.image ? (
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" aria-hidden />
      )}

      {/* Industry name (and title) overlay - visible only on hover */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        {project.category && (
          <span className="text-center text-xl font-bold tracking-tight text-steel-white drop-shadow-md md:text-2xl">
            {project.category}
          </span>
        )}
        {/* <span className="text-center text-base font-medium tracking-tight text-steel-white/90 drop-shadow-md md:text-lg">
          {project.title}
        </span> */}
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group h-full"
    >
      {project.link ? (
        <Link
          href={project.link}
          className="block h-full transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-steel-red focus-visible:ring-offset-2 rounded-lg"
          aria-label={`View ${project.title}`}
        >
          {card}
        </Link>
      ) : (
        <div className="block h-full">{card}</div>
      )}
    </motion.div>
  )
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
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const limitedProjects = projects.slice(0, 6)

  // Autoplay plugin
  const autoplayPlugin = useRef(
    AutoPlay({ delay: 5000, stopOnInteraction: true })
  )

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth, "px-6 lg:px-8")}>
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
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
          )}
        </motion.div>

        {/* Projects Carousel - Infinite loop carousel with Embla */}
        {limitedProjects.length > 0 && (
          <Carousel
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            plugins={[autoplayPlugin.current as any]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {limitedProjects.map((project, index) => (
                <CarouselItem
                  key={project.id}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <ProjectCard project={project} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 h-12 w-12 border-2 border-border bg-background/90 backdrop-blur-sm hover:bg-background hover:border-steel-red" />
            <CarouselNext className="right-0 h-12 w-12 border-2 border-border bg-background/90 backdrop-blur-sm hover:bg-background hover:border-steel-red" />
          </Carousel>
        )}
      </div>
    </section>
  )
}
