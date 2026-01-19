"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

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
  autoplay = true,
  muted = true,
  loop = true,
  className,
}: PremiumVideoSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [isLoaded, setIsLoaded] = useState(false)

  // Build YouTube embed URL with parameters to hide UI elements
  const embedUrl = `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    loop: loop ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
    playlist: loop ? videoId : undefined, // Required for loop to work with single video
  })
    .toString()
    .replace(/&undefined/g, "")}`

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
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

