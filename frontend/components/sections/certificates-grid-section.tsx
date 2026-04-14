"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface Certificate {
  name: string
  image: string
  imageAlt: string
  url?: string
}

interface CertificatesGridSectionProps {
  title: string
  paragraphs: string[]
  certificates: Certificate[]
  className?: string
}

export function CertificatesGridSection({
  title,
  paragraphs,
  certificates,
  className,
}: CertificatesGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  return (
    <section
      ref={ref}
      className={cn(
        "border-t border-border bg-background",
        spacing.sectionPadding,
        className
      )}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Title */}
          <motion.h2
            variants={itemVariants}
            className="mb-6 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>

          {/* Paragraphs */}
          <motion.div
            variants={itemVariants}
            className="mx-auto mb-12 max-w-4xl space-y-4 text-center"
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-lg leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </motion.div>

          {/* Certificates Grid */}
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.gridGap)}>
            {certificates.map((certificate, index) => (
              <motion.div
                key={certificate.name}
                variants={itemVariants}
                className="flex flex-col"
              >
                {/* Card - click to zoom */}
                <div
                  className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-steel-red/50 hover:shadow-lg md:p-8 cursor-pointer"
                  onClick={() => setSelectedImage({ src: certificate.image, alt: certificate.imageAlt })}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={certificate.image}
                      alt={certificate.imageAlt}
                      fill
                      loading="lazy"
                      className="object-contain transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                      quality={85}
                    />
                  </div>
                </div>
                {/* Name - outside card, with optional URL link */}
                <h3 className="mt-3 text-center text-sm font-medium text-foreground md:text-base">
                  {certificate.url ? (
                    <a
                      href={certificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-steel-red hover:underline"
                    >
                      {certificate.name}
                    </a>
                  ) : (
                    certificate.name
                  )}
                </h3>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-10 right-0 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          {selectedImage && (
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-white">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 900px"
                quality={95}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

