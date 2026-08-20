"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { usePage } from "@/hooks/use-page"

export default function PEBComparisonPage() {
  const { sections, isLoading, error } = usePage("peb-comparison")
  const heroSection = sections.find((section) => section.sectionTypeSlug === "hero_image")
  const heroContent = (heroSection?.content || {}) as Record<string, unknown>
  const heroImage = heroContent.image as string | undefined
  const heroTitle = heroContent.title as string | undefined
  const heroImageFit = (heroContent.imageFit as "cover" | "contain") || "cover"
  const heroImagePosition = (heroContent.imagePosition as "center" | "top" | "bottom") || "center"
  const remainingSections = sections.filter((section) => section.sectionTypeSlug !== "hero_image")

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-destructive">
              {error.message || "Failed to load page content"}
            </div>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">No content available</div>
          </div>
        ) : (
          <>
            <HeroImageSection
              image={heroImage || "/placeholder.jpg"}
              title={heroTitle}
              overlay
              imageFit={heroImageFit}
              imagePosition={heroImagePosition}
            />
            {remainingSections.length > 0 && <SectionRenderer sections={remainingSections} />}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}


