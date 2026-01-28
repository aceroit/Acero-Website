"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ProjectCarouselItem {
  id: string
  image: string
  alt: string
  industry?: string
  link?: string
}

interface ProjectsCarouselProps {
  projects: ProjectCarouselItem[]
  className?: string
  itemClassName?: string
}

export function ProjectsCarousel({
  projects,
  className,
  itemClassName = "h-64 w-full md:h-80 md:w-[28rem] lg:w-[32rem]",
}: ProjectsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Show 1 item on mobile, 2 on tablet, 3 on desktop
  const [itemsPerView, setItemsPerView] = useState(1)
  
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(3) // Desktop: 3 items
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2) // Tablet: 2 items
      } else {
        setItemsPerView(1) // Mobile: 1 item
      }
    }
    
    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  // Reset currentIndex when itemsPerView changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [itemsPerView])

  const maxIndex = Math.max(0, projects.length - itemsPerView)

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const visibleProjects = projects.slice(currentIndex, currentIndex + itemsPerView)

  return (
    <div className={cn("relative", className)}>
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div className="flex gap-4 md:gap-6 lg:gap-8 transition-transform duration-500 ease-in-out">
          {visibleProjects.map((project, index) => {
            const actualIndex = currentIndex + index
            const isHovered = hoveredIndex === actualIndex
            
            const cardContent = (
              <div
                key={project.id}
                className={cn(
                  "group relative shrink-0 overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-steel-red/50",
                  itemClassName,
                  "flex-shrink-0"
                )}
                onMouseEnter={() => setHoveredIndex(actualIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image */}
                <div className="relative h-full w-full">
                  <Image
                    src={project.image}
                    alt={project.alt}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 384px, 448px"
                    quality={90}
                  />
                  
                  {/* Hover Overlay with Industry - Only show on this specific card */}
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-500",
                    isHovered ? "bg-black/75 backdrop-blur-[2px]" : "bg-black/0"
                  )}>
                    {project.industry && (
                      <div className={cn(
                        "transition-all duration-500 ease-out",
                        isHovered ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"
                      )}>
                        <span className="inline-block bg-gradient-to-br from-steel-red via-red-800 to-red-900 px-6 py-3 text-base md:text-lg font-extrabold uppercase tracking-[0.3em] text-steel-white shadow-[0_8px_32px_rgba(225,6,0,0.4)] border-2 border-steel-white/30 backdrop-blur-md transform hover:scale-105 transition-transform duration-300">
                          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{project.industry}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )

            if (project.link) {
              return (
                <Link key={`link-${project.id}-${index}`} href={project.link} className="block">
                  {cardContent}
                </Link>
              )
            }

            return cardContent
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      {projects.length > itemsPerView && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-12 w-12 rounded-full border-2 border-border bg-background/80 backdrop-blur-sm hover:bg-background hover:border-steel-red transition-all"
            aria-label="Previous projects"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-12 w-12 rounded-full border-2 border-border bg-background/80 backdrop-blur-sm hover:bg-background hover:border-steel-red transition-all"
            aria-label="Next projects"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {projects.length > itemsPerView && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-8 bg-steel-red"
                  : "w-2 bg-border hover:bg-muted-foreground"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
