/**
 * TypeScript types for API responses
 * These match the backend model structures
 */

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Header Configuration Types
export interface NavigationLinkDropdown {
  label: string
  href: string
  order: number
}

export interface NavigationLink {
  label: string
  href: string
  order: number
  dropdown?: NavigationLinkDropdown[]
  isFieldActive: boolean
}

export interface HeaderLogo {
  imageUrl: string | null
  altText: string | null
  isFieldActive: boolean
}

export interface HeaderBrandName {
  text: string
  isFieldActive: boolean
}

export interface HeaderThemeToggle {
  enabled: boolean
  isFieldActive: boolean
}

export interface HeaderCtaButton {
  text: string
  href: string
  isFieldActive: boolean
}

export interface HeaderConfiguration {
  _id: string
  title: string
  status: string
  isActive: boolean
  featured: boolean
  logo: HeaderLogo
  brandName: HeaderBrandName
  navigationLinks: NavigationLink[]
  themeToggle: HeaderThemeToggle
  ctaButton: HeaderCtaButton
  createdAt: string
  updatedAt: string
}

export interface HeaderResponse {
  header: HeaderConfiguration | null
}

// Footer Configuration Types
export interface FooterLogo {
  imageUrl: string | null
  altText: string | null
}

export interface FooterBrandInfo {
  logo: FooterLogo
  description: string | null
  isFieldActive: boolean
}

export interface FooterContactInfo {
  phone: string | null
  email: string | null
  address: string | null
  isFieldActive: boolean
}

export interface FooterSocialLink {
  platform: string
  href: string
  icon: string | null
  isFieldActive: boolean
}

export interface FooterLink {
  label: string
  href: string
  isFieldActive: boolean
}

export interface FooterCopyright {
  text: string | null
  year: number
  isFieldActive: boolean
}

export interface FooterConfiguration {
  _id: string
  title: string
  status: string
  isActive: boolean
  featured: boolean
  brandInfo: FooterBrandInfo
  contactInfo: FooterContactInfo
  socialLinks: FooterSocialLink[]
  quickLinks: FooterLink[]
  productsLinks: FooterLink[]
  mediaLinks: FooterLink[]
  copyright: FooterCopyright
  legalLinks: FooterLink[]
  createdAt: string
  updatedAt: string
}

export interface FooterResponse {
  footer: FooterConfiguration | null
}

// Website Appearance Types
export interface ColorValue {
  value: string
  isFieldActive: boolean
}

export interface LightModeColors {
  background: ColorValue
  foreground: ColorValue
  card: ColorValue
  primary: ColorValue
  secondary: ColorValue
  muted: ColorValue
  accent: ColorValue
  border: ColorValue
  ring: ColorValue
}

export interface DarkModeColors {
  background: ColorValue
  foreground: ColorValue
  card: ColorValue
  primary: ColorValue
  secondary: ColorValue
  muted: ColorValue
  accent: ColorValue
  border: ColorValue
  ring: ColorValue
}

export interface SteelColors {
  steelBlack: ColorValue
  steelWhite: ColorValue
  steelGray: ColorValue
  steelRed: ColorValue
  steelDark: ColorValue
  steelMuted: ColorValue
}

export interface ColorPalette {
  lightMode: LightModeColors
  darkMode: DarkModeColors
  steelColors: SteelColors
}

export interface FontFamily {
  primary: { value: string; isFieldActive: boolean }
  monospace: { value: string; isFieldActive: boolean }
}

export interface FontScale {
  h1: { value: string; isFieldActive: boolean }
  h2: { value: string; isFieldActive: boolean }
  h3: { value: string; isFieldActive: boolean }
  h4: { value: string; isFieldActive: boolean }
  body: { value: string; isFieldActive: boolean }
}

export interface Typography {
  fontFamily: FontFamily
  fontScale: FontScale
}

export interface Spacing {
  containerMaxWidth: { value: string; isFieldActive: boolean }
  sectionPadding: { value: string; isFieldActive: boolean }
  gridGap: { value: string; isFieldActive: boolean }
}

export interface BorderRadius {
  defaultRadius: { value: string; isFieldActive: boolean }
}

export interface WebsiteAppearance {
  _id: string
  title: string
  status: string
  isActive: boolean
  featured: boolean
  colorPalette: ColorPalette
  typography: Typography
  spacing: Spacing
  borderRadius: BorderRadius
  createdAt: string
  updatedAt: string
}

export interface AppearanceResponse {
  appearance: WebsiteAppearance | null
}

// Page and Section Types
export interface Page {
  _id: string
  title: string
  slug: string
  path: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  createdAt: string
  updatedAt: string
}

export interface Section {
  _id: string
  pageId: string
  sectionTypeSlug: string
  order: number
  content: Record<string, unknown> // Dynamic content based on section type
  isVisible: boolean
  cssClasses?: string
  customStyles?: Record<string, unknown>
  status: string
  createdAt: string
  updatedAt: string
}

export interface PageResponse {
  page: Page | null
  sections: Section[]
}

// Form Configuration (thank-you timeout and redirect for Contact/Career forms)
export interface FormConfigSection {
  thankYouTimeout: number
  thankYouRedirectUrl: string
}

export interface FormConfiguration {
  career: FormConfigSection
  contact: FormConfigSection
  defaultEnquiryEmail?: string
  defaultApplicationEmail?: string
}

export interface FormConfigurationResponse {
  config: FormConfiguration
}

