import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getCmsPageMetadata } from "@/lib/page-metadata"

export async function generateMetadata(): Promise<Metadata> {
  return getCmsPageMetadata("company-update", "/media/company-update")
}

export default function RouteLayout({ children }: { children: ReactNode }) {
  return children
}
