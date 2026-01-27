import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SectionRenderer } from '@/components/sections/section-renderer'
import { getPageByPath } from '@/services/page.service'

type DynamicPageProps = {
  params: Promise<{ slug?: string[] }>
}

function buildPath(slug: string[] | undefined): string {
  const segments = slug ?? []
  if (segments.length === 0) return '/'
  return '/' + segments.join('/')
}

export async function generateMetadata({
  params,
}: DynamicPageProps): Promise<Metadata> {
  const { slug } = await params
  const path = buildPath(slug)
  if (path === '/') return {}
  const data = await getPageByPath(path)
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
  if (path === '/') notFound()
  const data = await getPageByPath(path)
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
