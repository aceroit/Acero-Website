"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from "react"
import { createPortal } from "react-dom"
import Image from "@/components/ui/cms-image"
import { Play, Share2, X, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { useToast } from "@/hooks/use-toast"
import { getSpacingValues } from "@/utils/spacing"

interface Video {
  _id: string
  title: string
  description?: string
  youtubeId: string
  youtubeUrl?: string
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

interface ShareVideoState {
  title: string
  url: string
}

interface ShareVideoModalProps {
  shareVideo: ShareVideoState | null
  onClose: () => void
  onCopy: (url: string) => Promise<void>
}

function getVideoUrl(video: Video): string {
  const rawUrl = video.youtubeUrl?.trim()

  if (rawUrl) {
    if (rawUrl.includes("/embed/")) {
      const embedId = rawUrl.split("/embed/")[1]?.split(/[?&#]/)[0]
      if (embedId) {
        return `https://www.youtube.com/watch?v=${embedId}`
      }
    }

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl
    }

    if (rawUrl.startsWith("www.")) {
      return `https://${rawUrl}`
    }
  }

  return `https://www.youtube.com/watch?v=${video.youtubeId}`
}

function ShareVideoModal({ shareVideo, onClose, onCopy }: ShareVideoModalProps) {
  useEffect(() => {
    if (!shareVideo || typeof document === "undefined") {
      return
    }

    const originalOverflow = document.body.style.overflow
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleEscape)
    }
  }, [shareVideo, onClose])

  if (!shareVideo || typeof document === "undefined") {
    return null
  }

  const encodedUrl = encodeURIComponent(shareVideo.url)
  const encodedTitle = encodeURIComponent(shareVideo.title)
  const emailBody = encodeURIComponent(`${shareVideo.title}\n${shareVideo.url}`)

  const shareActions = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareVideo.title} ${shareVideo.url}`)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${emailBody}`,
    },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share video"
    >
      <div
        className="w-full max-w-[520px] rounded-2xl bg-background p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Share Video</h3>
            <p className="mt-2 text-sm text-muted-foreground">{shareVideo.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close share dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-foreground">YouTube URL</label>
          <input
            readOnly
            value={shareVideo.url}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => void onCopy(shareVideo.url)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </button>

          {shareActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={action.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={action.href.startsWith("mailto:") ? undefined : "noreferrer"}
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {action.label}
            </a>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Share this video using the direct YouTube link.
        </p>
      </div>
    </div>,
    document.body
  )
}

export function VideoCardsSection({
  videos,
  onVideoClick,
  className,
}: VideoCardsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const [shareVideo, setShareVideo] = useState<ShareVideoState | null>(null)
  const { appearance } = useAppearance()
  const { toast } = useToast()
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

    return `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
  }

  const handleClick = (video: Video) => {
    if (onVideoClick) {
      onVideoClick(video)
      return
    }

    window.open(getVideoUrl(video), "_blank")
  }

  const handleShareClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    video: Video
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setShareVideo({
      title: video.title,
      url: getVideoUrl(video),
    })
  }

  const handleCopyLink = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = url
        textarea.setAttribute("readonly", "")
        textarea.style.position = "absolute"
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      toast({
        title: "Link copied",
        description: "The YouTube link is ready to share.",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the YouTube link manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
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
                    <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                      {isHovered ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0&mute=1&controls=1&modestbranding=1&rel=0`}
                          className="absolute inset-0 z-0 h-full w-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          title={video.title}
                        />
                      ) : (
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
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.jpg"
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />

                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex h-16 w-16 items-center justify-center rounded-full bg-steel-red shadow-lg transition-all group-hover:bg-steel-red/90"
                            >
                              <Play className="ml-1 h-8 w-8 fill-steel-white text-steel-white" />
                            </motion.div>
                          </div>
                        </>
                      )}

                    </div>

                    <div className="border-t border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {video.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(event) => handleShareClick(event, video)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                          aria-label={`Share ${video.title}`}
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <ShareVideoModal
        shareVideo={shareVideo}
        onClose={() => setShareVideo(null)}
        onCopy={handleCopyLink}
      />
    </>
  )
}


