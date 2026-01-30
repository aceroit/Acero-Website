"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface GalleryImage {
  src: string
  alt: string
}

interface ImageGallerySectionProps {
  title: string
  paragraph: string
  images: GalleryImage[]
  columns?: 2 | 3 | 6
  className?: string
}

/**
 * Image gallery section: two-column layout matching "Engineering Excellence" design.
 * Left = title (steel-red) + paragraph; Right = 3x2 grid of white logo/label cards.
 * Follows frontendDesign.md: steel-red accent, bg-card, border-border, spacing.
 */
export function ImageGallerySection({
  title,
  paragraph,
  images,
  columns = 3,
  className,
}: ImageGallerySectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  // Right column is always 2 columns (3 rows) for the 3x2 card grid from the design
  const gridCols = "grid-cols-2"
  const gridGap = spacing.gridGap || "gap-6"

  return (
    <section
      ref={ref}
      className={cn(
        "border-t border-border bg-background",
        spacing.sectionPadding,
        className
      )}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth, "px-6 lg:px-8")}>
        <div
          className={cn(
            "grid gap-12 lg:gap-16",
            "lg:grid-cols-2 lg:items-center"
          )}
        >
          {/* Left column: title + paragraph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {title}
            </h2>
            <p className="text-lg leading-relaxed text-foreground">
              {paragraph}
            </p>
          </motion.div>

          {/* Right column: 3x2 grid of image cards */}
          <div
            className={cn(
              "grid",
              gridCols,
              gridGap
            )}
          >
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={cn(
                  "relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm",
                  "transition-all duration-300 hover:border-steel-red/30 hover:shadow-md"
                )}
              >
                <div className="relative h-12 w-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    loading="lazy"
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                    quality={85}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
