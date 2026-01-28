"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
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

  return (
    <article
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero Image - 80% width, centered */}
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

        {/* Content - Detailed Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
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

        {/* Additional Images - Two images, 40% each, centered */}
        {update.additionalImages && update.additionalImages.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16"
          >
            <div className="mx-auto grid max-w-[80%] grid-cols-1 gap-6 md:grid-cols-2">
              {update.additionalImages.slice(0, 2).map((image, index) => (
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

