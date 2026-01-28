"use client"

import { FeaturedUpdateCard } from "@/components/company-updates/featured-update-card"
import { LinkedInPostsSection } from "@/components/company-updates/linkedin-posts-section"
import { cn } from "@/lib/utils"

// Inline type definitions (temporary)
interface CompanyUpdate {
  _id: string
  slug: string
  title: string
  featuredImage: {
    url: string
    publicId: string
    width: number
    height: number
  }
  excerpt?: string
  content: string
  additionalImages?: Array<{
    url: string
    publicId: string
    width: number
    height: number
  }>
  publishedAt: string
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

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

interface CompanyUpdateLayoutProps {
  featuredUpdate: CompanyUpdate
  linkedInPosts: LinkedInPost[]
  onReadMore: (update: CompanyUpdate) => void
  onPostClick: (post: LinkedInPost) => void
  className?: string
}

export function CompanyUpdateLayout({
  featuredUpdate,
  linkedInPosts,
  onReadMore,
  onPostClick,
  className,
}: CompanyUpdateLayoutProps) {
  return (
    <section
      className={cn(
        "border-t border-border bg-background py-24 md:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column - Featured Update (75% width) */}
          <div className="lg:col-span-9">
            <FeaturedUpdateCard update={featuredUpdate} onReadMore={onReadMore} />
          </div>

          {/* Right Column - LinkedIn Posts (25% width, sticky) */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
            <LinkedInPostsSection posts={linkedInPosts} onPostClick={onPostClick} />
          </div>
        </div>
      </div>
    </section>
  )
}

