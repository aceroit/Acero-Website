import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ContentSection } from "@/components/sections/content-section"
import { ImageModalGallery } from "@/components/sections/image-modal-gallery"
import { ApplicationCardsSection } from "@/components/sections/application-cards-section"
import {
  Layers,
  Cog,
  Droplets,
  Factory,
  Hammer,
} from "lucide-react"

// Conventional Steel Types Data
const conventionalSteelTypes = [
  {
    id: "t-bar",
    title: "T Bar",
    description:
      "Hot-rolled steel tees are favored for applications requiring extensive load-bearing capabilities. The T-shaped design ensures optimal performance: the top flange provides resistance against compressive stress, while the vertical section (web) effectively resists shear and bending forces.",
    image: "/images/conventional-steel/t-bar.jpg",
    imageAlt: "T Bar",
  },
  {
    id: "wide-flange",
    title: "Wide Flange",
    description:
      "Hot-rolled steel wide flange I-beams are among the most widely used beams and are highly versatile for various processing techniques. Typically featuring non-tapered flanges, and a robust center web, they offer enhanced strength for diverse applications.",
    image: "/images/conventional-steel/wide-flange.jpg",
    imageAlt: "Wide Flange",
  },
  {
    id: "hss",
    title: "HSS",
    description:
      "Hot-rolled square sections are steel profiles characterized by uniform dimensions on all four sides, resulting in a square shape. Renowned for their robustness and durability, these sections are widely utilized in construction, manufacturing and structural applications where ensuring strength and stability is critical.",
    image: "/images/conventional-steel/hss.jpg",
    imageAlt: "HSS",
  },
  {
    id: "i-beam",
    title: "I Beam",
    description:
      "Hot-rolled steel I-beams, a crucial element in structural steel, boasts an I-shaped cross-section, delivering an exceptional strength-to-weight ratio. It finds extensive application in construction, serving as beams, columns and other load-bearing components, guaranteeing structural stability.",
    image: "/images/conventional-steel/i-beam.jpg",
    imageAlt: "I Beam",
  },
  {
    id: "channel",
    title: "Channel",
    description:
      "C channels are hot-rolled steel profiles distinguished by a C-shaped cross-section. Manufactured through a hot-rolling process, they exhibit uniform dimensions, ensuring consistency and quality.",
    image: "/images/conventional-steel/channel.jpg",
    imageAlt: "Channel",
  },
  {
    id: "angle",
    title: "Angle",
    description:
      "Angles are hot-rolled steel profiles known for their distinctive L-shaped cross-section. Produced via hot-rolling, they exhibit uniform dimensions.",
    image: "/images/conventional-steel/angle.jpg",
    imageAlt: "Angle",
  },
]

// Application Cards Data
const applications = [
  { id: "1", name: "Pipe Racks", icon: <Layers className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "2", name: "Equipment", icon: <Cog className="h-6 w-6 md:h-8 md:w-8" /> },
  {
    id: "3",
    name: "Desalination Plant",
    icon: <Droplets className="h-6 w-6 md:h-8 md:w-8" />,
  },
  {
    id: "4",
    name: "Petrochemical Plant",
    icon: <Factory className="h-6 w-6 md:h-8 md:w-8" />,
  },
  { id: "5", name: "Steel Mill", icon: <Hammer className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "6", name: "Bridge Structure", icon: <Layers className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "7", name: "Cement Plant", icon: <Factory className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "8", name: "Oil and Gas", icon: <Droplets className="h-6 w-6 md:h-8 md:w-8" /> },
]

export default function ConventionalSteelPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection
          image="/images/conventional-steel/hero.jpg"
          title="Conventional Steel"
        />

        {/* Section 2: Conventional Steel Introduction */}
        <ContentSection
          title="Conventional Steel"
          paragraphs={[
            "Conventional steel buildings are traditional metal structures constructed by hot-rolled steel sections which are designed individually and fabricated. Primary steel members are selected from international standard hot-rolled sections, such as but not limited to \"UB\", \"UC\" and \"PFC\" (British Specifications), \"HE\" and \"IPE\" (EU Specifications) and \"JIS\" (Japanese Specifications).",
            "Components of conventional steel buildings come in standard shapes and sizes with limited modifications permitted. These components are ordered from the steel mills (hot-rolled sections) according to unique specifications and are generally ordered based on project requirements.",
          ]}
          layout="text-only"
        />

        {/* Section 3: Conventional Steel Types Gallery */}
        <ImageModalGallery
          title="Conventional Steel Types"
          items={conventionalSteelTypes}
          columns={3}
        />

        {/* Section 4: Application of Conventional Steel */}
        <ApplicationCardsSection
          title="Conventional Steel Applications"
          subtitle="Conventional steel finds applications across various industries and sectors:"
          applications={applications}
        />
      </main>
      <Footer />
    </>
  )
}

