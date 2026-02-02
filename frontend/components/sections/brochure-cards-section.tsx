"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

// Inline type definitions (temporary)
interface Brochure {
  _id: string
  title: string
  brochureImage: { url: string; publicId: string; width: number; height: number }
  description?: string
  languages: Array<{ languageCode: string; languageName: string; fileUrl: string }>
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

interface BrochureCardsSectionProps {
  brochures: Brochure[]
  onBrochureClick: (brochure: Brochure) => void
  className?: string
}

export function BrochureCardsSection({
  brochures,
  onBrochureClick,
  className,
}: BrochureCardsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  if (brochures.length === 0) {
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
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              No brochures available at the moment.
            </p>
          </div>
        </div>
      </section>
    )
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
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", spacing.gridGap)}>
          {brochures.map((brochure, index) => (
            <motion.div
              key={brochure._id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => onBrochureClick(brochure)}
            >
              <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-steel-red/50 hover:shadow-lg">
                {/* Title at the top */}
                <div className="border-b border-border bg-card p-4">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                    {brochure.title}
                  </h3>
                </div>

                {/* Brochure Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                  <Image
                    src={brochure.brochureImage.url}
                    alt={brochure.title}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                    quality={85}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </div>

                {/* Instruction text below image */}
                <div className="border-t border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click to view
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

