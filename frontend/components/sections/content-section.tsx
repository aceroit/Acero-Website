"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useLayoutEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContentSectionProps {
  title: string
  paragraphs: string[]
  cta?: {
    label: string
    href: string
  }
  image?: string
  imageAlt?: string
  images?: Array<{ url: string; imageAlt?: string }>
  layout?: "image-left" | "image-right" | "image-center" | "text-only" | "split"
  imageFit?: "contain" | "cover"
  variant?: "default" | "accent" | "muted"
  className?: string
}

export function ContentSection({
  title,
  paragraphs,
  cta,
  image,
  imageAlt,
  images,
  layout = "image-right",
  imageFit = "contain",
  variant = "default",
  className,
}: ContentSectionProps) {
  // Merge single image + images array: initial image first, then array, all shown in vertical stack when 2+
  const allImages: Array<{ url: string; imageAlt?: string }> = [
    ...(image ? [{ url: image, imageAlt: imageAlt ?? title }] : []),
    ...(images ?? []),
  ].filter((i) => i?.url)
  const showVerticalStack = allImages.length > 1 && layout !== "text-only"
  const showSingleImage = allImages.length === 1 && layout !== "text-only"
  const ref = useRef(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  // Constrain image stack height to content height (so images don’t extend past content)
  useLayoutEffect(() => {
    if (!showVerticalStack) return
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setContentHeight(e.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [showVerticalStack, title, paragraphs.length])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case "image-left":
        return "lg:grid-cols-2"
      case "image-right":
        return "lg:grid-cols-2"
      case "image-center":
        return "lg:grid-cols-2"
      case "text-only":
        return "lg:grid-cols-1"
      case "split":
        return "lg:grid-cols-2"
      default:
        return "lg:grid-cols-2"
    }
  }

  const getImageOrder = () => {
    if (layout === "image-left") return "lg:order-1"
    if (layout === "image-right") return "lg:order-2"
    if (layout === "image-center") return "lg:order-2"
    return ""
  }

  const getContentOrder = () => {
    if (layout === "image-left") return "lg:order-2"
    if (layout === "image-right") return "lg:order-1"
    if (layout === "image-center") return "lg:order-1"
    return ""
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "accent":
        return "bg-steel-red/5 border-t-4 border-steel-red"
      case "muted":
        return "bg-muted/30"
      default:
        return "bg-background"
    }
  }

  const isSvgUrl = (url: string) => /\.svg($|\?)/i.test(url ?? "")

  const renderMedia = (img: { url: string; imageAlt?: string }, alt: string) => {
    if (isSvgUrl(img.url)) {
      return (
        <object
          data={img.url}
          type="image/svg+xml"
          className="absolute inset-0 h-full w-full object-contain"
          aria-label={alt}
        />
      )
    }
    return (
      <Image
        src={img.url}
        alt={alt}
        fill
        loading="lazy"
        className={cn(
          "transition-transform duration-300",
          imageFit === "cover" ? "object-cover" : "object-contain"
        )}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        quality={85}
      />
    )
  }

  return (
    <section
      ref={ref}
      className={cn(
        "border-t border-border py-24 md:py-32",
        getVariantClasses(),
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className={cn("grid gap-12 md:gap-16", getLayoutClasses())}
        >
          {/* Image(s) — vertical stack when 2+ images, single full-height when 1 */}
          {showVerticalStack && (
            <motion.div
              variants={itemVariants}
              style={
                contentHeight != null
                  ? { maxHeight: contentHeight }
                  : undefined
              }
              className={cn(
                "flex flex-col gap-3 md:gap-4 w-full min-h-0 overflow-hidden lg:self-stretch",
                getImageOrder()
              )}
            >
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative min-h-0 flex-1 w-full overflow-hidden rounded-lg border border-border bg-card"
                >
                  {renderMedia(img, img.imageAlt || title)}
                </div>
              ))}
            </motion.div>
          )}
          {showSingleImage && (
            <motion.div
              variants={itemVariants}
              className={cn(
                "relative overflow-hidden rounded-lg",
                layout === "image-center"
                  ? "aspect-[4/3] w-full max-w-2xl lg:max-w-full mx-auto lg:mx-0 self-center"
                  : "aspect-[4/3] lg:aspect-auto self-center lg:self-stretch min-h-[280px] lg:min-h-0",
                getImageOrder()
              )}
            >
              {renderMedia(allImages[0], allImages[0].imageAlt || title)}
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            ref={contentRef}
            variants={itemVariants}
            className={cn(
              "flex flex-col justify-center",
              layout === "image-center" ? "order-1" : getContentOrder()
            )}
          >
            <motion.h2
              variants={itemVariants}
              className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl"
            >
              {title}
            </motion.h2>

            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  variants={itemVariants}
                  className="text-lg leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            {cta && (
              <motion.div variants={itemVariants} className="mt-8">
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2 bg-steel-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90"
                >
                  {cta.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

