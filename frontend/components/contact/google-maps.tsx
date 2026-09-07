"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { getPublicGoogleMapsApiKey } from "@/services/google-maps.service"

declare global {
  interface Window {
    google?: any
  }
}

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

const scriptLoaders = new Map<string, Promise<void>>()

function loadGoogleMapsScript(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (window.google?.maps) {
    return Promise.resolve()
  }

  const existingLoader = scriptLoaders.get(apiKey)
  if (existingLoader) {
    return existingLoader
  }

  const loader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-acero-google-maps="true"]`
    )

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", reject, { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.dataset.aceroGoogleMaps = "true"
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })

  scriptLoaders.set(apiKey, loader)
  return loader
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

export function GoogleMaps({
  markers,
  center,
  zoom = 12,
  height = "400px",
  className,
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "")
  const [scriptReady, setScriptReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)

  const validMarkers = useMemo(() => markers.filter(isValidMarker), [markers])
  const hasMarkers = validMarkers.length > 0

  const calculatedCenter = useMemo(() => {
    if (!hasMarkers) {
      return center || { lat: 0, lng: 0 }
    }

    return center || {
      lat: validMarkers.reduce((sum, marker) => sum + marker.lat, 0) / validMarkers.length,
      lng: validMarkers.reduce((sum, marker) => sum + marker.lng, 0) / validMarkers.length,
    }
  }, [center, hasMarkers, validMarkers])

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
    setMapFailed(false)
    setScriptReady(false)

    if (!apiKey || !hasMarkers) {
      return
    }

    let isMounted = true

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (isMounted) {
          setScriptReady(true)
        }
      })
      .catch(() => {
        if (isMounted) {
          setMapFailed(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [apiKey, hasMarkers])

  useEffect(() => {
    if (!scriptReady || !mapRef.current || !window.google?.maps || !hasMarkers) {
      return
    }

    const maps = window.google.maps
    const map = new maps.Map(mapRef.current, {
      center: calculatedCenter,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

    const bounds = new maps.LatLngBounds()
    const infoWindow = new maps.InfoWindow()

    validMarkers.forEach((marker) => {
      const position = { lat: marker.lat, lng: marker.lng }
      bounds.extend(position)

      const mapMarker = new maps.Marker({
        position,
        map,
        title: marker.label || "Acero location",
      })

      if (marker.label) {
        mapMarker.addListener("click", () => {
          infoWindow.setContent(`<strong>${marker.label}</strong>`)
          infoWindow.open({ anchor: mapMarker, map })
        })
      }
    })

    if (validMarkers.length === 1) {
      map.setCenter(validMarkers[0])
      map.setZoom(zoom)
    } else {
      map.fitBounds(bounds, 80)
    }
  }, [calculatedCenter, hasMarkers, scriptReady, validMarkers, zoom])

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

  if (apiKey && !mapFailed) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl",
          className
        )}
        style={{ height }}
      >
        <div ref={mapRef} className="h-full w-full" />
        {!scriptReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 text-sm font-medium text-muted-foreground">
            Loading map...
          </div>
        )}
      </div>
    )
  }

  const fallbackEmbedUrl = `https://www.google.com/maps?q=${calculatedCenter.lat},${calculatedCenter.lng}&z=${zoom}&output=embed`

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl",
        className
      )}
    >
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
