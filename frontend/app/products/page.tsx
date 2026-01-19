import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { ProductCardSection } from "@/components/sections/product-card-section"
import { ContentSection } from "@/components/sections/content-section"

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection
          image="/images/products/hero.jpg"
          title="Our Premium Products"
        />

        {/* Section 2: PEB */}
        <ProductCardSection
          title="PEB"
          paragraphs={[
            "Pre-engineered steel buildings (PEBs) consist of built-up structural components, including rafters and columns. These components are designed and manufactured in compliance with building and design codes to ensure the highest standards of quality and safety.",
            "Acero specializes in Pre-Engineered Steel Buildings (fast-track and customized solutions), Conventional Steel Buildings, Roof and Wall Systems, Porta Cabins, Racking Systems and Building Accessories.",
          ]}
          image="/images/products/peb.jpg"
          imageAlt="Pre-Engineered Buildings (PEB)"
          cta={{
            label: "Learn More",
            href: "/products/peb",
          }}
          layout="image-right"
        />

        {/* Section 3: Conventional Steel Buildings */}
        <ProductCardSection
          title="Conventional Steel Buildings"
          paragraphs={[
            "Conventional steel buildings are traditional metal structures constructed by hot rolled steel sections which are designed individually and fabricated.",
          ]}
          image="/images/products/conventional-steel.jpg"
          imageAlt="Conventional Steel Buildings"
          cta={{
            label: "Learn More",
            href: "/products/conventional-steel",
          }}
          layout="image-left"
        />

        {/* Section 4: Racking Systems */}
        <ProductCardSection
          title="Racking Systems"
          paragraphs={[
            "A warehouse racking system is a storage solution designed to stack materials in horizontal rows with multiple levels. These systems can help manage and better utilize warehouse space while organizing materials to streamline operations.",
          ]}
          image="/images/products/racking-systems.jpg"
          imageAlt="Racking Systems"
          cta={{
            label: "Learn More",
            href: "/products/racking-systems",
          }}
          layout="image-right"
        />

        {/* Section 5: Porta Cabins */}
        <ProductCardSection
          title="Porta Cabins"
          paragraphs={[
            "Acero manufactures and supplies Porta Cabins in all sizes, customized as per the requirements. Acero's Porta Cabins are carefully designed to be economical, strong, durable and easy to install.",
          ]}
          image="/images/products/porta-cabins.jpg"
          imageAlt="Porta Cabins"
          cta={{
            label: "Learn More",
            href: "/products/porta-cabins",
          }}
          layout="image-left"
        />

        {/* Section 6: Sustainable Steel Solutions */}
        <ContentSection
          title="Sustainable Steel Solutions"
          paragraphs={[
            "As a leading player in the market, Acero understands the importance of providing environmentally sustainable building solutions. With this principle at our core, we offer a diverse range of steel building solutions aimed at curbing energy consumption and supporting green initiatives, delivering both ecological and economic benefits.",
            "Steel buildings offer a host of eco-friendly features, such as unparalleled durability and recyclability. Furthermore, meticulously designed steel structures elevate projects by optimizing energy efficiency, integrating environmentally friendly roofing and wall panels, utilizing skylights & wall lights for natural light, and incorporating various steel-based structural elements.",
          ]}
          image="/images/products/sustainable-solutions.jpg"
          imageAlt="Sustainable Steel Solutions"
          layout="image-right"
        />
      </main>
      <Footer />
    </>
  )
}

