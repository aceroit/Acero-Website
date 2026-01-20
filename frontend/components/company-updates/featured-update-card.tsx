"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
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

interface FeaturedUpdateCardProps {
  update: CompanyUpdate
  onReadMore?: (update: CompanyUpdate) => void
  className?: string
}

export function FeaturedUpdateCard({
  update,
  onReadMore,
  className,
}: FeaturedUpdateCardProps) {
  const handleReadMore = () => {
    if (onReadMore) {
      onReadMore(update)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("group", className)}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-steel-red/50 hover:shadow-lg">
        {/* Large Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
          <Image
            src={update.featuredImage.url}
            alt={update.title}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 75vw"
            quality={90}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>

        {/* Content */}
        <div className="border-t border-border bg-card p-6 md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            {update.title}
          </h2>
          {update.excerpt && (
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              {update.excerpt}
            </p>
          )}

          {/* Read More Button */}
          <Link
            href={`/media/company-update/${update.slug}`}
            onClick={handleReadMore}
            className="inline-flex items-center gap-2 bg-steel-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90"
          >
            Read More
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

