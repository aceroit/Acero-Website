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
}

interface ProjectsGalleryImagesSectionProps {
  title: string
  paragraph: string
  images: GalleryImage[]
  className?: string
}

/**
 * Projects gallery images section: dynamic title at top, then full-width 2-col grid
 * of very large cover cards. Image fills entire card (object-cover). Used for
 * project gallery on building-type pages.
 */
export function ProjectsGalleryImagesSection({
  title,
  paragraph,
  images,
  className,
}: ProjectsGalleryImagesSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)

  const validImages = useMemo(
    () => images.filter((img) => img?.src && String(img.src).trim()),
    [images]
  )

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
        {/* Title + paragraph: full width at top, centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14 text-center max-w-4xl mx-auto"
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        </motion.div>

        {/* 2-col grid - card is exactly the size of the image (no fixed aspect) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-8 lg:gap-x-10 gap-y-3 md:gap-y-4 lg:gap-y-5 w-full mt-8">
          {validImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              role="button"
              tabIndex={0}
              onClick={() => setPreviewImage(image)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setPreviewImage(image)
                }
              }}
              className="relative w-full overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-steel-red focus:ring-offset-2 [&>img]:block"
            >
              {/* Native img so container sizes exactly to image (no extra horizontal space) */}
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="w-full h-auto block rounded-lg"
              />
            </motion.div>
          ))}
        </div>
      </div>

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
