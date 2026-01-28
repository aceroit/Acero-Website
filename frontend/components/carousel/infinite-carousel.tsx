"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface InfiniteCarouselItem {
  image: string
  alt: string
  width?: number
  height?: number
}

interface InfiniteCarouselProps {
  items: InfiniteCarouselItem[]
  speed?: "slow" | "medium" | "fast"
  direction?: "left" | "right"
  pauseOnHover?: boolean
  className?: string
  itemClassName?: string
  removeBackground?: boolean // For certificates - remove white background
}

export function InfiniteCarousel({
  items,
  speed = "medium",
  direction = "left",
  pauseOnHover = true,
  className,
  itemClassName,
  removeBackground = false,
}: InfiniteCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Duplicate items for seamless loop (need enough duplicates for smooth infinite scroll)
  const duplicatedItems = [...items, ...items, ...items, ...items]

  const speedClasses = {
    slow: "animate-scroll-slow",
    medium: "animate-scroll-medium",
    fast: "animate-scroll-fast",
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "overflow-hidden",
          pauseOnHover && "group"
        )}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      >
        <div
          className={cn(
            "flex gap-8 md:gap-12",
            speedClasses[speed],
            direction === "right" && "[animation-direction:reverse]",
            isPaused && "animation-paused"
          )}
        >
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.alt}-${index}`}
              className={cn(
                "flex shrink-0 items-center justify-center",
                itemClassName || "h-20 w-32 md:h-24 md:w-40"
              )}
            >
              {/* No grey tint – keep images original (no grayscale) */}
              <div className="relative h-full w-full">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  loading="lazy"
                  className="object-contain"
                  sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
                  quality={90}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
