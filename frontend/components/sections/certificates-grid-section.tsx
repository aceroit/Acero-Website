"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Certificate {
  name: string
  image: string
  imageAlt: string
}

interface CertificatesGridSectionProps {
  title: string
  paragraphs: string[]
  certificates: Certificate[]
  className?: string
}

export function CertificatesGridSection({
  title,
  paragraphs,
  certificates,
  className,
}: CertificatesGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  return (
    <section
      ref={ref}
      className={cn(
        "border-t border-border bg-background py-24 md:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Title */}
          <motion.h2
            variants={itemVariants}
            className="mb-6 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            {title}
          </motion.h2>

          {/* Paragraphs */}
          <motion.div
            variants={itemVariants}
            className="mx-auto mb-12 max-w-4xl space-y-4 text-center"
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-lg leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </motion.div>

          {/* Certificates Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {certificates.map((certificate, index) => (
              <motion.div
                key={certificate.name}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-steel-red/50 hover:shadow-lg md:p-8"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={certificate.image}
                    alt={certificate.imageAlt}
                    fill
                    loading="lazy"
                    className="object-contain transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    quality={85}
                  />
                </div>
                <h3 className="mt-4 text-center text-sm font-medium text-foreground md:text-base">
                  {certificate.name}
                </h3>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

