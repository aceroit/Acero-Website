"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { BrochureCardsSection } from "@/components/sections/brochure-cards-section"
import { BrochureLanguageModal } from "@/components/media/brochure-language-modal"
import { processedBrochures } from "@/utils/brochures-data"
import { useToast } from "@/hooks/use-toast"

// Inline type definitions (temporary - will be moved to types/brochure.ts later)
interface BrochureLanguage {
  languageCode: string
  languageName: string
  fileUrl: string
}

interface Brochure {
  _id: string
  title: string
  brochureImage: { url: string; publicId: string; width: number; height: number }
  description?: string
  languages: BrochureLanguage[]
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

export default function MediaLiteraturePage() {
  const [selectedBrochure, setSelectedBrochure] = useState<Brochure | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const handleBrochureClick = (brochure: Brochure) => {
    setSelectedBrochure(brochure)
    setIsModalOpen(true)
  }

  const handleLanguageClick = (language: BrochureLanguage) => {
    // Show toast notification (backend integration coming soon)
    toast({
      title: "Coming Soon",
      description: `The ${language.languageName} version of this brochure is currently being built.`,
      variant: "default",
    })
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image="/placeholder.jpg"
          title="Media"
        />
        <BrochureCardsSection
          brochures={processedBrochures}
          onBrochureClick={handleBrochureClick}
        />
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

