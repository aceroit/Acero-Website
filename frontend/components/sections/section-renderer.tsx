"use client"

import type { ComponentProps } from 'react'
import type { Section } from '@/lib/api/types'
import { HeroCarousel, type HeroCarouselSlide } from '@/components/carousel/hero-carousel'
import { ContentSection } from '@/components/sections/content-section'
import { StatsDisplay } from '@/components/sections/stats-display'
import { InfiniteCarousel } from '@/components/carousel/infinite-carousel'
import { DynamicInfiniteCarousel } from '@/components/sections/dynamic-infinite-carousel'
import { ProjectsSection, type Project } from '@/components/sections/projects-section'
import { DynamicProjectsSection } from '@/components/sections/dynamic-projects-section'
import { CompanyUpdatesSection, type CompanyUpdate } from '@/components/sections/company-updates-section'
import { DynamicCompanyUpdatesSection } from '@/components/sections/dynamic-company-updates-section'
import { HeroImageSection } from '@/components/sections/hero-image-section'
import { PremiumVideoSection } from '@/components/sections/premium-video-section'
import { ImageGallerySection } from '@/components/sections/image-gallery-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { ProductCardSection } from '@/components/sections/product-card-section'
import { ProductsGridSection } from '@/components/sections/products-grid-section'
import { ImageModalGallery } from '@/components/sections/image-modal-gallery'
import { TabbedComparisonSection } from '@/components/sections/tabbed-comparison-section'
import { FlipCardSection } from '@/components/sections/flip-card-section'
import { AdvantagesGridSection } from '@/components/sections/advantages-grid-section'
import { ApplicationCardsSection } from '@/components/sections/application-cards-section'
import { CircularAdvantagesSection } from '@/components/sections/circular-advantages-section'
import { WhyAceroSvgSection } from '@/components/sections/why-acero-svg-section'
import { PebAdvantageSvgSection } from '@/components/sections/peb-advantage-svg-section'
import { CertificatesGridSection } from '@/components/sections/certificates-grid-section'
import { VideoCardsSection } from '@/components/sections/video-cards-section'
import { ImageDisplaySection } from '@/components/sections/image-display-section'
import { HoverCardSection } from '@/components/sections/hover-card-section'
import { ComparisonTableSection } from '@/components/sections/comparison-table-section'
import { CtaSection } from '@/components/sections/cta-section'
import { getIconComponent } from '@/lib/utils/icon-mapper'
import { getPebApplicationSvgPath } from '@/utils/peb-application-svg'
import { getPortaCabinImagePath } from '@/utils/porta-cabin-icons'

interface SectionRendererProps {
  sections: Section[]
  isHomePage?: boolean
}

/** Match "Why Acero" section by title (flexible: "Why Acero?", "Why Acero - ...", etc.) */
function isWhyAceroTitle(title: string): boolean {
  return (title || '').trim().toLowerCase().includes('why acero')
}

/**
 * SectionRenderer
 * Dynamically renders sections based on sectionTypeSlug
 * Maps backend section types to frontend components
 */
export function SectionRenderer({ sections, isHomePage = false }: SectionRendererProps) {
  return (
    <>
      {sections
        .filter((section) => section.isVisible)
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          const { sectionTypeSlug, content } = section

          try {
            switch (sectionTypeSlug) {
              case 'hero_carousel': {
                const slides = (content.slides as HeroCarouselSlide[]) || []
                const autoPlay = (content.autoPlay as boolean) ?? true
                const interval = (content.interval as number) ?? 5000

                return (
                  <HeroCarousel
                    key={section._id}
                    slides={slides}
                    autoPlay={autoPlay}
                    interval={interval}
                  />
                )
              }

              case 'content_with_image': {
                const title = (content.title as string) || ''
                const paragraphs = (content.paragraphs as string[]) || []
                const cta = content.cta as { label: string; href: string } | undefined
                const image = (content.image as string) || undefined
                const imageAlt = (content.imageAlt as string) || undefined
                const rawImages = content.images as Array<{ url?: string; imageAlt?: string }> | undefined
                const images =
                  Array.isArray(rawImages) && rawImages.length >= 1
                    ? rawImages
                        .filter((i) => i?.url)
                        .map((i) => ({ url: i.url!, imageAlt: i.imageAlt ?? '' }))
                    : undefined
                const layout = (content.layout as 'image-left' | 'image-right' | 'image-center' | 'text-only' | 'split') || 'image-right'
                const imageFit = (content.imageFit as 'contain' | 'cover') || 'contain'
                const variant = (content.variant as 'default' | 'accent' | 'muted') || 'default'
                // Who we are "Reliability, Excellence, Trust" section: use local animated SVG so CSS animations run
                const inlineSvgPath =
                  title.trim() === 'Reliability, Excellence, Trust'
                    ? '/svgs/Reliability.svg'
                    : undefined

                return (
                  <ContentSection
                    key={section._id}
                    title={title}
                    paragraphs={paragraphs}
                    cta={cta}
                    image={image}
                    imageAlt={imageAlt}
                    images={images}
                    inlineSvgPath={inlineSvgPath}
                    layout={layout}
                    imageFit={imageFit}
                    variant={variant}
                  />
                )
              }

              case 'statistics': {
                const stats = (content.stats as Array<{ value: string; label: string; sublabel?: string }>) || []
                const columns = (content.columns as 3 | 4) || 3

                return (
                  <StatsDisplay
                    key={section._id}
                    stats={stats}
                    columns={columns}
                  />
                )
              }

              case 'infinite_carousel': {
                const items = (content.items as Array<{ image: string; alt: string; link?: string }>) || []
                const title = (content.title as string) || undefined
                const speed = (content.speed as 'slow' | 'medium' | 'fast') || 'medium'
                const direction = (content.direction as 'left' | 'right') || 'left'
                const pauseOnHover = (content.pauseOnHover as boolean) ?? true
                const itemClassName = (content.itemClassName as string) || undefined
                const sectionClasses = section.cssClasses || ''

                // Use DynamicInfiniteCarousel which handles fetching certificates/customers
                return (
                  <DynamicInfiniteCarousel
                    key={section._id}
                    sectionId={section._id}
                    title={title}
                    staticItems={items}
                    speed={speed}
                    direction={direction}
                    pauseOnHover={pauseOnHover}
                    itemClassName={itemClassName}
                    sectionClasses={sectionClasses}
                  />
                )
              }

              case 'projects_grid': {
                const projects = (content.projects as Project[]) || []
                const title = (content.title as string) || ''
                const subtitle = (content.subtitle as string) || undefined
                const columns = (content.columns as 3 | 4) || 3

                // Use DynamicProjectsSection which fetches from backend
                return (
                  <DynamicProjectsSection
                    key={section._id}
                    sectionId={section._id}
                    staticProjects={projects}
                    title={title}
                    subtitle={subtitle}
                    columns={columns}
                  />
                )
              }

              case 'company_updates': {
                const updates = (content.updates as Array<{
                  id: string
                  title: string
                  description: string
                  image: string
                  date: string | Date
                  category?: string
                  link?: string
                }>) || []
                const title = (content.title as string) || ''
                const subtitle = (content.subtitle as string) || undefined
                const columns = (content.columns as 3 | 4) || 3

                // Use DynamicCompanyUpdatesSection which fetches from backend. On home, use home endpoint (max 3).
                return (
                  <DynamicCompanyUpdatesSection
                    key={section._id}
                    sectionId={section._id}
                    forHome={isHomePage}
                    staticUpdates={updates}
                    title={title}
                    subtitle={subtitle}
                    columns={columns}
                  />
                )
              }

              case 'hero_image': {
                const image = (content.image as string) || ''
                const title = (content.title as string) || ''
                const overlay = (content.overlay as boolean) ?? true

                return (
                  <HeroImageSection
                    key={section._id}
                    image={image}
                    title={title}
                    overlay={overlay}
                    fullHeight={isHomePage}
                  />
                )
              }

              case 'premium_video': {
                const videoId = (content.videoId as string) || ''
                const title = (content.title as string) || undefined
                const autoplay = (content.autoplay as boolean) ?? false
                const muted = (content.muted as boolean) ?? true
                const loop = (content.loop as boolean) ?? true

                return (
                  <PremiumVideoSection
                    key={section._id}
                    videoId={videoId}
                    title={title}
                    autoplay={autoplay}
                    muted={muted}
                    loop={loop}
                  />
                )
              }

              case 'image_gallery': {
                const title = (content.title as string) || ''
                const paragraph = (content.paragraph as string) || ''
                const images = (content.images as Array<{
                  src: string
                  alt: string
                  name?: string
                  link?: string
                }>) || []
                const columns = (content.columns as 2 | 3 | 6) || 3
                const imageOrientation =
                  (content.imageOrientation as 'horizontal' | 'vertical') || 'horizontal'

                return (
                  <ImageGallerySection
                    key={section._id}
                    title={title}
                    paragraph={paragraph}
                    images={images}
                    columns={columns}
                    imageOrientation={imageOrientation}
                  />
                )
              }

              case 'features_grid': {
                const title = (content.title as string) || ''
                // Why Acero: show animated SVG (desktop + mobile) instead of feature cards
                if (isWhyAceroTitle(title)) {
                  return <WhyAceroSvgSection key={section._id} />
                }
                const featuresData = (content.features as Array<{
                  icon?: string
                  title: string
                  description: string
                }>) || []
                const columns = (content.columns as 3 | 4) || 3

                const features = featuresData.map((feature) => ({
                  icon: getIconComponent(feature.icon),
                  title: feature.title,
                  description: feature.description,
                }))

                return (
                  <FeaturesSection
                    key={section._id}
                    title={title}
                    features={features}
                    columns={columns}
                  />
                )
              }

              case 'product_card': {
                const title = (content.title as string) || ''
                const paragraphs = (content.paragraphs as string[]) || []
                const image = (content.image as string) || ''
                const imageAlt = (content.imageAlt as string) || ''
                const cta = content.cta as { label: string; href: string } | undefined
                const layout = (content.layout as 'image-left' | 'image-right') || 'image-right'

                return (
                  <ProductCardSection
                    key={section._id}
                    title={title}
                    paragraphs={paragraphs}
                    image={image}
                    imageAlt={imageAlt}
                    cta={cta || { label: 'Learn More', href: '#' }}
                    layout={layout}
                  />
                )
              }

              case 'products_grid': {
                const title = (content.title as string) || undefined
                const subtitle = (content.subtitle as string) || undefined

                return (
                  <ProductsGridSection
                    key={section._id}
                    title={title}
                    subtitle={subtitle}
                  />
                )
              }

              case 'image_modal_gallery': {
                const title = (content.title as string) || undefined
                const items = (content.items as Array<{
                  id: string
                  title: string
                  description: string
                  image: string
                  imageAlt: string
                }>) || []
                const columns = (content.columns as 2 | 3) || 3

                return (
                  <ImageModalGallery
                    key={section._id}
                    title={title}
                    items={items}
                    columns={columns}
                  />
                )
              }

              case 'tabbed_comparison': {
                const title = (content.title as string) || ''
                const subtitle = (content.subtitle as string) ?? ''
                const tabs = (content.tabs as Array<{
                  id: string
                  label: string
                  legend: Array<{ value?: string; color: string; label?: string }>
                  data: Array<{
                    criteria: string
                    preEngineered: string | { value: string; label: string }
                    conventionalSteel: string | { value: string; label: string }
                    reinforcedConcrete: string | { value: string; label: string }
                  }>
                  textBelowTable?: string
                }>) || []

                type TabbedTabs = ComponentProps<typeof TabbedComparisonSection>['tabs']
                return (
                  <TabbedComparisonSection
                    key={section._id}
                    title={title}
                    subtitle={subtitle}
                    tabs={tabs as TabbedTabs}
                  />
                )
              }

              case 'flip_card': {
                const cards = (content.cards as Array<{
                  id: string
                  title: string
                  description: string
                  image: string
                  imageAlt: string
                }>) || []
                const columns = (content.columns as 2 | 3 | 4) || 2

                return (
                  <FlipCardSection
                    key={section._id}
                    cards={cards}
                    columns={columns}
                  />
                )
              }

              case 'advantages_grid': {
                const title = (content.title as string) || ''
                // Why Acero: show animated SVG instead of advantage cards
                if (isWhyAceroTitle(title)) {
                  return <WhyAceroSvgSection key={section._id} />
                }
                const advantagesData = (content.advantages as Array<{
                  id: string
                  title: string
                  icon?: string
                }>) || []
                const columns = (content.columns as 2 | 3 | 4) || 4

                const advantages = advantagesData.map((advantage) => {
                  // Resolve Porta Cabin image by title first (e.g. "Cost Saving"), then by icon name
                  const iconImageUrl =
                    getPortaCabinImagePath(advantage.title) ??
                    getPortaCabinImagePath(
                      typeof advantage.icon === 'string' ? advantage.icon : ''
                    ) ??
                    undefined
                  return {
                    id: advantage.id,
                    title: advantage.title,
                    icon: getIconComponent(advantage.icon),
                    iconImageUrl,
                  }
                })

                return (
                  <AdvantagesGridSection
                    key={section._id}
                    title={title || undefined}
                    advantages={advantages}
                    columns={columns}
                  />
                )
              }

              case 'application_cards': {
                const title = (content.title as string) || undefined
                const subtitle = (content.subtitle as string) || ''
                const columns = (content.columns as number) || undefined
                const applicationsData = (content.applications as Array<{
                  id: string
                  name: string
                  icon?: string
                }>) || []

                // Transform applications: icon component + optional PEB application SVG (local SVGs override icon)
                const applications = applicationsData.map((application) => ({
                  id: application.id,
                  name: application.name,
                  icon: getIconComponent(application.icon),
                  svgPath: getPebApplicationSvgPath(application.name),
                }))

                return (
                  <ApplicationCardsSection
                    key={section._id}
                    title={title}
                    subtitle={subtitle}
                    applications={applications}
                    columns={columns}
                  />
                )
              }

              case 'why_acero_svg': {
                return <WhyAceroSvgSection key={section._id} />
              }

              case 'circular_advantages': {
                const title = (content.title as string) || ''
                // Why Acero: show animated SVG (desktop + mobile) instead of info cards
                if (isWhyAceroTitle(title)) {
                  return <WhyAceroSvgSection key={section._id} />
                }

                const centerText = (content.centerText as string) || 'ACERO'
                const advantagesData = (content.advantages as Array<{
                  id: string
                  title: string
                  description: string
                  icon?: string
                  position: number
                }>) || []

                const advantages = advantagesData.map((advantage) => ({
                  id: advantage.id,
                  title: advantage.title,
                  description: advantage.description,
                  icon: getIconComponent(advantage.icon),
                  position: advantage.position,
                }))

                return (
                  <CircularAdvantagesSection
                    key={section._id}
                    title={title}
                    centerText={centerText}
                    advantages={advantages}
                  />
                )
              }

              case 'peb_advantage_svg':
              case 'peb-advantage-svg': {
                return <PebAdvantageSvgSection key={section._id} />
              }

              case 'certificates_grid': {
                const title = (content.title as string) || ''
                const paragraphs = (content.paragraphs as string[]) || []
                const certificates = (content.certificates as Array<{
                  name: string
                  image: string
                  imageAlt: string
                }>) || []

                return (
                  <CertificatesGridSection
                    key={section._id}
                    title={title}
                    paragraphs={paragraphs}
                    certificates={certificates}
                  />
                )
              }

              case 'video_cards': {
                const rawVideos = (content.videos as Array<{
                  youtubeId: string
                  title?: string
                  description?: string
                }>) || []
                const videos = rawVideos
                  .filter((v) => v?.youtubeId)
                  .map((v, i) => ({
                    _id: v.youtubeId || String(i),
                    youtubeId: v.youtubeId,
                    title: v.title || 'Video',
                    description: v.description,
                    order: i,
                    featured: false,
                    status: 'published',
                    isActive: true,
                  }))

                return (
                  <VideoCardsSection
                    key={section._id}
                    videos={videos}
                    onVideoClick={(video) => {
                      window.open(
                        `https://www.youtube.com/watch?v=${video.youtubeId}`,
                        '_blank'
                      )
                    }}
                  />
                )
              }

              case 'image_display': {
                const image = (content.image as string) || ''
                const imageAlt = (content.alt as string) || (content.imageAlt as string) || ''
                const title = (content.title as string) || undefined
                const caption = (content.caption as string) || undefined

                return (
                  <ImageDisplaySection
                    key={section._id}
                    image={image}
                    imageAlt={imageAlt}
                    title={title}
                    caption={caption}
                  />
                )
              }

              case 'hover_card': {
                const title = (content.title as string) || undefined
                const subtitle = (content.subtitle as string) || undefined
                const cards = (content.cards as Array<{
                  id: string
                  title: string
                  description: string
                  image: string
                  imageAlt: string
                }>) || []
                const columns = (content.columns as 3 | 4) || 3

                return (
                  <HoverCardSection
                    key={section._id}
                    title={title}
                    subtitle={subtitle}
                    cards={cards}
                    columns={columns}
                  />
                )
              }

              case 'comparison_table': {
                const title = (content.title as string) || ''
                const factors = (content.factors as string[]) || []
                const systems = (content.systems as Array<{
                  name: string
                  values: string[]
                }>) || []

                return (
                  <ComparisonTableSection
                    key={section._id}
                    title={title}
                    factors={factors}
                    systems={systems}
                  />
                )
              }

              case 'cta': {
                const heading = (content.heading as string) || ''
                const description = (content.description as string) || undefined
                const buttonText = (content.buttonText as string) || ''
                const buttonLink = (content.buttonLink as string) || '#'
                const backgroundColor = (content.backgroundColor as string) || '#1e3a5f'
                const textColor = (content.textColor as string) || '#ffffff'

                return (
                  <CtaSection
                    key={section._id}
                    heading={heading}
                    description={description}
                    buttonText={buttonText}
                    buttonLink={buttonLink}
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                  />
                )
              }

              default:
                console.warn(`Unknown section type: ${sectionTypeSlug}`)
                return null
            }
          } catch (error) {
            console.error(`Error rendering section ${sectionTypeSlug}:`, error)
            return null
          }
        })}
    </>
  )
}

