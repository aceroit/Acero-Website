"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContentSectionProps {
  title: string
  paragraphs: string[]
  cta?: {
    label: string
    href: string
  }
  image?: string
  imageAlt?: string
  layout?: "image-left" | "image-right" | "image-center" | "text-only" | "split"
  variant?: "default" | "accent" | "muted"
  className?: string
}

export function ContentSection({
  title,
  paragraphs,
  cta,
  image,
  imageAlt,
  layout = "image-right",
  variant = "default",
  className,
}: ContentSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case "image-left":
        return "lg:grid-cols-2"
      case "image-right":
        return "lg:grid-cols-2"
      case "image-center":
        return "lg:grid-cols-1"
      case "text-only":
        return "lg:grid-cols-1"
      case "split":
        return "lg:grid-cols-2"
      default:
        return "lg:grid-cols-2"
    }
  }

  const getImageOrder = () => {
    if (layout === "image-left") return "lg:order-1"
    if (layout === "image-right") return "lg:order-2"
    return ""
  }

  const getContentOrder = () => {
    if (layout === "image-left") return "lg:order-2"
    if (layout === "image-right") return "lg:order-1"
    return ""
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "accent":
        return "bg-steel-red/5 border-t-4 border-steel-red"
      case "muted":
        return "bg-muted/30"
      default:
        return "bg-background"
    }
  }

  return (
    <section
      ref={ref}
      className={cn(
        "border-t border-border py-24 md:py-32",
        getVariantClasses(),
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className={cn("grid gap-12 md:gap-16", getLayoutClasses())}
        >
          {/* Image */}
          {image && layout !== "text-only" && (
            <motion.div
              variants={itemVariants}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg self-center",
                layout === "image-center" ? "mx-auto max-w-4xl" : "",
                getImageOrder()
              )}
            >
              <Image
                src={image}
                alt={imageAlt || title}
                fill
                loading="lazy"
                className="object-contain transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                quality={85}
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            variants={itemVariants}
            className={cn(
              "flex flex-col justify-center",
              layout === "image-center" ? "order-1" : getContentOrder()
            )}
          >
            <motion.h2
              variants={itemVariants}
              className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl"
            >
              {title}
            </motion.h2>

            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  variants={itemVariants}
                  className="text-lg leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            {cta && (
              <motion.div variants={itemVariants} className="mt-8">
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2 bg-steel-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90"
                >
                  {cta.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

