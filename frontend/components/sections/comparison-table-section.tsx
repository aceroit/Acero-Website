"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface ComparisonSystem {
  name: string
  values: string[]
}

interface ComparisonTableSectionProps {
  title: string
  factors: string[]
  systems: ComparisonSystem[]
  className?: string
}

export function ComparisonTableSection({
  title,
  factors,
  systems,
  className,
}: ComparisonTableSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto min-w-0 px-4 lg:px-8", spacing.containerMaxWidth)}>
        {/* Title - single line; truncate with ellipsis if too long */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          title={title}
          className="mb-12 truncate text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl"
        >
          {title}
        </motion.h2>

        {/* Comparison Table - horizontal scroll on mobile, full width on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="overflow-x-auto rounded-lg border border-border"
        >
          <table className="w-full min-w-[700px] caption-bottom border-collapse text-sm lg:min-w-0 lg:table-fixed">
            <colgroup>
              <col className="w-[120px] lg:w-[20%]" />
              {systems.map((_, index) => (
                <col key={index} className="w-[110px] lg:w-auto" />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-border bg-foreground hover:bg-foreground">
                <TableHead className="h-auto min-h-[2.5rem] align-top px-3 py-3 text-left text-xs font-bold uppercase leading-snug tracking-wider text-background whitespace-normal">
                  Factors
                </TableHead>
                {systems.map((system, index) => (
                  <TableHead
                    key={index}
                    className="h-auto min-h-[2.5rem] align-top px-3 py-3 text-center text-xs font-bold uppercase leading-snug tracking-wider text-background whitespace-normal"
                  >
                    {system.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {factors.map((factor, factorIndex) => (
                <TableRow
                  key={factorIndex}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/50",
                    factorIndex % 2 === 0 ? "bg-card" : "bg-muted/30"
                  )}
                >
                  <TableCell className="px-3 py-3 text-sm font-semibold text-foreground whitespace-normal">
                    {factor}
                  </TableCell>
                  {systems.map((system, systemIndex) => (
                    <TableCell
                      key={systemIndex}
                      className="px-3 py-3 text-center text-sm text-muted-foreground whitespace-normal"
                    >
                      {system.values[factorIndex]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}

