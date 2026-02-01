"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"

interface Product {
  id: string
  title: string
  image: string
  link: string
}

// Static products data - matching the 4 products mentioned in plan
const staticProducts: Product[] = [
  {
    id: "peb",
    title: "PEB",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157366/acero-cms/products/lpupgr1rmihi5tioxxse.jpg",
    link: "/products/peb",
  },
  {
    id: "conventional-steel",
    title: "Conventional Steel",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157770/acero-cms/products/cvzl5ivsk3ykofyurdik.png",
    link: "/products/conventional-steel",
  },
  {
    id: "racking-systems",
    title: "Racking Systems",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157787/acero-cms/products/ryrxjiyqotf3gd7eyshn.jpg",
    link: "/products/racking-systems",
  },
  {
    id: "porta-cabins",
    title: "Porta Cabins",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157806/acero-cms/products/zwkb8gz7dqlijnvpkyxn.jpg",
    link: "/products/porta-cabins",
  },
]

/**
 * Product card matching Projects page industry card design exactly:
 * rectangular aspect-[4/3], image only by default, title on hover, 4 per row
 */
function ProductCard({
  product,
  index = 0,
}: {
  product: Product
  index?: number
}) {
  const card = (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-500 hover:border-steel-red/50 hover:shadow-xl">
      {product.image ? (
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" aria-hidden />
      )}

      {/* Product name overlay - visible only on hover */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        <span className="text-center text-xl font-bold tracking-tight text-steel-white drop-shadow-md md:text-2xl">
          {product.title}
        </span>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group h-full"
    >
      <Link
        href={product.link}
        className="block h-full transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-steel-red focus-visible:ring-offset-2 rounded-lg"
        aria-label={`View ${product.title}`}
      >
        {card}
      </Link>
    </motion.div>
  )
}

interface ProductsGridSectionProps {
  title?: string
  subtitle?: string
  className?: string
}

export function ProductsGridSection({ title, subtitle, className }: ProductsGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth, "px-6 lg:px-8")}>
        {/* Header */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            {title && (
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
            )}
          </motion.div>
        )}

        {/* Products Grid - 4 cards horizontally, matching projects card design exactly */}
        <div className={cn("grid", spacing.gridGap, "grid-cols-1 md:grid-cols-2 lg:grid-cols-4")}>
          {staticProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
