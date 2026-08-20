"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Image from "@/components/ui/cms-image"
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
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6", spacing.gridGap)}>
          {brochures.map((brochure, index) => (
            <motion.div
              key={brochure._id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={cn(
                "group h-full cursor-pointer lg:col-span-2",
                brochures.length === 5 && index === 3 && "lg:col-start-2",
                brochures.length === 5 && index === 4 && "lg:col-start-4"
              )}
              onClick={() => onBrochureClick(brochure)}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-steel-red/40 hover:shadow-lg">
                <div className="border-b border-border bg-card px-5 py-3">
                  <h3 className="line-clamp-2 min-h-[2.75rem] text-lg font-bold leading-tight text-foreground">
                    {brochure.title}
                  </h3>
                </div>

                <div className="relative aspect-[5/7] w-full overflow-hidden bg-secondary">
                  <Image
                    src={brochure.brochureImage.url}
                    alt={brochure.title}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </div>

                <div className="mt-auto border-t border-border bg-card px-5 py-4">
                  <p className="text-center text-base text-muted-foreground transition-colors group-hover:text-steel-red">
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

