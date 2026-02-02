"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

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

interface CompanyUpdateDetailProps {
  update: CompanyUpdate
  className?: string
}

export function CompanyUpdateDetail({
  update,
  className,
}: CompanyUpdateDetailProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Filter additional images to only include valid ones with URLs
  const validAdditionalImages = useMemo(() => {
    if (!update.additionalImages) return []
    return update.additionalImages.filter((img) => img && img.url)
  }, [update.additionalImages])

  // Check if featured image is valid
  const hasFeaturedImage = update.featuredImage && update.featuredImage.url && update.featuredImage.url !== "/placeholder.jpg"

  return (
    <article
      ref={ref}
      className={cn(
        "border-t border-border bg-background",
        spacing.sectionPadding,
        className
      )}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        {/* Hero Image - 80% width, centered (only if valid image exists) */}
        {hasFeaturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="relative mx-auto aspect-[16/10] w-full max-w-[80%] overflow-hidden rounded-lg bg-secondary">
              <Image
                src={update.featuredImage.url}
                alt={update.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
                quality={90}
              />
            </div>
          </motion.div>
        )}

        {/* Content - Detailed Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: hasFeaturedImage ? 0.2 : 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {update.title}
          </h1>
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-line text-lg leading-relaxed text-foreground">
              {update.content}
            </div>
          </div>
        </motion.div>

        {/* Additional Images - Display if any valid images exist */}
        {validAdditionalImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: hasFeaturedImage ? 0.4 : 0.2 }}
            className="mt-16"
          >
            <div className={cn(
              "mx-auto grid max-w-[80%] gap-6",
              validAdditionalImages.length === 1 
                ? "grid-cols-1 max-w-[50%]" 
                : "grid-cols-1 md:grid-cols-2"
            )}>
              {validAdditionalImages.slice(0, 4).map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary"
                >
                  <Image
                    src={image.url}
                    alt={`${update.title} - Image ${index + 1}`}
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    quality={85}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </article>
  )
}

