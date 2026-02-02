"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface FlipCard {
  id: string
  title: string
  description: string
  image: string
  imageAlt: string
}

interface FlipCardSectionProps {
  title?: string
  cards: FlipCard[]
  columns?: 2 | 3 | 4
  className?: string
}

export function FlipCardSection({
  title,
  cards,
  columns = 2,
  className,
}: FlipCardSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const gridCols =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 3
        ? "md:grid-cols-2 lg:grid-cols-3"
        : "md:grid-cols-2 lg:grid-cols-4"

  const handleFlip = (cardId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

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
            className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>
        )}

        {/* Flip Cards Grid */}
        <div className={cn("grid", spacing.gridGap, gridCols)}>
          {cards.map((card, index) => {
            const isFlipped = flippedCards.has(card.id)

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
                style={{ perspective: "1000px" }}
                onMouseEnter={() => handleFlip(card.id)}
                onMouseLeave={() => handleFlip(card.id)}
              >
                <div
                  className="relative aspect-[4/3] w-full cursor-pointer"
                  style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.7s ease-in-out",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front Side - Image */}
                  <div
                    className="absolute inset-0 rounded-lg border border-border bg-card shadow-lg"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-lg bg-secondary">
                      <Image
                        src={card.image}
                        alt={card.imageAlt}
                        fill
                        loading="lazy"
                        className="object-contain transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                        quality={85}
                      />
                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
                        <h3 className="text-xl font-bold text-steel-white md:text-2xl">
                          {card.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Back Side - Description */}
                  <div
                    className="absolute inset-0 rounded-lg border border-border bg-card p-8 shadow-lg"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="flex h-full flex-col justify-center">
                      <h3 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
                        {card.title}
                      </h3>
                      <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

