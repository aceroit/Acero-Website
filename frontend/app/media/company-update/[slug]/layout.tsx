import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getCompanyUpdateBySlug } from "@/services/company-update.service"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://acerogroup.co").replace(/\/$/, "")
const DEFAULT_TITLE = "Company Update | Acero Building Systems"
const DEFAULT_DESCRIPTION = "Stay updated with the latest Acero Building Systems news, announcements, and milestones."

function parseKeywords(metaKeywords?: string[] | null): string[] | undefined {
  return metaKeywords && metaKeywords.length > 0 ? metaKeywords : undefined
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const update = await getCompanyUpdateBySlug(slug)

  const title = update?.metaTitle || update?.title || DEFAULT_TITLE
  const description = update?.metaDescription || update?.shortDescription || update?.description || DEFAULT_DESCRIPTION
  const image = update?.metaImage?.url || update?.featureImage?.url || update?.banner?.url || undefined
  const url = `${SITE_URL}/media/company-update/${slug}`

  return {
    title,
    description,
    keywords: parseKeywords(update?.metaKeywords),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Acero Building Systems",
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default function CompanyUpdateSlugLayout({ children }: { children: ReactNode }) {
  return children
}
