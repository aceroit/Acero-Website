"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BuildingType } from "@/utils/projects-data"

interface BuildingTypeCardProps {
  buildingType: BuildingType
  industrySlug: string
  index?: number
  className?: string
}

export function BuildingTypeCard({
  buildingType,
  industrySlug,
  index = 0,
  className,
}: BuildingTypeCardProps) {
  // Ensure slug exists before creating link
  if (!buildingType.slug) {
    console.warn(`BuildingType "${buildingType.name}" has no slug`)
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className={cn("group h-full", className)}
    >
      <Link
        href={`/projects/${industrySlug}/${buildingType.slug}`}
        className="block h-full transition-transform duration-300 hover:scale-[1.02]"
      >
        <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:border-steel-red/50 hover:shadow-xl">
          {/* Background Image */}
          {buildingType.image && buildingType.image !== "/placeholder.jpg" && (
            <>
              <Image
                src={buildingType.image}
                alt={buildingType.name}
                fill
                className="object-cover opacity-40 transition-opacity duration-500 group-hover:opacity-50"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              />
              {/* Darker overlay to make image more visible */}
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}
          {/* Premium gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/3 group-hover:to-steel-red/5" />

          {/* Content - Properly aligned */}
          <div className="relative z-10 flex h-full flex-col">
            {/* Building Type Name */}
            <h3 className="mb-6 text-2xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-steel-red md:text-3xl">
              {buildingType.name}
            </h3>

            {/* Project Count - Aligned at bottom */}
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-border">
              <div className="flex flex-col">
                <span className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Projects
                </span>
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {buildingType.projectCount}
                </span>
              </div>

              {/* Arrow Icon - Premium hover effect */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-background transition-all duration-300 group-hover:border-steel-red group-hover:bg-steel-red group-hover:shadow-lg">
                <ArrowRight className="h-6 w-6 text-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-steel-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
