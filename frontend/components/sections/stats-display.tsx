"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface Stat {
  value: string
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface StatsDisplayProps {
  stats: Stat[]
  columns?: 3 | 4
  className?: string
}

// Animated counter component
function AnimatedCounter({
  value,
  isInView,
}: {
  value: string
  isInView: boolean
}) {
  const [count, setCount] = useState(0)
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""))
  // Trim trailing commas so "100000," displays as "100000" not "100000,"
  const suffix = value.replace(/[0-9]/g, "").replace(/,\s*$/, "")

  useEffect(() => {
    if (!isInView || !numericValue) {
      // If value contains non-numeric characters, just display it
      if (!numericValue) {
        setCount(0)
        return
      }
      return
    }

    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = numericValue / steps
    const stepDuration = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [isInView, numericValue])

  // If value doesn't contain numbers, just display it
  if (!numericValue) {
    return <span>{value}</span>
  }

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

export function StatsDisplay({
  stats,
  columns = 3,
  className,
}: StatsDisplayProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Make stats responsive: on small screens stack, on medium+ show in a single row
  const gridCols = columns === 4 
    ? "grid-cols-2 md:grid-cols-4" 
    : "grid-cols-1 sm:grid-cols-3"

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth, "px-6 lg:px-8")}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn("grid", spacing.gridGap, gridCols)}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Premium Luxury Card with Glassmorphism */}
              <div className="relative h-full overflow-hidden rounded-xl border border-steel-red/20 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:from-steel-dark/80 dark:via-steel-dark/60 dark:to-steel-dark/40 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                {/* Content */}
                <div className="relative z-10 text-center">
                  {stat.icon && (
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-br from-steel-red/10 to-steel-red/5 p-3">
                        {stat.icon}
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="bg-gradient-to-br from-foreground via-foreground to-steel-red bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
                      <AnimatedCounter value={stat.value} isInView={isInView} />
                    </p>
                  </div>
                  <p className="mb-1 text-base font-bold uppercase tracking-[0.15em] text-foreground">
                    {stat.label}
                  </p>
                  {stat.sublabel && (
                    <p className="text-xs font-medium text-muted-foreground/80">
                      {stat.sublabel}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

