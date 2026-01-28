"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState } from "react"
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

type RatingValue =
  | "good"
  | "average"
  | "poor"
  | "low"
  | "medium"
  | "high"
  | "on-time"
  | "slow"

interface Rating {
  value: RatingValue
  label: string
}

interface ComparisonData {
  criteria: string
  preEngineered: Rating
  conventionalSteel: Rating
  reinforcedConcrete: Rating
}

interface LegendItem {
  value: RatingValue
  color: string
  label: string
}

interface TabData {
  id: string
  label: string
  legend: LegendItem[]
  data: ComparisonData[]
}

interface TabbedComparisonSectionProps {
  title: string
  subtitle: string
  tabs: TabData[]
  className?: string
}

function RatingDot({ rating }: { rating: Rating }) {
  const getColor = () => {
    switch (rating.value) {
      case "good":
      case "low":
      case "on-time":
        return "bg-green-500"
      case "average":
      case "medium":
        return "bg-yellow-500"
      case "poor":
      case "high":
      case "slow":
        return "bg-red-500"
      default:
        return "bg-muted-foreground"
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={cn("h-4 w-4 rounded-full", getColor())} />
      <span className="text-sm text-muted-foreground">{rating.label}</span>
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

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

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
                  className="data-[state=active]:bg-steel-red data-[state=active]:text-steel-white"
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
                    {/* Legend */}
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-6">
                      {tab.legend.map((item) => (
                        <div
                          key={item.value}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div
                            className={cn("h-3 w-3 rounded-full", {
                              "bg-green-500":
                                item.value === "good" ||
                                item.value === "low" ||
                                item.value === "on-time",
                              "bg-yellow-500":
                                item.value === "average" || item.value === "medium",
                              "bg-red-500":
                                item.value === "poor" ||
                                item.value === "high" ||
                                item.value === "slow",
                            })}
                          />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border bg-foreground hover:bg-foreground">
                            <TableHead className="h-14 px-6 text-sm font-bold uppercase tracking-wider text-background md:text-base">
                              {tab.label === "General Criteria"
                                ? "General Criteria"
                                : tab.label === "Cost Comparison"
                                  ? "Cost Criteria"
                                  : "Time Criteria"}
                            </TableHead>
                            <TableHead className="h-14 px-6 text-center text-sm font-bold uppercase tracking-wider text-background md:text-base">
                              Pre Engineered Buildings
                            </TableHead>
                            <TableHead className="h-14 px-6 text-center text-sm font-bold uppercase tracking-wider text-background md:text-base">
                              Conventional Steel Buildings
                            </TableHead>
                            <TableHead className="h-14 px-6 text-center text-sm font-bold uppercase tracking-wider text-background md:text-base">
                              Reinforced Cement Concrete
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
                              <TableCell className="px-6 py-4 font-semibold text-foreground">
                                {row.criteria}
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <RatingDot rating={row.preEngineered} />
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <RatingDot rating={row.conventionalSteel} />
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <RatingDot rating={row.reinforcedConcrete} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

