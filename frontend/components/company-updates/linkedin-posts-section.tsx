"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { LinkedInPostCard } from "./linkedin-post-card"
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

interface LinkedInPostsSectionProps {
  posts: LinkedInPost[]
  onPostClick: (post: LinkedInPost) => void
  className?: string
}

export function LinkedInPostsSection({
  posts,
  onPostClick,
  className,
}: LinkedInPostsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  if (posts.length === 0) {
    return (
      <div ref={ref} className={cn("", className)}>
        <h3 className="mb-6 text-xl font-bold text-foreground md:text-2xl">
          Recent LinkedIn Post
        </h3>
        <p className="text-sm text-muted-foreground">No posts available at the moment.</p>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("", className)}>
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="mb-6 text-xl font-bold text-foreground md:text-2xl"
      >
        Recent LinkedIn Post
      </motion.h3>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <LinkedInPostCard
            key={post._id}
            post={post}
            onClick={onPostClick}
          />
        ))}
      </div>
    </div>
  )
}

