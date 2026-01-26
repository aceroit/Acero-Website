"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { CompanyUpdateLayout } from "@/components/sections/company-update-layout"
import { LinkedInPostModal } from "@/components/company-updates/linkedin-post-modal"
import { useCompanyUpdates } from "@/hooks/use-company-updates"
import { usePage } from "@/hooks/use-page"
import { cn } from "@/lib/utils"
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

  // Transform LinkedIn posts
  const linkedInPosts = (update.linkedInPosts || []).map((post: any, index: number) => ({
    _id: post._id || `${update._id}-${post.order !== undefined ? post.order : index}`, // Generate ID if not present
    companyName: post.companyName || 'Acero Building Systems',
    date: post.date || '',
    text: post.text || '',
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    videoThumbnail: post.videoThumbnail,
    hashtags: post.hashtags || [],
    likes: post.likes || 0,
    comments: post.comments || 0,
    isVideo: post.isVideo || false,
    publishedAt: post.publishedAt || update.publishedAt || new Date().toISOString(),
    order: post.order !== undefined ? post.order : index,
  })).sort((a, b) => {
    // Sort by order, then by publishedAt
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  })

  return {
    _id: update._id,
    slug: update.slug,
    title: update.title || "",
    featuredImage,
    excerpt: update.shortDescription || update.description?.substring(0, 200) || "",
    content: update.description || "",
    additionalImages,
    linkedInPosts,
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

  // Transform all company updates
  const transformedUpdates = useMemo(() => {
    if (!companyUpdates || companyUpdates.length === 0) {
      return []
    }
    
    // Sort by publishedAt (most recent first)
    const sorted = [...companyUpdates].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    
    return sorted.map(update => transformCompanyUpdate(update))
  }, [companyUpdates])

  // Get featured update (first one) and other updates
  const featuredUpdate = useMemo(() => {
    if (transformedUpdates.length === 0) {
      return null
    }
    return transformedUpdates[0]
  }, [transformedUpdates])

  // Get other updates (excluding the featured one)
  const otherUpdates = useMemo(() => {
    if (transformedUpdates.length <= 1) {
      return []
    }
    return transformedUpdates.slice(1)
  }, [transformedUpdates])

  // Get LinkedIn posts from featured update (or combine from all if needed)
  const linkedInPosts = useMemo(() => {
    if (featuredUpdate && featuredUpdate.linkedInPosts && featuredUpdate.linkedInPosts.length > 0) {
      return featuredUpdate.linkedInPosts
    }
    // Fallback: get LinkedIn posts from all updates and combine
    const allPosts: LinkedInPost[] = []
    transformedUpdates.forEach(update => {
      if (update.linkedInPosts && update.linkedInPosts.length > 0) {
        allPosts.push(...update.linkedInPosts)
      }
    })
    // Sort by publishedAt and return most recent
    return allPosts.sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }).slice(0, 5) // Limit to 5 most recent
  }, [featuredUpdate, transformedUpdates])

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
          <>
            <CompanyUpdateLayout
              featuredUpdate={featuredUpdate}
              linkedInPosts={linkedInPosts}
              onReadMore={handleReadMore}
              onPostClick={handlePostClick}
            />
            {otherUpdates.length > 0 && (
              <section className="border-t border-border bg-background py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    More Company Updates
                  </h2>
                  <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {otherUpdates.map((update, index) => (
                      <UpdateCard
                        key={update._id}
                        update={update}
                        onReadMore={handleReadMore}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
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

// Update Card Component for grid display
interface UpdateCardProps {
  update: {
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
    publishedAt: string
  }
  onReadMore: (update: any) => void
}

function UpdateCard({ update, onReadMore }: UpdateCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleClick = () => {
    onReadMore(update)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="h-full"
    >
      <Link
        href={`/media/company-update/${update.slug}`}
        onClick={handleClick}
        className="group block h-full"
      >
        <div className="relative flex h-full flex-col overflow-hidden border border-border bg-card transition-all hover:border-steel-red/50 hover:shadow-lg">
          {/* Image */}
          <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-secondary">
            <Image
              src={update.featuredImage.url}
              alt={update.title}
              fill
              loading="lazy"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              quality={85}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-steel-red/0 transition-colors duration-300 group-hover:bg-steel-red/10" />
            {/* Date Badge */}
            <div className="absolute left-4 top-4 flex items-center gap-2 bg-steel-red px-3 py-1.5">
              <Calendar className="h-3 w-3 text-steel-white" />
              <span className="text-xs font-semibold uppercase tracking-wider text-steel-white">
                {formatDate(update.publishedAt)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {update.title}
            </h3>
            {update.excerpt && (
              <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {update.excerpt}
              </p>
            )}
            <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-foreground transition-all group-hover:gap-3 group-hover:text-steel-red">
              Read More
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

