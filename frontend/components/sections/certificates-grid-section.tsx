"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo, useState } from "react"
import Image from "@/components/ui/cms-image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { getCmsAssetUrl } from "@/utils/cms-asset-url"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ExternalLink, X } from "lucide-react"

interface Certificate {
  name: string
  image: string
  imageAlt: string
  url?: string
}

interface CertificatesGridSectionProps {
  title: string
  subtitle?: string
  paragraphs: string[]
  certificates: Certificate[]
  className?: string
}

export function CertificatesGridSection({
  title,
  subtitle,
  paragraphs,
  certificates,
  className,
}: CertificatesGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)
  const selectedImageUrl = selectedImage ? getCmsAssetUrl(selectedImage.src, selectedImage.src) : ""

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
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-12 text-center">
            <h2 className={`text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl${subtitle || paragraphs.length > 0 ? ' mb-4' : ''}`}>
              {title}
            </h2>

            {subtitle && (
              <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground md:text-xl">
                {subtitle}
              </p>
            )}

            {paragraphs.length > 0 && (
              <div className="mx-auto mt-4 max-w-4xl space-y-4 text-center">
                {paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-lg leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </motion.div>

          {/* Certificates Grid */}
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.gridGap)}>
            {certificates.map((certificate) => (
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
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={certificate.image}
                      alt={certificate.imageAlt}
                      fill
                      loading="lazy"
                      className="object-contain"
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
        <DialogContent
          showCloseButton={false}
          className="!left-3 !right-3 !top-4 !bottom-4 !w-auto !max-w-none !translate-x-0 !translate-y-0 overflow-hidden rounded-xl border border-border bg-background p-0 shadow-2xl sm:!left-1/2 sm:!right-auto sm:!top-1/2 sm:!bottom-auto sm:!w-[96vw] sm:!max-w-6xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:max-h-[92vh]"
        >
          {selectedImage && (
            <div className="flex h-full flex-col bg-background sm:max-h-[92vh]">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedImage.alt}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  {selectedImageUrl && (
                    <a
                      href={selectedImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-steel-red hover:text-steel-red sm:px-3"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">Open full size</span>
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="rounded-md border border-border p-2 text-foreground transition-colors hover:border-steel-red hover:text-steel-red"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-white p-3 md:p-6">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  loading="eager"
                  className="mx-auto h-auto w-full max-w-[1100px] object-contain"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
