"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { CareerApplicationForm } from "@/components/career/career-application-form"

export default function CareerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection image="/placeholder.jpg" title="Career" />
        <section className="border-t border-border bg-background py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <CareerApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

