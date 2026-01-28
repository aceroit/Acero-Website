"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { HeadOfficeSection } from "@/components/contact/head-office-section"
import { BranchSelectorSection } from "@/components/contact/branch-selector-section"
import { ContactForm } from "@/components/contact/contact-form"
import { FullWidthMapSection } from "@/components/contact/full-width-map-section"
import { usePage } from "@/hooks/use-page"

export default function ContactUsPage() {
  // Fetch Contact Us page for hero image
  const { sections, isLoading: pageLoading } = usePage("contact-us")
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image={heroImage || "/placeholder.jpg"}
          title="Contact Us"
        />

        <section className="border-t-2 border-border/50 bg-background py-32 md:py-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <HeadOfficeSection />
          </div>
        </section>

        <section className="border-t-2 border-border/50 bg-background py-32 md:py-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <BranchSelectorSection />
          </div>
        </section>

        <section className="border-t-2 border-border/50 bg-background py-32 md:py-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ContactForm />
          </div>
        </section>

        <FullWidthMapSection />
      </main>
      <Footer />
    </>
  )
}

