// Inline type definitions (temporary)
interface Branch {
  _id: string
  name: string
  location: string // e.g., "Dubai"
  country: string // e.g., "UAE"
  email: string
  phone: string
  address: string
  logo?: string // URL to logo image
  coordinates: {
    lat: number
    lng: number
  }
  isActive: boolean
}

interface Country {
  code: string // e.g., "UAE"
  name: string // e.g., "United Arab Emirates"
  branches: Branch[]
}

// Static data
export const branchesData: Branch[] = [
  {
    _id: "1",
    name: "Acero Building Systems - Dubai",
    location: "Dubai",
    country: "UAE",
    email: "info@acero.ae",
    phone: "+97148931000",
    address: "Jebel Ali Industrial Area 1, Dubai, United Arab Emirates",
    logo: "/images/branches/dubai-logo.png",
    coordinates: { lat: 24.9848, lng: 55.0962 },
    isActive: true,
  },
  {
    _id: "2",
    name: "Acero Building Systems - Abu Dhabi",
    location: "Abu Dhabi",
    country: "UAE",
    email: "abudhabi@acero.ae",
    phone: "+97125000000",
    address: "Industrial Area, Abu Dhabi, United Arab Emirates",
    logo: "/images/branches/abudhabi-logo.png",
    coordinates: { lat: 24.4539, lng: 54.3773 },
    isActive: true,
  },
  {
    _id: "3",
    name: "Acero Building Systems - Kannur",
    location: "Kannur",
    country: "India",
    email: "kannur@acero.ae",
    phone: "+914971234567",
    address: "Industrial Estate, Kannur, Kerala, India",
    logo: "/images/branches/kannur-logo.png",
    coordinates: { lat: 11.8745, lng: 75.3704 },
    isActive: true,
  },
  {
    _id: "4",
    name: "Acero Building Systems - Kochi",
    location: "Kochi",
    country: "India",
    email: "kochi@acero.ae",
    phone: "+914844123456",
    address: "Industrial Area, Kochi, Kerala, India",
    logo: "/images/branches/kochi-logo.png",
    coordinates: { lat: 9.9312, lng: 76.2673 },
    isActive: true,
  },
  {
    _id: "5",
    name: "Acero Building Systems - Hyderabad",
    location: "Hyderabad",
    country: "India",
    email: "hyderabad@acero.ae",
    phone: "+914012345678",
    address: "Industrial Park, Hyderabad, Telangana, India",
    logo: "/images/branches/hyderabad-logo.png",
    coordinates: { lat: 17.3850, lng: 78.4867 },
    isActive: true,
  },
  {
    _id: "6",
    name: "Acero Building Systems - Cairo",
    location: "Cairo",
    country: "Egypt",
    email: "cairo@acero.ae",
    phone: "+20212345678",
    address: "Industrial Zone, Cairo, Egypt",
    logo: "/images/branches/cairo-logo.png",
    coordinates: { lat: 30.0444, lng: 31.2357 },
    isActive: true,
  },
]

export const countriesData: Country[] = [
  {
    code: "UAE",
    name: "United Arab Emirates",
    branches: branchesData.filter((b) => b.country === "UAE" && b.isActive),
  },
  {
    code: "India",
    name: "India",
    branches: branchesData.filter((b) => b.country === "India" && b.isActive),
  },
  {
    code: "Egypt",
    name: "Egypt",
    branches: branchesData.filter((b) => b.country === "Egypt" && b.isActive),
  },
]

export const activeCountries = countriesData.filter((c) => c.branches.length > 0)

