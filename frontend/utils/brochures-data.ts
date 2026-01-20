// Inline type definitions (to be moved to types/brochure.ts later)
interface BrochureLanguage {
  languageCode: string
  languageName: string
  fileUrl: string
}

interface Brochure {
  _id: string
  title: string
  brochureImage: {
    url: string
    publicId: string
    width: number
    height: number
  }
  description?: string
  languages: BrochureLanguage[]
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

// Static brochures data
export const brochuresData: Brochure[] = [
  {
    _id: "1",
    title: "Company Overview Brochure",
    brochureImage: {
      url: "/placeholder.jpg",
      publicId: "brochures/company-overview",
      width: 300,
      height: 400,
    },
    description: "Comprehensive overview of our company and services",
    languages: [
      { languageCode: "en", languageName: "English", fileUrl: "#" },
      { languageCode: "ar", languageName: "العربية", fileUrl: "#" },
      { languageCode: "fr", languageName: "Français", fileUrl: "#" },
      { languageCode: "es", languageName: "Español", fileUrl: "#" },
    ],
    order: 0,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "2",
    title: "Product Catalog 2024",
    brochureImage: {
      url: "/placeholder.jpg",
      publicId: "brochures/product-catalog",
      width: 300,
      height: 400,
    },
    description: "Complete catalog of our steel products and solutions",
    languages: [
      { languageCode: "en", languageName: "English", fileUrl: "#" },
      { languageCode: "ar", languageName: "العربية", fileUrl: "#" },
      { languageCode: "hi", languageName: "हिन्दी", fileUrl: "#" },
    ],
    order: 1,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "3",
    title: "PEB Solutions Guide",
    brochureImage: {
      url: "/placeholder.jpg",
      publicId: "brochures/peb-solutions",
      width: 300,
      height: 400,
    },
    description: "Detailed guide to Pre-Engineered Building solutions",
    languages: [
      { languageCode: "en", languageName: "English", fileUrl: "#" },
      { languageCode: "ar", languageName: "العربية", fileUrl: "#" },
      { languageCode: "fr", languageName: "Français", fileUrl: "#" },
    ],
    order: 2,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "4",
    title: "Sustainability Report",
    brochureImage: {
      url: "/placeholder.jpg",
      publicId: "brochures/sustainability",
      width: 300,
      height: 400,
    },
    description: "Our commitment to sustainable steel manufacturing",
    languages: [
      { languageCode: "en", languageName: "English", fileUrl: "#" },
      { languageCode: "ar", languageName: "العربية", fileUrl: "#" },
    ],
    order: 3,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "5",
    title: "Technical Specifications",
    brochureImage: {
      url: "/placeholder.jpg",
      publicId: "brochures/technical-specs",
      width: 300,
      height: 400,
    },
    description: "Technical specifications for all our products",
    languages: [
      { languageCode: "en", languageName: "English", fileUrl: "#" },
      { languageCode: "ar", languageName: "العربية", fileUrl: "#" },
      { languageCode: "fr", languageName: "Français", fileUrl: "#" },
      { languageCode: "es", languageName: "Español", fileUrl: "#" },
      { languageCode: "hi", languageName: "हिन्दी", fileUrl: "#" },
    ],
    order: 4,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "6",
    title: "Case Studies Portfolio",
    brochureImage: {
      url: "/placeholder.jpg",
      publicId: "brochures/case-studies",
      width: 300,
      height: 400,
    },
    description: "Success stories and case studies from our projects",
    languages: [
      { languageCode: "en", languageName: "English", fileUrl: "#" },
      { languageCode: "ar", languageName: "العربية", fileUrl: "#" },
    ],
    order: 5,
    featured: true,
    status: "published",
    isActive: true,
  },
]

// Export processed data (sorted by order)
export const processedBrochures = brochuresData
  .filter((b) => b.isActive && b.status === "published" && b.featured)
  .sort((a, b) => a.order - b.order)

