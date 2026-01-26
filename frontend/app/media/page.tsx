"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { usePage } from "@/hooks/use-page"

export default function MediaPage() {
  const router = useRouter()
  const { page, sections, isLoading } = usePage("literature")

  // Find hero image section from Literature page
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  // Redirect to Literature page
  useEffect(() => {
    router.replace("/media/literature")
  }, [router])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <HeroImageSection
            image={heroImage || "/images/projects/hero.jpg"}
            title="Media"
          />
        )}
      </main>
      <Footer />
    </>
  )
}
