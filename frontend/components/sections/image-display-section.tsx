"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageDisplaySectionProps {
  image: string
  imageAlt: string
  mobileImage?: string
  mobilePopupImage?: string
  title?: string
  mobileTitle?: string
  mobileClickText?: string
  caption?: string
  className?: string
}

export function ImageDisplaySection({
  image,
  imageAlt,
  mobileImage,
  mobilePopupImage,
  title,
  mobileTitle,
  mobileClickText,
  caption,
  className,
}: ImageDisplaySectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasMobileClickFeature = mobileImage && mobilePopupImage

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-16 lg:py-20", className)}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth, "px-6 lg:px-8")}>
        {/* Desktop Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl",
            hasMobileClickFeature ? "hidden md:block" : ""
          )}
        >
          {title || "PEB Model"}
        </motion.h2>

        {/* Mobile Title and Click instruction text */}
        {hasMobileClickFeature && (
          <div className="md:hidden mb-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground"
            >
              {mobileTitle || title || "PEB Model"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center text-sm text-muted-foreground"
            >
              {mobileClickText || "To learn more about PEB Components, click on the image"}
            </motion.p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative overflow-hidden rounded-lg"
        >
          {/* Desktop Image */}
          <div className={cn("relative aspect-[16/9] w-full bg-transparent", hasMobileClickFeature ? "hidden md:block" : "")}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              quality={90}
            />
          </div>

          {/* Mobile: Clickable Image */}
          {hasMobileClickFeature && (
            <div 
              className="cursor-pointer overflow-hidden rounded-2xl md:hidden"
              onClick={() => setIsModalOpen(true)}
            >
              <Image
                src={mobileImage}
                alt={imageAlt}
                width={800}
                height={400}
                loading="lazy"
                className="w-full h-auto"
                sizes="100vw"
                quality={90}
              />
            </div>
          )}

          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
              <p className="text-center text-sm text-steel-white md:text-base">
                {caption}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile Popup Modal */}
      {hasMobileClickFeature && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 overflow-auto bg-white">
            <DialogTitle className="sr-only">{title || "PEB Model"} Details</DialogTitle>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full">
              <Image
                src={mobilePopupImage}
                alt={imageAlt}
                width={1200}
                height={1600}
                className="w-full h-auto"
                quality={95}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}

