"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageDisplaySectionProps {
  image: string
  imageAlt: string
  title?: string
  caption?: string
  className?: string
}

export function ImageDisplaySection({
  image,
  imageAlt,
  title,
  caption,
  className,
}: ImageDisplaySectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          {title || "PEB Model"}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative overflow-hidden rounded-lg border border-border shadow-2xl"
        >
          <div className="relative aspect-[16/9] w-full bg-secondary">
            <Image
              src={image}
              alt={imageAlt}
              fill
              loading="lazy"
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
              quality={90}
            />
          </div>
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
              <p className="text-center text-sm text-steel-white md:text-base">
                {caption}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

