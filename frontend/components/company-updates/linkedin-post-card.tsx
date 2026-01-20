"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Play, Heart, MessageCircle } from "lucide-react"
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

interface LinkedInPostCardProps {
  post: LinkedInPost
  onClick: (post: LinkedInPost) => void
  className?: string
}

export function LinkedInPostCard({
  post,
  onClick,
  className,
}: LinkedInPostCardProps) {
  const thumbnailUrl = post.isVideo
    ? post.videoThumbnail || post.imageUrl
    : post.imageUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("group cursor-pointer", className)}
      onClick={() => onClick(post)}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-steel-red/50 hover:shadow-md">
        {/* Company Name and Date */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-foreground">{post.companyName}</h3>
          <p className="text-xs text-muted-foreground">{post.date}</p>
        </div>

        {/* Post Text */}
        <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-foreground line-clamp-3">
          {post.text}
        </p>

        {/* Image/Video Thumbnail */}
        {thumbnailUrl && (
          <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md bg-secondary">
            <Image
              src={thumbnailUrl}
              alt={post.text.substring(0, 50)}
              fill
              loading="lazy"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 25vw"
              quality={85}
            />
            {/* Video Indicator */}
            {post.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-steel-red">
                  <Play className="ml-1 h-5 w-5 fill-steel-white text-steel-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs font-medium text-steel-red"
              >
                {tag}
              </span>
            ))}
            {post.hashtags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{post.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{post.likes}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{post.comments}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

