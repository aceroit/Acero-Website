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
  // Extract numeric value (remove commas and other non-digits)
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""))
  // Extract only the suffix after all digits and commas (e.g., "+" from "100,000+")
  const suffix = value.replace(/^[\d,\s]+/, "")

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

  // Format count with thousand separators (e.g. 1000 → "1,000", 100000 → "100,000")
  const formattedCount = count.toLocaleString()

  return (
    <span>
      {formattedCount}
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
              className={stat.sublabel ? "pt-4" : ""}
            >
              {/* Premium Card with Floating Red Banner */}
              <div className="relative h-full rounded-xl border border-border bg-card shadow-lg">
                {/* Floating Red Banner - positioned half outside the card */}
                {stat.sublabel && (
                  <div className="absolute -top-4 inset-x-3 z-10">
                    <div className="rounded-md bg-steel-red px-4 py-2 shadow-lg text-center">
                      <p className="text-xs font-semibold tracking-wide text-white md:text-sm">
                        {stat.sublabel}
                      </p>
                    </div>
                  </div>
                )}
                {/* Content */}
                <div className="px-6 py-6 text-center">
                  {stat.icon && (
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-br from-steel-red/10 to-steel-red/5 p-3">
                        {stat.icon}
                      </div>
                    </div>
                  )}
                  <div className="mb-2">
                    <p className="text-4xl font-extrabold text-foreground md:text-5xl">
                      <AnimatedCounter value={stat.value} isInView={isInView} />
                    </p>
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-foreground md:text-base">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

