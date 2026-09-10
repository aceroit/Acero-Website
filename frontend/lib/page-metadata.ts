import type { Metadata } from "next"
import { getPageBySlug } from "@/services/page.service"
import { getCmsAssetUrl, getSiteUrl } from "@/utils/cms-asset-url"

const DEFAULT_TITLE = "Acero | Steel Building Manufacturer |Global | PEB | Engineering Services"
const DEFAULT_DESCRIPTION = "Acero designs, manufactures and supplies custom pre-engineered steel buildings, conventional steel buildings, racking systems, porta cabins and steel building accessories, from our UAE and India. Serving over 100 countries with a capacity of 150,000 MT/year."
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://acerogroup.co").replace(/\/$/, "")

function parseKeywords(metaKeywords?: string | null): string[] | undefined {
  if (!metaKeywords) return undefined
  const keywords = metaKeywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  return keywords.length > 0 ? keywords : undefined
}

export async function getCmsPageMetadata(
  slug: string,
  path?: string,
  fallback?: { title?: string; description?: string }
): Promise<Metadata> {
  const data = await getPageBySlug(slug)
  const page = data?.page

  const title = page?.metaTitle || page?.title || fallback?.title || DEFAULT_TITLE
  const description = page?.metaDescription || fallback?.description || DEFAULT_DESCRIPTION
  const keywords = parseKeywords(page?.metaKeywords)
  const image = getCmsAssetUrl(page?.metaImage)
  const socialImage = image ? getSiteUrl(image) : undefined
  const canonicalPath = path || (page?.path && page.path.startsWith("/") ? page.path : `/${slug}`)
  const url = `${SITE_URL}${canonicalPath}`

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Acero Building Systems",
      type: "website",
      images: socialImage ? [{ url: socialImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  }
}
