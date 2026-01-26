"use client"

import { InfiniteCarousel } from '@/components/carousel/infinite-carousel'
import { useCertificates } from '@/hooks/use-certificates'
import { useCustomers } from '@/hooks/use-customers'

interface DynamicInfiniteCarouselProps {
  sectionId: string
  title?: string
  staticItems?: Array<{ image: string; alt: string }>
  speed?: 'slow' | 'medium' | 'fast'
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  itemClassName?: string
  sectionClasses?: string
}

/**
 * Dynamic Infinite Carousel that fetches data from backend
 * Detects if it's a certification or customer section based on title
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
  let items: Array<{ image: string; alt: string }> = []
  let isLoading = false
  let finalItemClassName = itemClassName

  if (isCertificationSection) {
    isLoading = certLoading
    // Transform certificates to carousel items
    items = certificates.map((cert) => ({
      image: cert.certificationImage?.url || '',
      alt: cert.name,
    })).filter((item) => item.image) // Filter out items without images
    
    // Set really large size for certificates if not specified
    if (!itemClassName) {
      finalItemClassName = 'h-96 w-[36rem] md:h-[28rem] md:w-[44rem] lg:h-[32rem] lg:w-[52rem]'
    }
  } else if (isCustomerSection) {
    isLoading = customerLoading
    // Transform customers to carousel items
    items = customers.map((customer) => ({
      image: customer.customerImage?.url || '',
      alt: customer.name,
    })).filter((item) => item.image) // Filter out items without images
    
    // Set larger size for customers if not specified
    if (!itemClassName) {
      finalItemClassName = 'h-24 w-40 md:h-32 md:w-52'
    }
  } else {
    // Use static items if provided
    items = staticItems || []
    finalItemClassName = itemClassName || 'h-20 w-32 md:h-24 md:w-40'
  }

  // Determine background class
  const bgClass = sectionClasses.includes('bg-muted') 
    ? 'bg-muted/30' 
    : title === 'Our Customers' 
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

