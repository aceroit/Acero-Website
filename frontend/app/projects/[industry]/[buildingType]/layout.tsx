import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getProjectsByBuildingType } from "@/services/project.service"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://acerogroup.co").replace(/\/$/, "")

function formatSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string; buildingType: string }>
}): Promise<Metadata> {
  const { industry, buildingType } = await params
  const projects = await getProjectsByBuildingType(industry, buildingType)
  const representativeProject = projects[0]

  const industryName = representativeProject?.industry?.name || formatSlug(industry)
  const buildingTypeName = representativeProject?.buildingType?.name || formatSlug(buildingType)
  const title = `${buildingTypeName} Projects | ${industryName} | Acero Building Systems`
  const description = representativeProject?.description
    || `Explore Acero Building Systems ${buildingTypeName} projects in the ${industryName} industry.`
  const image = representativeProject?.thumbnailImage?.url || representativeProject?.buildingType?.image?.url || undefined
  const url = `${SITE_URL}/projects/${industry}/${buildingType}`

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

export default function BuildingTypeLayout({ children }: { children: ReactNode }) {
  return children
}
