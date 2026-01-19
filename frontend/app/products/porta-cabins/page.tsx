import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ContentSection } from "@/components/sections/content-section"
import { FlipCardSection } from "@/components/sections/flip-card-section"
import { AdvantagesGridSection } from "@/components/sections/advantages-grid-section"
import { DollarSign, Clock, Truck, Settings } from "lucide-react"

// Porta Cabin Types Data
const portaCabinTypes = [
  {
    id: "pitched-roof",
    title: "Pitched Roof Porta Cabins",
    description:
      "Acero's porta cabins with pitched roofs provide an efficient and adaptable solution for various temporary or semi-permanent structure needs. Designed for enhanced water drainage and increased interior space, these cabins are perfect for uses such as site offices, residential accommodations, classrooms and storage units. The pitched roof design not only adds aesthetic appeal but also improves structural integrity and weather resistance.",
    image: "/images/porta-cabins/pitched-roof.jpg",
    imageAlt: "Pitched Roof Porta Cabins",
  },
  {
    id: "monoslope",
    title: "Monoslope Porta Cabins",
    description:
      "Acero's porta cabins with mono slope roofs offer a modern and practical solution for various temporary or semi-permanent needs. The single-slope roof design enhances water runoff and provides a sleek, contemporary appearance. Ideal for applications such as site offices, living quarters, classrooms and storage units. The mono slope design also allows for efficient use of interior space and can be customized to fit your specific project requirements.",
    image: "/images/porta-cabins/monoslope.jpg",
    imageAlt: "Monoslope Porta Cabins",
  },
  {
    id: "stackable",
    title: "Stackable Porta Cabins",
    description:
      "Acero offers stackable porta cabins designed for versatile and efficient use in various applications. These cabins are constructed using high-quality steel and feature a modular design that allows for easy stacking and assembly. With standardized dimensions and components, our stackable porta cabins are suitable for temporary or permanent use in construction sites, remote locations, or as office spaces.",
    image: "/images/porta-cabins/stackable.jpg",
    imageAlt: "Stackable Porta Cabins",
  },
  {
    id: "flat-roof",
    title: "Flat Roof Porta Cabins",
    description:
      "Acero's porta cabins with flat roofs offer a versatile and functional solution for temporary or semi-permanent structures. These cabins are designed for easy installation and relocation, making them ideal for various applications such as site offices, security booths, classrooms and accommodation units. The flat roof design allows for efficient stacking, maximizing space utilization and transportation efficiency.",
    image: "/images/porta-cabins/flat-roof.jpg",
    imageAlt: "Flat Roof Porta Cabins",
  },
]

// Advantages Data
const advantages = [
  {
    id: "cost",
    title: "Cost Saving",
    icon: <DollarSign className="h-12 w-12 md:h-16 md:w-16" />,
  },
  {
    id: "time",
    title: "Time Saving",
    icon: <Clock className="h-12 w-12 md:h-16 md:w-16" />,
  },
  {
    id: "portability",
    title: "Portability",
    icon: <Truck className="h-12 w-12 md:h-16 md:w-16" />,
  },
  {
    id: "flexibility",
    title: "Flexibility",
    icon: <Settings className="h-12 w-12 md:h-16 md:w-16" />,
  },
]

export default function PortaCabinsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection image="/images/porta-cabins/hero.jpg" title="Porta Cabins" />

        {/* Section 2: Porta Cabins Introduction */}
        <ContentSection
          title="Porta Cabins"
          paragraphs={[
            "Acero manufactures and supplies Porta Cabins in all sizes, customized as per the requirements. Acero's Porta Cabins are carefully designed to be economical, strong, durable and easy to install.",
          ]}
          layout="text-only"
        />

        {/* Section 3: Porta Cabin Types Flip Cards */}
        <FlipCardSection cards={portaCabinTypes} columns={2} />

        {/* Section 4: Advantages of Porta Cabins */}
        <AdvantagesGridSection
          title="Advantages of Porta Cabins"
          advantages={advantages}
          columns={4}
        />
      </main>
      <Footer />
    </>
  )
}

