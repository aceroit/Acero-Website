"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface CtaSectionProps {
  heading: string
  description?: string
  buttonText: string
  buttonLink: string
  backgroundColor?: string
  textColor?: string
  className?: string
}

export function CtaSection({
  heading,
  description,
  buttonText,
  buttonLink,
  backgroundColor = "#1e3a5f",
  textColor = "#ffffff",
  className,
}: CtaSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const isExternal = buttonLink.startsWith("http://") || buttonLink.startsWith("https://")

  return (
    <section
      ref={ref}
      className={cn(spacing.sectionPadding, className)}
      style={{ backgroundColor, color: textColor }}
    >
      <div className={cn("mx-auto px-6 lg:px-8 text-center", spacing.containerMaxWidth)}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
        >
          {heading}
        </motion.h2>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {isExternal ? (
            <a
              href={buttonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              style={{
                backgroundColor: textColor,
                color: backgroundColor,
              }}
            >
              {buttonText}
            </a>
          ) : (
            <Link
              href={buttonLink}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              style={{
                backgroundColor: textColor,
                color: backgroundColor,
              }}
            >
              {buttonText}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  )
}
