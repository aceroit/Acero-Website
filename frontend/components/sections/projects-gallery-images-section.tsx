"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo, useState, useLayoutEffect, type ReactNode } from "react"
import Image from "@/components/ui/cms-image"
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
  mobileTitleLines?: [string, string]
  paragraph?: string
  images: GalleryImage[]
  leadingAction?: ReactNode
  sideContent?: ReactNode
  className?: string
}

/**
 * Projects gallery images section: dynamic title at top, then full-width 2-col grid
 * of very large cover cards. Image fills entire card (object-cover). Used for
 * project gallery on building-type pages.
 */
export function ProjectsGalleryImagesSection({
  title,
  mobileTitleLines,
  paragraph,
  images,
  leadingAction,
  sideContent,
  className,
}: ProjectsGalleryImagesSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)
  const mobileTitleRef = useRef<HTMLSpanElement>(null)
  const [mobileFirstLine, mobileSecondLine] = mobileTitleLines || []

  useLayoutEffect(() => {
    const element = mobileTitleRef.current
    if (!element) return
    let active = true
    let previousWidth = 0

    const fitTitle = () => {
      if (!active || !element.clientWidth) return
      element.style.fontSize = "24px"
      const widestLine = Math.max(
        ...Array.from(element.children, (line) => line.getBoundingClientRect().width)
      )
      const size = Math.min(24, (24 * (element.clientWidth - 2)) / widestLine)
      element.style.fontSize = `${Math.floor(size * 10) / 10}px`
    }

    fitTitle()
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== previousWidth) {
        previousWidth = element.clientWidth
        fitTitle()
      }
    })
    observer.observe(element)
    void document.fonts.ready.then(fitTitle)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [mobileFirstLine, mobileSecondLine])

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
        {leadingAction && (
          <div className="mt-8 mb-8 flex justify-start lg:mt-0">
            {leadingAction}
          </div>
        )}

        {/* Title and optional paragraph: full width at top, centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14 text-center max-w-7xl mx-auto"
        >
          <h2 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl md:text-4xl lg:whitespace-nowrap lg:text-5xl">
            {mobileTitleLines ? (
              <>
                <span ref={mobileTitleRef} className="block w-full text-2xl leading-snug lg:hidden">
                  <span className="mx-auto block w-max whitespace-nowrap">{mobileFirstLine}</span>
                  <span className="mx-auto block w-max whitespace-nowrap">{mobileSecondLine}</span>
                </span>
                <span className="hidden lg:inline">{title}</span>
              </>
            ) : title}
          </h2>
          {paragraph && (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          )}
        </motion.div>

        <div className="flex flex-col">
        {sideContent && validImages.length > 0 && (
          /* Contents lets the card follow all images on mobile without duplicating it. */
          <div className="contents lg:grid lg:w-full lg:items-stretch lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)] lg:gap-8">
            <div className="order-last mt-8 h-full min-w-0 lg:order-none lg:mt-0">{sideContent}</div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.5 }}
              className="relative h-full min-h-[280px] overflow-hidden rounded-lg [&>img]:block"
            >
              <Image
                src={validImages[0].src}
                alt={validImages[0].alt}
                loading="lazy"
                className="h-full min-h-[280px] w-full rounded-lg object-cover"
              />
            </motion.div>
          </div>
        )}

        {/* Remaining images use the existing two-column gallery layout. */}
        {(sideContent ? validImages.length > 1 : validImages.length > 0) && (
          <div className="mt-8 grid w-full grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 md:gap-x-8 md:gap-y-4 lg:gap-x-10 lg:gap-y-5">
            {(sideContent ? validImages.slice(1) : validImages).map((image, index) => (
              <motion.div
                key={`${image.src}-${index}`}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative w-full overflow-hidden rounded-lg transition-all duration-300 [&>img]:block"
              >
                {/* CMS image uses direct upload URL to preserve original clarity */}
                <Image
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="w-full h-auto block rounded-lg"
                />
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Modal disabled - uncomment to re-enable image preview on click
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
      */}
    </section>
  )
}
