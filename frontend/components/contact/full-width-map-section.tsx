"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { GoogleMaps } from "./google-maps"
import { branchesData } from "@/utils/branches-data"

export function FullWidthMapSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  // Get all active branches with their coordinates
  const markers = branchesData
    .filter((branch) => branch.isActive)
    .map((branch) => ({
      lat: branch.coordinates.lat,
      lng: branch.coordinates.lng,
      label: branch.location,
    }))

  // Calculate center point (average of all coordinates)
  const center =
    markers.length > 0
      ? {
          lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
          lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
        }
      : undefined

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
      className="relative w-full border-t-2 border-border/50"
    >
      <div className="relative h-[60vh] w-full overflow-hidden md:h-[70vh] lg:h-[80vh]">
        {/* Premium overlay gradient at top */}
        <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-background via-background/50 to-transparent pointer-events-none" />
        
        {/* Premium overlay gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
        
        <div className="h-full w-full">
          <GoogleMaps
            markers={markers}
            center={center}
            zoom={4}
            height="100%"
            className="h-full w-full"
          />
        </div>
      </div>
    </motion.section>
  )
}

