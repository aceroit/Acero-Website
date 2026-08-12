"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "@/components/ui/cms-image"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Industry } from "@/utils/projects-data"

interface IndustryCardProps {
  industry: Industry
  index?: number
  className?: string
}

export function IndustryCard({ industry, index = 0, className }: IndustryCardProps) {
  const searchParams = useSearchParams()
  
  // Set industry filter as query param (stay on projects page)
  const buildHref = () => {
    const params = new URLSearchParams()
    const region = searchParams.get("region")
    const country = searchParams.get("country")
    const area = searchParams.get("area")
    
    // Set the industry filter
    params.set("industry", industry.slug)
    
    if (region && region !== "all") params.set("region", region)
    if (country && country !== "all") params.set("country", country)
    if (area && area !== "all") params.set("area", area)
    
    return `/projects?${params.toString()}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className={cn("group h-full", className)}
    >
      <Link
        href={buildHref()}
        className="block h-full transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-steel-red focus-visible:ring-offset-2 rounded-lg"
        aria-label={`View projects in ${industry.name}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-500 hover:border-steel-red/50 hover:shadow-xl">
          {/* Image - full bleed */}
          {industry.logo && industry.logo !== "/placeholder.jpg" ? (
            <Image
              src={industry.logo}
              alt={industry.name}
              fill
unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-muted" aria-hidden />
          )}

          {/* Desktop keeps hover reveal; mobile shows the label by default */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/45 p-4 opacity-100 transition-opacity duration-300 md:bg-gradient-to-t md:from-black/80 md:via-black/50 md:to-transparent md:p-0 md:opacity-0 group-hover:md:opacity-100"
            aria-hidden
          >
            <h3 className="max-w-full text-center text-base font-bold tracking-tight text-steel-white drop-shadow-md md:text-2xl">
              {industry.name}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
