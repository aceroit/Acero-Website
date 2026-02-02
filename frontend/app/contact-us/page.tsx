"use client"

import { useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { HeadOfficeSection } from "@/components/contact/head-office-section"
import { BranchSelectorSection } from "@/components/contact/branch-selector-section"
import { ContactForm } from "@/components/contact/contact-form"
import { FullWidthMapSection } from "@/components/contact/full-width-map-section"
import { usePage } from "@/hooks/use-page"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { cn } from "@/lib/utils"

export default function ContactUsPage() {
  // Fetch Contact Us page for hero image
  const { sections, isLoading: pageLoading } = usePage("contact-us")
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  // Get spacing values
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image={heroImage || "/placeholder.jpg"}
          title="Contact Us"
        />

        <section className={cn("border-t border-border bg-background", spacing.sectionPadding)}>
          <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
            <HeadOfficeSection />
          </div>
        </section>

        <section className={cn("border-t border-border bg-background", spacing.sectionPadding)}>
          <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
            <BranchSelectorSection />
          </div>
        </section>

        <section className={cn("border-t border-border bg-background", spacing.sectionPadding)}>
          <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
            <ContactForm />
          </div>
        </section>

        <FullWidthMapSection />
      </main>
      <Footer />
    </>
  )
}

