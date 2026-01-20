"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { HeadOfficeSection } from "@/components/contact/head-office-section"
import { BranchSelectorSection } from "@/components/contact/branch-selector-section"
import { ContactForm } from "@/components/contact/contact-form"
import { FullWidthMapSection } from "@/components/contact/full-width-map-section"

export default function ContactUsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection image="/placeholder.jpg" title="Contact Us" />

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

