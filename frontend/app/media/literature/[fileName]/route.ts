import { NextResponse } from "next/server"
import { getBrochurePdfFileName } from "@/utils/friendly-file-url"

type PublicBrochureLanguage = {
  languageCode?: string
  languageName?: string
  fileUrl?: string
}

type PublicBrochure = {
  _id?: string
  title?: string
  downloadLink?: string
  languages?: PublicBrochureLanguage[]
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "")
}

function resolveFileUrl(fileUrl: string, apiBaseUrl: string): string | null {
  const trimmed = String(fileUrl || "").trim()
  if (!trimmed || trimmed === "#") return null

  try {
    return new URL(trimmed).toString()
  } catch (error) {
    try {
      return new URL(trimmed, new URL(apiBaseUrl).origin).toString()
    } catch (nestedError) {
      return null
    }
  }
}

async function getPublishedBrochures(apiBaseUrl: string): Promise<PublicBrochure[]> {
  const response = await fetch(`${apiBaseUrl}/api/public/brochures`, {
    cache: "no-store",
  })

  if (!response.ok) return []

  const payload = await response.json().catch(() => null)
  return payload?.data?.brochures || []
}

function findBrochureFile(
  brochures: PublicBrochure[],
  fileName: string
): string | null {
  for (const brochure of brochures) {
    for (const language of brochure.languages || []) {
      if (getBrochurePdfFileName(brochure, language) === fileName) {
        return language.fileUrl || null
      }
    }

    if (brochure.downloadLink && getBrochurePdfFileName(brochure) === fileName) {
      return brochure.downloadLink
    }
  }

  return null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> | { fileName: string } }
) {
  const params = await context.params
  const fileName = params.fileName

  if (!fileName.endsWith(".pdf")) {
    return NextResponse.json({ message: "File not found" }, { status: 404 })
  }

  const apiBaseUrl = getApiBaseUrl()
  const brochures = await getPublishedBrochures(apiBaseUrl)
  const storedFileUrl = findBrochureFile(brochures, fileName)
  const resolvedFileUrl = storedFileUrl ? resolveFileUrl(storedFileUrl, apiBaseUrl) : null

  if (!resolvedFileUrl) {
    return NextResponse.json({ message: "File not found" }, { status: 404 })
  }

  const fileResponse = await fetch(resolvedFileUrl, { cache: "no-store" })
  if (!fileResponse.ok || !fileResponse.body) {
    return NextResponse.json({ message: "File not available" }, { status: 404 })
  }

  return new NextResponse(fileResponse.body, {
    headers: {
      "Content-Type": fileResponse.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=300",
    },
  })
}
