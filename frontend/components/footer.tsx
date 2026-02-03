"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useFooter } from "@/hooks/use-footer"

// Default fallback values
const defaultFooterLinks = {
  quickLinks: [
    { label: "Who We Are", href: "/who-we-are" },
    { label: "Manufacturing", href: "/manufacturing" },
    { label: "Projects", href: "/projects" },
    { label: "Career", href: "/career" },
    { label: "Contact Us", href: "/contact-us" },
  ],
  products: [
    { label: "PEB", href: "/products/peb" },
    { label: "Conventional Steel", href: "/products/conventional-steel" },
    { label: "Racking Systems", href: "/products/racking-systems" },
    { label: "Porta Cabins", href: "/products/porta-cabins" },
    { label: "Accessories", href: "/products/accessories" },
    { label: "PEB Comparison", href: "/products/peb-comparison" },
  ],
  media: [
    { label: "Literature", href: "/media/literature" },
    { label: "Videos", href: "/media/video" },
    { label: "Company Update", href: "/media/company-update" },
  ],
}

const defaultBrandDescription = ""
const defaultContactInfo = {
  phone: "+971 4 893 1000",
  email: "info@acero.ae",
  address: "Jebel Ali Industrial Area 1,\nDubai, United Arab Emirates",
}

const defaultCopyright = "Acero Steel Manufacturing. All rights reserved."

// Social media icon components
const SocialIcons: Record<string, React.ReactNode> = {
  linkedin: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  facebook: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  instagram: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  youtube: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
}

export function Footer() {
  const { footer } = useFooter()

  // Get brand info
  const brandInfo = useMemo(() => {
    if (footer?.brandInfo?.isFieldActive) {
      return {
        logo: footer.brandInfo.logo,
        description: footer.brandInfo.description || defaultBrandDescription,
      }
    }
    return {
      logo: null,
      description: defaultBrandDescription,
    }
  }, [footer])

  // Get contact info
  const contactInfo = useMemo(() => {
    if (footer?.contactInfo?.isFieldActive) {
      return {
        phone: footer.contactInfo.phone || defaultContactInfo.phone,
        email: footer.contactInfo.email || defaultContactInfo.email,
        address: footer.contactInfo.address || defaultContactInfo.address,
      }
    }
    return defaultContactInfo
  }, [footer])

  // Get social links
  const socialLinks = useMemo(() => {
    if (!footer?.socialLinks || footer.socialLinks.length === 0) {
      return []
    }
    return footer.socialLinks
      .filter((link) => link.isFieldActive)
      .map((link) => ({
        platform: link.platform.toLowerCase(),
        href: link.href,
        icon: SocialIcons[link.platform.toLowerCase()] || null,
        label: link.platform,
      }))
  }, [footer])

  // Get footer links
  const footerLinks = useMemo(() => {
    return {
      quickLinks:
        footer?.quickLinks && footer.quickLinks.length > 0
          ? footer.quickLinks
              .filter((link) => link.isFieldActive)
              .map((link) => ({ label: link.label, href: link.href }))
          : defaultFooterLinks.quickLinks,
      products:
        footer?.productsLinks && footer.productsLinks.length > 0
          ? footer.productsLinks
              .filter((link) => link.isFieldActive)
              .map((link) => ({ label: link.label, href: link.href }))
          : defaultFooterLinks.products,
      media:
        footer?.mediaLinks && footer.mediaLinks.length > 0
          ? footer.mediaLinks
              .filter((link) => link.isFieldActive)
              .map((link) => ({ label: link.label, href: link.href }))
          : defaultFooterLinks.media,
    }
  }, [footer])

  // Get copyright
  const copyright = useMemo(() => {
    if (footer?.copyright?.isFieldActive) {
      const year = footer.copyright.year || new Date().getFullYear()
      const text = footer.copyright.text || defaultCopyright
      return `© ${year} ${text}`
    }
    return `© ${new Date().getFullYear()} ${defaultCopyright}`
  }, [footer])

  // Get legal links
  const legalLinks = useMemo(() => {
    if (!footer?.legalLinks || footer.legalLinks.length === 0) {
      return [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ]
    }
    return footer.legalLinks
      .filter((link) => link.isFieldActive)
      .map((link) => ({ label: link.label, href: link.href }))
  }, [footer])
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center">
              {brandInfo.logo?.imageUrl ? (
                <Image
                  src={brandInfo.logo.imageUrl}
                  alt={brandInfo.logo.altText || "Acero Logo"}
                  width={48}
                  height={48}
                  className="h-12 w-auto object-contain"
                  style={{ maxHeight: '48px' }}
                />
              ) : (
                <>
                  {/* Static logo fallback */}
                  <Image
                    src="/Logo/Logo.png"
                    alt="Acero Logo"
                    width={48}
                    height={48}
                    className="h-12 w-auto object-contain"
                    style={{ maxHeight: '48px' }}
                  />
                </>
              )}
            </Link>
            {brandInfo.description && (
            <p className="mt-6 max-w-sm text-muted-foreground leading-relaxed">
                {brandInfo.description}
            </p>
            )}

            {/* Contact Info */}
            {contactInfo && (
            <div className="mt-8 space-y-3">
                {contactInfo.phone && (
              <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-[#E10600]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                    {contactInfo.phone}
              </a>
                )}
                {contactInfo.email && (
              <a
                    href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-[#E10600]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                    {contactInfo.email}
              </a>
                )}
                {contactInfo.address && (
              <div className="flex items-start gap-3 text-muted-foreground">
                <svg
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                    <span style={{ whiteSpace: "pre-line" }}>
                      {contactInfo.address}
                </span>
                  </div>
                )}
              </div>
            )}

            {/* Social Links - Moved to bottom bar */}
            {/* {socialLinks.length > 0 && (
            <div className="mt-8 flex gap-3">
              {socialLinks.map((social) => (
                <a
                    key={social.platform}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-[#E10600] hover:text-[#E10600] hover:bg-[#E10600]/10"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
            )} */}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-[#E10600]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">
              Products
            </h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-[#E10600]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Media */}
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">
              Media
            </h4>
            <ul className="space-y-3">
              {footerLinks.media.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-[#E10600]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">{copyright}</p>
          <div className="flex items-center gap-6">
            {/* Social Links - Moved here from brand column */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-[#E10600] hover:text-[#E10600] hover:bg-[#E10600]/10"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
            {/* Privacy Policy and Terms of Service - Commented out for now */}
            {/* {legalLinks.length > 0 && (
              <div className="flex gap-6">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[#E10600]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )} */}
          </div>
        </div>
      </div>
    </footer>
  )
}
