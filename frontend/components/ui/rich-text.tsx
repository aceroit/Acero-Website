"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface RichTextProps {
  html: string
  className?: string
  as?: "div" | "span"
}

const ALLOWED_TAGS = ["b", "strong", "a", "em", "i", "br", "span", "p"]
const ALLOWED_ATTR = ["href", "target", "rel", "class"]

export function RichText({ html, className, as = "div" }: RichTextProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("")

  useEffect(() => {
    if (!html) {
      setSanitizedHtml("")
      return
    }

    import("dompurify").then((DOMPurify) => {
      let sanitized = DOMPurify.default.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
      })
      // For inline rendering, strip wrapping <p> tags that cause line breaks
      if (as === "span") {
        sanitized = sanitized.replace(/^<p>|<\/p>$/gi, "").replace(/<p>/gi, " ").replace(/<\/p>/gi, "")
      }
      setSanitizedHtml(sanitized)
    })
  }, [html, as])

  if (!sanitizedHtml) return null

  const Component = as

  return (
    <Component
      className={cn(
        "[&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:transition-colors",
        "[&_strong]:font-bold [&_b]:font-bold",
        "[&_p]:mb-0 [&_p:last-child]:mb-0",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
