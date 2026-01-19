"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

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

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          {title}
        </motion.h2>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="overflow-x-auto rounded-lg border border-border"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-foreground hover:bg-foreground">
                <TableHead className="h-14 px-6 text-sm font-bold uppercase tracking-wider text-background md:text-base">
                  Factors
                </TableHead>
                {systems.map((system, index) => (
                  <TableHead
                    key={index}
                    className="h-14 px-6 text-center text-sm font-bold uppercase tracking-wider text-background md:text-base"
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
                  <TableCell className="px-6 py-4 font-semibold text-foreground">
                    {factor}
                  </TableCell>
                  {systems.map((system, systemIndex) => (
                    <TableCell
                      key={systemIndex}
                      className="px-6 py-4 text-center text-muted-foreground"
                    >
                      {system.values[factorIndex]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </section>
  )
}

