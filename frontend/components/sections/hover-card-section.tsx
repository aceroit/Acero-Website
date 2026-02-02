"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useMemo } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface HoverCard {
  id: string
  title: string
  description: string
  image: string
  imageAlt: string
}

interface HoverCardSectionProps {
  title?: string
  subtitle?: string
  cards: HoverCard[]
  columns?: 3 | 4
  className?: string
}

export function HoverCardSection({
  title,
  subtitle,
  cards,
  columns = 3,
  className,
}: HoverCardSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<HoverCard | null>(null)
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const gridCols =
    columns === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>
        )}

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12 text-center text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Hover Cards Grid */}
        <div className={cn("grid", spacing.gridGap, gridCols)}>
          {cards.map((card, index) => {
            const isHovered = hoveredCard === card.id

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedCard(card)}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-steel-red/50">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    quality={85}
                  />
                  {/* Hover Overlay with Description */}
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center bg-black/0 p-4 md:p-6 text-center transition-all duration-300 overflow-hidden",
                      isHovered && "bg-black/70"
                    )}
                  >
                    <h3 className="mb-2 text-base font-bold text-steel-white md:text-lg lg:text-xl">
                      {card.title}
                    </h3>
                    <p
                      className={cn(
                        "text-xs leading-relaxed text-steel-white transition-opacity duration-300 md:text-sm lg:text-base line-clamp-4 px-2",
                        isHovered ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {card.description}
                    </p>
                  </div>
                  {/* Title Overlay (always visible) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                    <h3 className="text-base font-semibold text-steel-white md:text-lg">
                      {card.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-3xl">
          {selectedCard && (
            <>
              <div className="relative w-full min-h-[300px] max-h-[70vh] overflow-hidden rounded-lg flex items-center justify-center">
                <Image
                  src={selectedCard.image}
                  alt={selectedCard.imageAlt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  quality={90}
                />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {selectedCard.title}
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                  {selectedCard.description}
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

