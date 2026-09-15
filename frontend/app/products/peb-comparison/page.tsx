import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { getPageBySlug } from "@/services/page.service"
import { notFound } from "next/navigation"

export default async function PEBComparisonPage() {
  const data = await getPageBySlug("peb-comparison")

  if (!data?.page) {
    notFound()
  }

  const sections = data.sections || []
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
        {sections.length === 0 ? (
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


