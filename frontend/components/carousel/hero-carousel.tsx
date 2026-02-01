"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface HeroCarouselSlide {
  image: string
  title: string
  description: string
}

interface HeroCarouselProps {
  slides: HeroCarouselSlide[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

export function HeroCarousel({
  slides,
  autoPlay = true,
  interval = 5000,
  className,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isPaused) return

    const timer = setInterval(() => {
      goToNext()
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, isPaused, interval, goToNext])

  return (
    <section
      className={cn("relative mt-20 h-[calc(100vh-5rem)] w-full overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="relative h-full w-full">
            <Image
              src={slides[currentIndex].image}
              alt={slides[currentIndex].title}
              fill
              priority={currentIndex === 0}
              loading={currentIndex === 0 ? "eager" : "lazy"}
              className="object-cover"
              sizes="100vw"
              quality={90}
            />
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </div>

          {/* Centered Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6 text-5xl font-extrabold uppercase tracking-tight text-steel-white md:text-6xl lg:text-7xl xl:text-8xl"
              >
                {slides[currentIndex].title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mx-auto max-w-3xl text-lg leading-relaxed text-steel-white/90 md:text-xl"
              >
                {slides[currentIndex].description}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 z-20 -translate-y-1/2 rounded-full border border-steel-white/30 bg-black/30 p-3 text-steel-white backdrop-blur-sm transition-all hover:bg-black/50 hover:border-steel-white/50 md:left-8"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 z-20 -translate-y-1/2 rounded-full border border-steel-white/30 bg-black/30 p-3 text-steel-white backdrop-blur-sm transition-all hover:bg-black/50 hover:border-steel-white/50 md:right-8"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-8 bg-steel-red"
                : "w-2 bg-steel-white/50 hover:bg-steel-white/70"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 right-8 z-20 hidden text-sm text-steel-white/70 md:block">
        <span className="font-medium">{currentIndex + 1}</span>
        <span className="mx-2">/</span>
        <span>{slides.length}</span>
      </div>
    </section>
  )
}

