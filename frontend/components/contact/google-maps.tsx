"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

const TILE_SIZE = 256

interface MapSize {
  width: number
  height: number
}

interface Tile {
  key: string
  x: number
  y: number
  wrappedX: number
  left: number
  top: number
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

function clampZoom(zoom: number) {
  return Math.min(Math.max(Math.round(zoom), 1), 18)
}

function toMercatorPoint(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom
  const safeLat = Math.min(Math.max(lat, -85.05112878), 85.05112878)
  const sinLat = Math.sin((safeLat * Math.PI) / 180)

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  }
}

function fromMercatorPoint(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom
  const lng = (x / scale) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / scale
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))

  return { lat, lng }
}

function getMarkerBounds(markers: Marker[], zoom: number) {
  const points = markers.map((marker) => toMercatorPoint(marker.lat, marker.lng, zoom))
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function getFittedZoom(markers: Marker[], size: MapSize, maxZoom: number) {
  if (markers.length <= 1) {
    return maxZoom
  }

  const horizontalPadding = Math.min(size.width * 0.28, 260)
  const verticalPadding = Math.min(size.height * 0.28, 180)
  const availableWidth = Math.max(size.width - horizontalPadding, 260)
  const availableHeight = Math.max(size.height - verticalPadding, 180)

  for (let candidateZoom = maxZoom; candidateZoom >= 1; candidateZoom -= 1) {
    const bounds = getMarkerBounds(markers, candidateZoom)
    const markerWidth = bounds.maxX - bounds.minX
    const markerHeight = bounds.maxY - bounds.minY

    if (markerWidth <= availableWidth && markerHeight <= availableHeight) {
      return candidateZoom
    }
  }

  return 1
}

function getMapCenter(markers: Marker[], zoom: number, center?: { lat: number; lng: number }) {
  if (center) {
    return center
  }

  if (markers.length > 1) {
    const bounds = getMarkerBounds(markers, zoom)
    return fromMercatorPoint((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, zoom)
  }

  return {
    lat: markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length,
    lng: markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length,
  }
}

function useMapSize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<MapSize>({ width: 1200, height: 520 })

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const updateSize = () => {
      if (!containerRef.current) {
        return
      }

      const bounds = containerRef.current.getBoundingClientRect()
      setSize({
        width: Math.max(bounds.width, 320),
        height: Math.max(bounds.height, 240),
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return { containerRef, size }
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
  const requestedZoom = clampZoom(zoom)
  const { containerRef, size } = useMapSize()

  const mapZoom = useMemo(
    () => getFittedZoom(validMarkers, size, requestedZoom),
    [requestedZoom, size, validMarkers]
  )

  const calculatedCenter = useMemo(
    () => (hasMarkers ? getMapCenter(validMarkers, mapZoom, center) : center || { lat: 0, lng: 0 }),
    [center, hasMarkers, mapZoom, validMarkers]
  )

  const centerPoint = useMemo(
    () => toMercatorPoint(calculatedCenter.lat, calculatedCenter.lng, mapZoom),
    [calculatedCenter, mapZoom]
  )

  const viewportTopLeft = useMemo(
    () => ({
      x: centerPoint.x - size.width / 2,
      y: centerPoint.y - size.height / 2,
    }),
    [centerPoint, size]
  )

  const tiles = useMemo<Tile[]>(() => {
    const tileCount = 2 ** mapZoom
    const minTileX = Math.floor(viewportTopLeft.x / TILE_SIZE) - 1
    const maxTileX = Math.floor((viewportTopLeft.x + size.width) / TILE_SIZE) + 1
    const minTileY = Math.max(0, Math.floor(viewportTopLeft.y / TILE_SIZE) - 1)
    const maxTileY = Math.min(
      tileCount - 1,
      Math.floor((viewportTopLeft.y + size.height) / TILE_SIZE) + 1
    )
    const nextTiles: Tile[] = []

    for (let x = minTileX; x <= maxTileX; x += 1) {
      const wrappedX = ((x % tileCount) + tileCount) % tileCount

      for (let y = minTileY; y <= maxTileY; y += 1) {
        nextTiles.push({
          key: `${mapZoom}-${x}-${y}`,
          x,
          y,
          wrappedX,
          left: x * TILE_SIZE - viewportTopLeft.x,
          top: y * TILE_SIZE - viewportTopLeft.y,
        })
      }
    }

    return nextTiles
  }, [mapZoom, size, viewportTopLeft])

  const projectedMarkers = useMemo(
    () =>
      validMarkers.map((marker) => {
        const point = toMercatorPoint(marker.lat, marker.lng, mapZoom)

        return {
          ...marker,
          left: point.x - viewportTopLeft.x,
          top: point.y - viewportTopLeft.y,
        }
      }),
    [mapZoom, validMarkers, viewportTopLeft]
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-border/50 bg-[#dbe7e3] shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl",
        className
      )}
      style={{ height }}
    >
      <div className="absolute inset-0">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={`https://tile.openstreetmap.org/${mapZoom}/${tile.wrappedX}/${tile.y}.png`}
            alt=""
            width={TILE_SIZE}
            height={TILE_SIZE}
            draggable={false}
            className="absolute select-none"
            style={{
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />

      <div className="absolute inset-0">
        {projectedMarkers.map((marker, index) => (
          <a
            key={`${marker.lat}-${marker.lng}-${index}`}
            href={`https://www.google.com/maps?q=${marker.lat},${marker.lng}`}
            target="_blank"
            rel="noreferrer"
            className="group pointer-events-auto absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
            style={{ left: marker.left, top: marker.top }}
            title={marker.label || "Acero location"}
          >
            <span className="absolute bottom-full mb-2 hidden min-w-max max-w-[220px] rounded bg-white/95 px-3 py-2 text-center text-[11px] font-semibold uppercase leading-tight text-foreground shadow-lg ring-1 ring-border group-hover:block group-focus:block md:text-xs">
              {marker.label || "Acero location"}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-steel-red text-sm font-bold text-white shadow-xl ring-4 ring-white/80 md:h-11 md:w-11 md:text-base">
              {index + 1}
            </span>
          </a>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 z-10 max-h-[45%] w-[min(360px,calc(100%-2rem))] overflow-y-auto rounded-lg bg-white/95 p-3 shadow-xl ring-1 ring-border/70 backdrop-blur-sm md:bottom-6 md:left-6 md:max-h-[60%] md:p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-foreground">
          <MapPin className="h-4 w-4 text-steel-red" />
          Acero Locations
        </div>
        <ol className="space-y-2">
          {validMarkers.map((marker, index) => (
            <li
              key={`legend-${marker.lat}-${marker.lng}-${index}`}
              className="flex items-start gap-2 text-xs font-semibold leading-snug text-foreground md:text-sm"
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-steel-red text-[10px] font-bold text-white md:h-6 md:w-6 md:text-xs">
                {index + 1}
              </span>
              <span>{marker.label || "Acero location"}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="absolute bottom-2 right-3 z-10 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
        Map data © OpenStreetMap contributors
      </div>
    </div>
  )
}
