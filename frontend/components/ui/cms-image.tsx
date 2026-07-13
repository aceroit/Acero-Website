"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getCmsAssetUrl } from "@/utils/cms-asset-url"

type CmsImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading"> & {
  src?: string | null
  alt: string
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  unoptimized?: boolean
  loading?: "eager" | "lazy"
  fallbackSrc?: string
}

const CmsImage = React.forwardRef<HTMLImageElement, CmsImageProps>(function CmsImage(
  {
    src,
    alt,
    className,
    fill = false,
    priority = false,
    quality: _quality,
    sizes: _sizes,
    unoptimized: _unoptimized,
    loading,
    decoding = "async",
    fallbackSrc = "/placeholder.jpg",
    fetchPriority,
    ...props
  },
  ref
) {
  const resolvedSrc = getCmsAssetUrl(src, fallbackSrc) || fallbackSrc
  const finalLoading = priority ? "eager" : loading ?? "lazy"

  return (
    <img
      ref={ref}
      src={resolvedSrc}
      alt={alt}
      loading={finalLoading}
      decoding={decoding}
      fetchPriority={priority ? "high" : fetchPriority}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      {...props}
    />
  )
})

export default CmsImage