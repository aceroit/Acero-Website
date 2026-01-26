"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { VideoCardsSection } from "@/components/sections/video-cards-section"
import { useVideos } from "@/hooks/use-videos"
import { usePage } from "@/hooks/use-page"
import type { Video } from "@/services/media.service"

export default function MediaVideoPage() {
  // Fetch videos from Media Library
  const { videos, isLoading: videosLoading } = useVideos()
  
  // Fetch Videos page for hero image
  const { sections, isLoading: pageLoading } = usePage("videos")
  const heroSection = sections.find((s) => s.sectionTypeSlug === "hero_image")
  const heroImage = heroSection?.content?.image as string | undefined

  const handleVideoClick = (video: Video) => {
    // Open video in YouTube (new tab)
    window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, "_blank")
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <HeroImageSection
          image={heroImage || "/images/projects/hero.jpg"}
          title="Videos"
        />
        {videosLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Loading videos...</p>
          </div>
        ) : (
          <VideoCardsSection
            videos={videos}
            onVideoClick={handleVideoClick}
          />
        )}
      </main>
      <Footer />
    </>
  )
}

