"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

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
  const suffix = value.replace(/[0-9]/g, "")

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
      {count.toLocaleString()}
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

  const gridCols = columns === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn("grid gap-8 md:gap-12", gridCols)}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              {stat.icon && (
                <div className="mb-4 flex justify-center">{stat.icon}</div>
              )}
              <div className="mb-2">
                <p className="text-5xl font-bold text-foreground md:text-6xl">
                  <AnimatedCounter value={stat.value} isInView={isInView} />
                </p>
              </div>
              <p className="mb-1 text-lg font-semibold uppercase tracking-wider text-foreground">
                {stat.label}
              </p>
              {stat.sublabel && (
                <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

