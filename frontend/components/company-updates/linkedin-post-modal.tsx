"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Inline type definitions (temporary)
interface LinkedInPost {
  _id: string
  companyName: string
  date: string
  text: string
  imageUrl?: string
  videoUrl?: string
  videoThumbnail?: string
  hashtags: string[]
  likes: number
  comments: number
  isVideo: boolean
  publishedAt: string
}

interface LinkedInPostModalProps {
  post: LinkedInPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkedInPostModal({
  post,
  open,
  onOpenChange,
}: LinkedInPostModalProps) {
  if (!post) return null

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const videoId = post.isVideo && post.videoUrl ? getVideoId(post.videoUrl) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:h-[600px]">
          {/* Left: Video or Image - Full height */}
          <div className="relative h-full w-full overflow-hidden rounded-lg bg-black md:h-full">
            {post.isVideo && videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={post.text}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
                style={{ border: "none" }}
              />
            ) : post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.text.substring(0, 50)}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={90}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No media available
              </div>
            )}
          </div>

          {/* Right: Post Information */}
          <div className="flex h-full flex-col md:h-full">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {post.companyName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {post.date}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex-1">
              <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {post.text}
              </p>

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs font-medium text-steel-red"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="mt-auto flex items-center gap-6 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{post.likes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

