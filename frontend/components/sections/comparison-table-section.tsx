"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const MAX_HEADER_CHARS = 14

function truncateHeader(text: string, max = MAX_HEADER_CHARS): string {
  const t = text.trim()
  if (t.length <= max) return t
  return t.slice(0, max) + "…"
}

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
      <div className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
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

        {/* Comparison Table - no scroll: no overflow wrapper, table-fixed so it fits viewport */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="min-w-0 overflow-hidden rounded-lg border border-border"
        >
          <table className="w-full min-w-0 table-fixed caption-bottom border-collapse text-sm">
            <colgroup>
              <col style={{ width: "20%" }} />
              {/* Remaining columns share 80% equally via table-fixed */}
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-border bg-foreground hover:bg-foreground">
                <TableHead className="h-auto min-h-[2.5rem] overflow-hidden align-top px-2 py-2.5 text-left text-[11px] font-bold uppercase leading-snug tracking-wider text-background md:px-2.5 md:text-xs">
                  <span className="block truncate">Factors</span>
                </TableHead>
                {systems.map((system, index) => (
                  <TableHead
                    key={index}
                    className="h-auto min-h-[2.5rem] overflow-hidden align-top px-2 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wider text-background md:px-2.5 md:text-xs"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate cursor-default">
                          {truncateHeader(system.name)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        {system.name}
                      </TooltipContent>
                    </Tooltip>
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
                  <TableCell className="overflow-hidden break-words px-2 py-2 text-sm font-semibold text-foreground md:px-2.5 md:py-2.5 [white-space:normal]">
                    {factor}
                  </TableCell>
                  {systems.map((system, systemIndex) => (
                    <TableCell
                      key={systemIndex}
                      className="overflow-hidden break-words px-2 py-2 text-center text-xs text-muted-foreground md:px-2.5 md:py-2.5 [white-space:normal]"
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

