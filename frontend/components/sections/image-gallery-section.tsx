"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface GalleryImage {
  src: string
  alt: string
  name?: string
  link?: string // Optional URL link for the image
}

interface ImageGallerySectionProps {
  title: string
  paragraph: string
  images: GalleryImage[]
  columns?: 2 | 3 | 6
  /** Horizontal = 3 columns (2 rows). Vertical = 2 columns (more rows). */
  imageOrientation?: "horizontal" | "vertical"
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
  imageOrientation = "horizontal",
  className,
}: ImageGallerySectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)
  const showPreview = imageOrientation === "horizontal"

  // Filter out images with no valid src to avoid empty cards
  const validImages = useMemo(
    () => images.filter((img) => img?.src && String(img.src).trim()),
    [images]
  )

  // Grid: use columns prop for layout (2 = 2x2, 3 = 3 cols, 6 = 6 cols). Fallback to imageOrientation.
  const gridCols =
    columns === 2
      ? "grid-cols-2"
      : columns === 6
        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        : imageOrientation === "horizontal"
          ? "grid-cols-2 md:grid-cols-3"
          : "grid-cols-2"
  const gridGap = spacing.gridGap || "gap-6"
  // Horizontal: larger cards with aspect ratio. Vertical: original compact card.
  const imageContainerClass =
    imageOrientation === "horizontal"
      ? "aspect-[4/3] min-h-[180px]"
      : "h-12 w-full"

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

          {/* Right column: grid of image cards with optional name below */}
          <div
            className={cn(
              "grid",
              gridCols,
              gridGap
            )}
          >
            {validImages.map((image, index) => {
              const hasLink = image.link?.trim()
              const CardContent = (
                <>
                  <div className={cn("relative w-full", imageContainerClass)}>
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
                  {image.name?.trim() && (
                    <p className="mt-3 text-center text-sm font-medium text-foreground">
                      {image.name}
                    </p>
                  )}
                </>
              )
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  role={showPreview && !hasLink ? "button" : undefined}
                  tabIndex={showPreview && !hasLink ? 0 : undefined}
                  onClick={showPreview && !hasLink ? () => setPreviewImage(image) : undefined}
                  onKeyDown={
                    showPreview && !hasLink
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setPreviewImage(image)
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm",
                    "transition-all duration-300 hover:border-steel-red/30 hover:shadow-md",
                    "flex flex-col",
                    (showPreview || hasLink) && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-steel-red focus:ring-offset-2"
                  )}
                >
                  {hasLink ? (
                    <a
                      href={image.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col"
                    >
                      {CardContent}
                    </a>
                  ) : (
                    CardContent
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Large preview modal – only for horizontal orientation */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent
          className="max-w-6xl w-[98vw] max-h-[98vh] p-2 sm:p-4 flex flex-col"
          showCloseButton={true}
        >
          {previewImage && (
            <>
              <DialogTitle className="sr-only">
                {previewImage.name || previewImage.alt}
              </DialogTitle>
              <div className="relative w-full flex-1 min-h-[70vh] max-h-[90vh] bg-card rounded-lg overflow-hidden">
                <Image
                  src={previewImage.src}
                  alt={previewImage.alt}
                  fill
                  className="object-contain"
                  sizes="95vw"
                  quality={95}
                />
              </div>
              {previewImage.name?.trim() && (
                <p className="text-center text-sm font-medium text-foreground mt-2">
                  {previewImage.name}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
