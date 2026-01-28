import { Suspense } from "react"
import { IndustryContent } from "./industry-content"

interface IndustryPageProps {
  params: Promise<{ industry: string }>
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { industry } = await params

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IndustryContent industrySlug={industry} />
    </Suspense>
  )
}

