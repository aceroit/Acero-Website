"use client"

import { InfiniteCarousel } from '@/components/carousel/infinite-carousel'
import { useCertificates } from '@/hooks/use-certificates'
import { useCustomers } from '@/hooks/use-customers'

interface DynamicInfiniteCarouselProps {
  sectionId: string
  title?: string
  staticItems?: Array<{ image: string; alt: string; link?: string }>
  speed?: 'slow' | 'medium' | 'fast'
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  itemClassName?: string
  sectionClasses?: string
}

/**
 * Dynamic Infinite Carousel – where do images come from?
 *
 * 1. OUR QUALITY CERTIFICATIONS (title contains "certification" or "quality")
 *    → FROM CERTIFICATIONS MASTER: useCertificates() fetches published certs from the API.
 *    → Section content.items are ignored. Edit in Admin: Certifications.
 *
 * 2. OUR CUSTOMERS (title contains "customer")
 *    → FROM CUSTOMERS MASTER: useCustomers() fetches published customers from the API.
 *    → Section content.items are ignored. Edit in Admin: Customers.
 *
 * 3. ANY OTHER infinite_carousel (e.g. custom logos)
 *    → FROM SECTION: uses staticItems (content.items) from the section in the CMS.
 *    → Edit in Admin: Page → Section → Carousel items.
 */
export function DynamicInfiniteCarousel({
  sectionId,
  title,
  staticItems,
  speed = 'medium',
  direction = 'left',
  pauseOnHover = true,
  itemClassName,
  sectionClasses = '',
}: DynamicInfiniteCarouselProps) {
  // Detect section type based on title
  const isCertificationSection = title?.toLowerCase().includes('certification') || title?.toLowerCase().includes('quality')
  const isCustomerSection = title?.toLowerCase().includes('customer')

  // Fetch certificates if it's a certification section
  const { certificates, isLoading: certLoading } = useCertificates()
  
  // Fetch customers if it's a customer section
  const { customers, isLoading: customerLoading } = useCustomers()

  // Determine which data to use
  let items: Array<{ image: string; alt: string; link?: string }> = []
  let isLoading = false
  let finalItemClassName = itemClassName

  if (isCertificationSection) {
    isLoading = certLoading
    // From Certifications master (API) – section items ignored
    items = certificates.map((cert) => ({
      image: cert.certificationImage?.url || '',
      alt: cert.name,
      link: cert.link || undefined,
    })).filter((item) => item.image) // Filter out items without images

    // Larger cert logos so they're clearly visible in the carousel (from master API)
    // Always use substantial cert logo size (~100–120px height); ignore section itemClassName
    finalItemClassName =
      'h-[100px] w-[140px] shrink-0 md:h-[120px] md:w-[170px] lg:h-[120px] lg:w-[180px]'
  } else if (isCustomerSection) {
    isLoading = customerLoading
    // From Customers master (API) – section items ignored
    items = customers.map((customer) => ({
      image: customer.customerImage?.url || '',
      alt: customer.name,
      // Customers don't have link field in the model
    })).filter((item) => item.image) // Filter out items without images

    // Large customer logos from master – ~2–3× bigger than before
    if (!itemClassName) {
      finalItemClassName =
        'h-40 w-64 shrink-0 md:h-52 md:w-80 lg:h-64 lg:w-96'
    }
  } else {
    // From section content (staticItems = content.items)
    items = staticItems || []
    finalItemClassName = itemClassName || 'h-20 w-32 md:h-24 md:w-40'
  }

  // Determine background class - always use page background, no gray for customers
  const bgClass = sectionClasses.includes('bg-muted') 
    ? 'bg-muted/30' 
    : 'bg-background'

  // Show loading state
  if (isLoading && items.length === 0) {
    return (
      <section
        key={sectionId}
        className={`border-t border-border ${bgClass} py-16 md:py-24`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {title && (
            <h2 className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {title}
            </h2>
          )}
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </section>
    )
  }

  // If no items, don't render
  if (items.length === 0) {
    return null
  }

  // Render with title wrapper if title exists
  if (title) {
    return (
      <section
        key={sectionId}
        className={`border-t border-border ${bgClass} py-16 md:py-24`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <InfiniteCarousel
            items={items}
            speed={speed}
            direction={direction}
            pauseOnHover={pauseOnHover}
            itemClassName={finalItemClassName}
            removeBackground={isCertificationSection}
          />
        </div>
      </section>
    )
  }

  // Render without title wrapper
  return (
    <InfiniteCarousel
      key={sectionId}
      items={items}
      speed={speed}
      direction={direction}
      pauseOnHover={pauseOnHover}
      itemClassName={finalItemClassName}
      removeBackground={isCertificationSection}
    />
  )
}

