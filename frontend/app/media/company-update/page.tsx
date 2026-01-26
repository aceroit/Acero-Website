"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { CompanyUpdateLayout } from "@/components/sections/company-update-layout"
import { LinkedInPostModal } from "@/components/company-updates/linkedin-post-modal"
import { useCompanyUpdates } from "@/hooks/use-company-updates"
import { usePage } from "@/hooks/use-page"
import { processedLinkedInPosts } from "@/utils/company-updates-data"
import type { CompanyUpdate } from "@/services/company-update.service"

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

// Transform backend CompanyUpdate to frontend format
function transformCompanyUpdate(update: CompanyUpdate) {
  // Handle featureImage - check if it exists and has url
  let featuredImage = {
    url: "/placeholder.jpg",
    publicId: "",
    width: 0,
    height: 0,
  }
  
  if (update.featureImage && update.featureImage.url) {
    featuredImage = {
      url: update.featureImage.url,
      publicId: update.featureImage.publicId || "",
      width: update.featureImage.width || 0,
      height: update.featureImage.height || 0,
    }
  } else if (update.banner && update.banner.url) {
    // Fallback to banner if featureImage is not available
    featuredImage = {
      url: update.banner.url,
      publicId: update.banner.publicId || "",
      width: update.banner.width || 0,
      height: update.banner.height || 0,
    }
  }

  // Transform gallery images
  const additionalImages = (update.gallery || []).map((img: any) => ({
    url: img.url || "",
    publicId: img.publicId || "",
    width: img.width || 0,
    height: img.height || 0,
  })).filter((img: any) => img.url) // Only include images with URLs

  return {
    _id: update._id,
    slug: update.slug,
    title: update.title || "",
    featuredImage,
    excerpt: update.shortDescription || update.description?.substring(0, 200) || "",
    content: update.description || "",
    additionalImages,
    publishedAt: update.publishedAt || update.createdAt || new Date().toISOString(),
    order: 0,
    featured: update.featured || false,
    status: update.status || "published",
    isActive: update.isActive !== undefined ? update.isActive : true,
  }
}

export default function CompanyUpdatePage() {
  const router = useRouter()
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch company updates from backend
  const { companyUpdates, isLoading: updatesLoading } = useCompanyUpdates()
  
  // Fetch Company Updates page for hero image
  const { sections, isLoading: pageLoading } = usePage("company-update")
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  // Get featured update (first featured or most recent)
  const featuredUpdate = useMemo(() => {
    if (!companyUpdates || companyUpdates.length === 0) {
      console.log('No company updates found')
      return null
    }
    
    console.log('Total company updates:', companyUpdates.length)
    
    // Try to find featured update
    const featured = companyUpdates.find((u) => u.featured === true)
    if (featured) {
      console.log('Found featured update:', featured.title)
      const transformed = transformCompanyUpdate(featured)
      console.log('Transformed featured update:', {
        title: transformed.title,
        hasFeaturedImage: !!transformed.featuredImage?.url,
        featuredImageUrl: transformed.featuredImage?.url,
        hasExcerpt: !!transformed.excerpt,
        hasContent: !!transformed.content,
      })
      return transformed
    }
    
    // If no featured, get most recent
    const sorted = [...companyUpdates].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    
    console.log('Using most recent update:', sorted[0]?.title)
    const transformed = transformCompanyUpdate(sorted[0])
    console.log('Transformed most recent update:', {
      title: transformed.title,
      hasFeaturedImage: !!transformed.featuredImage?.url,
      featuredImageUrl: transformed.featuredImage?.url,
    })
    return transformed
  }, [companyUpdates])

  const handleReadMore = (update: any) => {
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
          image={heroImage || "/images/projects/hero.jpg"}
          title="Company Update"
        />
        {updatesLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Loading company updates...</p>
          </div>
        ) : featuredUpdate ? (
          <CompanyUpdateLayout
            featuredUpdate={featuredUpdate}
            linkedInPosts={processedLinkedInPosts}
            onReadMore={handleReadMore}
            onPostClick={handlePostClick}
          />
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No company updates available at the moment.</p>
          </div>
        )}
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

