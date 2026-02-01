"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface InlineAnimatedSvgProps {
  /** Public path to SVG (e.g. /svgs/why-acero-desktop.svg). Inlining allows CSS animations inside the SVG to run. */
  src: string
  alt?: string
  className?: string
}

/**
 * Global helpers for SVG hover layers (e.g. why-acero-desktop.svg uses onmouseover="showLayer('_1A')").
 * Scripts inside innerHTML are not executed, so we define these on window for inlined SVGs.
 */
function registerSvgLayerHelpers() {
  if (typeof window === "undefined") return
  if ((window as unknown as { __svgShowLayer?: boolean }).__svgShowLayer) return
  ;(window as unknown as { __svgShowLayer?: boolean }).__svgShowLayer = true
  ;(window as unknown as { showLayer: (id: string) => void }).showLayer = (layerId: string) => {
    const el = document.getElementById(layerId)
    if (el) {
      el.style.display = "block"
      el.style.opacity = "1"
      el.style.visibility = "visible"
    }
  }
  ;(window as unknown as { hideLayer: (id: string) => void }).hideLayer = (layerId: string) => {
    const el = document.getElementById(layerId)
    if (el) {
      el.style.opacity = "0"
      el.style.visibility = "hidden"
    }
  }
}

/**
 * Fetches an SVG from the given path and renders it inline so that internal
 * CSS animations (@keyframes, animation) and styles are applied correctly.
 * Using <img> or <object> with external URLs (e.g. Cloudinary) can prevent
 * SVG animations from running; this component fixes that for local SVGs.
 */
export function InlineAnimatedSvg({ src, alt, className }: InlineAnimatedSvgProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    registerSvgLayerHelpers()
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load SVG: ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setSvgContent(text)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (error) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
        role="img"
        aria-label={alt ?? "SVG failed to load"}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    )
  }

  if (!svgContent) {
    return (
      <div
        className={cn("animate-pulse bg-muted", className)}
        aria-hidden
      />
    )
  }

  return (
    <div
      className={cn("flex w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:object-contain [&_svg]:block [&_svg]:mx-auto", className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      role="img"
      aria-label={alt ?? undefined}
    />
  )
}
