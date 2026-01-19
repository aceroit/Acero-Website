import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ContentSection } from "@/components/sections/content-section"
import { ImageModalGallery } from "@/components/sections/image-modal-gallery"
import { ImageDisplaySection } from "@/components/sections/image-display-section"
import { ApplicationCardsSection } from "@/components/sections/application-cards-section"
import { CircularAdvantagesSection } from "@/components/sections/circular-advantages-section"
import {
  Plane,
  Warehouse,
  Building2,
  Factory,
  Layers,
  Droplets,
  Home,
  Building,
  Palette,
  Briefcase,
  Wheat,
  PlaneTakeoff,
  Package,
  ShoppingBag,
  Store,
  Hammer,
  Cross,
  Zap,
  Snowflake,
  Wrench,
  Cog,
  Trophy,
  Droplet,
} from "lucide-react"
import {
  Zap as SpeedIcon,
  DollarSign,
  Shield,
  Leaf,
  CheckCircle,
  Layers as EfficiencyIcon,
  Lightbulb,
  Settings,
  Grid,
} from "lucide-react"

// PEB Types Data
const pebTypes = [
  {
    id: "clear-span",
    title: "CLEAR SPAN",
    description:
      "CLEAR SPAN buildings have a gable roof with vertical sidewalls and end walls. Interior bay frames are clear span rigid frames (without interior columns).",
    image: "/images/peb/types/clear-span.jpg",
    imageAlt: "Clear Span PEB",
  },
  {
    id: "lean-to",
    title: "LEAN-TO",
    description:
      "LEAN-TO buildings consist of outer sidewall columns supporting simple span rafters attached to the sidewall columns or the end-wall of the main building.",
    image: "/images/peb/types/lean-to.jpg",
    imageAlt: "Lean-To PEB",
  },
  {
    id: "mono-slope",
    title: "MONO SLOPE",
    description:
      "MONO SLOPE is a building with a sloping roof in one plane. The slope extends from one wall to the opposite wall.",
    image: "/images/peb/types/mono-slope.jpg",
    imageAlt: "Mono Slope PEB",
  },
  {
    id: "multigable",
    title: "MULTIGABLE",
    description:
      "MULTIGABLE buildings have a roof with 2 or more gables, vertical side-walls, and vertical end-walls. Interior bay frames are rigid frames.",
    image: "/images/peb/types/multigable.jpg",
    imageAlt: "Multigable PEB",
  },
  {
    id: "multispan",
    title: "MULTISPAN",
    description:
      "MULTISPAN buildings have a gable roof with vertical side-walls and end-walls. Interior bay frames are rigid frames. The designation MS-1 implies one interior column, MS-2 implies two interior columns, and so on.",
    image: "/images/peb/types/multispan.jpg",
    imageAlt: "Multispan PEB",
  },
  {
    id: "multispan-ms2",
    title: "MULTISPAN MS-2",
    description:
      "MULTISPAN MS-2 buildings have a gable roof with vertical side-walls and end-walls. Interior bay frames are rigid frames. The designation MS-2 implies two interior columns, and so on.",
    image: "/images/peb/types/multispan-ms2.jpg",
    imageAlt: "Multispan MS-2 PEB",
  },
]

// Application Cards Data
const applications = [
  { id: "1", name: "Aircraft Hangar", icon: <Plane className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "2", name: "Distribution Center", icon: <Warehouse className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "3", name: "Multi Story", icon: <Building2 className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "4", name: "Refinery System", icon: <Factory className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "5", name: "Steel Platform", icon: <Layers className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "6", name: "Desalination Plant", icon: <Droplets className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "7", name: "Accommodation Camp", icon: <Home className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "8", name: "Modular House", icon: <Building className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "9", name: "Exhibition Hall", icon: <Palette className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "10", name: "Office Building", icon: <Briefcase className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "11", name: "Residential Building", icon: <Home className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "12", name: "Sugar Mill", icon: <Wheat className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "13", name: "Airport Structure", icon: <PlaneTakeoff className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "14", name: "Racking System", icon: <Package className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "15", name: "Factory Building", icon: <Factory className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "16", name: "Pipe Rack", icon: <Layers className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "17", name: "Shopping Center", icon: <ShoppingBag className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "18", name: "Supermarket", icon: <Store className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "19", name: "Bridge Structure", icon: <Layers className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "20", name: "Steel Mill", icon: <Hammer className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "21", name: "Field Hospital", icon: <Cross className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "22", name: "Power Plant", icon: <Zap className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "23", name: "Showroom", icon: <Store className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "24", name: "Warehouse", icon: <Warehouse className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "25", name: "Cold Storage", icon: <Snowflake className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "26", name: "Workshop", icon: <Wrench className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "27", name: "Flour Mill", icon: <Wheat className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "28", name: "Processing Mill", icon: <Cog className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "29", name: "Sports Center", icon: <Trophy className="h-6 w-6 md:h-8 md:w-8" /> },
  { id: "30", name: "Water Tower", icon: <Droplet className="h-6 w-6 md:h-8 md:w-8" /> },
]

// Advantages Data
const advantages = [
  {
    id: "speed",
    title: "Speed of Construction",
    description:
      "One of the primary advantages of PEBs is their speed of production since the components are fabricated using standardized raw material which is readily available. The materials are efficiently transported to the construction site and assembled easily and quickly.",
    icon: <SpeedIcon className="h-8 w-8" />,
    position: 1,
  },
  {
    id: "cost",
    title: "Cost-Effectiveness",
    description:
      "PEBs offer exceptional cost-effectiveness through standardized processes, reduced construction time, and efficient material usage, resulting in lower overall project costs compared to traditional building methods.",
    icon: <DollarSign className="h-8 w-8" />,
    position: 2,
  },
  {
    id: "seismic",
    title: "Seismic Resistance",
    description:
      "Pre-engineered steel buildings are designed to withstand seismic activity and extreme weather conditions, providing superior structural integrity and safety in earthquake-prone regions.",
    icon: <Shield className="h-8 w-8" />,
    position: 3,
  },
  {
    id: "sustainability",
    title: "Sustainability",
    description:
      "Steel buildings offer eco-friendly features including recyclability, energy efficiency, and reduced waste during construction, making them an environmentally responsible choice.",
    icon: <Leaf className="h-8 w-8" />,
    position: 4,
  },
  {
    id: "quality",
    title: "Quality Control",
    description:
      "PEBs are produced in controlled factory environments with rigorous quality assurance processes, ensuring consistency, precision, and adherence to international building codes and standards.",
    icon: <CheckCircle className="h-8 w-8" />,
    position: 5,
  },
  {
    id: "efficiency",
    title: "Structural Efficiency and Durability",
    description:
      "Pre-engineered steel buildings are renowned for their durability and strength, ensuring a long lifespan with minimal maintenance. Steel's inherent properties provide exceptional structural efficiency.",
    icon: <EfficiencyIcon className="h-8 w-8" />,
    position: 6,
  },
  {
    id: "energy",
    title: "Energy Efficiency",
    description:
      "Meticulously designed steel structures optimize energy efficiency through environmentally friendly roofing and wall panels, skylights, wall lights for natural light, and superior insulation capabilities.",
    icon: <Lightbulb className="h-8 w-8" />,
    position: 7,
  },
  {
    id: "customization",
    title: "Customization",
    description:
      "PEBs offer exceptional versatility with designs that can be customized to meet specific requirements, allowing for various building sizes, configurations, and architectural styles to suit diverse needs.",
    icon: <Settings className="h-8 w-8" />,
    position: 8,
  },
  {
    id: "versatility",
    title: "Versatility",
    description:
      "The flexible nature of steel as a building material enables wide-span designs, creating large, open interior spaces without the need for intrusive support columns, making PEBs suitable for numerous applications.",
    icon: <Grid className="h-8 w-8" />,
    position: 9,
  },
]

export default function PEBPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection image="/images/peb/hero.jpg" title="PEB" />

        {/* Section 2: PEB Introduction */}
        <ContentSection
          title="PEB"
          paragraphs={[
            "The main concept behind PEBs is the integration of engineering and manufacturing processes. Specialized engineers design buildings that meet specific requirements, considering factors such as load-bearing capacity, wind, snow and seismic loads, and other local regulations. During the design phase the engineering team ensures that the building is structurally sound and optimized for its intended use.",
            "Once the design is finalized, the manufacturing process begins. Steel components, including columns, rafters, purlins, girts, roof and wall panels, are fabricated in a controlled factory environment. The use of standardized components allows for precise manufacturing, ensuring consistency and accuracy throughout the building process.",
          ]}
          layout="text-only"
        />

        {/* Section 3: PEB Types Gallery */}
        <ImageModalGallery
          title="PEB Types"
          items={pebTypes}
          columns={3}
        />

        {/* Section 4: Why PEB? */}
        <ContentSection
          title="Why PEB?"
          paragraphs={[
            "One of the primary advantages of PEBs is their speed of production since the components are fabricated using standardized raw material which is readily available in the manufacturer's raw material yard. The materials are efficiently transported to the construction site and assembled easily and quickly. This significantly reduces construction time and in turn total project time compared to traditional methods, enabling projects to be completed in a fraction of the time.",
            "PEBs offer exceptional versatility. The design can be customized to meet specific requirements, allowing for various building sizes, configurations and architectural styles. The flexible nature of steel as a building material enables wide-span designs, creating large, open interior spaces without the need for intrusive support columns.",
            "Pre-engineered steel buildings are also renowned for their durability and strength ensuring a long lifespan with minimal maintenance. Additionally, steel buildings can withstand extreme weather conditions, including high winds, heavy snow loads and seismic activity, providing a safe and secure environment.",
          ]}
          image="/images/peb/why-peb.jpg"
          imageAlt="Why PEB"
          layout="image-right"
        />

        {/* Section 5: PEB Model */}
        <ImageDisplaySection
          title="PEB Model"
          image="/images/peb/peb-model.jpg"
          imageAlt="Complete PEB Model"
        />

        {/* Section 6: Application of PEB */}
        <ApplicationCardsSection
          title="Application of PEB"
          subtitle="We are dedicated to providing versatile solutions, with applications extending to, but not limited to:"
          applications={applications}
        />

        {/* Section 7: Advantages of PEB */}
        <CircularAdvantagesSection
          title="Advantages of PEB"
          advantages={advantages}
          centerText="ACERO"
        />
      </main>
      <Footer />
    </>
  )
}

