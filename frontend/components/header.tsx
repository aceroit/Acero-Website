"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "@/components/theme-provider"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useHeader } from "@/hooks/use-header"
import { cn } from "@/lib/utils"

// Default fallback values
const defaultNavLinks = [
  { href: "/who-we-are", label: "Who We Are" },
  {
    href: "/products",
    label: "Products",
    dropdown: [
      { href: "/products/peb", label: "PEB" },
      { href: "/products/conventional-steel", label: "Conventional Steel" },
      { href: "/products/racking-systems", label: "Racking Systems" },
      { href: "/products/porta-cabins", label: "Porta Cabins" },
      { href: "/products/accessories", label: "Accessories" },
      { href: "/products/peb-comparison", label: "PEB Comparison" },
    ],
  },
  { href: "/manufacturing", label: "Manufacturing" },
  { href: "/projects", label: "Projects" },
  {
    href: "/media/literature",
    label: "Media",
    dropdown: [
      { href: "/media/literature", label: "Literature" },
      { href: "/media/video", label: "Video" },
      { href: "/media/company-update", label: "Company Update" },
    ],
  },
  { href: "/career", label: "Career" },
  { href: "/contact-us", label: "Contact Us" },
]

const defaultBrandName = "ACERO"
const defaultCtaButton = { text: "Get Quote", href: "/contact-us" }

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()
  const { header, isLoading } = useHeader()

  // Map backend navigationLinks to component format
  const navLinks = useMemo(() => {
    if (!header?.navigationLinks || header.navigationLinks.length === 0) {
      return defaultNavLinks
    }

    return header.navigationLinks
      .filter((link) => link.isFieldActive)
      .sort((a, b) => a.order - b.order)
      .map((link) => ({
        href: link.href,
        label: link.label,
        dropdown:
          link.dropdown && link.dropdown.length > 0
            ? link.dropdown
                .filter((item) => item)
                .sort((a, b) => a.order - b.order)
                .map((item) => ({
                  href: item.href,
                  label: item.label,
                }))
            : undefined,
      }))
  }, [header])

  // Get brand name
  const brandName = useMemo(() => {
    if (header?.brandName?.isFieldActive && header.brandName.text) {
      return header.brandName.text
    }
    return defaultBrandName
  }, [header])

  // Get CTA button
  const ctaButton = useMemo(() => {
    if (header?.ctaButton?.isFieldActive) {
      return {
        text: header.ctaButton.text || defaultCtaButton.text,
        href: header.ctaButton.href || defaultCtaButton.href,
      }
    }
    return defaultCtaButton
  }, [header])

  // Check if theme toggle should be shown
  const showThemeToggle = useMemo(() => {
    return header?.themeToggle?.isFieldActive && header.themeToggle.enabled !== false
  }, [header])

  // Get logo
  const logo = useMemo(() => {
    if (header?.logo?.isFieldActive && header.logo.imageUrl) {
      return {
        imageUrl: header.logo.imageUrl,
        altText: header.logo.altText || "Acero Logo",
      }
    }
    return null
  }, [header])

  // Determine if we should show brand name text
  // Only show text if logo is not available or not active
  const showBrandName = useMemo(() => {
    // If logo is active and has image, don't show text
    if (logo) {
      return false
    }
    // Otherwise, show text if brandName is active
    return header?.brandName?.isFieldActive !== false
  }, [logo, header])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          {logo && !isLoading ? (
            <Image
              src={logo.imageUrl}
              alt={logo.altText}
              width={48}
              height={48}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <Image
              src="/Logo/Logo.png"
              alt="Acero Logo"
              width={48}
              height={48}
              className="h-12 w-auto object-contain"
            />
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <div
              key={link.href}
              className="relative"
              onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href={link.href}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-steel-red whitespace-nowrap"
              >
                {link.label}
                {link.dropdown && (
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${
                      activeDropdown === link.label ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </Link>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {link.dropdown && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full pt-2"
                  >
                    <div className="min-w-[220px] rounded-lg border border-border bg-background p-2 shadow-xl">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-md px-4 py-2.5 text-sm text-muted-foreground transition-all hover:bg-steel-red/10 hover:text-steel-red"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {showThemeToggle && (
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/50 transition-all hover:bg-secondary hover:border-[#E10600]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg
                className="h-5 w-5 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          )}

          {/* CTA Button */}
          <Link
            href={ctaButton.href}
            className="hidden bg-[#B61F24] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#B61F24]/90 sm:block"
          >
            {ctaButton.text}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center lg:hidden"
            aria-label="Toggle menu"
          >
            <div className="relative h-5 w-6">
              <span
                className={`absolute left-0 h-0.5 w-full bg-foreground transition-all duration-300 ${
                  isMobileMenuOpen ? "top-2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-2 h-0.5 w-full bg-foreground transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full bg-foreground transition-all duration-300 ${
                  isMobileMenuOpen ? "top-2 -rotate-45" : "top-4"
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border bg-background lg:hidden"
          >
            <div className="flex flex-col px-6 py-6">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <Link
                    href={link.href}
                    onClick={() => !link.dropdown && setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-4 text-lg font-medium uppercase tracking-wider text-foreground transition-colors hover:text-steel-red"
                  >
                    {link.label}
                    {link.dropdown && (
                      <svg
                        className="h-5 w-5 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </Link>
                  {link.dropdown && (
                    <div className="pb-4 pl-4">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block rounded-md py-2 px-2 text-muted-foreground transition-all hover:bg-steel-red/10 hover:text-steel-red"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="pt-4"
              >
                <Link
                  href={ctaButton.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block bg-[#B61F24] px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white"
                >
                  {ctaButton.text}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
