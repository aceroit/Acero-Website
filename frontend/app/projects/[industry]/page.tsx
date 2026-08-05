import { Suspense } from "react"
import type { Metadata } from "next"
import { IndustryContent } from "./industry-content"
import { getBuildingTypesByIndustry } from "@/services/project.service"

interface IndustryPageProps {
  params: Promise<{ industry: string }>
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://acerogroup.co").replace(/\/$/, "")

function formatSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { industry } = await params
  const buildingTypes = await getBuildingTypesByIndustry(industry)
  const industryName = buildingTypes[0]?.name ? formatSlug(industry) : formatSlug(industry)
  const title = `${industryName} Projects | Acero Building Systems`
  const description = `Explore Acero Building Systems projects in the ${industryName} industry across multiple building types and locations.`
  const url = `${SITE_URL}/projects/${industry}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Acero Building Systems",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { industry } = await params

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IndustryContent industrySlug={industry} />
    </Suspense>
  )
}
