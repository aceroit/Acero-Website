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

interface GalleryItem {
  id: string
  title: string
  description: string
  image: string
  imageAlt: string
}

interface ImageModalGalleryProps {
  title?: string
  items: GalleryItem[]
  columns?: 2 | 3
  className?: string
}

export function ImageModalGallery({
  title,
  items,
  columns = 3,
  className,
}: ImageModalGalleryProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const gridCols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"

  return (
    <>
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

          {/* Image Grid - full width cards aligned with container */}
          <div className={cn("grid", spacing.gridGap, gridCols)}>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer w-full"
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-steel-red/50">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 320px"
                    quality={85}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                    <h3 className="text-lg font-semibold text-steel-white">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl">
          {selectedItem && (
            <>
              <div className="relative w-full min-h-[300px] max-h-[70vh] overflow-hidden rounded-lg flex items-center justify-center">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.imageAlt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  quality={90}
                />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {selectedItem.title}
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

