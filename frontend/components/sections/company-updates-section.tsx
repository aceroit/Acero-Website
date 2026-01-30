"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

export interface CompanyUpdate {
  id: string
  title: string
  description: string
  image: string
  date: Date | string
  category?: string
  link?: string
}

interface CompanyUpdatesSectionProps {
  updates: CompanyUpdate[]
  title: string
  subtitle?: string
  columns?: 3 | 4
  className?: string
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function CompanyUpdatesSection({
  updates,
  title,
  subtitle,
  columns = 3,
  className,
}: CompanyUpdatesSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const gridCols =
    columns === 4
      ? "md:grid-cols-2 lg:grid-cols-4"
      : "md:grid-cols-2 lg:grid-cols-3"

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
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Updates Grid */}
        <div className={cn("grid", spacing.gridGap, gridCols)}>
          {updates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="h-full"
            >
              <UpdateCard update={update} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UpdateCard({ update }: { update: CompanyUpdate }) {
  const cardContent = (
    <div className="group relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-steel-red/50 hover:shadow-lg cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-secondary">
        <Image
          src={update.image}
          alt={update.title}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          quality={85}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-steel-red/0 transition-colors duration-300 group-hover:bg-steel-red/10" />
        {/* Date Badge */}
        <div className="absolute left-4 top-4 flex items-center gap-2 bg-steel-red px-3 py-1.5">
          <Calendar className="h-3 w-3 text-steel-white" />
          <span className="text-xs font-semibold uppercase tracking-wider text-steel-white">
            {formatDate(update.date)}
          </span>
        </div>
        {/* Category Badge */}
        {update.category && (
          <div className="absolute right-4 top-4">
            <span className="bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur-sm">
              {update.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-xl font-semibold text-foreground line-clamp-2">
          {update.title}
        </h3>
        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {update.description}
        </p>
        <div className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-foreground transition-all group-hover:gap-3 group-hover:text-steel-red">
          Read More
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  )

  // Always wrap in Link if link exists, otherwise return card as-is
  if (update.link) {
    return (
      <Link href={update.link} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

