import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroCarousel, type HeroCarouselSlide } from "@/components/carousel/hero-carousel"
import { ContentSection } from "@/components/sections/content-section"
import { StatsDisplay } from "@/components/sections/stats-display"
import { InfiniteCarousel } from "@/components/carousel/infinite-carousel"
import { ProjectsSection, type Project } from "@/components/sections/projects-section"
import { CompanyUpdatesSection, type CompanyUpdate } from "@/components/sections/company-updates-section"

// Hero Carousel Data
const heroSlides: HeroCarouselSlide[] = [
  {
    image: "/images/carousel/global-reach.jpg",
    title: "GLOBAL REACH, LOCAL IMPACT",
    description:
      "Our extensive global network empowers us to serve customers across borders while maintaining a localized approach, our steel building systems resonate with local needs.",
  },
  {
    image: "/images/carousel/manufacturing-mastery.jpg",
    title: "MANUFACTURING MASTERY",
    description:
      "With a robust production capacity exceeding 100,000 tons per year, we stand tall as industry leaders. Our commitment to precision and quality ensures that every ton we produce meets the highest standards.",
  },
  {
    image: "/images/carousel/engineering-excellence.jpg",
    title: "ENGINEERING EXCELLENCE",
    description:
      "Our engineering prowess lies in our ability to deliver steel buildings that are not only precise but also cost-effective. We optimize designs, processes and materials to create value for our customers.",
  },
  {
    image: "/images/carousel/quality-uncompromised.jpg",
    title: "QUALITY UNCOMPROMISED",
    description:
      "From the moment raw materials arrive at our doorstep, we embark on a journey of excellence. Our unwavering commitment to quality ensures that each product leaving our facility bears the mark of excellence.",
  },
  {
    image: "/images/carousel/safety-first.jpg",
    title: "SAFETY FIRST",
    description:
      "Our relentless pursuit of safety drives us toward our goal: zero accidents. We invest in training, protocols and cutting-edge technology to safeguard our workforce and the communities we serve.",
  },
]

// Company Stats Data
const companyStats = [
  {
    value: "100+",
    label: "Countries",
    sublabel: "Sales Distribution Network",
  },
  {
    value: "100,000+",
    label: "MT / year",
    sublabel: "Manufacturing Capacity",
  },
  {
    value: "1,000+",
    label: "Number of Employees",
  },
]

// Quality Certifications (placeholder - replace with actual certification logos)
const certifications = [
  { image: "/images/certifications/iso-9001.png", alt: "ISO 9001" },
  { image: "/images/certifications/iso-14001.png", alt: "ISO 14001" },
  { image: "/images/certifications/ohsas-18001.png", alt: "OHSAS 18001" },
  { image: "/images/certifications/ce-mark.png", alt: "CE Mark" },
  { image: "/images/certifications/astm.png", alt: "ASTM" },
  { image: "/images/certifications/aisc.png", alt: "AISC" },
]

// Projects Data (placeholder - replace with actual project data)
const projects: Project[] = [
  {
    id: "1",
    title: "Industrial Warehouse Complex",
    description:
      "A state-of-the-art warehouse facility spanning 50,000 square meters, showcasing our PEB expertise.",
    image: "/images/projects/project-1.jpg",
    category: "PEB",
    link: "/projects/industrial-warehouse",
  },
  {
    id: "2",
    title: "Commercial Office Building",
    description:
      "Modern steel-framed office complex demonstrating our conventional steel building capabilities.",
    image: "/images/projects/project-2.jpg",
    category: "Conventional",
    link: "/projects/commercial-office",
  },
  {
    id: "3",
    title: "Distribution Center",
    description:
      "Large-scale distribution center with advanced racking systems and optimized storage solutions.",
    image: "/images/projects/project-3.jpg",
    category: "Racking Systems",
    link: "/projects/distribution-center",
  },
]

// Customer Logos (placeholder - replace with actual customer logos)
const customers = [
  { image: "/images/customers/customer-1.png", alt: "Customer 1" },
  { image: "/images/customers/customer-2.png", alt: "Customer 2" },
  { image: "/images/customers/customer-3.png", alt: "Customer 3" },
  { image: "/images/customers/customer-4.png", alt: "Customer 4" },
  { image: "/images/customers/customer-5.png", alt: "Customer 5" },
  { image: "/images/customers/customer-6.png", alt: "Customer 6" },
]

// Company Updates Data (placeholder - replace with actual update data)
const companyUpdates: CompanyUpdate[] = [
  {
    id: "1",
    title: "New Manufacturing Facility Expansion",
    description:
      "We're excited to announce the expansion of our manufacturing facility, increasing our production capacity by 30%.",
    image: "/images/updates/update-1.jpg",
    date: new Date("2024-01-15"),
    category: "Company News",
    link: "/media/company-update/facility-expansion",
  },
  {
    id: "2",
    title: "Award for Excellence in Safety",
    description:
      "Acero has been recognized with the prestigious safety award for maintaining zero accidents for three consecutive years.",
    image: "/images/updates/update-2.jpg",
    date: new Date("2024-02-20"),
    category: "Awards",
    link: "/media/company-update/safety-award",
  },
  {
    id: "3",
    title: "Launch of New Product Line",
    description:
      "Introducing our new line of eco-friendly steel building solutions, designed for sustainable construction.",
    image: "/images/updates/update-3.jpg",
    date: new Date("2024-03-10"),
    category: "Products",
    link: "/media/company-update/new-product-line",
  },
]

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Carousel */}
        <HeroCarousel slides={heroSlides} autoPlay={true} interval={5000} />

        {/* Section 2: Complete Steel Building Solutions */}
        <ContentSection
          title="Complete Steel Building Solutions"
          paragraphs={[
            "Acero Building Systems provides total solutions for customized steel buildings, including design, manufacture and supply, using internationally recognized engineering software and advanced production equipment. Acero specializes in Pre-Engineered Steel Buildings (fast-track and customized solutions), Conventional Steel Buildings, Roof and Wall Systems, Porta Cabins, Racking Systems and Building Accessories.",
          ]}
          cta={{
            label: "Learn More",
            href: "/products",
          }}
          image="/images/steel-building-solutions.jpg"
          imageAlt="Complete Steel Building Solutions"
          layout="image-right"
        />

        {/* Section 3: Company Information Stats */}
        <StatsDisplay stats={companyStats} columns={3} />

        {/* Section 4: Quality Certifications */}
        <section className="border-t border-border bg-background py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Our Quality Certifications
            </h2>
            <InfiniteCarousel
              items={certifications}
              speed="medium"
              direction="left"
              pauseOnHover={true}
              itemClassName="h-20 w-32 md:h-24 md:w-40"
            />
          </div>
        </section>

        {/* Section 5: Our Projects */}
        <ProjectsSection
          projects={projects}
          title="Our Projects"
          subtitle="Showcasing our expertise through successful steel building projects"
        />

        {/* Section 6: Our Customers */}
        <section className="border-t border-border bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Our Customers
            </h2>
            <InfiniteCarousel
              items={customers}
              speed="slow"
              direction="left"
              pauseOnHover={true}
              itemClassName="h-16 w-32 md:h-20 md:w-40"
            />
          </div>
        </section>

        {/* Section 7: Company Updates */}
        <CompanyUpdatesSection
          updates={companyUpdates}
          title="Company Updates"
          subtitle="Stay updated with our latest news and announcements"
        />
      </main>
      <Footer />
    </>
  )
}
