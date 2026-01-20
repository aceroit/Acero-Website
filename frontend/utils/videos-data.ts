// Inline type definitions (to be moved to types/video.ts later)
interface Video {
  _id: string
  title: string
  description?: string
  youtubeId: string // YouTube video ID (e.g., "dQw4w9WgXcQ")
  thumbnailUrl?: string // Optional custom thumbnail, otherwise use YouTube thumbnail
  order: number
  featured: boolean
  status: string
  isActive: boolean
  publishedAt?: string
}

// Static videos data
export const videosData: Video[] = [
  {
    _id: "1",
    title: "Company Overview Video",
    description: "Learn about our company history, values, and commitment to excellence in steel manufacturing",
    youtubeId: "dQw4w9WgXcQ", // Example ID - replace with actual
    order: 0,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "2",
    title: "PEB Manufacturing Process",
    description: "Watch how we manufacture Pre-Engineered Buildings with precision and quality",
    youtubeId: "dQw4w9WgXcQ", // Example ID - replace with actual
    order: 1,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "3",
    title: "Project Showcase - Industrial Complex",
    description: "A detailed look at one of our major industrial building projects",
    youtubeId: "dQw4w9WgXcQ", // Example ID - replace with actual
    order: 2,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "4",
    title: "Quality Control & Testing",
    description: "Our rigorous quality control processes ensure the highest standards",
    youtubeId: "dQw4w9WgXcQ", // Example ID - replace with actual
    order: 3,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "5",
    title: "Sustainability Initiatives",
    description: "Learn about our commitment to sustainable steel manufacturing practices",
    youtubeId: "dQw4w9WgXcQ", // Example ID - replace with actual
    order: 4,
    featured: true,
    status: "published",
    isActive: true,
  },
  {
    _id: "6",
    title: "Customer Testimonials",
    description: "Hear from our satisfied clients about their experience working with us",
    youtubeId: "dQw4w9WgXcQ", // Example ID - replace with actual
    order: 5,
    featured: true,
    status: "published",
    isActive: true,
  },
]

// Export processed data (sorted by order)
export const processedVideos = videosData
  .filter((v) => v.isActive && v.status === "published" && v.featured)
  .sort((a, b) => a.order - b.order)

