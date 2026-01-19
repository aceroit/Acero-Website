"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductCardSectionProps {
  title: string
  paragraphs: string[]
  image: string
  imageAlt: string
  cta: {
    label: string
    href: string
  }
  layout?: "image-left" | "image-right"
  className?: string
}

export function ProductCardSection({
  title,
  paragraphs,
  image,
  imageAlt,
  cta,
  layout = "image-right",
  className,
}: ProductCardSectionProps) {
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

  const getImageOrder = () => {
    return layout === "image-left" ? "lg:order-1" : "lg:order-2"
  }

  const getContentOrder = () => {
    return layout === "image-left" ? "lg:order-2" : "lg:order-1"
  }

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background py-24 md:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-12 md:gap-16 lg:grid-cols-2 lg:items-center"
        >
          {/* Image */}
          <motion.div
            variants={itemVariants}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg",
              getImageOrder()
            )}
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              loading="lazy"
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              quality={85}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            variants={itemVariants}
            className={cn("flex flex-col justify-center", getContentOrder())}
          >
            <motion.h2
              variants={itemVariants}
              className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
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

            <motion.div variants={itemVariants} className="mt-8">
              <Link
                href={cta.href}
                className="group inline-flex items-center gap-2 bg-steel-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90"
              >
                {cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

