"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

// Inline type definitions (temporary)
interface Video {
  _id: string
  title: string
  description?: string
  youtubeId: string
  thumbnailUrl?: string
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

interface VideoCardsSectionProps {
  videos: Video[]
  onVideoClick?: (video: Video) => void
  className?: string
}

export function VideoCardsSection({
  videos,
  onVideoClick,
  className,
}: VideoCardsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  if (videos.length === 0) {
    return (
      <section
        ref={ref}
        className={cn(
          "border-t border-border bg-background",
          spacing.sectionPadding,
          className
        )}
      >
        <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              No videos available at the moment.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const getThumbnailUrl = (video: Video) => {
    if (video.thumbnailUrl) {
      return video.thumbnailUrl
    }
    // Use YouTube's thumbnail API
    return `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
  }

  const handleClick = (video: Video) => {
    if (onVideoClick) {
      onVideoClick(video)
    } else {
      // Default: open in YouTube
      window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, "_blank")
    }
  }

  return (
    <section
      ref={ref}
      className={cn(
        "border-t border-border bg-background",
        spacing.sectionPadding,
        className
      )}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.gridGap)}>
          {videos.map((video, index) => {
            const isHovered = hoveredVideoId === video._id
            
            return (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => handleClick(video)}
                onMouseEnter={() => setHoveredVideoId(video._id)}
                onMouseLeave={() => setHoveredVideoId(null)}
              >
                <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-steel-red/50 hover:shadow-lg">
                  {/* Video Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                    {isHovered ? (
                      // YouTube iframe on hover
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${video.youtubeId}&modestbranding=1&rel=0`}
                        className="absolute inset-0 h-full w-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={video.title}
                      />
                    ) : (
                      // Thumbnail when not hovering
                      <>
                        <Image
                          src={getThumbnailUrl(video)}
                          alt={video.title}
                          fill
                          loading="lazy"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                          quality={85}
                          onError={(e) => {
                            // Fallback to placeholder if thumbnail fails
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.jpg"
                          }}
                        />
                        {/* Dark Overlay */}
                        <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-steel-red shadow-lg transition-all group-hover:bg-steel-red/90"
                          >
                            <Play className="ml-1 h-8 w-8 text-steel-white fill-steel-white" />
                          </motion.div>
                        </div>
                      </>
                    )}
                  </div>

                {/* Video Info */}
                {/* <div className="border-t border-border bg-card p-4 md:p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div> */}
              </div>
            </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

