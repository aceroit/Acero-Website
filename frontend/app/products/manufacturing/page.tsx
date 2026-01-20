import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ContentSection } from "@/components/sections/content-section"
import { CertificatesGridSection } from "@/components/sections/certificates-grid-section"

// Certificates Data
const certificates = [
  {
    name: "ISO 9001",
    image: "/images/certificates/iso-9001.jpg",
    imageAlt: "ISO 9001 Certificate",
  },
  {
    name: "ISO 14001",
    image: "/images/certificates/iso-14001.jpg",
    imageAlt: "ISO 14001 Certificate",
  },
  {
    name: "ISO 45001",
    image: "/images/certificates/iso-45001.jpg",
    imageAlt: "ISO 45001 Certificate",
  },
  {
    name: "AS/NZS ISO 3834",
    image: "/images/certificates/as-nzs-iso-3834.jpg",
    imageAlt: "AS/NZS ISO 3834 Certificate",
  },
  {
    name: "EN 1090-1",
    image: "/images/certificates/en-1090-1.jpg",
    imageAlt: "EN 1090-1 Certificate",
  },
  {
    name: "QHSE Policy",
    image: "/images/certificates/qhse-policy.jpg",
    imageAlt: "QHSE Policy Certificate",
  },
]

export default function ManufacturingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection
          image="/images/manufacturing/hero.jpg"
          title="Manufacturing Excellence"
        />

        {/* Section 2: Manufacturing Excellence */}
        <ContentSection
          title="Manufacturing Excellence"
          paragraphs={[
            "At Acero, we take pride in our cutting-edge production facility, equipped with the latest technology and manned by a team of skilled professionals with years of experience. Our commitment to quality and precision is evident in every step of the manufacturing process.",
            "Our welders are not just workers; they are certified craftsmen trained to meet the highest standards set by organizations such as the American Welding Society (AWS), British Standards (BS), European Standards (EN) and the International Organization for Standardization (ISO). This ensures that each weld meets stringent quality requirements, guaranteeing the structural integrity of every building we produce.",
            "From start to finish, our manufacturing process is meticulously streamlined to deliver exceptional results. Every component is carefully crafted and inspected to ensure consistency and accuracy. We understand the importance of timely delivery and our efficient production methods ensure that each building is completed on schedule, ready to meet the project deadlines.",
            "At Acero, we go beyond designing, manufacturing, and supplying steel structures – we provide peace of mind. With a commitment to excellence and a track record for on-time delivery, Acero is your trusted partner for quality and precision.",
          ]}
          image="/images/manufacturing/manufacturing-excellence.jpg"
          imageAlt="Manufacturing Excellence"
          layout="image-right"
        />

        {/* Section 3: Acero's Advanced Manufacturing Process */}
        <ContentSection
          title="Acero's Advanced Manufacturing Process"
          paragraphs={[
            "At Acero, our manufacturing facility is equipped with cutting-edge technology and specialized software to ensure the highest standards and efficiency in fabrication. Our comprehensive production setup includes manufacturing of:",
            "Primary Members - Fully automated beam welding lines integrating plate preparation, tack welding, submerged arc welding (SAW), in-built hydraulic straightening, drilling and cutting for unmatched precision.",
            "Secondary Members - Automated roll forming lines for Z and C sections, roof, and wall panels with consistent accuracy.",
            "Shot Blasting and Painting - Automated shot blasting and painting ensure durable, high-quality finishes. These advanced production lines collectively enable Acero to maintain unmatched quality and efficiency in steel building manufacturing.",
          ]}
          image="/images/manufacturing/advanced-process.jpg"
          imageAlt="Acero's Advanced Manufacturing Process"
          layout="image-left"
        />

        {/* Section 4: Primary Members */}
        <ContentSection
          title="Primary Members"
          paragraphs={[
            "At Acero, our fully automated continuous beam welding lines deliver unmatched efficiency and precision in the fabrication of structural members, ensuring high-quality output for every project.",
            "Fully Automated Continuous Beam Welding Line",
            "We take pride in our state-of-the-art, fully automated beam welding line, the only one of its kind in the world, manufactured and supplied from the USA. This all-in-one software operated system seamlessly integrates every stage of production, from plate preparation for web and flange to tack welding, continuous beam welding, submerged arc welding (SAW), drilling and cutting. The result is unparalleled speed and precision in manufacturing. The process is further optimized by low gantry cranes with electro-magnetic heads, ensuring efficient material handling. Remarkably, the entire beam line is operated by just four skilled operators, highlighting the innovation and operational excellence that define our manufacturing capabilities.",
            "After the beams are produced through our automatic welding, essential components such as base plates, connection plates and clips are precisely positioned and welded. These components undergo a rigorous inspection by Acero's specialized Quality Control (QC) inspectors for dimensional accuracy and location of the weld, ensuring 100% compliance with engineering drawings.",
          ]}
          image="/images/manufacturing/primary-members.jpg"
          imageAlt="Primary Members Manufacturing"
          layout="image-right"
        />

        {/* Section 5: Secondary Members */}
        <ContentSection
          title="Secondary Members"
          paragraphs={[
            "Our continuous automated roll forming lines are designed to form corrugated sheets with exceptional precision, ensuring the integrity of the desired profiles. This line is dedicated to manufacturing roof and wall sheeting panels, as well as decking panels. We offer Acero 45-150 and Acero 45-250 profiles, delivering consistent quality and performance in every panel. We specialize in the precise and efficient production of secondary members. Our roll forming lines produce Z and C sections.",
          ]}
          image="/images/manufacturing/secondary-members.jpg"
          imageAlt="Secondary Members Manufacturing"
          layout="image-right"
        />

        {/* Section 6: Shot Blasting and Painting */}
        <ContentSection
          title="Shot Blasting and Painting"
          paragraphs={[
            "Once fabrication is complete, the primary steel members are shot blasted in our automatic shot blasting line, a process that removes rust and other impurities from the steel surface. These steel shots not only clean the surface but also etch it to ensure accurate paint adhesion, ensuring optimal paint system performance. After shot blasting, the materials are painted. Once coated, they enter the drying area, where a final QC inspection is conducted to check the paint quality as per the requirements. Only after QC approval, the materials are released to the finished goods yard.",
          ]}
          image="/images/manufacturing/shot-blasting-painting.jpg"
          imageAlt="Shot Blasting and Painting"
          layout="image-right"
        />

        {/* Section 7: Quality Policy with Certificates */}
        <CertificatesGridSection
          title="Quality Policy"
          paragraphs={[
            "The Acero quality control team is trained and qualified in using the latest equipment and methods to ensure the consistent quality standards enforced by world-renowned organizations, such as the American Society for Testing and Materials (ASTM), British Standards Institute (BSI), and the European Standards (EN).",
            "Quality control at Acero starts with receiving raw materials, where every batch of steel is tested for both physical and chemical properties, in-house as well as by third-party certified and accredited labs, to ensure consistent quality. Acero also enforces quality control checks at every workstation in the production cycle, ensuring that only the highest quality products make it to the final stages of the production process.",
          ]}
          certificates={certificates}
        />
      </main>
      <Footer />
    </>
  )
}

