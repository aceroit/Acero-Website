import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ContentSection } from "@/components/sections/content-section"
import { PremiumVideoSection } from "@/components/sections/premium-video-section"
import { ImageGallerySection } from "@/components/sections/image-gallery-section"
import { FeaturesSection } from "@/components/sections/features-section"
import {
  Globe,
  Factory,
  Code,
  Award,
  Users,
  TrendingUp,
} from "lucide-react"

// Engineering Excellence Images (placeholder - replace with actual images)
const engineeringImages = [
  { src: "/images/engineering/engineering-1.jpg", alt: "Engineering Excellence 1" },
  { src: "/images/engineering/engineering-2.jpg", alt: "Engineering Excellence 2" },
  { src: "/images/engineering/engineering-3.jpg", alt: "Engineering Excellence 3" },
  { src: "/images/engineering/engineering-4.jpg", alt: "Engineering Excellence 4" },
  { src: "/images/engineering/engineering-5.jpg", alt: "Engineering Excellence 5" },
  { src: "/images/engineering/engineering-6.jpg", alt: "Engineering Excellence 6" },
]

// Why Acero Features
const whyAceroFeatures = [
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Global Reach, Local Expertise",
    description:
      "Worldwide presence with localized service. Our extensive global network empowers us to serve customers across borders while maintaining a localized approach.",
  },
  {
    icon: <Factory className="h-8 w-8" />,
    title: "Manufacturing Excellence",
    description:
      "With a robust production capacity exceeding 100,000 tons per year, we stand tall as industry leaders. Our commitment to precision and quality ensures excellence.",
  },
  {
    icon: <Code className="h-8 w-8" />,
    title: "Engineering Innovation",
    description:
      "Engineering groups in five locations across three countries ensure that all engineering inputs and outputs are generated with precision and digital excellence.",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Quality Assurance",
    description:
      "International certifications and unwavering commitment to quality ensure that each product leaving our facility bears the mark of excellence.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Customer-Centric",
    description:
      "Dedicated sales engineers meticulously address every building inquiry, delivering optimal solutions with the utmost attention to detail and cost-effectiveness.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Industry Leadership",
    description:
      "25+ years of experience in the steel building industry, backed by a team of highly experienced professionals and one of the largest manufacturing facilities.",
  },
]

export default function WhoWeArePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection
          image="/images/who-we-are/hero.jpg"
          title="Acero Building Systems"
        />

        {/* Section 2: Reliability, Excellence, Trust */}
        <ContentSection
          title="Reliability, Excellence, Trust"
          paragraphs={[
            "Acero Building Systems is a premier manufacturer of comprehensive steel buildings. From conceptualization to delivery, Acero seamlessly integrates design, manufacturing and supply services, leveraging internationally recognized engineering software and cutting-edge production equipment. Our headquarters and manufacturing facility stand proudly in Jebel Ali, Dubai, United Arab Emirates.",
            "At Acero, we pride ourselves on delivering tailored steel buildings that encompass the entire steel building system. Our commitment extends globally, offering specialized expertise in pre-engineered steel buildings, including both fast-track and customized solutions, conventional steel buildings, roof and wall systems, racking systems, porta cabins and various building accessories.",
            "Backed by a team of highly experienced professionals in the steel building industry and equipped with one of the largest manufacturing facilities, Acero caters to the diverse needs of the global steel building market.",
            "At Acero Building Systems, we do not just provide steel buildings; we deliver reliability, excellence, and a partnership you can trust. Experience the Acero advantage as we redefine the standards of the steel building industry.",
          ]}
          image="/images/who-we-are/reliability-excellence-trust.jpg"
          imageAlt="Reliability, Excellence, Trust"
          layout="image-right"
        />

        {/* Section 3: Premium Video */}
        <PremiumVideoSection
          videoId="YOUR_VIDEO_ID_HERE"
          autoplay={true}
          muted={true}
          loop={true}
        />

        {/* Section 4: Engineering Excellence */}
        <ImageGallerySection
          title="Engineering Excellence"
          paragraph="At Acero Building Systems, we combine global presence with precision-driven processes to deliver exceptional results. With engineering groups in five locations (Dubai, Kannur, Kochi, Hyderabad and Cairo) across three countries (UAE, India and Egypt), procedural safeguards are in place to ensure that all engineering inputs and outputs, such as design calculations, approval drawings, shop details and bills of material, are generated, checked, released, and archived in digital format, ensuring the customer's best interests are at heart."
          images={engineeringImages}
          columns={6}
        />

        {/* Section 5: Elevating Customer Experience */}
        <ContentSection
          title="Elevating Customer Experience"
          paragraphs={[
            "Acero's dedicated sales engineers meticulously address every building inquiry, delivering optimal solutions with the utmost attention to detail and cost-effectiveness. Committed to exceptional customer service, the Acero sales team ensures continuous and seamless communication with our valued customers.",
          ]}
          image="/images/who-we-are/customer-experience.jpg"
          imageAlt="Elevating Customer Experience"
          layout="image-left"
        />

        {/* Section 6: Transforming Industries Globally */}
        <ContentSection
          title="Transforming Industries Globally"
          paragraphs={[
            "Acero takes pride in designing, manufacturing and supplying a diverse range of steel buildings tailored to meet the unique needs of global industries and sectors.",
            "Our portfolio spans across agriculture, education, aviation, transportation, logistics, industrial, commercial and residential domains.",
          ]}
          image="/images/who-we-are/transforming-industries.jpg"
          imageAlt="Transforming Industries Globally"
          layout="image-right"
        />

        {/* Section 7: Why Acero? */}
        <FeaturesSection
          title="Why Acero?"
          features={whyAceroFeatures}
          columns={3}
        />
      </main>
      <Footer />
    </>
  )
}

