"use client"

import { use } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CompanyUpdateDetail } from "@/components/company-updates/company-update-detail"
import { companyUpdatesData } from "@/utils/company-updates-data"
import { notFound } from "next/navigation"

interface CompanyUpdateDetailPageProps {
  params: Promise<{ slug: string }>
}

export default function CompanyUpdateDetailPage({
  params,
}: CompanyUpdateDetailPageProps) {
  const { slug } = use(params)
  const update = companyUpdatesData.find((u) => u.slug === slug)

  if (!update) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <CompanyUpdateDetail update={update} />
      </main>
      <Footer />
    </>
  )
}

