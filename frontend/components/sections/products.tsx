"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { cn } from "@/lib/utils"

const products = [
  {
    title: "Steel Beams",
    description:
      "High-strength structural beams for commercial and industrial construction.",
    image: "/images/steel-beams.jpg",
    category: "Structural",
  },
  {
    title: "Steel Plates",
    description:
      "Premium quality plates for heavy machinery and infrastructure projects.",
    image: "/images/steel-plates.jpg",
    category: "Industrial",
  },
  {
    title: "Reinforcement Bars",
    description:
      "Durable rebar solutions for concrete reinforcement applications.",
    image: "/images/rebar.jpg",
    category: "Construction",
  },
  {
    title: "Custom Fabrication",
    description:
      "Tailored steel solutions designed to meet your specific requirements.",
    image: "/images/custom.jpg",
    category: "Custom",
  },
]

export function ProductsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  return (
    <section
      id="products"
      ref={ref}
      className={cn("border-t border-border", spacing.sectionPadding, "px-6")}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth)}>
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-steel-red"
          >
            Our Products
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            Premium Steel <span className="text-steel-red">Solutions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            From structural beams to custom fabrications, we deliver steel
            products that meet the highest industry standards.
          </motion.p>
        </div>

        {/* Products Grid */}
        <div className={cn("grid", spacing.gridGap, "md:grid-cols-2 lg:grid-cols-4")}>
          {products.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="group relative overflow-hidden border border-border bg-card"
            >
              {/* Image Placeholder */}
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="h-16 w-16 text-muted-foreground/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-steel-red/0 transition-all duration-300 group-hover:bg-steel-red/10" />
              </div>

              {/* Content */}
              <div className="p-6">
                <span className="mb-2 inline-block text-xs font-medium uppercase tracking-wider text-steel-red">
                  {product.category}
                </span>
                <h4 className="mb-2 text-lg font-semibold text-foreground">
                  {product.title}
                </h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  {product.description}
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-all hover:gap-3 hover:text-steel-red"
                >
                  Learn More
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-steel-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90"
          >
            View All Products
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
