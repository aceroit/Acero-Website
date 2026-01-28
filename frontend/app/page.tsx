"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { usePage } from "@/hooks/use-page"

export default function Home() {
  const { sections, isLoading, error } = usePage('home')

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          // Loading state - can show skeleton or nothing
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : error ? (
          // Error state
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-destructive">
              {error.message || 'Failed to load page content'}
            </div>
          </div>
        ) : sections.length === 0 ? (
          // Empty state
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">No content available</div>
          </div>
        ) : (
          // Render sections dynamically
          <SectionRenderer sections={sections} isHomePage />
        )}
      </main>
      <Footer />
    </>
  )
}
