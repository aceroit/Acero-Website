"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useMemo, useEffect, useCallback } from "react"
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
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [selectedCard, setSelectedCard] = useState<HoverCard | null>(null)
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches)
  }, [])

  const handleCardInteraction = useCallback(
    (card: HoverCard) => {
      if (isTouchDevice) {
        // First tap: reveal overlay. Second tap: open modal.
        if (activeCard === card.id) {
          setSelectedCard(card)
        } else {
          setActiveCard(card.id)
        }
      } else {
        setSelectedCard(card)
      }
    },
    [isTouchDevice, activeCard]
  )

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
            const isActive = activeCard === card.id

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group relative cursor-pointer"
                onMouseEnter={() => !isTouchDevice && setActiveCard(card.id)}
                onMouseLeave={() => !isTouchDevice && setActiveCard(null)}
                onClick={() => handleCardInteraction(card)}
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
                  {/* Full overlay with title + description (visible on hover/tap) */}
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-4 text-center transition-all duration-300 lg:p-6",
                      isActive ? "bg-black/75" : "bg-transparent"
                    )}
                  >
                    <h3
                      className={cn(
                        "mb-2 text-base font-bold text-steel-white transition-opacity duration-300 lg:text-xl",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {card.title}
                    </h3>
                    <p
                      className={cn(
                        "line-clamp-4 px-1 text-xs leading-relaxed text-steel-white/90 transition-opacity duration-300 lg:text-base",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {card.description}
                    </p>
                  </div>
                  {/* Bottom title (visible only when NOT active) */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 transition-opacity duration-300 lg:p-4",
                      isActive ? "opacity-0" : "opacity-100"
                    )}
                  >
                    <h3 className="text-sm font-semibold text-steel-white lg:text-lg">
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
              <div className="relative flex min-h-[200px] w-full items-center justify-center overflow-hidden rounded-lg lg:min-h-[300px] lg:max-h-[70vh]">
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
                <DialogTitle className="text-xl font-bold text-foreground lg:text-2xl">
                  {selectedCard.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground lg:text-base">
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

