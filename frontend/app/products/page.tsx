"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { usePage } from "@/hooks/use-page"

export default function ProductsPage() {
  const { sections, isLoading, error } = usePage('products')

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-destructive">
              {error.message || 'Failed to load page content'}
            </div>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">No content available</div>
          </div>
        ) : (
          <SectionRenderer sections={sections} />
        )}
      </main>
      <Footer />
    </>
  )
}

