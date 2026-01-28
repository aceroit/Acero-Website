"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { usePage } from "@/hooks/use-page"

export default function MediaVideoPage() {
  const { sections, isLoading, error } = usePage("video")

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-destructive">{error.message}</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-muted-foreground">No content available</p>
          </div>
        ) : (
          <SectionRenderer sections={sections} />
        )}
      </main>
      <Footer />
    </>
  )
}
