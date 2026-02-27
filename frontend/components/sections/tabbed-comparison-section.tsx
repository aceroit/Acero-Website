"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

/** Colour class from backend (e.g. "bg-green-500"). Legend item has only color. */
interface LegendItem {
  color: string
  value?: string
  label?: string
}

/** Cell value: either colour class string (new) or legacy { value, label } */
type CellValue = string | { value: string; label: string }

interface ComparisonData {
  criteria: string
  preEngineered: CellValue
  conventionalSteel: CellValue
  reinforcedConcrete: CellValue
}

interface TabData {
  id: string
  label: string
  legend: LegendItem[]
  data: ComparisonData[]
  /** Text shown below the table when this tab is active */
  textBelowTable?: string
}

interface TabbedComparisonSectionProps {
  title: string
  subtitle: string
  tabs: TabData[]
  className?: string
}

/** Map legacy value strings to colour class */
const LEGACY_VALUE_TO_COLOR: Record<string, string> = {
  good: "bg-green-500",
  average: "bg-yellow-500",
  poor: "bg-red-500",
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
  "on-time": "bg-green-500",
  slow: "bg-red-500",
}

/** Resolve colour class: use string directly, look up by value in legend, or legacy value map */
function getColorClass(
  cell: CellValue,
  legend: LegendItem[]
): string {
  if (typeof cell === "string") {
    if (cell.startsWith("bg-")) return cell
    return LEGACY_VALUE_TO_COLOR[cell.toLowerCase()] || cell || "bg-muted-foreground"
  }
  const val = cell?.value?.toLowerCase?.() ?? ""
  const fromLegend = legend.find((l) => (l.value ?? "").toLowerCase() === val)?.color
  if (fromLegend) return fromLegend
  return LEGACY_VALUE_TO_COLOR[val] ?? "bg-muted-foreground"
}

/**
 * Derive per-color labels from the tab data cells.
 * When legend items lack explicit labels, this extracts them from { value, label } cell objects.
 */
function deriveLegendLabelsFromData(tab: TabData): Map<string, string> {
  const colorToLabel = new Map<string, string>()
  for (const row of tab.data) {
    for (const cell of [row.preEngineered, row.conventionalSteel, row.reinforcedConcrete]) {
      if (typeof cell === "object" && cell?.value && cell?.label) {
        const color = LEGACY_VALUE_TO_COLOR[cell.value.toLowerCase()]
        if (color && !colorToLabel.has(color)) {
          colorToLabel.set(color, cell.label)
        }
      }
    }
  }
  return colorToLabel
}

/** Table cell: only the colored dot; labels appear once in the legend below tabs */
function RatingDot({
  cell,
  legend,
}: {
  cell: CellValue
  legend: LegendItem[]
}) {
  const colorClass = getColorClass(cell, legend)
  return (
    <div className="flex items-center justify-center">
      <div className={cn("h-4 w-4 shrink-0 rounded-full", colorClass)} />
    </div>
  )
}

export function TabbedComparisonSection({
  title,
  subtitle,
  tabs,
  className,
}: TabbedComparisonSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "")
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          {title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 text-center text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {subtitle}
        </motion.p>

        {/* Tabs and Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab List */}
            <TabsList className="mb-8 grid w-full grid-cols-3 bg-muted p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-xs lg:text-sm data-[state=active]:bg-steel-red data-[state=active]:text-steel-white"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Content */}
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Legend: dots + labels outside table (above table) */}
                    {(() => {
                      const derivedLabels = deriveLegendLabelsFromData(tab)
                      return (
                        <div className="mb-6 flex flex-wrap items-center justify-center gap-6">
                          {tab.legend.map((item, idx) => {
                            const colorClass = item.color || "bg-muted-foreground"
                            const label =
                              item.label ?? item.value ?? derivedLabels.get(colorClass) ?? ""
                            return (
                              <div
                                key={`${tab.id}-${item.color ?? idx}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <div
                                  className={cn(
                                    "h-3 w-3 shrink-0 rounded-full",
                                    colorClass
                                  )}
                                />
                                {label && <span>{label}</span>}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Comparison Table */}
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full table-fixed border-collapse text-sm">
                        <colgroup>
                          <col className="w-[34%] lg:w-[28%]" />
                          <col className="w-[22%] lg:w-[24%]" />
                          <col className="w-[22%] lg:w-[24%]" />
                          <col className="w-[22%] lg:w-[24%]" />
                        </colgroup>
                        <TableHeader>
                          <TableRow className="border-b border-border bg-foreground hover:bg-foreground">
                            <TableHead className="h-auto px-2 py-2.5 text-left text-[10px] font-bold uppercase leading-snug tracking-wider text-background lg:px-6 lg:py-4 lg:text-sm">
                              {tab.label === "General Criteria"
                                ? "General Criteria"
                                : tab.label === "Cost Comparison"
                                  ? "Cost Criteria"
                                  : "Time Criteria"}
                            </TableHead>
                            <TableHead className="h-auto px-1.5 py-2.5 text-center text-[10px] font-bold uppercase leading-snug tracking-wider text-background lg:px-6 lg:py-4 lg:text-sm">
                              <span className="lg:hidden">PEB</span>
                              <span className="hidden lg:inline">Pre Engineered Buildings</span>
                            </TableHead>
                            <TableHead className="h-auto px-1.5 py-2.5 text-center text-[10px] font-bold uppercase leading-snug tracking-wider text-background lg:px-6 lg:py-4 lg:text-sm">
                              <span className="lg:hidden">CSB</span>
                              <span className="hidden lg:inline">Conventional Steel Buildings</span>
                            </TableHead>
                            <TableHead className="h-auto px-1.5 py-2.5 text-center text-[10px] font-bold uppercase leading-snug tracking-wider text-background lg:px-6 lg:py-4 lg:text-sm">
                              <span className="lg:hidden">RCC</span>
                              <span className="hidden lg:inline">Reinforced Cement Concrete</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tab.data.map((row, index) => (
                            <TableRow
                              key={index}
                              className={cn(
                                "border-b border-border transition-colors hover:bg-muted/50",
                                index % 2 === 0 ? "bg-card" : "bg-muted/30"
                              )}
                            >
                              <TableCell className="break-words px-2 py-2 text-xs font-semibold text-foreground [white-space:normal] lg:px-6 lg:py-4 lg:text-sm">
                                {row.criteria}
                              </TableCell>
                              <TableCell className="px-1.5 py-2 lg:px-6 lg:py-4">
                                <RatingDot
                                  cell={row.preEngineered}
                                  legend={tab.legend}
                                />
                              </TableCell>
                              <TableCell className="px-1.5 py-2 lg:px-6 lg:py-4">
                                <RatingDot
                                  cell={row.conventionalSteel}
                                  legend={tab.legend}
                                />
                              </TableCell>
                              <TableCell className="px-1.5 py-2 lg:px-6 lg:py-4">
                                <RatingDot
                                  cell={row.reinforcedConcrete}
                                  legend={tab.legend}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </table>
                    </div>

                    {/* Mobile abbreviation legend */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground lg:hidden">
                      <span><strong>PEB</strong> = Pre Engineered Buildings</span>
                      <span><strong>CSB</strong> = Conventional Steel Buildings</span>
                      <span><strong>RCC</strong> = Reinforced Cement Concrete</span>
                    </div>

                    {/* Tab-specific text below table */}
                    {tab.textBelowTable && (
                      <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground md:text-base">
                        {tab.textBelowTable}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  )
}

