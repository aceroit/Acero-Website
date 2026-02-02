"use client"

import { use, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CompanyUpdateDetail } from "@/components/company-updates/company-update-detail"
import { useCompanyUpdate } from "@/hooks/use-company-updates"
import { notFound } from "next/navigation"
import type { CompanyUpdate } from "@/services/company-update.service"

interface CompanyUpdateDetailPageProps {
  params: Promise<{ slug: string }>
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

export default function CompanyUpdateDetailPage({
  params,
}: CompanyUpdateDetailPageProps) {
  const { slug } = use(params)
  const { companyUpdate, isLoading, error } = useCompanyUpdate(slug)

  // Transform the company update data
  const transformedUpdate = useMemo(() => {
    if (!companyUpdate) return null
    return transformCompanyUpdate(companyUpdate)
  }, [companyUpdate])

  // Show 404 if not loading and no update found
  if (!isLoading && !companyUpdate && !error) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-lg text-destructive">{error}</p>
          </div>
        ) : transformedUpdate ? (
          <CompanyUpdateDetail update={transformedUpdate} />
        ) : null}
      </main>
      <Footer />
    </>
  )
}

