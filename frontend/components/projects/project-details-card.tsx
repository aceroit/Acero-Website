"use client"

import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Project } from "@/utils/projects-data"

interface ProjectDetailsCardProps {
  project: Project
  industry: string
  buildingType: string
  className?: string
}

export function ProjectDetailsCard({
  project,
  industry,
  buildingType,
  className,
}: ProjectDetailsCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const details = [
    { label: "Region", value: project.region },
    { label: "Country", value: project.country },
    { label: "Industry", value: industry },
    { label: "Building Type", value: buildingType },
    ...(project.accessoriesAndSpecialFeatures && project.accessoriesAndSpecialFeatures !== "--"
      ? [{ label: "Accessories & Special Features", value: project.accessoriesAndSpecialFeatures }]
      : []),
    ...(project.builtUpAreaSqm && project.builtUpAreaSqm !== "--"
      ? [{ label: "Built Up Area (sqm)", value: project.builtUpAreaSqm }]
      : []),
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6 }}
      className={cn("w-full", className)}
    >
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 sm:grid-cols-2">
            {details.map((detail, index) => (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className="flex flex-col space-y-2"
              >
                <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {detail.label}
                </dt>
                <dd className="text-lg font-semibold leading-relaxed text-foreground">
                  {detail.value}
                </dd>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

