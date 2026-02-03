"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface PremiumVideoSectionProps {
  videoId: string
  title?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
}

export function PremiumVideoSection({
  videoId,
  title,
  autoplay = false,
  muted = true,
  loop = true,
  className,
}: PremiumVideoSectionProps) {
  const ref = useRef(null)
  // Stabilize in-view: require 25% visible so we don't flicker at scroll boundary (was causing iframe reload storm and lag)
  const isInView = useInView(ref, { once: false, amount: 0.25, margin: "-50px" })
  // Animate in once only – avoids re-running animations when scrolling past, which caused jank
  const hasAnimated = useInView(ref, { once: true, amount: 0.2 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const hasTriggeredLoad = useRef(false)
  // Freeze URL after first load so scrolling past doesn't change src (which would reload iframe and cause lag)
  const [frozenEmbedUrl, setFrozenEmbedUrl] = useState<string | null>(null)

  const buildEmbedUrl = (withAutoplay: boolean) => {
    const params: Record<string, string> = {
      autoplay: withAutoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      loop: loop ? "1" : "0",
      controls: "0",
      modestbranding: "1",
      rel: "0",
      showinfo: "0",
    }
    if (loop) params.playlist = videoId
    return `https://www.youtube.com/embed/${videoId}?${new URLSearchParams(params).toString()}`
  }

  const embedUrl = frozenEmbedUrl ?? buildEmbedUrl(autoplay && isInView)
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Load iframe once when first entering view; freeze URL so it never changes (prevents reload on scroll)
  useEffect(() => {
    if (isInView && autoplay && !hasTriggeredLoad.current) {
      hasTriggeredLoad.current = true
      setFrozenEmbedUrl(buildEmbedUrl(true))
      setIframeKey((prev) => prev + 1)
      setIsLoaded(false)
    }
  }, [isInView, autoplay, videoId, muted, loop])

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative overflow-hidden rounded-lg border border-border shadow-2xl"
        >
          {/* Video Container */}
          <div className="relative aspect-video w-full bg-black">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-steel-dark">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-steel-red border-t-transparent" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={embedUrl}
              title={title || "Video"}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className={cn(
                "absolute inset-0 h-full w-full",
                !isLoaded && "opacity-0"
              )}
              onLoad={() => setIsLoaded(true)}
              style={{
                border: "none",
              }}
            />
          </div>

          {/* Premium Overlay Gradient (subtle) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5" />
        </motion.div>
      </div>

      <style jsx global>{`
        /* Hide YouTube branding and controls */
        iframe[src*="youtube"] {
          pointer-events: auto;
        }
      `}</style>
    </section>
  )
}

