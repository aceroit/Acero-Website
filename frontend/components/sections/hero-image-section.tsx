"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface HeroImageSectionProps {
  image: string
  title?: string
  overlay?: boolean
  /** When false (inner pages e.g. Who We Are), hero uses 75% height below header. When true (home), full height. */
  fullHeight?: boolean
  className?: string
}

export function HeroImageSection({
  image,
  title,
  overlay = true,
  fullHeight = false,
  className,
}: HeroImageSectionProps) {
  return (
    <section
      className={cn(
        "relative mt-20 w-full overflow-hidden",
        fullHeight
          ? "md:h-[calc(100vh-5rem)]"
          : "md:h-[60vh] lg:h-[calc((100vh-5rem)*0.75)]",
        className
      )}
    >
      {/* Mobile: Show full image without cropping */}
      <div className="relative w-full md:hidden">
        <Image
          src={image}
          alt={title || "Hero image"}
          width={1920}
          height={1080}
          priority
          className="w-full h-auto"
          sizes="100vw"
          quality={90}
        />
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        )}
        {title && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 text-center px-4"
            >
              <h1 className="text-4xl font-extrabold uppercase tracking-tight text-steel-white">
                {title}
              </h1>
            </motion.div>
          </div>
        )}
      </div>

      {/* Desktop: Fixed height with object-cover */}
      <div className="hidden md:block absolute inset-0">
        <Image
          src={image}
          alt={title || "Hero image"}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={90}
        />
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        )}
        {title && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 text-center px-4"
            >
              <h1 className="text-6xl font-extrabold uppercase tracking-tight text-steel-white lg:text-7xl xl:text-8xl">
                {title}
              </h1>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}

