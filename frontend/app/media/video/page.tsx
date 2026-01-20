"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { VideoCardsSection } from "@/components/sections/video-cards-section"
import { processedVideos } from "@/utils/videos-data"

// Inline type definitions (temporary - will be moved to types/video.ts later)
interface Video {
  _id: string
  title: string
  description?: string
  youtubeId: string
  thumbnailUrl?: string
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

export default function MediaVideoPage() {
  const handleVideoClick = (video: Video) => {
    // Open video in YouTube (new tab)
    window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, "_blank")
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image="/placeholder.jpg"
          title="Videos"
        />
        <VideoCardsSection
          videos={processedVideos}
          onVideoClick={handleVideoClick}
        />
      </main>
      <Footer />
    </>
  )
}

