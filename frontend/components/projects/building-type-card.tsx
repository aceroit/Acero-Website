"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
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
  if (!buildingType.slug) {
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
        className="block h-full transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-steel-red focus-visible:ring-offset-2 rounded-lg"
        aria-label={`View ${buildingType.name} projects`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-500 hover:border-steel-red/50 hover:shadow-xl">
          {/* Image - full bleed */}
          {buildingType.image && buildingType.image !== "/placeholder.jpg" ? (
            <Image
              src={buildingType.image}
              alt={buildingType.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-muted" aria-hidden />
          )}

          {/* Name overlay - visible only on hover */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          >
            <h3 className="text-center text-xl font-bold tracking-tight text-steel-white drop-shadow-md md:text-2xl">
              {buildingType.name}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
