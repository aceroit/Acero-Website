"use client"

import { useEffect, useState, useRef } from "react"
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
      el.style.display = "none"
      el.style.opacity = "0"
      el.style.visibility = "hidden"
    }
  }
}

/**
 * Add mouse and touch/click support for SVG interactive elements.
 * Inline event handlers (onmouseover/onmouseout) don't work when SVG is inlined via dangerouslySetInnerHTML,
 * so we manually attach event listeners.
 */
function addInteractivityToSvg(container: HTMLElement) {
  const interactiveGroups = container.querySelectorAll("[onmouseover]")
  
  // Detect touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // Use a closure to track active layer across all groups
  const state = { activeLayer: null as string | null }

  interactiveGroups.forEach((group) => {
    const mouseoverAttr = group.getAttribute("onmouseover")
    if (!mouseoverAttr) return

    const match = mouseoverAttr.match(/showLayer\(['"]([^'"]+)['"]\)/)
    if (!match) return

    const layerId = match[1]
    
    // Make the group clickable with cursor pointer
    ;(group as HTMLElement).style.cursor = "pointer"

    const showLayer = () => {
      const el = document.getElementById(layerId)
      if (el) {
        el.style.display = "block"
        el.style.opacity = "1"
        el.style.visibility = "visible"
      }
    }

    const hideLayer = () => {
      const el = document.getElementById(layerId)
      if (el) {
        el.style.display = "none"
        el.style.opacity = "0"
        el.style.visibility = "hidden"
      }
    }

    // Desktop only: hover behavior (not on touch devices)
    if (!isTouchDevice) {
      group.addEventListener("mouseenter", showLayer)
      group.addEventListener("mouseleave", hideLayer)
    }
    
    // Touch devices: use touchend for tap to toggle
    if (isTouchDevice) {
      group.addEventListener("touchend", (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Hide previous active layer if different
        if (state.activeLayer && state.activeLayer !== layerId) {
          const prevEl = document.getElementById(state.activeLayer)
          if (prevEl) {
            prevEl.style.display = "none"
            prevEl.style.opacity = "0"
            prevEl.style.visibility = "hidden"
          }
        }
        
        const el = document.getElementById(layerId)
        if (el) {
          // Toggle: if same layer tapped again, hide it
          if (state.activeLayer === layerId) {
            el.style.display = "none"
            el.style.opacity = "0"
            el.style.visibility = "hidden"
            state.activeLayer = null
          } else {
            el.style.display = "block"
            el.style.opacity = "1"
            el.style.visibility = "visible"
            state.activeLayer = layerId
          }
        }
      }, { passive: false })
    } else {
      // Desktop: click to toggle (for accessibility)
      group.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Hide previous active layer if different
        if (state.activeLayer && state.activeLayer !== layerId) {
          const prevEl = document.getElementById(state.activeLayer)
          if (prevEl) {
            prevEl.style.display = "none"
            prevEl.style.opacity = "0"
            prevEl.style.visibility = "hidden"
          }
        }
        
        const el = document.getElementById(layerId)
        if (el) {
          // Toggle: if same layer clicked again, hide it
          if (state.activeLayer === layerId) {
            el.style.display = "none"
            el.style.opacity = "0"
            el.style.visibility = "hidden"
            state.activeLayer = null
          } else {
            el.style.display = "block"
            el.style.opacity = "1"
            el.style.visibility = "visible"
            state.activeLayer = layerId
          }
        }
      })
    }
  })
  
  // Tap/click outside to close active layer
  const closeOnOutsideInteraction = (e: Event) => {
    if (state.activeLayer && !container.contains(e.target as Node)) {
      const el = document.getElementById(state.activeLayer)
      if (el) {
        el.style.display = "none"
        el.style.opacity = "0"
        el.style.visibility = "hidden"
      }
      state.activeLayer = null
    }
  }
  
  if (isTouchDevice) {
    document.addEventListener("touchstart", closeOnOutsideInteraction)
  } else {
    document.addEventListener("click", closeOnOutsideInteraction)
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    registerSvgLayerHelpers()
  }, [])

  useEffect(() => {
    if (svgContent && containerRef.current) {
      addInteractivityToSvg(containerRef.current)
    }
  }, [svgContent])

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
      ref={containerRef}
      className={cn("flex w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:object-contain [&_svg]:block [&_svg]:mx-auto [&_svg]:w-full [&_svg]:h-auto", className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      role="img"
      aria-label={alt ?? undefined}
    />
  )
}
