import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SectionRenderer } from '@/components/sections/section-renderer'
import { getPageByPath, getPageBySlug } from '@/services/page.service'
import type { PageResponse } from '@/lib/api/types'

type DynamicPageProps = {
  params: Promise<{ slug: string[] }>
}

function buildPath(segments: string[]): string {
  return '/' + segments.join('/')
}

/** Fetch published page by path; for single-segment paths also try by slug if path fails */
async function getPublishedPage(
  path: string,
  segments: string[]
): Promise<PageResponse | null> {
  let data = await getPageByPath(path)
  if (data?.page) return data
  if (segments.length === 1) {
    data = await getPageBySlug(segments[0])
  }
  return data
}

export async function generateMetadata({
  params,
}: DynamicPageProps): Promise<Metadata> {
  const { slug } = await params
  const path = buildPath(slug)
  const data = await getPublishedPage(path, slug)
  if (!data?.page) return {}
  return {
    title: data.page.metaTitle || data.page.title,
    description: data.page.metaDescription ?? undefined,
    keywords: data.page.metaKeywords
      ? data.page.metaKeywords.split(',').map((k) => k.trim())
      : undefined,
  }
}

export default async function DynamicCMSPage({ params }: DynamicPageProps) {
  const { slug } = await params
  const path = buildPath(slug)
  const data = await getPublishedPage(path, slug)
  if (!data?.page) notFound()
  const sections = data.sections ?? []
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <SectionRenderer sections={sections} />
      </main>
      <Footer />
    </>
  )
}
