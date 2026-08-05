import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getCmsPageMetadata } from "@/lib/page-metadata"

export async function generateMetadata(): Promise<Metadata> {
  return getCmsPageMetadata("home", "/home")
}

export default function RouteLayout({ children }: { children: ReactNode }) {
  return children
}
