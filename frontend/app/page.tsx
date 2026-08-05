import type { Metadata } from "next"
import HomePageClient from "./home-page-client"
import { getCmsPageMetadata } from "@/lib/page-metadata"

export async function generateMetadata(): Promise<Metadata> {
  return getCmsPageMetadata("home", "/")
}

export default function Home() {
  return <HomePageClient />
}
