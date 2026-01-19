"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface Advantage {
  id: string
  title: string
  icon: React.ReactNode
}

interface AdvantagesGridSectionProps {
  title?: string
  advantages: Advantage[]
  columns?: 2 | 3 | 4
  className?: string
}

export function AdvantagesGridSection({
  title,
  advantages,
  columns = 4,
  className,
}: AdvantagesGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const gridCols =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2 lg:grid-cols-4"

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>
        )}

        {/* Advantages Grid */}
        <div className={cn("grid gap-6 md:gap-8", gridCols)}>
          {advantages.map((advantage, index) => (
            <motion.div
              key={advantage.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="group flex h-full flex-col items-center justify-center border border-border bg-card p-8 text-center transition-all hover:border-steel-red/50 hover:bg-card/50">
                {/* Icon */}
                <div className="mb-4 flex h-16 w-16 items-center justify-center text-steel-red transition-colors group-hover:text-steel-red/80 md:h-20 md:w-20">
                  {advantage.icon}
                </div>
                {/* Title */}
                <h4 className="text-lg font-semibold text-foreground md:text-xl">
                  {advantage.title}
                </h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

