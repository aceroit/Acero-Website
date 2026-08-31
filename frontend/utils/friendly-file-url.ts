type BrochureLanguage = {
  languageCode?: string
  languageName?: string
  fileUrl?: string
}

type BrochureLike = {
  _id?: string
  title?: string
}

export function slugifyFilePart(value: string | undefined, fallback = "file"): string {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || fallback
}

export function getBrochurePdfFileName(
  brochure: BrochureLike,
  language?: BrochureLanguage
): string {
  const title = slugifyFilePart(brochure.title, "brochure")
  const languageSuffix = slugifyFilePart(
    language?.languageCode || language?.languageName,
    ""
  )
  const parts = [title, languageSuffix].filter(Boolean)

  return `${parts.join("-")}.pdf`
}

export function getBrochurePdfPath(
  brochure: BrochureLike,
  language?: BrochureLanguage
): string {
  return `/media/literature/${getBrochurePdfFileName(brochure, language)}`
}
