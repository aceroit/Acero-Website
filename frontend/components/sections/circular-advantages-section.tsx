"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useMemo } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Grid } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface Advantage {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  position: number // 1-9 for circular positioning
}

interface CircularAdvantagesSectionProps {
  title: string
  advantages: Advantage[]
  centerText?: string
  className?: string
}

// Calculate position on circle (0-360 degrees)
function getPositionAngle(position: number, total: number): number {
  return ((position - 1) / total) * 360
}

// Convert angle to x, y coordinates on circle
function getCirclePosition(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  }
}

export function CircularAdvantagesSection({
  title,
  advantages,
  centerText = "ACERO",
  className,
}: CircularAdvantagesSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredAdvantage, setHoveredAdvantage] = useState<string | null>(null)
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Circle radius (responsive)
  const radius = 200 // Base radius for radiating lines

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-muted/30", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          {title}
        </motion.h2>

        {/* Circular Layout */}
        <div className="relative flex min-h-[600px] items-center justify-center md:min-h-[700px]">
          {/* Mobile: Stacked Layout */}
          <div className="grid w-full gap-6 md:hidden">
            {advantages.map((advantage, index) => (
              <motion.div
                key={advantage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-center gap-4 border border-border bg-card p-4"
                onMouseEnter={() => setHoveredAdvantage(advantage.id)}
                onMouseLeave={() => setHoveredAdvantage(null)}
              >
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-bold uppercase tracking-wider text-foreground">
                    {advantage.title}
                  </h4>
                  {hoveredAdvantage === advantage.id && (
                    <p className="text-xs text-muted-foreground">
                      {advantage.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Circular Layout */}
          <div className="hidden md:block">
            <div className="relative mx-auto h-[700px] w-full max-w-4xl">
              {/* Central Hub - Small Gray Dot at exact center */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute left-1/2 top-1/2 z-30 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/40"
              />

              {/* Large ACERO Circle - Centered */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute left-1/2 top-1/2 z-20 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-steel-red bg-steel-red shadow-xl"
              >
                <span className="text-2xl font-bold uppercase tracking-wider text-steel-white">
                  ACERO
                </span>
              </motion.div>

              {/* Small Circle with Grid Icon - Overlapping bottom-right of ACERO */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute left-1/2 top-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-steel-red bg-card shadow-lg"
                style={{
                  transform: "translate(calc(-50% + 60px), calc(-50% + 60px))",
                }}
              >
                <Grid className="h-6 w-6 text-steel-red" />
              </motion.div>

              {/* Advantages as Text Labels along Radiating Lines */}
              {advantages.map((advantage, index) => {
                const angle = getPositionAngle(advantage.position, advantages.length)
                const lineLength = radius + 60
                const textDistance = lineLength + 30
                const radians = (angle * Math.PI) / 180
                const textX = Math.cos(radians) * textDistance
                const textY = Math.sin(radians) * textDistance

                return (
                  <Tooltip key={advantage.id}>
                    <TooltipTrigger asChild>
                      <div className="absolute left-1/2 top-1/2">
                        {/* Radiating Line from Center Hub to Text Label */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                          transition={{
                            duration: 0.8,
                            delay: 0.5 + index * 0.1,
                            ease: "easeOut",
                          }}
                          className={cn(
                            "absolute left-1/2 top-1/2 h-[1px] origin-left -translate-x-1/2 -translate-y-1/2 bg-border transition-all duration-300",
                            hoveredAdvantage === advantage.id && "bg-steel-red/80 h-[1.5px]"
                          )}
                          style={{
                            width: `${lineLength}px`,
                            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                          }}
                        />

                        {/* Text Label positioned at end of line */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                          transition={{
                            duration: 0.6,
                            delay: 0.7 + index * 0.1,
                          }}
                          className="absolute cursor-pointer"
                          style={{
                            left: `calc(50% + ${textX}px)`,
                            top: `calc(50% + ${textY}px)`,
                            transform: "translate(-50%, -50%)",
                          }}
                          onMouseEnter={() => setHoveredAdvantage(advantage.id)}
                          onMouseLeave={() => setHoveredAdvantage(null)}
                        >
                          <h4
                            className={cn(
                              "whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-colors",
                              hoveredAdvantage === advantage.id
                                ? "text-steel-red"
                                : "text-foreground"
                            )}
                          >
                            {advantage.title}
                          </h4>
                        </motion.div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side={angle > 90 && angle < 270 ? "left" : "right"}
                      className="max-w-xs border border-border bg-card p-4 text-sm"
                      sideOffset={10}
                    >
                      <p className="leading-relaxed text-muted-foreground">
                        {advantage.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

