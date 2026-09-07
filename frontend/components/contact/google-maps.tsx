"use client"

import { useMemo } from "react"
import { MapPin } from "lucide-react"
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

function isValidMarker(marker: Marker) {
  return (
    Number.isFinite(marker.lat) &&
    Number.isFinite(marker.lng) &&
    marker.lat >= -90 &&
    marker.lat <= 90 &&
    marker.lng >= -180 &&
    marker.lng <= 180
  )
}

function toMercatorPoint(marker: Marker) {
  const sinLat = Math.sin((marker.lat * Math.PI) / 180)

  return {
    x: (marker.lng + 180) / 360,
    y: 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI),
  }
}

function getOverlayBounds(markers: Marker[]) {
  const points = markers.map(toMercatorPoint)
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(maxX - minX, 0.01)
  const height = Math.max(maxY - minY, 0.01)
  const paddingX = width * 0.2
  const paddingY = height * 0.24

  return {
    minX: Math.max(0, minX - paddingX),
    maxX: Math.min(1, maxX + paddingX),
    minY: Math.max(0, minY - paddingY),
    maxY: Math.min(1, maxY + paddingY),
  }
}

function getOverlayPosition(marker: Marker, bounds: ReturnType<typeof getOverlayBounds>) {
  const point = toMercatorPoint(marker)
  const width = Math.max(bounds.maxX - bounds.minX, 0.01)
  const height = Math.max(bounds.maxY - bounds.minY, 0.01)

  return {
    left: `${((point.x - bounds.minX) / width) * 100}%`,
    top: `${((point.y - bounds.minY) / height) * 100}%`,
  }
}

function getMapCenter(markers: Marker[], center?: { lat: number; lng: number }) {
  if (center) {
    return center
  }

  return {
    lat: markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length,
    lng: markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length,
  }
}

export function GoogleMaps({
  markers,
  center,
  zoom = 12,
  height = "400px",
  className,
}: GoogleMapsProps) {
  const validMarkers = useMemo(() => markers.filter(isValidMarker), [markers])
  const hasMarkers = validMarkers.length > 0
  const isSingleMarker = validMarkers.length === 1

  const calculatedCenter = useMemo(
    () => (hasMarkers ? getMapCenter(validMarkers, center) : center || { lat: 0, lng: 0 }),
    [center, hasMarkers, validMarkers]
  )

  const overlayBounds = useMemo(
    () => (validMarkers.length > 1 ? getOverlayBounds(validMarkers) : null),
    [validMarkers]
  )

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

  if (isSingleMarker) {
    const marker = validMarkers[0]
    const singleMarkerEmbedUrl = `https://www.google.com/maps?q=${marker.lat},${marker.lng}&z=${zoom}&output=embed`

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl",
          className
        )}
      >
        <iframe
          src={singleMarkerEmbedUrl}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full"
          title={marker.label || "Acero location map"}
        />
      </div>
    )
  }

  const overviewMapUrl = `https://www.google.com/maps?ll=${calculatedCenter.lat},${calculatedCenter.lng}&z=${zoom}&output=embed`

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-border/50 bg-card shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl",
        className
      )}
      style={{ height }}
    >
      <iframe
        src={overviewMapUrl}
        width="100%"
        height="100%"
        style={{ border: 0, pointerEvents: "none" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full"
        title="Acero locations map"
      />

      {overlayBounds && (
        <div className="pointer-events-none absolute inset-0">
          {validMarkers.map((marker, index) => {
            const position = getOverlayPosition(marker, overlayBounds)

            return (
              <div
                key={`${marker.lat}-${marker.lng}-${index}`}
                className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                style={position}
                title={marker.label || "Acero location"}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-steel-red text-white shadow-xl ring-4 ring-white/80 md:h-11 md:w-11">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6" />
                </span>
                {marker.label && (
                  <span className="mt-2 max-w-[170px] rounded bg-white/95 px-2 py-1 text-center text-[10px] font-semibold uppercase leading-tight text-foreground shadow md:text-xs">
                    {marker.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
