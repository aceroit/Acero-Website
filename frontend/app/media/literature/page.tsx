"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { BrochureCardsSection } from "@/components/sections/brochure-cards-section"
import { BrochureLanguageModal } from "@/components/media/brochure-language-modal"
import { useBrochures } from "@/hooks/use-brochures"
import { usePage } from "@/hooks/use-page"
import { useToast } from "@/hooks/use-toast"
import { getBrochurePdfPath } from "@/utils/friendly-file-url"
import type { Brochure } from "@/services/brochure.service"

interface BrochureLanguage {
  languageCode: string
  languageName: string
  fileUrl: string
}

export default function MediaLiteraturePage() {
  const [selectedBrochure, setSelectedBrochure] = useState<Brochure | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()
  
  // Fetch brochures from backend
  const { brochures, isLoading: brochuresLoading } = useBrochures()
  
  // Fetch Literature page for hero image
  const { sections, isLoading: pageLoading } = usePage("literature")
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  // Transform backend brochures to include languages (empty array if not present)
  const processedBrochures = brochures.map((brochure) => ({
    ...brochure,
    languages: brochure.languages || [], // Handle missing languages field
  }))

  const openPdf = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleBrochureClick = (brochure: Brochure) => {
    const languages = brochure.languages || []

    if (languages.length > 1) {
      setSelectedBrochure(brochure)
      setIsModalOpen(true)
      return
    }

    if (languages.length === 1) {
      const [language] = languages
      if (language.fileUrl) {
        openPdf(getBrochurePdfPath(brochure, language))
        return
      }
    }

    if (brochure.downloadLink) {
      openPdf(getBrochurePdfPath(brochure))
    } else {
      toast({
        title: "No Download Available",
        description: "This brochure is not available for download at the moment.",
        variant: "default",
      })
    }
  }

  const handleLanguageClick = (language: BrochureLanguage) => {
    if (language.fileUrl) {
      if (selectedBrochure) {
        openPdf(getBrochurePdfPath(selectedBrochure, language))
      } else {
        openPdf(language.fileUrl)
      }
      setIsModalOpen(false)
    } else {
      toast({
        title: "Coming Soon",
        description: `The ${language.languageName} version of this brochure is currently being built.`,
        variant: "default",
      })
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image={heroImage || "/images/projects/hero.jpg"}
          title={(heroSection?.content?.title as string) || "Literature"}
        />
        {brochuresLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Loading brochures...</p>
          </div>
        ) : (
          <BrochureCardsSection
            brochures={processedBrochures}
            onBrochureClick={handleBrochureClick}
          />
        )}
      </main>
      <Footer />
      <BrochureLanguageModal
        brochure={selectedBrochure}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onLanguageClick={handleLanguageClick}
      />
    </>
  )
}

