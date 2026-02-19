"use client"

import { useMemo } from "react"
import DOMPurify from "dompurify"
import { cn } from "@/lib/utils"

interface RichTextProps {
  html: string
  className?: string
}

const ALLOWED_TAGS = ["b", "strong", "a", "em", "i", "br", "span", "p"]
const ALLOWED_ATTR = ["href", "target", "rel", "class"]

export function RichText({ html, className }: RichTextProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return ""
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    })
  }, [html])

  if (!sanitizedHtml) return null

  return (
    <div
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
