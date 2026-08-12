"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import CmsImage from "@/components/ui/cms-image"

const desktopCardOverlayStyle = {
  background:
    "linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0))",
}

interface Product {
  id: string
  title: string
  image: string
  imageAlt?: string
  link: string
}

const defaultProducts: Product[] = [
  {
    id: "peb",
    title: "PEB",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157366/acero-cms/products/lpupgr1rmihi5tioxxse.jpg",
    imageAlt: "PEB steel structure",
    link: "/products/peb",
  },
  {
    id: "conventional-steel",
    title: "Conventional Steel",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157770/acero-cms/products/cvzl5ivsk3ykofyurdik.png",
    imageAlt: "Conventional steel building frame",
    link: "/products/conventional-steel",
  },
  {
    id: "racking-systems",
    title: "Racking Systems",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157787/acero-cms/products/ryrxjiyqotf3gd7eyshn.jpg",
    imageAlt: "Industrial racking system",
    link: "/products/racking-systems",
  },
  {
    id: "porta-cabins",
    title: "Porta Cabins",
    image: "https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157806/acero-cms/products/zwkb8gz7dqlijnvpkyxn.jpg",
    imageAlt: "Porta cabin building",
    link: "/products/porta-cabins",
  },
]

function normalizeProduct(product: Partial<Product>, index: number): Product {
  return {
    id: String(product.id || `product-${index + 1}`),
    title: String(product.title || `Product ${index + 1}`),
    image: String(product.image || ""),
    imageAlt: product.imageAlt ? String(product.imageAlt) : undefined,
    link: String(product.link || "#"),
  }
}

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
        <CmsImage
          src={product.image}
          alt={product.imageAlt || product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" aria-hidden />
      )}

      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 lg:hidden"
        style={desktopCardOverlayStyle}
        aria-hidden
      >
        <span className="text-center text-xl font-bold tracking-tight text-steel-white drop-shadow-md md:text-2xl">
          {product.title}
        </span>
      </div>
      <div
        className="absolute inset-0 hidden flex-col items-center justify-center gap-2 opacity-0 transition-opacity duration-300 lg:flex lg:group-hover:opacity-100"
        style={desktopCardOverlayStyle}
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
        className="block h-full rounded-lg transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-steel-red focus-visible:ring-offset-2"
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
  products?: Array<Partial<Product>>
  className?: string
}

export function ProductsGridSection({ title, subtitle, products, className }: ProductsGridSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  const resolvedProducts = (products && products.length > 0 ? products : defaultProducts).map(normalizeProduct)

  return (
    <section
      ref={ref}
      className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
    >
      <div className={cn("mx-auto", spacing.containerMaxWidth, "px-6 lg:px-8")}>
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            {title && (
              <h2 className={`text-4xl font-bold tracking-tight text-foreground md:text-5xl${subtitle ? ' mb-4' : ''}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground md:text-xl">{subtitle}</p>
            )}
          </motion.div>
        )}

        <div className={cn("grid", spacing.gridGap, "grid-cols-1 md:grid-cols-2 lg:grid-cols-4")}>
          {resolvedProducts.map((product, index) => (
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

