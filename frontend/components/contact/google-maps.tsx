"use client"

import { cn } from "@/lib/utils"

interface Marker {
  lat: number
  lng: number
  label?: string
}

interface GoogleMapsProps {
  markers: Marker[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  className?: string
}

export function GoogleMaps({
  markers,
  center,
  zoom = 12,
  height = "400px",
  className,
}: GoogleMapsProps) {
  // If no markers, return empty
  if (markers.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border-2 border-border/50 bg-card/50 shadow-lg",
          className
        )}
        style={{ height }}
      >
        <p className="text-base font-medium text-muted-foreground">No location data available</p>
      </div>
    )
  }

  // Calculate center if not provided (average of all markers)
  const calculatedCenter = center || {
    lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
    lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
  }

  // For single marker, use embed API
  if (markers.length === 1) {
    const marker = markers[0]
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&q=${marker.lat},${marker.lng}&zoom=${zoom}`

  return (
    <div className={cn("relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl", className)}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full"
      />
    </div>
  )
  }

  // For multiple markers, use static map or JavaScript API
  // For now, use static map image as fallback
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${calculatedCenter.lat},${calculatedCenter.lng}&zoom=${zoom}&size=800x400&markers=${markers.map((m) => `${m.lat},${m.lng}`).join("|")}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}`

  // If API key is not available, show placeholder
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border-2 border-border/50 bg-card/50 shadow-lg",
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <p className="mb-2 text-base font-semibold text-foreground">
            Map View Available
          </p>
          <p className="text-sm text-muted-foreground">
            {markers.length} location{markers.length > 1 ? "s" : ""} marked
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl", className)}>
      <img
        src={staticMapUrl}
        alt="Map showing branch locations"
        className="h-full w-full object-cover"
        style={{ height }}
      />
    </div>
  )
}

