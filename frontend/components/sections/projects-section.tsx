"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
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

  const gridCols =
    columns === 4
      ? "md:grid-cols-2 lg:grid-cols-4"
      : "md:grid-cols-2 lg:grid-cols-3"

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

        {/* Projects Grid */}
        <div className={cn("grid gap-6 md:gap-8", gridCols)}>
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="h-full"
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const cardContent = (
    <div className="group relative flex h-full flex-col overflow-hidden border border-border bg-card transition-all hover:border-steel-red/50">
      {/* Image */}
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-secondary">
        <Image
          src={project.image}
          alt={project.title}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          quality={85}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-steel-red/0 transition-colors duration-300 group-hover:bg-steel-red/10" />
        {/* Category Badge */}
        {project.category && (
          <div className="absolute left-4 top-4">
            <span className="bg-steel-red px-3 py-1 text-xs font-semibold uppercase tracking-wider text-steel-white">
              {project.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          {project.title}
        </h3>
        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
        {project.link && (
          <Link
            href={project.link}
            className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-foreground transition-all hover:gap-3 hover:text-steel-red"
          >
            Learn More
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )

  if (project.link) {
    return (
      <Link href={project.link} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

