"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  name: string
  icon: React.ReactNode
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

  // Generate grid classes based on columns prop or calculate optimal columns
  const getGridClasses = () => {
    if (columns) {
      // Use provided columns (max 4 as per admin panel)
      const cols = Math.min(Math.max(columns, 2), 4)
      switch (cols) {
        case 2:
          return "grid-cols-2 sm:grid-cols-2 md:grid-cols-2"
        case 3:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
        case 4:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        default:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      }
    }
    
    // Calculate optimal columns based on application count
    const count = applications.length
    if (count <= 4) {
      return "grid-cols-2 sm:grid-cols-2 md:grid-cols-4"
    } else if (count <= 6) {
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
    } else if (count <= 8) {
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
    } else {
      // For more than 8, use 4 columns max
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
    }
  }

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
        <div className={cn("grid gap-4 md:gap-6", getGridClasses())}>
          {applications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <div className="group flex h-full flex-col items-center justify-center border border-border bg-card p-4 text-center transition-all hover:border-steel-red/50 hover:bg-card/50 md:p-6">
                {/* Icon */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center text-steel-red transition-colors group-hover:text-steel-red/80 md:h-14 md:w-14">
                  {application.icon}
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

