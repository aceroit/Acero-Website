"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface GalleryImage {
  src: string
  alt: string
}

interface ImageGallerySectionProps {
  title: string
  paragraph: string
  images: GalleryImage[]
  columns?: 2 | 3 | 6
  className?: string
}

export function ImageGallerySection({
  title,
  paragraph,
  images,
  columns = 3,
  className,
}: ImageGallerySectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return "md:grid-cols-2"
      case 6:
        return "md:grid-cols-3 lg:grid-cols-6"
      case 3:
      default:
        return "md:grid-cols-2 lg:grid-cols-3"
    }
  }

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        </motion.div>

        {/* Image Grid */}
        <div className={cn("grid gap-4 md:gap-6", getGridCols())}>
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-lg transition-all"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  loading="lazy"
                  className="object-contain transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                  quality={85}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-steel-red/0 transition-colors duration-300 group-hover:bg-steel-red/10" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

