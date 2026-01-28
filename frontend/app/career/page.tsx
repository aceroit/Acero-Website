"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { CareerApplicationForm } from "@/components/career/career-application-form"
import { VacanciesSection } from "@/components/career/vacancies-section"
import { usePage } from "@/hooks/use-page"
import { useSearchParams } from "next/navigation"

function CareerPageContent() {
  // Fetch Career page for hero image
  const { sections, isLoading: pageLoading } = usePage("career")
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  const searchParams = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("")

  // Check for vacancy in URL params on mount
  useEffect(() => {
    const vacancyId = searchParams.get("vacancy")
    if (vacancyId) {
      setSelectedVacancyId(vacancyId)
      // Scroll to form after a short delay to ensure it's rendered
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [searchParams])

  const handleApplyNow = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId)
    // Scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image={heroImage || "/placeholder.jpg"}
          title="Career"
        />
        <VacanciesSection onApplyNow={handleApplyNow} />
        <section
          ref={formRef}
          id="application-form"
          className="border-t border-border bg-background py-24 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <CareerApplicationForm selectedVacancyId={selectedVacancyId} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function CareerPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    }>
      <CareerPageContent />
    </Suspense>
  )
}

