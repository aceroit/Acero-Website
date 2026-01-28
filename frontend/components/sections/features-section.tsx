"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface Feature {
  icon?: React.ReactNode
  image?: string
  title: string
  description: string
}

interface FeaturesSectionProps {
  title: string
  features: Feature[]
  columns?: 3 | 4
  className?: string
}

export function FeaturesSection({
  title,
  features,
  columns = 3,
  className,
}: FeaturesSectionProps) {
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
        </motion.div>

        {/* Features Grid */}
        <div className={cn("grid gap-6 md:gap-8", gridCols)}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="h-full"
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="group flex h-full flex-col border border-border bg-card p-6 transition-all hover:border-steel-red/50 md:p-8">
      {/* Icon or Image */}
      {feature.icon && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center border border-border text-steel-red transition-colors group-hover:border-steel-red group-hover:bg-steel-red group-hover:text-steel-white">
          {feature.icon}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <h3 className="mb-3 text-xl font-semibold text-foreground md:text-2xl">
          {feature.title}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">
          {feature.description}
        </p>
      </div>
    </div>
  )
}

