// Inline type definitions (to be moved to types/company-update.ts later)
interface CompanyUpdate {
  _id: string
  slug: string
  title: string
  featuredImage: {
    url: string
    publicId: string
    width: number
    height: number
  }
  excerpt?: string
  content: string // Full detailed content
  additionalImages?: Array<{
    url: string
    publicId: string
    width: number
    height: number
  }>
  publishedAt: string
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

interface LinkedInPost {
  _id: string
  companyName: string
  date: string // e.g., "January 2026"
  text: string
  imageUrl?: string
  videoUrl?: string
  videoThumbnail?: string
  hashtags: string[]
  likes: number
  comments: number
  isVideo: boolean
  publishedAt: string
}

// Static data
export const companyUpdatesData: CompanyUpdate[] = [
  {
    _id: "1",
    slug: "acero-building-hosts-iftar-dinner",
    title: "Acero Building Hosts Iftar Dinner for Employees and Families",
    featuredImage: {
      url: "/placeholder.jpg",
      publicId: "company-updates/iftar-dinner",
      width: 1200,
      height: 800,
    },
    excerpt:
      "Acero Building Systems organized a heartwarming Iftar Dinner for its employees and their families on March 22, 2024. Held at the Oaks Ibn Battuta Gate Hotel in Dubai, the event brought together the Acero family to break fast in the holy month of Ramadan.",
    content: `Acero Building Hosts Iftar Dinner for Employees and Families.

Acero Building Systems, a leading name in construction and innovation, recently organized a heartwarming Iftar Dinner for its employees and their families on March 22, 2024. Held at the Oaks Ibn Battuta Gate Hotel in Dubai, the event brought together the Acero family to break fast in the holy month of Ramadan.

The Iftar Dinner served as a remarkable occasion for all staff members to come together with their loved ones and share in the spirit of unity and togetherness. Against the backdrop of the serene setting, employees and their families had the opportunity to interact, fostering stronger bonds between colleagues, peers, and subordinates.

The event witnessed an overwhelming turnout, with employees from various departments joining in the festivities alongside their families. Laughter filled the air as children played and families mingled, creating an atmosphere of warmth and camaraderie.

The evening was marked by delicious cuisine, traditional Ramadan delicacies, and heartfelt conversations. As the sun set and the call to prayer echoed, attendees gathered to break their fast together, symbolizing unity and solidarity.

The Iftar Dinner not only provided an opportunity for employees and their families to share a meal but also served as a platform to reinforce Acero Building Systems' commitment to fostering a supportive and inclusive work environment.

As the evening drew to a close, attendees departed with hearts full of gratitude and cherished memories, strengthening the fabric of the Acero family. The success of the event underscores Acero Building Systems' dedication to nurturing strong relationships and fostering a sense of belonging among its employees.`,
    additionalImages: [
      {
        url: "/placeholder.jpg",
        publicId: "company-updates/iftar-dinner-1",
        width: 800,
        height: 600,
      },
      {
        url: "/placeholder.jpg",
        publicId: "company-updates/iftar-dinner-2",
        width: 800,
        height: 600,
      },
    ],
    publishedAt: "2024-03-22",
    order: 0,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "2",
    slug: "new-manufacturing-facility-inauguration",
    title: "New Manufacturing Facility Inauguration",
    featuredImage: {
      url: "/placeholder.jpg",
      publicId: "company-updates/facility-inauguration",
      width: 1200,
      height: 800,
    },
    excerpt:
      "Acero Building Systems inaugurates state-of-the-art manufacturing facility to meet growing demand for steel structures.",
    content: `New Manufacturing Facility Inauguration.

Acero Building Systems has successfully inaugurated its new state-of-the-art manufacturing facility, marking a significant milestone in the company's expansion journey. The facility, equipped with the latest technology and machinery, will significantly increase production capacity and enable the company to meet the growing demand for high-quality steel structures.

The inauguration ceremony was attended by key stakeholders, partners, and members of the Acero team. The new facility represents our commitment to innovation, quality, and sustainable manufacturing practices.`,
    additionalImages: [
      {
        url: "/placeholder.jpg",
        publicId: "company-updates/facility-1",
        width: 800,
        height: 600,
      },
      {
        url: "/placeholder.jpg",
        publicId: "company-updates/facility-2",
        width: 800,
        height: 600,
      },
    ],
    publishedAt: "2024-02-15",
    order: 1,
    featured: false,
    status: "published",
    isActive: true,
  },
]

export const linkedInPostsData: LinkedInPost[] = [
  {
    _id: "1",
    companyName: "Acero Building Systems",
    date: "January 2026",
    text: "Strong. Reliable. Engineered by Acero.\n\nThis N-Truss Bridge in Madagascar designed, manufactured and supplied by Acero.",
    imageUrl: "/placeholder.jpg",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoThumbnail: "/placeholder.jpg",
    hashtags: [
      "#Acero",
      "#AceroSteel",
      "#PEB",
      "#SteelBridgeDesign",
      "#InfrastructureDevelopment",
      "#MadagascarProjects",
      "#EngineeringExcellence",
    ],
    likes: 42,
    comments: 1,
    isVideo: true,
    publishedAt: "2026-01-15",
  },
  {
    _id: "2",
    companyName: "Acero Building Systems",
    date: "December 2025",
    text: "Celebrating another successful project completion. Our team's dedication to excellence shines through in every structure we build.",
    imageUrl: "/placeholder.jpg",
    hashtags: ["#Acero", "#ProjectCompletion", "#Excellence", "#SteelConstruction"],
    likes: 28,
    comments: 3,
    isVideo: false,
    publishedAt: "2025-12-20",
  },
  {
    _id: "3",
    companyName: "Acero Building Systems",
    date: "November 2025",
    text: "Innovation meets tradition. Our latest PEB project showcases the perfect blend of modern engineering and timeless quality.",
    imageUrl: "/placeholder.jpg",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoThumbnail: "/placeholder.jpg",
    hashtags: ["#Acero", "#PEB", "#Innovation", "#Engineering"],
    likes: 35,
    comments: 2,
    isVideo: true,
    publishedAt: "2025-11-10",
  },
  {
    _id: "4",
    companyName: "Acero Building Systems",
    date: "October 2025",
    text: "Quality is not an act, it is a habit. Our commitment to excellence drives everything we do at Acero.",
    imageUrl: "/placeholder.jpg",
    hashtags: ["#Acero", "#Quality", "#Excellence", "#SteelManufacturing"],
    likes: 19,
    comments: 0,
    isVideo: false,
    publishedAt: "2025-10-05",
  },
]

// Export processed data
export const featuredCompanyUpdate =
  companyUpdatesData.find(
    (u) => u.isActive && u.status === "published" && u.featured
  ) || companyUpdatesData[0]

export const processedLinkedInPosts = linkedInPostsData.sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
)

