import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ContentSection } from "@/components/sections/content-section"
import { FlipCardSection } from "@/components/sections/flip-card-section"
import { ComparisonTableSection } from "@/components/sections/comparison-table-section"

// Racking Systems Data
const rackingSystems = [
  {
    id: "pallet",
    title: "Pallet Racking Systems",
    description:
      "Pallet racking systems offered by Acero are robust and versatile storage solutions designed to efficiently organize and store goods in warehouses, distribution centers and industrial facilities. These systems feature sturdy steel frames and beams that provide excellent support for palletized loads of varying sizes and weights.",
    image: "/images/racking-systems/pallet-racking.jpg",
    imageAlt: "Pallet Racking Systems",
  },
  {
    id: "cantilever",
    title: "Cantilever Racking Systems",
    description:
      "Acero's Cantilever Racking Systems are designed to efficiently store long and bulky items such as lumber, piping, tubing and other elongated materials. These systems feature sturdy steel columns with horizontal arms that extend outward, providing unobstructed access to stored items.",
    image: "/images/racking-systems/cantilever-racking.jpg",
    imageAlt: "Cantilever Racking Systems",
  },
]

// Comparison Table Data
const comparisonFactors = [
  "Budget",
  "Floor Utilization",
  "Versatility",
  "Forklift Accessibility",
  "Inventory Management",
]

const comparisonSystems = [
  {
    name: "Drive-in System",
    values: ["Medium", "60 - 70%", "Single Row", "Yes", "LIFO"],
  },
  {
    name: "Double Deep Racking System",
    values: ["Low", "60 - 65%", "Same SKU", "Extendable Fork", "LIFO"],
  },
  {
    name: "Push Back Racking System",
    values: ["Very High", "70 - 75%", "Same SKU Items", "Various Goods", "LIFO"],
  },
  {
    name: "Selective Racking System",
    values: ["Very Low", "40 - 45%", "Various Goods", "Yes", "LIFO"],
  },
  {
    name: "Live Racking System",
    values: ["High", "70 - 75%", "High Volume SKU", "Yes", "LIFO"],
  },
]

export default function RackingSystemsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection
          image="/images/racking-systems/hero.jpg"
          title="Racking Systems"
        />

        {/* Section 2: Racking Systems Introduction */}
        <ContentSection
          title="Racking Systems"
          paragraphs={[
            "A warehouse racking system is a highly efficient storage solution designed to organize materials in horizontal rows across multiple levels. These systems optimize warehouse space utilization and streamline operations by systematically arranging materials.",
            "Racking systems allow the storage of palletized products up to seven stacks high, depending on height and weight considerations. They are ideal not only for goods handling but also for storing raw materials and parts.",
            "At Acero, we offer both palletized and cantilever racking solutions:",
            "Pallet Racking System: Perfect for standard-sized items that need efficient, organized storage.",
            "Cantilever Racking System: Ideal for bulky, non-standard sized items. This solution provides unobstructed storage, making more efficient use of warehouse space.",
            "Enhance your warehouse operations with Acero's optimized racking solutions.",
          ]}
          layout="text-only"
        />

        {/* Section 3: Racking Systems Flip Cards */}
        <FlipCardSection cards={rackingSystems} columns={2} />

        {/* Section 4: Comparison Table */}
        <ComparisonTableSection
          title="Factors to consider while selecting the right racking system"
          factors={comparisonFactors}
          systems={comparisonSystems}
        />
      </main>
      <Footer />
    </>
  )
}

