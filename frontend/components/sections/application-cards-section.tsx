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
  className?: string
}

export function ApplicationCardsSection({
  title,
  subtitle,
  applications,
  className,
}: ApplicationCardsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
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

