"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface Application {
  id: string
  name: string
  icon: React.ReactNode
  /** When set (e.g. PEB application SVGs), show this image instead of icon */
  svgPath?: string | null
}

interface ApplicationCardsSectionProps {
  title?: string
  subtitle: string
  applications: Application[]
  columns?: number
  className?: string
}

export function ApplicationCardsSection({
  title,
  subtitle,
  applications,
  columns,
  className,
}: ApplicationCardsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Generate grid classes based on columns prop (admin allows 2–6)
  const getGridClasses = () => {
    if (columns) {
      const cols = Math.min(Math.max(columns, 2), 6)
      switch (cols) {
        case 2:
          return "grid-cols-2 sm:grid-cols-2 md:grid-cols-2"
        case 3:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
        case 4:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        case 5:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        case 6:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        default:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      }
    }

    const count = applications.length
    if (count <= 4) {
      return "grid-cols-2 sm:grid-cols-2 md:grid-cols-4"
    }
    if (count <= 6) {
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    }
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
  }

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        {/* Title */}
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>
        )}
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {subtitle}
        </motion.p>

        {/* Application Cards Grid */}
        <div className={cn("grid", spacing.gridGap, getGridClasses())}>
          {applications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <div className="group flex h-full flex-col items-center justify-center rounded-lg border border-border bg-card p-4 text-center transition-all hover:border-steel-red/50 hover:bg-card/50 md:p-6">
                {/* Icon or PEB application SVG */}
                <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center text-steel-red transition-colors group-hover:text-steel-red/80 md:h-14 md:w-14">
                  {application.svgPath ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={application.svgPath}
                        alt={application.name}
                        fill
                        className="object-contain"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    application.icon
                  )}
                </div>
                {/* Name */}
                <h4 className="text-sm font-medium text-foreground md:text-base">
                  {application.name}
                </h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

