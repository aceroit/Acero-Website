"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { CompanyUpdateLayout } from "@/components/sections/company-update-layout"
import { LinkedInPostModal } from "@/components/company-updates/linkedin-post-modal"
import {
  featuredCompanyUpdate,
  processedLinkedInPosts,
} from "@/utils/company-updates-data"

// Inline type definitions (temporary - will be moved to types/company-update.ts later)
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

export default function CompanyUpdatePage() {
  const router = useRouter()
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleReadMore = (update: CompanyUpdate) => {
    router.push(`/media/company-update/${update.slug}`)
  }

  const handlePostClick = (post: LinkedInPost) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image="/placeholder.jpg"
          title="Company Update"
        />
        <CompanyUpdateLayout
          featuredUpdate={featuredCompanyUpdate}
          linkedInPosts={processedLinkedInPosts}
          onReadMore={handleReadMore}
          onPostClick={handlePostClick}
        />
      </main>
      <Footer />
      <LinkedInPostModal
        post={selectedPost}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}

