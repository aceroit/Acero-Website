"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { getPublicGoogleMapsApiKey } from "@/services/google-maps.service"

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
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "")
  const [staticMapFailed, setStaticMapFailed] = useState(false)

  useEffect(() => {
    let isMounted = true

    getPublicGoogleMapsApiKey().then((key) => {
      if (isMounted) {
        setApiKey(key)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setStaticMapFailed(false)
  }, [apiKey, markers])

  const hasMarkers = markers.length > 0
  const calculatedCenter = useMemo(() => {
    if (!hasMarkers) {
      return center || { lat: 0, lng: 0 }
    }

    return center || {
      lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
      lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
    }
  }, [center, hasMarkers, markers])

  const staticMapUrl = useMemo(() => {
    if (!apiKey || !hasMarkers) {
      return ""
    }

    const markerParams = markers
      .map((marker) => `${marker.lat},${marker.lng}`)
      .join("|")

    return `https://maps.googleapis.com/maps/api/staticmap?center=${calculatedCenter.lat},${calculatedCenter.lng}&zoom=${zoom}&size=1200x600&scale=2&markers=${markerParams}&key=${encodeURIComponent(apiKey)}`
  }, [apiKey, calculatedCenter.lat, calculatedCenter.lng, hasMarkers, markers, zoom])

  // If no markers, return empty
  if (!hasMarkers) {
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

  // For single marker, use embed API
  if (markers.length === 1) {
    const marker = markers[0]
    const embedUrl = apiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${marker.lat},${marker.lng}&zoom=${zoom}`
      : `https://www.google.com/maps?q=${marker.lat},${marker.lng}&z=${zoom}&output=embed`

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

  if (!apiKey || staticMapFailed) {
    const fallbackEmbedUrl = `https://www.google.com/maps?q=${calculatedCenter.lat},${calculatedCenter.lng}&z=${zoom}&output=embed`

    return (
      <div className={cn("relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl", className)}>
        <iframe
          src={fallbackEmbedUrl}
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

  return (
    <div className={cn("relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl", className)}>
      <img
        src={staticMapUrl}
        alt="Map showing branch locations"
        className="h-full w-full object-cover"
        style={{ height }}
        onError={() => setStaticMapFailed(true)}
      />
    </div>
  )
}

